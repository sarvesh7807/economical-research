import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, X, Send, Sparkles, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';

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
        <div class="fixed bottom-20 right-6 w-80 sm:w-96 h-[480px] bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded-lg shadow-2xl z-40 flex flex-col overflow-hidden font-sans">
          {/* Header */}
          <div class="bg-navy text-white px-4 py-3 flex items-center justify-between border-b border-gold/20 shrink-0">
            <div class="flex items-center gap-1.5">
              <Sparkles size={14} class="text-gold animate-spin-slow" />
              <span class="font-serif text-xs font-black uppercase tracking-wider text-gold">ER Assistant</span>
            </div>
            <div class="flex items-center gap-2">
              <button 
                onClick={handleClear}
                class="text-[9px] hover:text-gold uppercase tracking-wider font-bold border border-white/20 px-1.5 py-0.5 rounded"
                title="Clear Logs"
              >
                Clear
              </button>
              <button onClick={() => setIsOpen(false)} class="text-gray-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages body */}
          <div class="flex-grow overflow-y-auto p-4 space-y-3.5 scrollbar-none bg-paper dark:bg-paper-dark">
            {history.map((msg, idx) => (
              <div 
                key={idx} 
                class={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div 
                  class={`px-3 py-2 rounded text-[11px] leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-navy text-gold dark:bg-gold dark:text-navy font-semibold rounded-br-none'
                      : msg.isPaywall 
                        ? 'bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/30 rounded-bl-none'
                        : 'bg-white dark:bg-paper-cardDark text-navy dark:text-gray-200 border border-paper-border dark:border-paper-borderDark rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  
                  {msg.isPaywall && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        window.dispatchEvent(new CustomEvent('change-view', { detail: 'billing' }));
                      }}
                      class="mt-2 block bg-red-600 text-white font-bold text-[9px] uppercase px-2 py-1 rounded text-center tracking-wider hover:bg-red-700"
                    >
                      Upgrade to PRO
                    </button>
                  )}
                </div>
                <span class="text-[8px] text-gray-450 dark:text-gray-500 mt-1 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {/* Suggestions on empty/initial history */}
            {history.length <= 1 && (
              <div class="pt-4 space-y-2">
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
              <div class="flex items-center gap-1.5 text-[10px] text-gray-400 italic">
                <RefreshCw size={10} class="animate-spin text-gold" />
                <span>Analysing databases...</span>
              </div>
            )}

            {error && (
              <div class="flex items-center gap-1.5 text-[10px] text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-500/20">
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
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
      `}</style>
    </>
  );
}
