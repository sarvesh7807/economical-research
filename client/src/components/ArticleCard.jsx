import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, List, ChevronDown, ChevronUp, AlertCircle, Calendar, ShieldCheck, Bookmark, Lock, MessageSquare, Clock, Languages, TrendingUp, FileText } from 'lucide-react';
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

  // Voice Reader States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Feature 1: 5 Point Summary
  const [fivePoints, setFivePoints] = useState(null);
  const [loadingFivePoints, setLoadingFivePoints] = useState(false);
  const [errorFivePoints, setErrorFivePoints] = useState(null);
  const [showFivePoints, setShowFivePoints] = useState(false);

  // Feature 3: Market Impact Meter
  const [marketImpact, setMarketImpact] = useState(null);
  const [loadingMarketImpact, setLoadingMarketImpact] = useState(false);
  const [errorMarketImpact, setErrorMarketImpact] = useState(null);
  const [showMarketImpact, setShowMarketImpact] = useState(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleListen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.speechSynthesis.cancel();

    const textToSpeak = (translatedTitle || title) + ". " + (translatedDesc || description || "");
    const speech = new SpeechSynthesisUtterance();
    speech.text = textToSpeak;
    speech.lang = 'en-US';
    speech.rate = 0.9;

    speech.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    speech.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(speech);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const handleStop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

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
      reads: 10
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
        body: JSON.stringify({ title, description, content, source: source?.name || 'Unknown Source' })
      });

      if (!response.ok) throw new Error('Failed to generate summary');
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      setErrorSummary('The AI analyst was unable to process this article. Please check your credentials.');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Trigger Gemini Key Points
  const handleFetchKeyPoints = async () => {
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
        body: JSON.stringify({ title, description, content, source: source?.name || 'Unknown Source' })
      });

      if (!response.ok) throw new Error('Failed to generate key points');
      const data = await response.json();
      setKeyPoints(data.keyPoints);
    } catch (err) {
      console.error(err);
      setErrorKeyPoints('The AI analyst was unable to extract key points. Please check your credentials.');
    } finally {
      setLoadingKeyPoints(false);
    }
  };

  // Feature 1: 5 Point Summary handler
  const handleFivePoints = async () => {
    if (fivePoints) {
      setShowFivePoints(!showFivePoints);
      setShowSummary(false);
      setShowKeyPoints(false);
      setShowMarketImpact(false);
      return;
    }

    setLoadingFivePoints(true);
    setErrorFivePoints(null);
    setShowFivePoints(true);
    setShowSummary(false);
    setShowKeyPoints(false);
    setShowMarketImpact(false);

    try {
      const response = await fetch('/api/ai/five-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, content })
      });
      if (!response.ok) throw new Error('Failed to generate 5-point summary');
      const data = await response.json();
      setFivePoints(data.points);
    } catch (err) {
      console.error(err);
      setErrorFivePoints('Unable to generate 5-point summary. Please try again.');
    } finally {
      setLoadingFivePoints(false);
    }
  };

  // Feature 3: Market Impact Meter handler
  const handleMarketImpact = async () => {
    if (marketImpact) {
      setShowMarketImpact(!showMarketImpact);
      setShowSummary(false);
      setShowKeyPoints(false);
      setShowFivePoints(false);
      return;
    }

    setLoadingMarketImpact(true);
    setErrorMarketImpact(null);
    setShowMarketImpact(true);
    setShowSummary(false);
    setShowKeyPoints(false);
    setShowFivePoints(false);

    try {
      const response = await fetch('/api/ai/market-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, content })
      });
      if (!response.ok) throw new Error('Failed to analyze market impact');
      const data = await response.json();
      setMarketImpact(data);
    } catch (err) {
      console.error(err);
      setErrorMarketImpact('Unable to analyze market impact. Please try again.');
    } finally {
      setLoadingMarketImpact(false);
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

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
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

  // Image error handling
  const [imgError, setImgError] = useState(false);

  const categoryFallbacks = {
    world: 'https://images.unsplash.com/photo-1529245005476-ebdf853c8485?w=800&auto=format&fit=crop', // Better fallback images from unsplash that actually work
    business: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop',
    technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop',
    sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop',
    entertainment: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=800&auto=format&fit=crop',
    health: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop',
    science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop',
    politics: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop',
    default: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop'
  };

  const getCategoryFallback = (category) => {
    return categoryFallbacks[category] || categoryFallbacks.default;
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
          You have reached your daily limit of 10 articles on the ER Basic tier.
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
      class="glass-card p-5 flex flex-col justify-between relative group min-h-[350px] overflow-hidden rounded-3xl"
    >
      {/* Simulated Reading Progressive Bar */}
      <div 
        class="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary-glow to-accent-neon transition-all duration-150" 
        style={{ width: `${readProgress}%` }}
      ></div>

      <div>
        {/* Featured Image - Bleeds to top edge */}
        <div class="relative w-full h-48 -mx-5 -mt-5 mb-5 overflow-hidden" style={{ background: '#1A3A5C', minHeight: '200px' }}>
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
          <img 
            src={imgError || !urlToImage ? getCategoryFallback(article.category) : urlToImage} 
            alt={title} 
            loading="lazy"
            class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
            onError={() => setImgError(true)}
          />
          {/* Overlay Category/Source */}
          <div class="absolute bottom-3 left-4 z-20">
             <span class="px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest font-sans border border-white/20">
               {source?.name || 'Unknown Source'}
             </span>
          </div>
        </div>

        {/* Top Info Row */}
        <div class="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 font-sans flex-wrap gap-2">
          <div class="flex items-center gap-2.5">
            <span class="flex items-center gap-1 font-mono bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
              <Calendar size={10} class="text-primary-glow" />
              {getRelativeTime(publishedAt)}
            </span>
            <span class="flex items-center gap-1 font-mono text-[9px] bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
              <Clock size={10} class="text-accent-neon" />
              {getEstimatedReadingTime()} min read
            </span>

            {/* Translation Widget */}
            <div class="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
              <Languages size={9} class="text-accent-pink shrink-0" />
              {translating ? (
                <span class="text-[8px] animate-pulse">Wait...</span>
              ) : (
                <select
                  value={activeLang}
                  onChange={(e) => handleTranslate(e.target.value)}
                  class="bg-transparent text-gray-500 dark:text-gray-400 font-bold focus:outline-none cursor-pointer border-none text-[8px] p-0"
                >
                  <option value="Original" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">EN</option>
                  <option value="Hindi" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">HI</option>
                  <option value="Spanish" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">ES</option>
                  <option value="French" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">FR</option>
                  <option value="German" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">DE</option>
                  <option value="Japanese" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">JA</option>
                </select>
              )}
            </div>

            <button 
              onClick={handleBookmarkToggle}
              class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors focus:outline-none shrink-0"
              title={bookmarked ? "Remove Bookmark" : "Save Bookmark"}
            >
              <Bookmark size={14} class={bookmarked ? "fill-accent-neon text-accent-neon drop-shadow-[0_0_8px_rgba(204,255,0,0.8)]" : "text-gray-400 dark:text-gray-500"} />
            </button>

            {/* Voice News Reader */}
            <div class="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full text-[8.5px] font-sans shrink-0">
              {!isPlaying ? (
                <button
                  onClick={handleListen}
                  class="flex items-center gap-1 text-gray-550 hover:text-gold transition-colors focus:outline-none font-bold"
                  title="Listen to Article"
                >
                  <span>🔊</span> Listen
                </button>
              ) : (
                <div class="flex items-center gap-1.5 font-bold">
                  <button
                    onClick={handlePause}
                    class="text-gray-550 hover:text-gold transition-colors focus:outline-none flex items-center gap-0.5"
                    title={isPaused ? "Resume Speech" : "Pause Speech"}
                  >
                    <span>{isPaused ? '▶️' : '⏸️'}</span>
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <span class="text-gray-300">|</span>
                  <button
                    onClick={handleStop}
                    class="text-red-500 hover:text-red-650 transition-colors focus:outline-none flex items-center gap-0.5"
                    title="Stop Speech"
                  >
                    <span>⏹️</span> Stop
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sentiment and Factual Integrity Rating */}
        {analysis && (
          <div class="flex items-center gap-2 mb-3 flex-wrap">
            <span class={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
              analysis.sentiment === 'Positive' ? 'bg-green-100/50 text-green-700 dark:bg-green-500/20 dark:text-green-300 border border-green-200 dark:border-green-500/30' :
              analysis.sentiment === 'Negative' ? 'bg-red-100/50 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30' :
              'bg-gray-100/50 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300 border border-gray-200 dark:border-gray-500/30'
            }`}>
              {analysis.sentiment}
            </span>
            <span class="text-[9px] font-bold text-navy/80 dark:text-primary-glow bg-navy/5 dark:bg-primary/10 border border-navy/10 dark:border-primary/20 px-2 py-1 rounded-full font-mono flex items-center gap-1">
              <Sparkles size={9} /> Trust Score: {analysis.fakeNewsScore}%
            </span>
            {hovered && readProgress >= 100 && (
              <span class="text-[9px] text-accent-neon font-bold uppercase tracking-wider animate-pulse font-mono bg-accent-neon/10 px-2 py-1 rounded-full border border-accent-neon/30">
                ✓ COMPLETED
              </span>
            )}
          </div>
        )}

        {/* Article Title */}
        <h3 class="font-display text-xl md:text-2xl font-bold leading-tight text-navy dark:text-white hover:text-primary-glow dark:hover:text-primary-glow transition-colors mb-3">
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
            {translatedTitle || title}
          </a>
        </h3>

        {/* Author */}
        {author && (
          <p class="text-[11px] text-navy/60 dark:text-gray-400 mb-3 font-mono bg-gray-50 dark:bg-white/5 inline-block px-2 py-1 rounded-md">
            By <span class="font-bold uppercase tracking-wider text-primary">{author}</span>
          </p>
        )}

        {/* Article Description */}
        <p class={`text-navy/80 dark:text-gray-300 leading-relaxed font-sans mb-5 ${
          settings?.fontSize === 'small' ? 'text-sm' : 
          settings?.fontSize === 'large' ? 'text-lg' : 'text-base'
        }`}>
          {translatedDesc || description || 'Full report details are available in the linked release archive.'}
        </p>
      </div>

      {/* AI Controls, Drawer & Comments */}
      <div>
        {/* Action Buttons Row 1 */}
        <div class="flex items-center gap-2 border-t border-gray-200 dark:border-white/10 pt-4 mt-2">
          {/* AI Summary Button */}
          <button
            onClick={handleFetchSummary}
            disabled={loadingSummary}
            class={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
              showSummary
                ? 'bg-primary text-white shadow-purple-glow border border-transparent'
                : 'bg-gray-100 dark:bg-white/5 border border-transparent hover:border-primary/50 text-navy dark:text-gray-200'
            }`}
          >
            <Sparkles size={12} class={showSummary ? 'text-white' : 'text-primary-glow'} />
            <span>AI Summary</span>
            {showSummary ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Key Points Button */}
          <button
            onClick={handleFetchKeyPoints}
            disabled={loadingKeyPoints}
            class={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
              showKeyPoints
                ? 'bg-primary text-white shadow-purple-glow border border-transparent'
                : 'bg-gray-100 dark:bg-white/5 border border-transparent hover:border-primary/50 text-navy dark:text-gray-200'
            }`}
          >
            <List size={12} class={showKeyPoints ? 'text-white' : 'text-primary-glow'} />
            <span>Key Points</span>
            {showKeyPoints ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Comments Toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            class={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
              showComments
                ? 'bg-navy text-accent-neon dark:bg-white/10 dark:text-accent-neon border-transparent'
                : 'bg-gray-100 dark:bg-white/5 border-transparent hover:border-navy dark:hover:border-white/20 text-navy dark:text-gray-200'
            }`}
          >
            <MessageSquare size={12} />
            <span>Debate</span>
            {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Action Buttons Row 2 — New AI Features */}
        <div class="flex items-center gap-2 mt-2">
          {/* Feature 1: 5-Point Summary */}
          <button
            onClick={handleFivePoints}
            disabled={loadingFivePoints}
            class={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
              showFivePoints
                ? 'bg-amber-500 text-white border border-transparent'
                : 'bg-gray-100 dark:bg-white/5 border border-transparent hover:border-amber-400/60 text-navy dark:text-gray-200'
            }`}
          >
            <FileText size={12} class={showFivePoints ? 'text-white' : 'text-amber-500'} />
            <span>📝 5 Points</span>
            {showFivePoints ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Feature 3: Market Impact Meter */}
          <button
            onClick={handleMarketImpact}
            disabled={loadingMarketImpact}
            class={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
              showMarketImpact
                ? 'bg-emerald-600 text-white border border-transparent'
                : 'bg-gray-100 dark:bg-white/5 border border-transparent hover:border-emerald-500/60 text-navy dark:text-gray-200'
            }`}
          >
            <TrendingUp size={12} class={showMarketImpact ? 'text-white' : 'text-emerald-500'} />
            <span>📊 Market Impact</span>
            {showMarketImpact ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* AI DRAWER (SUMMARY OR KEY POINTS) */}
        {(showSummary || showKeyPoints) && (
          <div class="mt-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 relative overflow-hidden transition-all duration-300 shadow-inner">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-glow to-accent-neon"></div>

            {/* AI Summary Content */}
            {showSummary && (
              <div>
                <div class="flex items-center gap-1.5 text-[9px] font-bold text-navy dark:text-primary-glow uppercase tracking-widest mb-1.5 font-mono">
                  <ShieldCheck size={11} class="text-primary-glow" />
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
                  <p class="text-xs text-navy/95 dark:text-gray-200 font-sans leading-relaxed">
                    {summary}
                  </p>
                )}
              </div>
            )}

            {/* Key Points Content */}
            {showKeyPoints && (
              <div>
                <div class="flex items-center gap-1.5 text-[9px] font-bold text-navy dark:text-primary-glow uppercase tracking-widest mb-2 font-mono">
                  <ShieldCheck size={11} class="text-primary-glow" />
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
              <div class="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 flex justify-end">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={handleLinkClick}
                  class="text-[9px] font-bold text-navy hover:text-primary-glow dark:text-gray-300 dark:hover:text-primary-glow uppercase tracking-widest flex items-center gap-0.5 transition-colors bg-white/50 dark:bg-black/50 px-3 py-1.5 rounded-full"
                >
                  Read Wire Release ↗
                </a>
              </div>
            )}
          </div>
        )}

        {/* FEATURE 1: 5-POINT SUMMARY DRAWER */}
        {showFivePoints && (
          <div class="mt-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 relative overflow-hidden transition-all duration-300 shadow-inner">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500"></div>
            <div class="flex items-center gap-1.5 text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-3 font-mono">
              <FileText size={11} />
              <span>📝 News in 5 Points</span>
            </div>
            {loadingFivePoints ? (
              <div class="space-y-2 py-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} class="h-2.5 rounded bg-amber-200/60 dark:bg-amber-800/30 animate-pulse" style={{ width: `${85 + (i % 3) * 5}%` }}></div>
                ))}
              </div>
            ) : errorFivePoints ? (
              <div class="flex items-start gap-1.5 text-red-600 dark:text-red-400 text-[10px] font-medium py-1">
                <AlertCircle size={12} class="shrink-0 mt-0.5" />
                <span>{errorFivePoints}</span>
              </div>
            ) : fivePoints ? (
              <ol class="space-y-2">
                {fivePoints.map((point, idx) => (
                  <li key={idx} class="flex items-start gap-2.5">
                    <span class="shrink-0 w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center font-mono">{idx + 1}</span>
                    <span class="text-[11px] text-navy/90 dark:text-gray-200 font-sans leading-snug">{point}</span>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        )}

        {/* FEATURE 3: MARKET IMPACT METER DRAWER */}
        {showMarketImpact && (
          <div class="mt-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 relative overflow-hidden transition-all duration-300 shadow-inner">
            <div class={`absolute left-0 top-0 bottom-0 w-1 ${
              marketImpact?.impactLevel === 'HIGH' ? 'bg-red-500' :
              marketImpact?.impactLevel === 'LOW' ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <div class="flex items-center gap-1.5 text-[9px] font-bold text-navy dark:text-emerald-400 uppercase tracking-widest mb-3 font-mono">
              <TrendingUp size={11} />
              <span>📊 Market Impact Analysis</span>
            </div>
            {loadingMarketImpact ? (
              <div class="space-y-2 py-1">
                <div class="h-7 w-40 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                <div class="h-2.5 rounded w-[70%] bg-gray-200 dark:bg-gray-800 animate-pulse mt-3"></div>
                <div class="h-2.5 rounded w-[50%] bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
              </div>
            ) : errorMarketImpact ? (
              <div class="flex items-start gap-1.5 text-red-600 dark:text-red-400 text-[10px] font-medium py-1">
                <AlertCircle size={12} class="shrink-0 mt-0.5" />
                <span>{errorMarketImpact}</span>
              </div>
            ) : marketImpact ? (
              <div class="space-y-3">
                {/* Impact Badge */}
                <div class={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                  marketImpact.impactLevel === 'HIGH' && marketImpact.direction === 'NEGATIVE'
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30'
                  : marketImpact.impactLevel === 'HIGH' && marketImpact.direction === 'POSITIVE'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-500/30'
                  : marketImpact.impactLevel === 'MEDIUM'
                    ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/30'
                  : marketImpact.direction === 'POSITIVE'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }`}>
                  <span>
                    {marketImpact.impactLevel === 'HIGH' && marketImpact.direction === 'NEGATIVE' ? '🔴' :
                     marketImpact.impactLevel === 'HIGH' && marketImpact.direction === 'POSITIVE' ? '🟢' :
                     marketImpact.impactLevel === 'MEDIUM' ? '🟡' :
                     marketImpact.direction === 'POSITIVE' ? '🟢' : '⚪'}
                  </span>
                  <span>{marketImpact.impactLevel} IMPACT — {marketImpact.direction}</span>
                </div>

                {/* Affected Sectors */}
                {marketImpact.sectors && marketImpact.sectors.length > 0 && (
                  <div>
                    <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Affected Sectors</span>
                    <div class="flex flex-wrap gap-1.5">
                      {marketImpact.sectors.map((sector, idx) => (
                        <span key={idx} class="px-2 py-0.5 bg-navy/5 dark:bg-white/10 text-navy dark:text-gray-200 text-[9px] font-bold rounded-full border border-navy/10 dark:border-white/10">
                          {sector}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reasoning */}
                {marketImpact.reasoning && (
                  <p class="text-[10px] text-gray-500 dark:text-gray-400 italic font-sans leading-relaxed border-t border-gray-100 dark:border-white/5 pt-2">
                    {marketImpact.reasoning}
                  </p>
                )}
              </div>
            ) : null}
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
