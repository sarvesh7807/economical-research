import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, X, Send, Sparkles, AlertCircle, RefreshCw, Copy, Check, Minus } from 'lucide-react';
import { checkMessageLimit, incrementMessageCount } from '../utils/chatbotUsage';

// Custom lightweight inline parser for the drawer message bubbles
function parseDrawerMessageContent(text) {
  if (!text) return null;

  // 1. Strip artifacts out and show a brief workspace invitation
  const artifactRegex = /<erArtifact\s+type="([^"]+)"\s+title="([^"]+)"(?:\s+filename="([^"]+)")?>([\s\S]*?)<\/erArtifact>/g;
  const artifacts = [];
  let match;
  let cleanText = text;

  artifactRegex.lastIndex = 0;
  while ((match = artifactRegex.exec(text)) !== null) {
    artifacts.push({
      type: match[1],
      title: match[2],
      filename: match[3] || 'export.txt'
    });
  }

  // Remove artifacts from chat bubble
  cleanText = text.replace(artifactRegex, '').trim();

  // 2. Parse code blocks
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
    <div class="space-y-2 font-serif text-[11px] leading-relaxed">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          return <DrawerCodeBlock key={idx} lang={part.lang} code={part.content} />;
        } else {
          return <DrawerFormattedText key={idx} text={part.content} />;
        }
      })}

      {artifacts.length > 0 && (
        <div class="mt-3 pt-2.5 border-t border-paper-border dark:border-paper-borderDark space-y-1.5 font-sans">
          <span class="text-[8.5px] uppercase font-bold text-gold tracking-widest block">Ledger Artifact Created</span>
          {artifacts.map((art, aIdx) => (
            <button
              key={aIdx}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('change-view', { detail: 'assistant' }));
              }}
              class="w-full flex items-center justify-between p-2 bg-gray-55 dark:bg-navy-light/10 border border-paper-border dark:border-paper-borderDark rounded hover:border-gold dark:hover:border-gold transition-all text-left"
            >
              <div class="min-w-0">
                <span class="text-[10px] font-bold text-navy dark:text-gray-200 block truncate">{art.title}</span>
                <span class="text-[8px] text-gray-400 block font-mono">{art.type === 'chart' ? 'Interactive Chart' : 'CSV Spreadsheet'}</span>
              </div>
              <span class="text-[8.5px] text-gold font-bold uppercase tracking-wider shrink-0 ml-2">Open Workspace ↗</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact Code Block for Drawer
function DrawerCodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="my-2 border border-paper-border dark:border-paper-borderDark rounded overflow-hidden font-mono text-[10px] select-text">
      <div class="bg-gray-100 dark:bg-[#07111E] px-2.5 py-1.5 flex items-center justify-between border-b border-paper-border dark:border-paper-borderDark select-none">
        <span class="text-[8.5px] uppercase font-bold text-gray-500">{lang || 'code'}</span>
        <button 
          onClick={handleCopy}
          class="flex items-center gap-0.5 text-[8.5px] font-bold text-gray-500 hover:text-gold transition-all uppercase"
        >
          {copied ? <Check size={9} class="text-green-500" /> : <Copy size={9} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre class="p-2.5 bg-gray-55 dark:bg-[#040A12] text-navy dark:text-gray-250 overflow-x-auto leading-normal scrollbar-none">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}

// Formatted text for Drawer
function DrawerFormattedText({ text }) {
  const lines = text.split('\n');
  const formattedElements = [];

  let inList = false;
  let listItems = [];

  const parseInline = (str) => {
    let escaped = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/__(.*?)__/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/_(.*?)_/g, '<em>$1</em>');
    escaped = escaped.replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-gray-150 dark:bg-navy-light/25 rounded font-mono text-[9.5px] text-gold">$1</code>');

    return <span dangerouslySetInnerHTML={{ __html: escaped }} />;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(trimmed.substring(2));
    } else {
      if (inList) {
        formattedElements.push(
          <ul key={`list-${index}`} class="list-disc pl-4 my-1.5 space-y-0.5 font-sans text-[10px]">
            {listItems.map((item, idx) => (
              <li key={idx}>{parseInline(item)}</li>
            ))}
          </ul>
        );
        inList = false;
        listItems = [];
      }

      if (trimmed) {
        if (trimmed.startsWith('### ')) {
          formattedElements.push(<h4 key={index} class="text-[11.5px] font-bold text-navy dark:text-gold mt-2 mb-1 font-sans">{parseInline(trimmed.substring(4))}</h4>);
        } else if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          formattedElements.push(<h3 key={index} class="text-xs font-black text-navy dark:text-gold mt-2.5 mb-1 font-sans border-b border-paper-border dark:border-paper-borderDark pb-0.5">{parseInline(trimmed.replace(/^#+\s+/, ''))}</h3>);
        } else {
          formattedElements.push(<p key={index} class="mb-1.5 leading-normal">{parseInline(line)}</p>);
        }
      } else {
        formattedElements.push(<div key={index} class="h-1"></div>);
      }
    }
  });

  if (inList) {
    formattedElements.push(
      <ul key={`list-end`} class="list-disc pl-4 my-1.5 space-y-0.5 font-sans text-[10px]">
        {listItems.map((item, idx) => (
          <li key={idx}>{parseInline(item)}</li>
        ))}
      </ul>
    );
  }

  return <div class="formatted-markdown-drawer-wrapper">{formattedElements}</div>;
}export default function AiAssistant() {
  const { user, subscription } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usageLimit, setUsageLimit] = useState({ allowed: true, remaining: 21 });
  const scrollRef = useRef(null);

  const isPro = subscription?.tier === 'PRO';

  const quickReplies = [
    "📰 Latest News",
    "💰 Business News",
    "🌍 World News",
    "📊 Stock Market",
    "💎 Upgrade to PRO",
    "❓ Help"
  ];

  // Load chatbot history from local storage per user session
  useEffect(() => {
    const key = `er_chat_history_${user ? user.uid : 'guest'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setHistory(JSON.parse(saved));
    } else {
      setHistory([
        {
          sender: 'bot',
          text: `Hello! I am ER Assistant 👋\nI can help you with latest news, economic analysis and research.\nWhat would you like to know today?`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [user]);

  // Scroll to bottom of chat logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, loading]);

  // Load limits when opened
  useEffect(() => {
    if (isOpen) {
      checkMessageLimit(user, subscription).then(setUsageLimit);
    }
  }, [isOpen, user, subscription]);

  const saveHistory = (updated) => {
    setHistory(updated);
    const key = `er_chat_history_${user ? user.uid : 'guest'}`;
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const handleSend = async (e, directText = null) => {
    if (e) e.preventDefault();
    const textToSend = directText || message;
    if (!textToSend.trim()) return;

    // Message limit check
    const limitCheck = await checkMessageLimit(user, subscription);
    if (!limitCheck.allowed) {
      saveHistory([
        ...history,
        { sender: 'user', text: textToSend, timestamp: new Date().toISOString() },
        { 
          sender: 'bot', 
          text: `You've used all 21 free messages! 🎉\nUpgrade to ER PRO for unlimited AI assistance.`,
          isPaywall: true,
          timestamp: new Date().toISOString() 
        }
      ]);
      setMessage('');
      setUsageLimit(limitCheck);
      return;
    }

    const newUserMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...history, newUserMessage];
    saveHistory(newHistory);
    setMessage('');
    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      // Build valid Gemini contents:
      // 1. Exclude paywall messages and system-only bot messages
      // 2. Map to Gemini roles
      let rawContents = newHistory
        .filter(h => h.sender === 'user' || (h.sender === 'bot' && !h.isPaywall))
        .map(h => ({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        }));

      // 3. Gemini requires conversation to START with 'user' role
      //    Drop any leading 'model' messages
      while (rawContents.length > 0 && rawContents[0].role === 'model') {
        rawContents.shift();
      }

      // 4. Collapse consecutive same-role messages (Gemini rejects them)
      const geminiContents = rawContents.reduce((acc, curr) => {
        if (acc.length > 0 && acc[acc.length - 1].role === curr.role) {
          // Merge text into the last message
          acc[acc.length - 1].parts[0].text += '\n' + curr.parts[0].text;
        } else {
          acc.push(curr);
        }
        return acc;
      }, []);

      // 5. Safety check: if nothing remains, send a minimal user message
      if (geminiContents.length === 0) {
        geminiContents.push({ role: 'user', parts: [{ text: textToSend }] });
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: geminiContents,
            systemInstruction: {
              parts: [{ 
                text: `You are ER Assistant, the AI assistant for Economical Research news website (er-news-sarvesh.vercel.app).
You help users with:
- Latest news summaries and breaking stories
- Economic and financial analysis
- Market trends and stock information
- Research help and fact-checking
- Website navigation and subscription info

Always be helpful, professional, and concise. Format responses clearly using markdown (bullet points, bold text) where appropriate. Keep responses focused and under 200 words unless asked for detail.` 
              }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600
            }
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`API error ${response.status}: ${errData?.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!replyText) {
        throw new Error('Empty response from AI');
      }
      
      saveHistory([
        ...newHistory,
        {
          sender: 'bot',
          text: replyText,
          timestamp: new Date().toISOString()
        }
      ]);

      // Increment limit count and update state
      await incrementMessageCount(user);
      const newLimitCheck = await checkMessageLimit(user, subscription);
      setUsageLimit(newLimitCheck);
    } catch (err) {
      console.error('ER Assistant error:', err);
      setError(`Connection error: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    const fresh = [
      {
        sender: 'bot',
        text: `Hello! I am ER Assistant 👋\nI can help you with latest news, economic analysis and research.\nWhat would you like to know today?`,
        timestamp: new Date().toISOString()
      }
    ];
    saveHistory(fresh);
  };

  return (
    <>
      {/* 1. FLOATING CHAT TRIGGER BUBBLE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        class="fixed bottom-6 right-6 z-40 bg-navy hover:bg-navy-light text-gold p-4 rounded-full shadow-[0_4px_20px_rgba(10,22,40,0.35)] dark:shadow-[0_4px_20px_rgba(212,175,55,0.2)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center border border-gold/40 focus:outline-none"
        title="ER Intelligence Assistant"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} class="animate-pulse" />}
      </button>

      {/* 2. CHAT DRAWER */}
      {isOpen && (
        <div class="fixed bottom-0 right-0 w-full h-full sm:bottom-20 sm:right-6 sm:w-96 sm:h-[480px] sm:rounded-2xl bg-white dark:bg-paper-cardDark border-t sm:border border-paper-border dark:border-paper-borderDark shadow-2xl z-40 flex flex-col overflow-hidden font-sans select-none animate-fade-in">
          {/* Header */}
          <div class="bg-navy text-white px-4 py-3 flex flex-col gap-2 border-b border-gold/20 shrink-0 select-none">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <Sparkles size={14} class="text-gold animate-pulse" />
                <span class="font-serif text-xs font-black uppercase tracking-wider text-gold">ER Assistant</span>
              </div>
              <div class="flex items-center gap-1.5 select-none">
                <button 
                  onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('change-view', { detail: 'assistant' })); }}
                  class="text-[9px] hover:text-gold uppercase tracking-wider font-bold border border-gold/30 text-gold px-1.5 py-0.5 rounded bg-gold/5 transition-all"
                  title="Open Split Workspace"
                >
                  Workspace
                </button>
                <button 
                  onClick={handleClear}
                  class="text-[9px] hover:text-gold uppercase tracking-wider font-bold border border-white/20 px-1.5 py-0.5 rounded transition-all"
                  title="Clear Logs"
                >
                  Clear
                </button>
                <button onClick={() => setIsOpen(false)} class="text-gray-400 hover:text-white p-1 rounded transition-colors" title="Minimize Chat">
                  <Minus size={14} />
                </button>
              </div>
            </div>
            {/* Limit Banner */}
            <div class="flex justify-between items-center bg-white/5 px-2 py-1 rounded text-[10px] font-bold">
              {isPro ? (
                <span class="text-gold">✨ Unlimited messages (PRO member)</span>
              ) : (
                <>
                  <span class={`${usageLimit.remaining <= 5 ? 'text-orange-400' : 'text-gray-300'}`}>
                    {usageLimit.remaining <= 5 ? '⚠️ Only ' : '💬 '}{usageLimit.remaining} free messages remaining
                  </span>
                  {usageLimit.remaining <= 5 && (
                    <button onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('change-view', { detail: 'billing' })); }} class="text-gold hover:text-white transition-colors underline">Upgrade</button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Messages body */}
          <div class="flex-grow overflow-y-auto p-4 space-y-3.5 scrollbar-none bg-paper dark:bg-paper-dark select-text">
            {history.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={idx} 
                  class={`flex gap-2 max-w-[88%] items-start animate-fade-in ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {!isUser && (
                    <div class="w-6 h-6 rounded-full bg-navy text-gold border border-gold/15 flex items-center justify-center font-serif font-black text-[9px] shrink-0 select-none shadow">
                      ER
                    </div>
                  )}
                  <div class="flex flex-col">
                    <div 
                      class={`px-3 py-2 rounded-2xl text-[11px] leading-relaxed shadow-sm border ${
                        isUser
                          ? 'bg-gold text-navy font-bold rounded-tr-none border-gold/30 ml-auto'
                          : msg.isPaywall 
                            ? 'bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/30 rounded-tl-none mr-auto'
                            : 'bg-navy text-white dark:bg-navy dark:text-white border border-gold/25 rounded-tl-none mr-auto'
                      }`}
                    >
                      {isUser ? (
                        <p class="whitespace-pre-line font-sans font-medium">{msg.text}</p>
                      ) : (
                        parseDrawerMessageContent(msg.text)
                      )}
                      
                      {msg.isPaywall && (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            window.dispatchEvent(new CustomEvent('change-view', { detail: 'billing' }));
                          }}
                          class="mt-2 block w-full bg-navy border border-gold hover:bg-navy-light text-gold font-bold text-[9px] uppercase px-2 py-1.5 rounded text-center tracking-wider transition-all font-sans"
                        >
                          🚀 Upgrade to PRO - Unlimited Messages
                        </button>
                      )}
                    </div>
                    <span class={`text-[7.5px] text-gray-455 dark:text-gray-500 mt-1 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div class="flex gap-2 max-w-[88%] items-start animate-fade-in mr-auto">
                <div class="w-6 h-6 rounded-full bg-navy text-gold border border-gold/15 flex items-center justify-center font-serif font-black text-[9px] shrink-0 select-none shadow">
                  ER
                </div>
                <div class="flex flex-col">
                  <div class="px-4 py-2 bg-navy text-gold border border-gold/25 rounded-2xl rounded-tl-none text-xs flex items-center gap-1 shadow-md">
                    <span class="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span class="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span class="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div class="flex items-center gap-1.5 text-[10px] text-red-500 bg-red-50 dark:bg-red-955/20 p-2 rounded border border-red-500/20 font-bold font-sans select-none">
                <AlertCircle size={12} class="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={scrollRef}></div>
          </div>

          {/* Quick Replies Row */}
          <div class="px-3 py-2 border-t border-paper-border dark:border-paper-borderDark bg-gray-55 dark:bg-paper-dark/50 flex gap-2 overflow-x-auto scrollbar-none shrink-0 select-none">
            {quickReplies.map((qr, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleSend(e, qr)}
                class="shrink-0 px-2.5 py-1 bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark hover:border-gold dark:hover:border-gold rounded-full text-[10px] font-bold text-navy dark:text-gray-300 transition-all shadow-sm"
              >
                {qr}
              </button>
            ))}
          </div>

          {/* Footer input form */}
          <form onSubmit={(e) => handleSend(e)} class="p-3 border-t border-paper-border dark:border-paper-borderDark bg-white dark:bg-paper-cardDark shrink-0 flex items-center gap-2">
            <input
              type="text"
              placeholder={isPro ? "Query research assistant..." : "Message ER Assistant..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              class="flex-grow bg-gray-50 dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              class="bg-navy hover:bg-navy-light text-gold p-2 rounded transition-all disabled:opacity-50"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </>
  );
}

