import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, List, ChevronDown, ChevronUp, AlertCircle, Calendar, ShieldCheck, Bookmark, Lock, MessageSquare, Clock, Languages, TrendingUp, FileText, Share2 } from 'lucide-react';
import CommentsSection from './CommentsSection';
import { getCachedOrFetchAI } from '../utils/aiCache';
import ShareModal from './ShareModal';
import { getPremiumArticleImage } from '../utils/imageSystem';

function ArticleCard({ article, isLead }) {
  const { title, description, content, source, author, url, urlToImage, publishedAt } = article;
  const { saveBookmark, deleteBookmark, isBookmarked, logReadingEvent, settings, subscription, trackArticleRead } = useAuth();
  

  // Mobile layout state
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Shared state for AI
  const [activeAI, setActiveAI] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState('');

  // Debug API key load status
  useEffect(() => {
    console.log('Gemini Key exists:', !!import.meta.env.VITE_GEMINI_API_KEY);
    console.log('Key starts with:', import.meta.env.VITE_GEMINI_API_KEY?.slice(0, 10));
  }, []);

  // Sentiment and Trust rating
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Progressive Reading attention bar
  const [hovered, setHovered] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  // Paywall locks
  const [paywallActive, setPaywallActive] = useState(false);
  const [paywallType, setPaywallType] = useState('reads'); // 'reads' or 'summaries'

  // Comments/Share settings
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const articleRef = useRef(null);

  // Voice Reader States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);


  // Caching helpers
  const getArticleId = (urlStr) => {
    if (!urlStr) return 'unknown_article';
    return urlStr.replace(/[^a-zA-Z0-9]/g, '_');
  };

  const callGeminiAPI = async (type) => {
    let endpoint = '';
    let body = {};
    
    if (type === 'summary') {
      endpoint = '/api/ai/summarize';
      body = { title, description, content, source: source?.name || 'Unknown Source' };
    } else if (type === 'keypoints') {
      endpoint = '/api/ai/keypoints';
      body = { title, description, content, source: source?.name || 'Unknown Source' };
    } else if (type === 'fivepoints') {
      endpoint = '/api/ai/five-points';
      body = { title, description, content };
    } else if (type === 'marketimpact') {
      endpoint = '/api/ai/market-impact';
      body = { title, description, content };
    } else if (type === 'debate') {
      endpoint = '/api/ai/debate';
      body = { title, description, content };
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (response.status === 429) {
      throw { status: 429 };
    }
    
    if (!response.ok) {
      throw new Error('API failed');
    }
    
    return await response.json();
  };



  const [imgError, setImgError] = useState(false);
  const imageUrl = getPremiumArticleImage(imgError ? { ...article, urlToImage: null } : article);

  // Preload above-the-fold hero image dynamically
  useEffect(() => {
    if (isLead && imageUrl) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imageUrl;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [isLead, imageUrl]);

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

  // Fetch Sentiment and Trust score on hover or interaction
  useEffect(() => {
    if (!hovered && !activeAI) return;
    if (analysis || loadingAnalysis) return;

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
  }, [title, hovered, activeAI, analysis, loadingAnalysis]);

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

  const getArticleTopic = () => {
    const cat = (article.category || 'world').toLowerCase();
    const text = ((title || '') + ' ' + (description || '') + ' ' + (content || '')).toLowerCase();
    
    if (text.includes('cricket')) return 'cricket';
    if (text.includes('football') || text.includes('soccer')) return 'football';
    if (text.includes('mma') || text.includes('ufc') || text.includes('martial arts') || text.includes('boxing')) return 'mma';
    
    if (cat === 'tech' || cat === 'technology' || cat === 'tech & ai') return 'technology';
    if (cat === 'sports') return 'sports';
    if (cat === 'world') return 'world';
    if (cat === 'business') return 'business';
    if (cat === 'finance') return 'finance';
    if (cat === 'politics') return 'politics';
    if (cat === 'health') return 'health';
    if (cat === 'science') return 'science';
    if (cat === 'entertainment') return 'entertainment';
    
    return cat;
  };

  // Track continuous reading (> 30 seconds) on hover
  useEffect(() => {
    if (!hovered) return;
    const timer = setTimeout(() => {
      const topic = getArticleTopic();
      trackArticleRead(topic, 2);
    }, 30000);
    return () => clearTimeout(timer);
  }, [hovered]);

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

  const handleBookmarkToggle = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      return;
    }
    
    if (isBookmarked) {
      setBookmarked(false);
      removeBookmark(url);
      if (window.gtag) {
        window.gtag('event', 'remove_bookmark', {
          article_title: title,
          article_url: url
        });
      }
    } else {
      setBookmarked(true);
      saveBookmark(article);
      if (window.gtag) {
        window.gtag('event', 'save_bookmark', {
          article_title: title,
          article_url: url
        });
      }
    }
  };

  const handleLinkClick = (e) => {
    const paywall = checkPaywallLimit('reads');
    if (paywall.blocked) {
      e.preventDefault();
      setPaywallActive(true);
      setPaywallType('reads');
      if (window.gtag) {
        window.gtag('event', 'paywall_blocked', {
          action_type: 'read',
          article_title: title
        });
      }
      return;
    }
    logReadingEvent(article);
    const topic = getArticleTopic();
    trackArticleRead(topic, 1);
    incrementPaywallCount('reads');
    if (window.gtag) {
      window.gtag('event', 'article_open', {
        article_title: title,
        article_url: url,
        article_source: article.source?.name || 'Unknown',
        article_category: activeCategory || article.category || 'world'
      });
    }
  };

  const callGeminiAI = async (prompt, cacheKey) => {
    // Check cache first
    try {
      const { getCachedOrFetchAI } = await import('../utils/aiCache');
      const result = await getCachedOrFetchAI(
        cacheKey,
        async () => {
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          
          if (!apiKey) {
            throw new Error('No API key found');
          }
          
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
          
          const res = await fetch(url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
              contents: [{ 
                parts: [{ text: prompt }] 
              }],
              generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7
              }
            })
          });
          
          if (res.status === 429) {
            return '⏳ Too many requests. Please wait 30 seconds and try again.';
          }
          
          if (!res.ok) {
            const errData = await res.json();
            console.error('Gemini error:', errData);
            throw new Error('API call failed');
          }
          
          const data = await res.json();
          return data.candidates?.[0]
            ?.content?.parts?.[0]?.text || 
            'Could not generate response.';
        }
      );
      return result.content || result;
    } catch (err) {
      console.error('AI call failed:', err);
      return '❌ Could not load. Please try again.';
    }
  };

  // AI SUMMARY
  const handleSummary = async () => {
    if (activeAI === 'summary') {
      setActiveAI(null);
      return;
    }
    setActiveAI('summary');
    setAiLoading(true);
    setAiContent('');
    
    const result = await callGeminiAI(
      `Summarize this news in 3-4 clear sentences. 
      Title: ${article.title}
      Description: ${article.description || ''}
      Be concise and informative.`,
      `summary_${article.url?.slice(-30)}`
    );
    
    setAiContent(result);
    setAiLoading(false);
  };

  // KEY POINTS
  const handleKeyPoints = async () => {
    if (activeAI === 'keypoints') {
      setActiveAI(null);
      return;
    }
    setActiveAI('keypoints');
    setAiLoading(true);
    setAiContent('');
    
    const result = await callGeminiAI(
      `Extract 5 key points from this news article.
      Format as numbered list.
      Title: ${article.title}
      Description: ${article.description || ''}`,
      `keypoints_${article.url?.slice(-30)}`
    );
    
    setAiContent(result);
    setAiLoading(false);
  };

  // DEBATE
  const handleDebate = async () => {
    if (activeAI === 'debate') {
      setActiveAI(null);
      return;
    }
    setActiveAI('debate');
    setAiLoading(true);
    setAiContent('');
    
    const result = await callGeminiAI(
      `Create a short debate on this news topic.
      FOR argument (2 points) and 
      AGAINST argument (2 points).
      Title: ${article.title}
      Description: ${article.description || ''}`,
      `debate_${article.url?.slice(-30)}`
    );
    
    setAiContent(result);
    setAiLoading(false);
  };

  // 5 POINTS SUMMARY
  const handleFivePoints = async () => {
    if (activeAI === 'fivepoints') {
      setActiveAI(null);
      return;
    }
    setActiveAI('fivepoints');
    setAiLoading(true);
    setAiContent('');
    
    const result = await callGeminiAI(
      `Summarize this news in exactly 5 
      bullet points, each under 15 words.
      Title: ${article.title}
      Description: ${article.description || ''}`,
      `fivepoints_${article.url?.slice(-30)}`
    );
    
    setAiContent(result);
    setAiLoading(false);
  };

  // MARKET IMPACT
  const handleMarketImpact = async () => {
    if (activeAI === 'market') {
      setActiveAI(null);
      return;
    }
    setActiveAI('market');
    setAiLoading(true);
    setAiContent('');
    
    const result = await callGeminiAI(
      `Analyze the stock market impact of 
      this news. Rate: HIGH/MEDIUM/LOW impact.
      Direction: POSITIVE/NEGATIVE/NEUTRAL.
      Affected sectors (list 2-3).
      Title: ${article.title}
      Description: ${article.description || ''}`,
      `market_${article.url?.slice(-30)}`
    );
    
    setAiContent(result);
    setAiLoading(false);
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

  const categoryFallbacks = {
    world: [
      'https://images.unsplash.com/photo-1529245005476-ebdf853c8485?w=800&auto=format&fit=crop', // Better fallback images from unsplash that actually work
      'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1495465798138-718f86d1a4bd?w=800&auto=format&fit=crop'
    ],
    business: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop'
    ],
    technology: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1531297172868-9f1d8b67115e?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop'
    ],
    sports: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1495555687398-3f50d6e79e1e?w=800&auto=format&fit=crop'
    ],
    entertainment: ['https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=800&auto=format&fit=crop'],
    health: ['https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop'],
    science: ['https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop'],
    politics: ['https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop'],
    default: ['https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop']
  };

  const getCategoryFallback = (category, articleId) => {
    const images = categoryFallbacks[category] || categoryFallbacks.default;
    const index = articleId ? articleId.length % images.length : 0;
    return images[index];
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
      ref={articleRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setReadProgress(0); }}
      class={`glass-card p-5 flex flex-col justify-between relative group overflow-hidden rounded-3xl transition-all ${
        isLead ? 'w-full min-h-[500px]' : 'w-full h-[480px] shrink-0'
      }`}
    >
      {/* Simulated Reading Progressive Bar */}
      <div 
        class="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary-glow to-accent-neon transition-all duration-150" 
        style={{ width: `${readProgress}%` }}
      ></div>

      <div>
        {/* Featured Image - Bleeds to top edge */}
        <div 
          class={`relative w-full -mx-5 -mt-5 mb-5 overflow-hidden ${
            isLead ? 'h-56 md:h-64' : 'h-40 md:h-44'
          }`} 
          style={{ background: '#1A3A5C', minHeight: isLead ? '220px' : '160px' }}
        >
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
          <img 
            src={imageUrl} 
            alt={title} 
            loading={isLead ? "eager" : "lazy"}
            fetchPriority={isLead ? "high" : "low"}
            decoding="async"
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
                  class="flex items-center gap-1 text-gray-500 hover:text-gold transition-colors focus:outline-none font-bold"
                  title="Listen to Article"
                >
                  <span>🔊</span> Listen
                </button>
              ) : (
                <div class="flex items-center gap-1.5 font-bold">
                  <button
                    onClick={handlePause}
                    class="text-gray-500 hover:text-gold transition-colors focus:outline-none flex items-center gap-0.5"
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
        <h3 class={`font-display font-bold leading-tight text-navy dark:text-white hover:text-primary-glow dark:hover:text-primary-glow transition-colors mb-3 ${
          isLead ? 'text-2xl md:text-3xl line-clamp-3' : 'text-xl md:text-2xl line-clamp-2'
        }`}>
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
            {title}
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
          isLead ? 'line-clamp-4' : 'line-clamp-2'
        } ${
          settings?.fontSize === 'small' ? 'text-sm' : 
          settings?.fontSize === 'large' ? 'text-lg' : 'text-base'
        }`}>
          {description || 'Full report details are available in the linked release archive.'}
        </p>
      </div>

      {/* AI Controls, Drawer & Comments */}
      <div class="article-actions">
        {/* Action Buttons Row 1 */}
        <div class="article-btn-row flex items-center gap-2 border-t border-gray-200 dark:border-white/10 pt-4 mt-2">
          {/* AI Summary Button */}
          <button
            onClick={handleSummary}
            disabled={aiLoading}
            class="ai-btn article-btn flex-1 flex items-center justify-center gap-1 transition-all"
            style={{
              background: activeAI === 'summary' ? '#F4A726' : 'rgba(244,167,38,0.1)',
              color: activeAI === 'summary' ? '#0A1628' : '#F4A726',
              border: '1px solid rgba(244,167,38,0.3)',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            <Sparkles size={12} class={activeAI === 'summary' ? 'text-[#0A1628]' : 'text-primary-glow'} />
            <span>AI Summary</span>
            {activeAI === 'summary' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Key Points Button */}
          <button
            onClick={handleKeyPoints}
            disabled={aiLoading}
            class="ai-btn article-btn flex-1 flex items-center justify-center gap-1 transition-all"
            style={{
              background: activeAI === 'keypoints' ? '#F4A726' : 'rgba(244,167,38,0.1)',
              color: activeAI === 'keypoints' ? '#0A1628' : '#F4A726',
              border: '1px solid rgba(244,167,38,0.3)',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            <List size={12} class={activeAI === 'keypoints' ? 'text-[#0A1628]' : 'text-primary-glow'} />
            <span>Key Points</span>
            {activeAI === 'keypoints' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Comments Toggle */}
          <button
            onClick={handleDebate}
            disabled={aiLoading}
            class="ai-btn article-btn flex-1 flex items-center justify-center gap-1 transition-all"
            style={{
              background: activeAI === 'debate' ? '#F4A726' : 'rgba(244,167,38,0.1)',
              color: activeAI === 'debate' ? '#0A1628' : '#F4A726',
              border: '1px solid rgba(244,167,38,0.3)',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            <MessageSquare size={12} class={activeAI === 'debate' ? 'text-[#0A1628]' : 'text-primary-glow'} />
            <span>Debate</span>
            {activeAI === 'debate' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Action Buttons Row 2 — New AI Features */}
        <div class="article-btn-row flex items-center gap-2 mt-2">
          {/* Feature 1: 5-Point Summary */}
          <button
            onClick={handleFivePoints}
            disabled={aiLoading}
            class="article-btn flex-1 flex items-center justify-center gap-1 transition-all"
            style={{
              background: activeAI === 'fivepoints' ? '#F4A726' : 'rgba(244,167,38,0.1)',
              color: activeAI === 'fivepoints' ? '#0A1628' : '#F4A726',
              border: '1px solid rgba(244,167,38,0.3)',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            <FileText size={12} class={activeAI === 'fivepoints' ? 'text-[#0A1628]' : 'text-amber-500'} />
            <span>📝 5 Points</span>
            {activeAI === 'fivepoints' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Feature 3: Market Impact Meter */}
          <button
            onClick={handleMarketImpact}
            disabled={aiLoading}
            class="article-btn flex-1 flex items-center justify-center gap-1 transition-all"
            style={{
              background: activeAI === 'market' ? '#F4A726' : 'rgba(244,167,38,0.1)',
              color: activeAI === 'market' ? '#0A1628' : '#F4A726',
              border: '1px solid rgba(244,167,38,0.3)',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            <TrendingUp size={12} class={activeAI === 'market' ? 'text-[#0A1628]' : 'text-emerald-500'} />
            <span>📊 Market Impact</span>
            {activeAI === 'market' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Share Button */}
          <button
            onClick={() => {
              setIsShareModalOpen(true);
              const topic = getArticleTopic();
              trackArticleRead(topic, 3);
            }}
            class="article-btn flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all bg-gray-100 dark:bg-white/5 border border-transparent hover:border-gold text-navy dark:text-gray-200"
          >
            <Share2 size={12} class="text-gold" />
            <span>Share</span>
          </button>
        </div>

        {/* AI Result Display (Step 5) */}
        {(aiLoading || aiContent) && (
          <div style={{
            marginTop: '12px',
            padding: '14px',
            background: 'rgba(244,167,38,0.08)',
            border: '1px solid rgba(244,167,38,0.25)',
            borderRadius: '10px'
          }}>
            {aiLoading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#F4A726',
                fontSize: '13px'
              }}>
                <span>🤖</span>
                <span>AI is thinking...</span>
              </div>
            ) : (
              <div style={{
                color: '#fff',
                fontSize: '13px',
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap'
              }}>
                {aiContent}
              </div>
            )}
          </div>
        )}

        {/* Comments Section for Debate */}
        {activeAI === 'debate' && (
          <div class="mt-4">
            <CommentsSection articleUrl={url} />
          </div>
        )}

        {/* Mock Ad Banner */}
        {renderAdSlot()}
      </div>

      <ShareModal
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={url}
        shareTitle={`Check out this article on Economical Research: "${title}"`}
        downloadFilename={`economical-research-report-${getArticleId(url)}`}
        captureRef={articleRef}
      />
    </article>
  );
}

// Wrap in React.memo to prevent unnecessary re-renders of the cards
export default React.memo(ArticleCard, (prev, next) => {
  return prev.isLead === next.isLead && 
         prev.article.url === next.article.url && 
         prev.article.title === next.article.title && 
         prev.article.publishedAt === next.article.publishedAt;
});
