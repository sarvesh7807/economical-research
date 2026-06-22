import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Send, Sparkles, AlertCircle, RefreshCw, Plus, Trash2, 
  MessageSquare, ChevronRight, Download, BarChart2, FileText, 
  X, Maximize2, Minimize2, Copy, Check, Menu 
} from 'lucide-react';
import Chart from 'chart.js/auto';
import { checkMessageLimit, incrementMessageCount } from '../utils/chatbotUsage';
import { getCachedOrFetchAI, hashText } from '../utils/aiCache';

// Custom Markdown + Code block parser
function parseMessageContent(text, onOpenArtifact) {
  if (!text) return null;

  // 1. Extract and separate artifacts from the text
  const artifactRegex = /<erArtifact\s+type="([^"]+)"\s+title="([^"]+)"(?:\s+filename="([^"]+)")?>([\s\S]*?)<\/erArtifact>/g;
  const artifacts = [];
  let match;
  let cleanText = text;

  // Reset regex index
  artifactRegex.lastIndex = 0;
  while ((match = artifactRegex.exec(text)) !== null) {
    artifacts.push({
      type: match[1],
      title: match[2],
      filename: match[3] || 'export.txt',
      content: match[4].trim()
    });
  }

  // Remove artifacts from clean text display
  cleanText = text.replace(artifactRegex, '').trim();

  // 2. Parse inline markdown / code blocks
  const parts = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;

  codeBlockRegex.lastIndex = 0;
  while ((match = codeBlockRegex.exec(cleanText)) !== null) {
    const textBefore = cleanText.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push({ type: 'text', content: textBefore });
    }
    parts.push({ type: 'code', lang: match[1], content: match[2] });
    lastIndex = codeBlockRegex.lastIndex;
  }

  const textAfter = cleanText.substring(lastIndex);
  if (textAfter) {
    parts.push({ type: 'text', content: textAfter });
  }

  return (
    <div class="space-y-3 font-serif text-[13px] leading-relaxed">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          return <CodeBlock key={idx} lang={part.lang} code={part.content} />;
        } else {
          return <FormattedText key={idx} text={part.content} />;
        }
      })}

      {artifacts.length > 0 && (
        <div class="mt-4 pt-3 border-t border-paper-border dark:border-paper-borderDark space-y-2">
          <span class="text-[10px] uppercase font-bold text-gold tracking-wider block font-sans">Generated Deliverables</span>
          {artifacts.map((art, aIdx) => (
            <button
              key={aIdx}
              onClick={() => onOpenArtifact(art)}
              class="w-full flex items-center justify-between p-2.5 bg-gray-50 dark:bg-navy-light/10 border border-paper-border dark:border-paper-borderDark rounded hover:border-gold dark:hover:border-gold transition-all text-left font-sans"
            >
              <div class="flex items-center gap-2">
                {art.type === 'chart' ? (
                  <BarChart2 size={16} class="text-gold" />
                ) : (
                  <FileText size={16} class="text-gold" />
                )}
                <div>
                  <span class="text-xs font-bold text-navy dark:text-gray-200 block leading-tight">{art.title}</span>
                  <span class="text-[9px] text-gray-400 block font-mono">{art.type === 'chart' ? 'Interactive Chart' : art.filename}</span>
                </div>
              </div>
              <div class="flex items-center gap-1 text-[10px] text-gold font-bold uppercase tracking-wider">
                <span>View</span>
                <ChevronRight size={12} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Styled Code Block with Copy Button
function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="my-3 border border-paper-border dark:border-paper-borderDark rounded-lg overflow-hidden font-mono text-xs">
      <div class="bg-gray-100 dark:bg-[#07111E] px-4 py-2 flex items-center justify-between border-b border-paper-border dark:border-paper-borderDark">
        <span class="text-[10px] uppercase font-bold text-gray-500">{lang || 'code'}</span>
        <button 
          onClick={handleCopy}
          class="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-gold transition-all uppercase"
        >
          {copied ? <Check size={11} class="text-green-500" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre class="p-4 bg-gray-50 dark:bg-[#040A12] text-navy dark:text-gray-250 overflow-x-auto leading-relaxed scrollbar-thin">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}

// Paragraph/list markdown formatter
function FormattedText({ text }) {
  // Convert basic markdown tags to HTML safely
  const lines = text.split('\n');
  const formattedElements = [];

  let inList = false;
  let listItems = [];

  const parseInline = (str) => {
    // Escape HTML special characters
    let escaped = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold (**text** or __text__)
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic (*text* or _text_)
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/_(.*?)_/g, '<em>$1</em>');

    // Inline Code (`code`)
    escaped = escaped.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-gray-150 dark:bg-navy-light/20 rounded font-mono text-xs text-gold">$1</code>');

    return <span dangerouslySetInnerHTML={{ __html: escaped }} />;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for bullet list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(trimmed.substring(2));
    } else {
      // If we were inside a list, flush the list items
      if (inList) {
        formattedElements.push(
          <ul key={`list-${index}`} class="list-disc pl-5 my-2 space-y-1 font-sans text-xs">
            {listItems.map((item, idx) => (
              <li key={idx}>{parseInline(item)}</li>
            ))}
          </ul>
        );
        inList = false;
        listItems = [];
      }

      if (trimmed) {
        // Headers
        if (trimmed.startsWith('### ')) {
          formattedElements.push(<h4 key={index} class="text-sm font-bold text-navy dark:text-gold mt-3 mb-1.5 font-sans">{parseInline(trimmed.substring(4))}</h4>);
        } else if (trimmed.startsWith('## ')) {
          formattedElements.push(<h3 key={index} class="text-base font-bold text-navy dark:text-gold mt-4 mb-2 font-sans border-b border-paper-border dark:border-paper-borderDark pb-1">{parseInline(trimmed.substring(3))}</h3>);
        } else if (trimmed.startsWith('# ')) {
          formattedElements.push(<h2 key={index} class="text-lg font-black text-navy dark:text-gold mt-5 mb-2 font-sans">{parseInline(trimmed.substring(2))}</h2>);
        } else {
          // Regular paragraph
          formattedElements.push(<p key={index} class="mb-2 leading-relaxed">{parseInline(line)}</p>);
        }
      } else {
        // Add a line break for double enters
        formattedElements.push(<div key={index} class="h-2"></div>);
      }
    }
  });

  // Final flush of active lists
  if (inList) {
    formattedElements.push(
      <ul key={`list-end`} class="list-disc pl-5 my-2 space-y-1 font-sans text-xs">
        {listItems.map((item, idx) => (
          <li key={idx}>{parseInline(item)}</li>
        ))}
      </ul>
    );
  }

  return <div class="formatted-markdown-wrapper">{formattedElements}</div>;
}

// Economic Chart using dynamic canvas registration
function EconomicChart({ artifact }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Parse JSON from configuration content
      const config = JSON.parse(artifact.content);

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const ctx = canvasRef.current.getContext('2d');
      
      const themeIsDark = document.documentElement.classList.contains('dark');
      const gridColor = themeIsDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
      const textColor = themeIsDark ? '#9CA3AF' : '#4B5563';

      chartRef.current = new Chart(ctx, {
        type: config.chartType || 'line',
        data: {
          labels: config.labels || [],
          datasets: (config.datasets || []).map((ds, idx) => ({
            label: ds.label || 'Data',
            data: ds.data || [],
            borderColor: idx === 0 ? '#D4AF37' : idx === 1 ? '#4682B4' : '#2E8B57', // Gold, SteelBlue, SeaGreen
            backgroundColor: idx === 0 ? 'rgba(212, 175, 55, 0.08)' : 'rgba(70, 130, 180, 0.08)',
            borderWidth: 2.5,
            tension: 0.35,
            fill: config.chartType !== 'bar',
            ...ds
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: textColor,
                font: { family: 'Inter, sans-serif', size: 10, weight: 'bold' }
              }
            },
            tooltip: {
              backgroundColor: themeIsDark ? '#0F1E32' : '#FFFFFF',
              titleColor: themeIsDark ? '#FFFFFF' : '#0A1628',
              bodyColor: themeIsDark ? '#D4AF37' : '#0A1628',
              borderColor: 'rgba(212, 175, 55, 0.3)',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { size: 9 } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { size: 9 } }
            }
          }
        }
      });
      setError(null);
    } catch (err) {
      console.error('Failed to render Chart.js:', err);
      setError('JSON compilation format error. Unable to construct dynamic ledger graph.');
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [artifact]);

  if (error) {
    return (
      <div class="h-64 flex flex-col items-center justify-center p-6 text-center border border-red-500/20 bg-red-500/5 rounded">
        <AlertCircle size={24} class="text-red-500 mb-2" />
        <span class="text-xs font-semibold text-red-500 font-sans">{error}</span>
        <pre class="mt-4 p-3 bg-navy text-gray-300 font-mono text-[9px] text-left overflow-x-auto w-full rounded border border-white/5">{artifact.content}</pre>
      </div>
    );
  }

  return (
    <div class="relative w-full h-[320px] bg-gray-50/50 dark:bg-navy-dark/30 p-4 border border-paper-border dark:border-paper-borderDark rounded-lg">
      <canvas ref={canvasRef} />
    </div>
  );
}

// Economic File/CSV Viewer
function EconomicFileViewer({ artifact }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', artifact.filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check if content looks like CSV
  const lines = artifact.content.split('\n').map(l => l.trim()).filter(Boolean);
  const isCSV = lines.length > 0 && lines[0].includes(',');

  let headers = [];
  let rows = [];

  if (isCSV) {
    try {
      headers = lines[0].split(',').map(h => h.replace(/^"(.*)"$/, '$1'));
      rows = lines.slice(1).map(row => 
        row.split(',').map(val => val.replace(/^"(.*)"$/, '$1'))
      );
    } catch (e) {
      console.error('Failed to parse CSV lines:', e);
    }
  }

  return (
    <div class="space-y-4">
      {/* File Action Controls */}
      <div class="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-navy-light/10 border border-paper-border dark:border-paper-borderDark rounded-lg font-sans">
        <div class="flex items-center gap-2">
          <FileText size={18} class="text-gold" />
          <div>
            <span class="text-xs font-bold text-navy dark:text-gray-200 block leading-tight">{artifact.title}</span>
            <span class="text-[9px] text-gray-400 block font-mono">{artifact.filename}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button 
            onClick={handleCopy}
            class="share-inline-btn"
          >
            {copied ? <Check size={11} class="text-green-500" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button 
            onClick={handleDownload}
            class="share-inline-btn"
          >
            <Download size={11} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* CSV Table Rendering */}
      {isCSV && headers.length > 0 ? (
        <div class="border border-paper-border dark:border-paper-borderDark rounded-lg overflow-hidden font-sans">
          <div class="overflow-x-auto max-h-[300px] scrollbar-thin">
            <table class="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr class="bg-gray-100 dark:bg-navy border-b border-paper-border dark:border-paper-borderDark text-navy dark:text-gold uppercase tracking-wider font-bold">
                  {headers.map((h, i) => (
                    <th key={i} class="px-3.5 py-2.5 border-r border-paper-border dark:border-paper-borderDark last:border-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-150/10 dark:divide-gray-800">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} class="hover:bg-gray-50 dark:hover:bg-navy-light/10 text-gray-700 dark:text-gray-300 font-medium">
                    {row.map((val, cIdx) => (
                      <td key={cIdx} class="px-3.5 py-2.5 border-r border-paper-border dark:border-paper-borderDark last:border-0 font-mono tabular-nums">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Standard plain text preview */
        <div class="border border-paper-border dark:border-paper-borderDark rounded-lg overflow-hidden font-mono text-xs">
          <pre class="p-4 bg-gray-50 dark:bg-[#040A12] text-navy dark:text-gray-250 overflow-x-auto max-h-[320px] scrollbar-thin leading-relaxed">
            {artifact.content}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ErAssistantFull() {
  const { user, subscription } = useAuth();
  
  // States
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Artifact panel split-view state
  const [activeArtifact, setActiveArtifact] = useState(null);
  const [artifactPanelOpen, setArtifactPanelOpen] = useState(false);
  const [fullscreenArtifact, setFullscreenArtifact] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usageLimit, setUsageLimit] = useState({ allowed: true, remaining: 21 });

  const scrollRef = useRef(null);
  const [cooldown, setCooldown] = useState(0);
  const isPro = subscription?.tier === 'PRO';

  // Load chat sessions from local storage on mount
  useEffect(() => {
    const key = `er_chat_sessions_${user ? user.uid : 'guest'}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
      }
    } else {
      // Create an initial session
      const initialSession = {
        id: 'session-' + Date.now(),
        title: 'Initial Inquiry Desk',
        messages: [
          {
            sender: 'bot',
            text: `Welcome to the Economical Research Assistant workspace. I am your specialized editor for global monetary policy, market structures, and financial data. How can I assist you with today's dispatches?`,
            timestamp: new Date().toISOString()
          }
        ]
      };
      setSessions([initialSession]);
      setCurrentSessionId(initialSession.id);
      localStorage.setItem(key, JSON.stringify([initialSession]));
    }
  }, [user]);

  // Scroll to bottom of chat logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessions, currentSessionId, loading]);

  // Fetch limit
  useEffect(() => {
    checkMessageLimit(user, subscription).then(setUsageLimit);
  }, [user, subscription]);

  const activeSession = sessions.find(s => s.id === currentSessionId);
  const history = activeSession ? activeSession.messages : [];

  // Save updated sessions to state and storage
  const saveSessions = (updatedSessions) => {
    setSessions(updatedSessions);
    const key = `er_chat_sessions_${user ? user.uid : 'guest'}`;
    localStorage.setItem(key, JSON.stringify(updatedSessions));
  };

  // Switch session
  const selectSession = (id) => {
    setCurrentSessionId(id);
    setActiveArtifact(null);
    setArtifactPanelOpen(false);
    setError(null);
    setSidebarOpen(false);
  };

  // Create new session
  const createNewSession = () => {
    const newSession = {
      id: 'session-' + Date.now(),
      title: 'New Analytical inquiry',
      messages: [
        {
          sender: 'bot',
          text: `A new briefing workspace has been established. Submit your topics below to fetch news indexes or generate economic graphs.`,
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setCurrentSessionId(newSession.id);
    setActiveArtifact(null);
    setArtifactPanelOpen(false);
    setError(null);
    setSidebarOpen(false);
  };

  // Delete session
  const deleteSession = (id, e) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      // Can't delete the only session, just reset it
      const resetSession = {
        id: 'session-' + Date.now(),
        title: 'Initial Inquiry Desk',
        messages: [
          {
            sender: 'bot',
            text: `Welcome back to the Economical Research Assistant workspace. What data briefings can I compile today?`,
            timestamp: new Date().toISOString()
          }
        ]
      };
      saveSessions([resetSession]);
      setCurrentSessionId(resetSession.id);
      setActiveArtifact(null);
      setArtifactPanelOpen(false);
      return;
    }

    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    
    if (currentSessionId === id) {
      setCurrentSessionId(updated[0].id);
      setActiveArtifact(null);
      setArtifactPanelOpen(false);
    }
  };

  const handleSend = async (e, directText = null) => {
    if (e) e.preventDefault();
    const textToSend = directText || message;
    if (!textToSend.trim()) return;

    if (cooldown > 0) return;

    setCooldown(5);
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Message limit check
    const limitCheck = await checkMessageLimit(user, subscription);
    if (!limitCheck.allowed) {
      const paywallMessage = {
        sender: 'bot',
        text: `You've used all 21 free messages! 🎉\nUpgrade to ER PRO for unlimited AI assistance.`,
        isPaywall: true,
        timestamp: new Date().toISOString()
      };
      const updated = sessions.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, { sender: 'user', text: textToSend, timestamp: new Date().toISOString() }, paywallMessage]
          };
        }
        return s;
      });
      saveSessions(updated);
      setMessage('');
      setUsageLimit(limitCheck);
      return;
    }

    const newUserMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...history, newUserMessage];
    
    // Update session with user message and dynamically update title on first query
    const updatedSessionsUser = sessions.map(s => {
      if (s.id === currentSessionId) {
        const needsTitleUpdate = s.title === 'New Analytical inquiry' || s.title === 'Initial Inquiry Desk';
        return {
          ...s,
          title: needsTitleUpdate ? (textToSend.slice(0, 24) + (textToSend.length > 24 ? '...' : '')) : s.title,
          messages: updatedHistory
        };
      }
      return s;
    });

    saveSessions(updatedSessionsUser);
    setMessage('');
    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      // Build valid Gemini contents from updated history
      // 1. Filter out paywall messages
      let rawContents = updatedHistory
        .filter(h => h.sender === 'user' || (h.sender === 'bot' && !h.isPaywall))
        .map(h => ({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        }));

      // 2. Gemini requires conversation to START with 'user' role
      while (rawContents.length > 0 && rawContents[0].role === 'model') {
        rawContents.shift();
      }

      // 3. Collapse consecutive same-role messages (Gemini API rejects them)
      const geminiContents = rawContents.reduce((acc, curr) => {
        if (acc.length > 0 && acc[acc.length - 1].role === curr.role) {
          acc[acc.length - 1].parts[0].text += '\n' + curr.parts[0].text;
        } else {
          acc.push(curr);
        }
        return acc;
      }, []);

      // 4. Safety check
      if (geminiContents.length === 0) {
        geminiContents.push({ role: 'user', parts: [{ text: textToSend }] });
      }

      const apiCall = async () => {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: geminiContents,
              systemInstruction: {
                parts: [{ 
                  text: `You are ER Assistant, a specialized AI editor for the Economical Research news platform (er-news-sarvesh.vercel.app).

You are an expert in:
- Global economics, monetary policy, and market analysis
- Financial data, stock market trends, interest rates
- Geopolitical news and its economic implications
- Data visualization (charts) and structured data (CSV reports)

When appropriate, you can generate structured artifacts using this format:
<erArtifact type="chart" title="Chart Title" filename="data.json">
{"chartType":"line","labels":["Jan","Feb","Mar"],"datasets":[{"label":"GDP Growth","data":[2.1,2.3,2.5]}]}
</erArtifact>

Or for CSV data:
<erArtifact type="csv" title="Report Title" filename="report.csv">
Year,Value,Country
2023,4.2,India
</erArtifact>

Always be professional, analytical, and cite economic context. Format responses with clear markdown structure.`
                }]
              },
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1200
              }
            })
          }
        );

        if (response.status === 429) {
          throw { status: 429 };
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(`API error ${response.status}: ${errData?.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!replyText) {
          throw new Error('Empty response from AI');
        }
        return replyText;
      };

      try {
        const historyHash = hashText(JSON.stringify(geminiContents));
        const cacheKey = `chat_${historyHash}`;
        const { content: replyText, fromCache } = await getCachedOrFetchAI(cacheKey, apiCall);

        const newBotMessage = {
          sender: 'bot',
          text: replyText,
          fromCache: fromCache,
          timestamp: new Date().toISOString()
        };

        const finalSessions = sessions.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: [...updatedHistory, newBotMessage]
            };
          }
          return s;
        });

        saveSessions(finalSessions);

        // Increment limit count and update state
        await incrementMessageCount(user);
        const newLimitCheck = await checkMessageLimit(user, subscription);
        setUsageLimit(newLimitCheck);

        // Auto-open artifacts panel if a new artifact is found inside the bot's response
        const artifactRegex = /<erArtifact\s+type="([^"]+)"\s+title="([^"]+)"(?:\s+filename="([^"]+)")?>([\s\S]*?)<\/erArtifact>/;
        const artifactMatch = replyText.match(artifactRegex);
        if (artifactMatch) {
          const parsedArtifact = {
            type: artifactMatch[1],
            title: artifactMatch[2],
            filename: artifactMatch[3] || 'export.txt',
            content: artifactMatch[4].trim()
          };
          setActiveArtifact(parsedArtifact);
          setArtifactPanelOpen(true);
        }
      } catch (err) {
        if (err.status === 429) {
          const finalSessions = sessions.map(s => {
            if (s.id === currentSessionId) {
              return {
                ...s,
                messages: [...updatedHistory, {
                  sender: 'bot',
                  text: '⏳ High demand right now! Try again in 30 seconds.',
                  timestamp: new Date().toISOString()
                }]
              };
            }
            return s;
          });
          saveSessions(finalSessions);
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('ER Assistant Full error:', err);
      setError(`Connection error: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenArtifact = (art) => {
    setActiveArtifact(art);
    setArtifactPanelOpen(true);
  };

  const suggestionPrompts = [
    'Analyze the correlation between global shipping rates and core inflation.',
    'Provide a chart of India GDP growth rates from 2020 to 2025.',
    'Generate a CSV report comparing US, China, and EU interest rates.'
  ];

  return (
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-6 h-[calc(100vh-140px)] min-h-[550px] flex gap-4 overflow-hidden font-sans select-none relative">
      
      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          class="fixed inset-0 bg-black/60 z-20 md:hidden" 
        />
      )}

      {/* 1. LEFT SIDEBAR: CHAT SESSIONS LEDGER */}
      <div class={`w-64 bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded-lg flex flex-col shrink-0 overflow-hidden shadow-md absolute md:relative top-0 left-0 md:top-auto md:left-auto z-30 h-full md:h-auto transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Sidebar Header */}
        <div class="p-3 border-b border-paper-border dark:border-paper-borderDark flex items-center justify-between bg-gray-50/50 dark:bg-navy-light/10">
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              class="md:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-navy-light/10 transition-colors"
              title="Close Workspaces"
            >
              <X size={14} />
            </button>
            <span class="text-[9px] font-black uppercase tracking-widest text-navy dark:text-gold font-mono"> brief workspaces</span>
          </div>
          <button 
            onClick={createNewSession}
            class="p-1 rounded bg-navy dark:bg-gold text-gold dark:text-navy hover:scale-105 transition-all shadow-sm border border-gold/10"
            title="New Chat Desk"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Sessions List */}
        <div class="flex-grow overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {sessions.map(s => {
            const isActive = s.id === currentSessionId;
            return (
              <button
                key={s.id}
                onClick={() => selectSession(s.id)}
                class={`w-full text-left p-2.5 rounded text-[11px] font-bold transition-all flex items-center justify-between group border ${
                  isActive 
                    ? 'bg-navy dark:bg-gold text-gold dark:text-navy border-gold/20' 
                    : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-navy-light/10 text-gray-550 dark:text-gray-300'
                }`}
              >
                <div class="flex items-center gap-1.5 min-w-0 flex-grow">
                  <MessageSquare size={13} class={isActive ? 'text-gold dark:text-navy' : 'text-gray-400 group-hover:text-gold'} />
                  <span class="truncate block pr-2">{s.title}</span>
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  class={`opacity-0 group-hover:opacity-100 transition-all p-0.5 rounded hover:bg-red-500/15 hover:text-red-500 ${
                    isActive ? 'text-gold dark:text-navy hover:text-red-500 hover:bg-red-500/10' : 'text-gray-400'
                  }`}
                  title="Purge session"
                >
                  <Trash2 size={12} />
                </button>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div class="p-3 border-t border-paper-border dark:border-paper-borderDark text-[9px] font-mono text-center text-gray-450 dark:text-gray-500 select-none">
          Claude Engine v3.5 • Gemini Flash
        </div>
      </div>

      {/* 2. CHAT workspace CONTROLLER */}
      <div class="flex-grow flex gap-4 overflow-hidden relative min-w-0">
        
        {/* MAIN CHAT WINDOW */}
        <div class="flex-grow bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded-lg flex flex-col overflow-hidden shadow-md min-w-0">
          
          {/* Header */}
          <div class="px-4 py-3 bg-navy text-white flex flex-col gap-2 border-b border-gold/20 shrink-0">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  class="md:hidden p-1 -ml-1 text-gold hover:text-white rounded hover:bg-white/5 transition-colors"
                  title="Open Workspaces"
                >
                  <Menu size={16} />
                </button>
                <Sparkles size={15} class="text-gold" />
                <span class="font-serif text-[11px] font-black uppercase tracking-wider text-gold">ER Claude Assistant</span>
              </div>
              {artifactPanelOpen && (
                <button 
                  onClick={() => setArtifactPanelOpen(false)}
                  class="lg:hidden text-gray-450 hover:text-white text-xs border border-white/20 px-2 py-0.5 rounded font-sans uppercase tracking-wider"
                >
                  Hide Panel
                </button>
              )}
            </div>
            {/* Limit Banner */}
            <div class="flex justify-between items-center bg-white/5 px-2.5 py-1.5 rounded text-[11px] font-bold">
              {isPro ? (
                <span class="text-gold">✨ Unlimited messages (PRO member)</span>
              ) : (
                <>
                  <span class={`${usageLimit.remaining <= 5 ? 'text-orange-400' : 'text-gray-300'}`}>
                    {usageLimit.remaining <= 5 ? '⚠️ Only ' : '💬 '}{usageLimit.remaining} free messages remaining
                  </span>
                  {usageLimit.remaining <= 5 && (
                    <button onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: 'billing' }))} class="text-gold hover:text-white transition-colors underline">Upgrade</button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Messages list */}
          <div class="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin bg-paper dark:bg-paper-dark select-text">
            {history.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={idx} 
                  class={`flex gap-3 max-w-[85%] items-start animate-fade-in ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* AI Circle Avatar */}
                  {!isUser && (
                    <div class="w-8 h-8 rounded-full bg-navy text-gold border border-gold/20 flex items-center justify-center font-serif font-black text-xs shrink-0 select-none shadow">
                      ER
                    </div>
                  )}

                  <div class="flex flex-col">
                    <div 
                      class={`px-4 py-3 rounded-lg shadow-sm border ${
                        isUser
                          ? 'bg-navy text-gold dark:bg-gold dark:text-navy border-gold/15 rounded-tr-none font-semibold'
                          : msg.isPaywall 
                            ? 'bg-red-550/10 text-red-700 dark:text-red-400 border-red-500/20 rounded-tl-none'
                            : 'bg-white dark:bg-paper-cardDark text-navy dark:text-gray-200 border-paper-border dark:border-paper-borderDark rounded-tl-none'
                      }`}
                    >
                      {isUser ? (
                        <p class="text-[13px] leading-relaxed font-sans font-medium whitespace-pre-line">{msg.text}</p>
                      ) : (
                        <div>
                          {parseMessageContent(msg.text, handleOpenArtifact)}
                          {msg.fromCache && (
                            <div class="mt-1.5 flex justify-end">
                              <span class="text-[7.5px] font-bold px-2 py-0.5 rounded bg-amber-550/10 text-amber-500 border border-amber-500/20 font-mono">
                                ⚡ Instant
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {msg.isPaywall && (
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('change-view', { detail: 'billing' }));
                          }}
                          class="mt-3 w-full block bg-navy text-gold border border-gold hover:bg-navy-light font-bold text-[10px] uppercase px-3 py-2 rounded text-center tracking-wider transition-all font-sans"
                        >
                          🚀 Upgrade to PRO - Unlimited Messages
                        </button>
                      )}
                    </div>
                    <span class={`text-[8.5px] text-gray-450 dark:text-gray-500 mt-1 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Empty view: Suggestion cards */}
            {history.length <= 1 && (
              <div class="py-10 px-4 max-w-md mx-auto space-y-4 text-center select-none font-serif">
                <div class="flex justify-center text-4xl mb-2">🤖</div>
                <h3 class="text-base font-bold text-navy dark:text-gold uppercase tracking-wider">How can I assist your analytical research?</h3>
                <p class="text-[11px] leading-relaxed text-gray-400">
                  Ask me about macroeconomic models, sector indexes, monetary actions, or let me synthesize dynamic datasets and trend charts.
                </p>
                
                <div class="pt-4 space-y-2 text-left">
                  <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block text-center mb-2 font-sans">Suggested briefs to request</span>
                  {suggestionPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => handleSend(e, p)}
                      class="w-full text-left bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark hover:border-gold dark:hover:border-gold p-3 rounded-lg text-[10.5px] text-navy dark:text-gray-300 font-sans font-bold leading-normal transition-all hover:-translate-y-0.5 shadow-sm"
                    >
                      ✦ {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loader indicator */}
            {loading && (
              <div class="flex gap-3 max-w-[80%] items-start animate-pulse select-none">
                <div class="w-8 h-8 rounded-full bg-navy text-gold border border-gold/15 flex items-center justify-center font-serif font-black text-xs shrink-0 shadow">
                  ER
                </div>
                <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark px-4 py-3 rounded-lg rounded-tl-none shadow-sm flex flex-col gap-1.5">
                  <div class="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider font-sans">
                    <RefreshCw size={10} class="animate-spin text-gold" />
                    <span>Compiling wire indices...</span>
                  </div>
                  {/* Claude Dot Typing Indicator */}
                  <div class="flex items-center gap-1 py-1 px-0.5">
                    <span class="w-1.5 h-1.5 bg-gold rounded-full animate-[bounce_1.4s_infinite_0ms]"></span>
                    <span class="w-1.5 h-1.5 bg-gold rounded-full animate-[bounce_1.4s_infinite_200ms]"></span>
                    <span class="w-1.5 h-1.5 bg-gold rounded-full animate-[bounce_1.4s_infinite_400ms]"></span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div class="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-500/20 font-sans font-bold">
                <AlertCircle size={14} class="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={scrollRef}></div>
          </div>

          {/* Footer Input form */}
          <form onSubmit={(e) => handleSend(e)} class="p-3.5 border-t border-paper-border dark:border-paper-borderDark bg-white dark:bg-paper-cardDark shrink-0 flex items-center gap-2">
            <input
              type="text"
              placeholder={isPro ? "Request economic report or trend chart..." : "Message ER Assistant..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              class="flex-grow bg-gray-50 dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white font-medium"
            />
            <button
              type="submit"
              disabled={loading || cooldown > 0 || !message.trim()}
              class="bg-navy hover:bg-navy-light text-gold p-3 rounded-lg transition-all disabled:opacity-40 hover:scale-105 border border-gold/10 min-w-[40px] flex justify-center items-center"
              title="Submit Inquiry"
            >
              {cooldown > 0 ? <span class="text-[9px] font-bold tracking-widest uppercase">Wait {cooldown}s</span> : <Send size={14} />}
            </button>
          </form>
        </div>

        {/* 3. CLAUDE-STYLE ARTIFACTS PANEL */}
        {artifactPanelOpen && activeArtifact && (
          <div 
            class={`bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded-lg shadow-xl flex flex-col overflow-hidden transition-all duration-300 z-20 min-w-0 ${
              fullscreenArtifact 
                ? 'absolute inset-0' 
                : 'absolute inset-0 lg:relative lg:inset-auto lg:w-[480px] lg:shrink-0'
            }`}
          >
            {/* Panel Header */}
            <div class="px-4 py-3 bg-[#07111E] text-white flex items-center justify-between border-b border-gold/20 font-sans">
              <div class="flex items-center gap-1.5 min-w-0">
                {activeArtifact.type === 'chart' ? (
                  <BarChart2 size={15} class="text-gold" />
                ) : (
                  <FileText size={15} class="text-gold" />
                )}
                <span class="text-xs font-bold uppercase tracking-wider text-gold truncate">{activeArtifact.title}</span>
              </div>
              <div class="flex items-center gap-1 text-gray-400">
                {/* Fullscreen toggle */}
                <button 
                  onClick={() => setFullscreenArtifact(!fullscreenArtifact)}
                  class="p-1 hover:text-white rounded hover:bg-white/5"
                  title={fullscreenArtifact ? 'Exit fullscreen' : 'Maximize preview'}
                >
                  {fullscreenArtifact ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                {/* Close panel */}
                <button 
                  onClick={() => setArtifactPanelOpen(false)}
                  class="p-1 hover:text-white rounded hover:bg-white/5"
                  title="Close preview"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Panel Content Body */}
            <div class="flex-grow overflow-y-auto p-4 scrollbar-thin bg-paper dark:bg-paper-dark">
              {activeArtifact.type === 'chart' ? (
                <div class="space-y-4">
                  <div class="p-3 bg-gray-50 dark:bg-navy-light/10 border border-paper-border dark:border-paper-borderDark rounded-lg text-[11px] leading-relaxed text-gray-550 dark:text-gray-350 font-serif">
                    💡 <strong>Economic Intelligence Visualization</strong>: The chart below plots the requested data points dynamically. Hover over nodes to inspect specific dates and numeric values.
                  </div>
                  <EconomicChart artifact={activeArtifact} />
                  <pre class="p-3 bg-[#040A12] text-gray-400 rounded border border-paper-border dark:border-paper-borderDark font-mono text-[9px] overflow-x-auto leading-normal">
                    {/* Pretty format the JSON data */}
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(activeArtifact.content), null, 2);
                      } catch (e) {
                        return activeArtifact.content;
                      }
                    })()}
                  </pre>
                </div>
              ) : (
                <EconomicFileViewer artifact={activeArtifact} />
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.2);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.4);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.35s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
