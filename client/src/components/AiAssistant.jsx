import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, X, Send, Sparkles, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';

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
}

export default function AiAssistant() {
  const { user, subscription } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const isPro = subscription?.tier === 'PRO';

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
          text: `Welcome to Economical Research. I am your Research Assistant. How can I assist you with today's intelligence bulletins?`,
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

  const saveHistory = (updated) => {
    setHistory(updated);
    const key = `er_chat_history_${user ? user.uid : 'guest'}`;
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const handleSend = async (e, directText = null) => {
    if (e) e.preventDefault();
    const textToSend = directText || message;
    if (!textToSend.trim()) return;

    // Daily summaries / AI count check for Basic users
    if (!isPro) {
      const today = new Date().toISOString().split('T')[0];
      const countKey = `er_paywall_summaries_${today}`;
      const summariesToday = parseInt(localStorage.getItem(countKey) || '0', 10);
      if (summariesToday >= 3) {
        saveHistory([
          ...history,
          { sender: 'user', text: textToSend, timestamp: new Date().toISOString() },
          { 
            sender: 'bot', 
            text: '⚠️ You have exceeded the 3 daily AI queries limit on the Basic Tier. Please upgrade to PRO for unlimited assistant queries.',
            isPaywall: true,
            timestamp: new Date().toISOString() 
          }
        ]);
        setMessage('');
        return;
      }
      // Increment AI query count
      localStorage.setItem(countKey, summariesToday + 1);
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
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: newHistory.slice(-10) // Send last 10 messages for context
        })
      });

      if (!response.ok) throw new Error('Query error');
      const data = await response.json();
      
      saveHistory([
        ...newHistory,
        {
          sender: 'bot',
          text: data.reply,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.error(err);
      setError('Connection disrupted. Please check server settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    const fresh = [
      {
        sender: 'bot',
        text: `Chat logs purged. How can I assist you with today's intelligence bulletins?`,
        timestamp: new Date().toISOString()
      }
    ];
    saveHistory(fresh);
  };

  const suggestionPrompts = [
    'What is the economic impact of global shipping bottlenecks?',
    'Explain the correlation between interest rates and inflation.',
    'List recent technology policy changes in India.'
  ];

  return (
    <>
      {/* 1. FLOATING CHAT TRIGGER BUBBLE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        class="fixed bottom-6 right-6 z-40 bg-navy dark:bg-gold text-gold dark:text-navy p-3.5 rounded-full shadow-2xl hover:scale-105 transition-all flex items-center justify-center border border-gold/20 focus:outline-none"
        title="ER Intelligence Assistant"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} class="animate-pulse" />}
      </button>

      {/* 2. CHAT DRAWER */}
      {isOpen && (
        <div class="fixed bottom-20 right-6 w-80 sm:w-96 h-[480px] bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded-lg shadow-2xl z-40 flex flex-col overflow-hidden font-sans select-none">
          {/* Header */}
          <div class="bg-navy text-white px-4 py-3 flex items-center justify-between border-b border-gold/20 shrink-0">
            <div class="flex items-center gap-1.5">
              <Sparkles size={14} class="text-gold animate-pulse" />
              <span class="font-serif text-xs font-black uppercase tracking-wider text-gold">ER Assistant</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button 
                onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('change-view', { detail: 'assistant' })); }}
                class="text-[9px] hover:text-gold uppercase tracking-wider font-bold border border-gold/30 text-gold px-1.5 py-0.5 rounded bg-gold/5"
                title="Open Split Workspace"
              >
                Workspace
              </button>
              <button 
                onClick={handleClear}
                class="text-[9px] hover:text-gold uppercase tracking-wider font-bold border border-white/20 px-1.5 py-0.5 rounded"
                title="Clear Logs"
              >
                Clear
              </button>
              <button onClick={() => setIsOpen(false)} class="text-gray-400 hover:text-white ml-1">
                <X size={14} />
              </button>
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
                      class={`px-3 py-2 rounded text-[11px] leading-relaxed shadow-sm border ${
                        isUser
                          ? 'bg-navy text-gold dark:bg-gold dark:text-navy font-semibold rounded-tr-none border-gold/15'
                          : msg.isPaywall 
                            ? 'bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/30 rounded-tl-none'
                            : 'bg-white dark:bg-paper-cardDark text-navy dark:text-gray-200 border border-paper-border dark:border-paper-borderDark rounded-tl-none'
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
                          class="mt-2 block bg-red-600 text-white font-bold text-[9px] uppercase px-2 py-1 rounded text-center tracking-wider hover:bg-red-700 font-sans"
                        >
                          Upgrade to PRO
                        </button>
                      )}
                    </div>
                    <span class={`text-[7.5px] text-gray-450 dark:text-gray-500 mt-1 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Suggestions on empty/initial history */}
            {history.length <= 1 && (
              <div class="pt-4 space-y-2 select-none">
                <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block text-center mb-1">Suggested Inquiries</span>
                {suggestionPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => handleSend(e, p)}
                    class="w-full text-left bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark hover:border-gold dark:hover:border-gold p-2 rounded text-[10px] text-navy dark:text-gray-300 font-semibold leading-normal transition-all"
                  >
                    ✦ {p}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div class="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider animate-pulse select-none">
                <RefreshCw size={10} class="animate-spin text-gold" />
                <span>Analysing databases...</span>
              </div>
            )}

            {error && (
              <div class="flex items-center gap-1.5 text-[10px] text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-500/20 font-bold font-sans select-none">
                <AlertCircle size={12} class="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={scrollRef}></div>
          </div>

          {/* Footer input form */}
          <form onSubmit={(e) => handleSend(e)} class="p-3 border-t border-paper-border dark:border-paper-borderDark bg-white dark:bg-paper-cardDark shrink-0 flex items-center gap-2">
            <input
              type="text"
              placeholder={isPro ? "Query research assistant..." : "3 daily queries max (Basic)..."}
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
