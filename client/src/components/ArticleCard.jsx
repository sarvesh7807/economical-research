import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, List, ChevronDown, ChevronUp, AlertCircle, Calendar, ShieldCheck, Bookmark, Lock, MessageSquare, Clock, Languages } from 'lucide-react';
import CommentsSection from './CommentsSection';

export default function ArticleCard({ article }) {
  const { title, description, content, source, author, url, urlToImage, publishedAt } = article;
  const { saveBookmark, deleteBookmark, isBookmarked, logReadingEvent, settings, subscription } = useAuth();
  
  // Translation states
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translatedDesc, setTranslatedDesc] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [activeLang, setActiveLang] = useState('Original');

  // AI Summary / Keypoints
  const [summary, setSummary] = useState(null);
  const [keyPoints, setKeyPoints] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingKeyPoints, setLoadingKeyPoints] = useState(false);
  const [errorSummary, setErrorSummary] = useState(null);
  const [errorKeyPoints, setErrorKeyPoints] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showKeyPoints, setShowKeyPoints] = useState(false);

  // Sentiment and Trust rating
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Progressive Reading attention bar
  const [hovered, setHovered] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  // Paywall locks
  const [paywallActive, setPaywallActive] = useState(false);
  const [paywallType, setPaywallType] = useState('reads'); // 'reads' or 'summaries'

  // Comments drawer
  const [showComments, setShowComments] = useState(false);

  const bookmarked = isBookmarked(url);

  // Fetch Sentiment and Trust score on mount
  useEffect(() => {
    setLoadingAnalysis(true);
    fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, content })
    })
      .then(res => res.json())
      .then(data => {
        setAnalysis(data);
        setLoadingAnalysis(false);
      })
      .catch(err => {
        console.error('Analysis error:', err);
        setLoadingAnalysis(false);
      });
  }, [title]);

  // Progressive Reading attention bar simulation
  useEffect(() => {
    if (!hovered) return;
    const estTimeSec = getEstimatedReadingTime() * 10; // 10s per minute read time simulation
    const stepTime = (estTimeSec * 1000) / 100;
    
    const interval = setInterval(() => {
      setReadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, stepTime);

    return () => clearInterval(interval);
  }, [hovered]);

  const getEstimatedReadingTime = () => {
    const text = (title + ' ' + (description || '') + ' ' + (content || '')).trim();
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const checkPaywallLimit = (type) => {
    if (subscription?.tier === 'PRO') return { blocked: false };
    
    const today = new Date().toISOString().split('T')[0];
    const key = `er_paywall_${type}_${today}`;
    const currentCount = parseInt(localStorage.getItem(key) || '0', 10);
    
    const limits = {
      reads: 10,
      summaries: 3
    };
    
    if (currentCount >= limits[type]) {
      return { blocked: true, count: currentCount, limit: limits[type] };
    }
    return { blocked: false, count: currentCount, limit: limits[type] };
  };

  const incrementPaywallCount = (type) => {
    if (subscription?.tier === 'PRO') return;
    const today = new Date().toISOString().split('T')[0];
    const key = `er_paywall_${type}_${today}`;
    const currentCount = parseInt(localStorage.getItem(key) || '0', 10);
    localStorage.setItem(key, currentCount + 1);
  };

  const handleBookmarkToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarked) {
      deleteBookmark(url);
    } else {
      saveBookmark(article);
    }
  };

  const handleLinkClick = (e) => {
    const paywall = checkPaywallLimit('reads');
    if (paywall.blocked) {
      e.preventDefault();
      setPaywallActive(true);
      setPaywallType('reads');
      return;
    }
    logReadingEvent(article);
    incrementPaywallCount('reads');
  };

  // Trigger Gemini Summary
  const handleFetchSummary = async () => {
    const paywall = checkPaywallLimit('summaries');
    if (paywall.blocked) {
      setPaywallActive(true);
      setPaywallType('summaries');
      return;
    }

    if (summary) {
      setShowSummary(!showSummary);
      setShowKeyPoints(false);
      return;
    }

    setLoadingSummary(true);
    setErrorSummary(null);
    setShowSummary(true);
    setShowKeyPoints(false);

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, content, source: source.name })
      });

      if (!response.ok) throw new Error('Failed to generate summary');
      const data = await response.json();
      setSummary(data.summary);
      incrementPaywallCount('summaries');
    } catch (err) {
      console.error(err);
      setErrorSummary('The AI analyst was unable to process this article. Please check your credentials.');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Trigger Gemini Key Points
  const handleFetchKeyPoints = async () => {
    const paywall = checkPaywallLimit('summaries');
    if (paywall.blocked) {
      setPaywallActive(true);
      setPaywallType('summaries');
      return;
    }

    if (keyPoints) {
      setShowKeyPoints(!showKeyPoints);
      setShowSummary(false);
      return;
    }

    setLoadingKeyPoints(true);
    setErrorKeyPoints(null);
    setShowKeyPoints(true);
    setShowSummary(false);

    try {
      const response = await fetch('/api/ai/keypoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, content, source: source.name })
      });

      if (!response.ok) throw new Error('Failed to generate key points');
      const data = await response.json();
      setKeyPoints(data.keyPoints);
      incrementPaywallCount('summaries');
    } catch (err) {
      console.error(err);
      setErrorKeyPoints('The AI analyst was unable to extract key points. Please check your credentials.');
    } finally {
      setLoadingKeyPoints(false);
    }
  };

  // Translation handler
  const handleTranslate = async (lang) => {
    setActiveLang(lang);
    if (lang === 'Original') {
      setTranslatedTitle(null);
      setTranslatedDesc(null);
      return;
    }

    setTranslating(true);
    try {
      const titleRes = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: title, targetLanguage: lang })
      });
      const titleData = await titleRes.json();

      const descRes = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: description || 'No summary text available.', targetLanguage: lang })
      });
      const descData = await descRes.json();

      setTranslatedTitle(titleData.translatedText);
      setTranslatedDesc(descData.translatedText);
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setTranslating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent Wire';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' @ ' + date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderAdSlot = () => {
    if (subscription?.tier === 'PRO') return null;
    return (
      <div class="mt-4 pt-3 border-t border-paper-border dark:border-paper-borderDark text-center">
        <div class="bg-gray-50 dark:bg-navy-light/10 py-3 px-2 rounded border border-dashed border-gray-300 dark:border-gray-800 text-[10px] text-gray-400 font-semibold tracking-wider select-none uppercase font-mono">
          ADVERTISEMENT: <span class="text-navy dark:text-gold font-bold">Invest in ER Capital Desks Yield Notes 6.4% APY</span>
        </div>
      </div>
    );
  };

  if (paywallActive) {
    return (
      <div class="bg-white dark:bg-paper-cardDark border-2 border-gold p-6 rounded text-center relative overflow-hidden flex flex-col justify-center items-center min-h-[300px]">
        <div class="absolute top-2 left-2 w-2 h-2 border-t border-l border-gold"></div>
        <div class="absolute top-2 right-2 w-2 h-2 border-t border-r border-gold"></div>
        <div class="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-gold"></div>
        <div class="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-gold"></div>
        
        <Lock size={32} class="text-gold mb-3 animate-bounce" />
        <h3 class="font-serif text-base font-black text-navy dark:text-gold uppercase tracking-wider mb-2">
          🔒 Editorial paywall locked
        </h3>
        <p class="text-[10px] text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed mb-5 font-semibold uppercase font-sans">
          You have reached your daily limit of {paywallType === 'reads' ? '10 articles' : '3 AI summaries'} on the ER Basic tier.
        </p>
        
        <div class="flex flex-col gap-2 w-full max-w-[180px]">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('change-view', { detail: 'billing' }));
            }}
            class="w-full bg-gold hover:bg-gold-light text-navy font-bold text-xs uppercase py-2 rounded tracking-widest transition-all"
          >
            Upgrade to PRO
          </button>
          <button
            onClick={() => setPaywallActive(false)}
            class="w-full bg-transparent border border-navy/20 dark:border-gold/30 hover:border-navy text-navy dark:text-gray-300 font-bold text-[9px] uppercase py-1.5 rounded transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <article 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setReadProgress(0); }}
      class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark p-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 relative group min-h-[350px] overflow-hidden"
    >
      {/* Decorative Corner Lines for Newspaper Feel */}
      <div class="absolute top-2 left-2 w-2 h-2 border-t border-l border-navy/20 dark:border-gold/30"></div>
      <div class="absolute top-2 right-2 w-2 h-2 border-t border-r border-navy/20 dark:border-gold/30"></div>
      
      {/* Simulated Reading Progressive Bar */}
      <div 
        class="absolute bottom-0 left-0 h-1 bg-gold transition-all duration-150" 
        style={{ width: `${readProgress}%` }}
      ></div>

      <div>
        {/* Source and Date Row with Bookmark & Translate Dropdown */}
        <div class="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 font-sans border-b border-gray-150 dark:border-gray-800 pb-1.5 flex-wrap gap-2">
          <span class="text-gold dark:text-gold-light font-black">{source.name}</span>
          <div class="flex items-center gap-2.5">
            <span class="flex items-center gap-1 font-mono">
              <Calendar size={10} />
              {formatDate(publishedAt)}
            </span>
            <span class="flex items-center gap-1 font-mono text-[9px]">
              <Clock size={10} />
              {getEstimatedReadingTime()} min read
            </span>

            {/* Translation Widget */}
            <div class="flex items-center gap-1 border border-paper-border dark:border-paper-borderDark rounded px-1.5 py-0.5 bg-gray-50/50 dark:bg-navy-light/10">
              <Languages size={9} class="text-gold shrink-0" />
              {translating ? (
                <span class="text-[8px] animate-pulse">Translating...</span>
              ) : (
                <select
                  value={activeLang}
                  onChange={(e) => handleTranslate(e.target.value)}
                  class="bg-transparent text-gray-500 dark:text-gray-400 font-bold focus:outline-none cursor-pointer border-none text-[8px] p-0"
                >
                  <option value="Original" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">EN</option>
                  <option value="Hindi" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">HI (हिंदी)</option>
                  <option value="Spanish" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">ES</option>
                  <option value="French" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">FR</option>
                  <option value="German" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">DE</option>
                  <option value="Japanese" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">JA</option>
                </select>
              )}
            </div>

            <button 
              onClick={handleBookmarkToggle}
              class="text-gray-400 hover:text-gold transition-colors p-0.5 focus:outline-none shrink-0"
              title={bookmarked ? "Remove Bookmark" : "Save Bookmark"}
            >
              <Bookmark size={12} class={bookmarked ? "fill-gold text-gold" : "text-gray-400 dark:text-gray-500"} />
            </button>
          </div>
        </div>

        {/* Sentiment and Factual Integrity Rating */}
        {analysis && (
          <div class="flex items-center gap-2 mb-2.5 flex-wrap">
            <span class={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
              analysis.sentiment === 'Positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              analysis.sentiment === 'Negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {analysis.sentiment}
            </span>
            <span class="text-[9px] font-bold text-navy/60 dark:text-gold/80 bg-navy/5 dark:bg-gold/10 px-1.5 py-0.5 rounded font-mono">
              ★ Factual Integrity: {analysis.fakeNewsScore}%
            </span>
            {hovered && readProgress >= 100 && (
              <span class="text-[8px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider animate-pulse font-mono">
                ✓ BULLETIN READ
              </span>
            )}
          </div>
        )}

        {/* Article Title */}
        <h3 class="font-serif text-base md:text-lg font-bold leading-snug text-navy dark:text-gray-100 hover:text-gold dark:hover:text-gold transition-colors mb-2.5">
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick} class="hover:underline">
            {translatedTitle || title}
          </a>
        </h3>

        {/* Featured Image */}
        {urlToImage ? (
          <div class="relative w-full h-36 overflow-hidden mb-3.5 bg-gray-50 dark:bg-gray-850 rounded-sm">
            <img 
              src={urlToImage} 
              alt={title} 
              class="w-full h-full object-cover filter saturate-[0.8] hover:saturate-100 hover:scale-103 transition-all duration-500"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        ) : (
          <div class="w-full h-2 bg-paper-border/20 dark:bg-paper-borderDark/20 mb-3 border-y border-dashed border-gray-250 dark:border-gray-800"></div>
        )}

        {/* Author */}
        {author && (
          <p class="text-[10px] italic text-navy/60 dark:text-gray-400 mb-2 font-serif">
            By <span class="font-semibold uppercase tracking-wider">{author}</span>
          </p>
        )}

        {/* Article Description */}
        <p class={`text-navy/80 dark:text-gray-300 leading-relaxed font-sans mb-4 ${
          settings?.fontSize === 'small' ? 'text-xs' : 
          settings?.fontSize === 'large' ? 'text-base' : 'text-xs'
        }`}>
          {translatedDesc || description || 'Full report details are available in the linked release archive.'}
        </p>
      </div>

      {/* AI Controls, Drawer & Comments */}
      <div>
        {/* Action Buttons */}
        <div class="flex items-center gap-2 border-t border-paper-border dark:border-paper-borderDark pt-3 mt-1">
          {/* AI Summary Button */}
          <button
            onClick={handleFetchSummary}
            disabled={loadingSummary}
            class={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${
              showSummary
                ? 'bg-navy text-gold dark:bg-gold dark:text-navy border border-transparent'
                : 'bg-transparent border border-navy/20 dark:border-gold/30 hover:border-navy dark:hover:border-gold text-navy dark:text-gray-200 hover:bg-navy/5 dark:hover:bg-gold/5'
            }`}
          >
            <Sparkles size={11} class={showSummary ? 'text-gold dark:text-navy' : 'text-gold'} />
            <span>AI Summary</span>
            {showSummary ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {/* Key Points Button */}
          <button
            onClick={handleFetchKeyPoints}
            disabled={loadingKeyPoints}
            class={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${
              showKeyPoints
                ? 'bg-navy text-gold dark:bg-gold dark:text-navy border border-transparent'
                : 'bg-transparent border border-navy/20 dark:border-gold/30 hover:border-navy dark:hover:border-gold text-navy dark:text-gray-200 hover:bg-navy/5 dark:hover:bg-gold/5'
            }`}
          >
            <List size={11} class={showKeyPoints ? 'text-gold dark:text-navy' : 'text-gold'} />
            <span>Key Points</span>
            {showKeyPoints ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {/* Comments Toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            class={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 text-[9px] font-bold uppercase tracking-wider rounded border transition-all ${
              showComments
                ? 'bg-navy text-gold dark:bg-gold dark:text-navy border-transparent'
                : 'bg-transparent border-navy/20 dark:border-gold/30 hover:border-navy dark:hover:border-gold text-navy dark:text-gray-200'
            }`}
          >
            <MessageSquare size={11} />
            <span>Debate</span>
            {showComments ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>

        {/* AI DRAWER (SUMMARY OR KEY POINTS) */}
        {(showSummary || showKeyPoints) && (
          <div class="mt-3.5 p-3.5 border border-gold/45 dark:border-gold/30 bg-gold/5 dark:bg-navy-light/10 rounded-sm relative overflow-hidden transition-all duration-300">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-gold"></div>

            {/* AI Summary Content */}
            {showSummary && (
              <div>
                <div class="flex items-center gap-1.5 text-[9px] font-bold text-navy dark:text-gold uppercase tracking-widest mb-1.5 font-serif">
                  <ShieldCheck size={11} class="text-gold" />
                  <span>AI Editorial Summary</span>
                </div>
                
                {loadingSummary ? (
                  <div class="space-y-1.5 py-1">
                    <div class="h-2.5 rounded bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                    <div class="h-2.5 rounded w-[90%] bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                    <div class="h-2.5 rounded w-[75%] bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                  </div>
                ) : errorSummary ? (
                  <div class="flex items-start gap-1.5 text-red-650 dark:text-red-400 text-[10px] font-medium py-1">
                    <AlertCircle size={12} class="shrink-0 mt-0.5" />
                    <span>{errorSummary}</span>
                  </div>
                ) : (
                  <p class="text-xs text-navy/95 dark:text-gray-200 font-serif leading-relaxed italic">
                    &ldquo;{summary}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* Key Points Content */}
            {showKeyPoints && (
              <div>
                <div class="flex items-center gap-1.5 text-[9px] font-bold text-navy dark:text-gold uppercase tracking-widest mb-2 font-serif">
                  <ShieldCheck size={11} class="text-gold" />
                  <span>AI Structural Implications</span>
                </div>
                
                {loadingKeyPoints ? (
                  <div class="space-y-1.5 py-1">
                    <div class="h-2.5 rounded bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                    <div class="h-2.5 rounded w-[85%] bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                    <div class="h-2.5 rounded w-[95%] bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                  </div>
                ) : errorKeyPoints ? (
                  <div class="flex items-start gap-1.5 text-red-650 dark:text-red-400 text-[10px] font-medium py-1">
                    <AlertCircle size={12} class="shrink-0 mt-0.5" />
                    <span>{errorKeyPoints}</span>
                  </div>
                ) : (
                  <ul class="space-y-1.5 text-xs text-navy/95 dark:text-gray-200 font-sans list-disc pl-4 leading-relaxed">
                    {keyPoints && keyPoints.map((point, idx) => (
                      <li key={idx} class="marker:text-gold">
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {/* Read Full Article Link */}
            {!loadingSummary && !loadingKeyPoints && !errorSummary && !errorKeyPoints && (
              <div class="mt-3.5 pt-2 border-t border-gold/20 flex justify-end">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={handleLinkClick}
                  class="text-[9px] font-bold text-navy hover:text-gold dark:text-gray-300 dark:hover:text-gold uppercase tracking-widest flex items-center gap-0.5 transition-colors"
                >
                  Read Wire Release ↗
                </a>
              </div>
            )}
          </div>
        )}

        {/* COMMENTS SECTION LEDGER */}
        {showComments && (
          <CommentsSection articleUrl={url} />
        )}

        {/* Mock Ad Banner */}
        {renderAdSlot()}
      </div>
    </article>
  );
}
