import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Lock } from 'lucide-react';
import ShareModal from './ShareModal';
import { getPremiumArticleImage } from '../utils/imageSystem';

function ArticleCard({ article, isLead }) {
  const [translatedTitle, setTranslatedTitle] = useState(article?.title || '')
  const [translatedDescription, setTranslatedDescription] = useState(article?.description || '')
  const [translatedContent, setTranslatedContent] = useState(article?.content || '')
  const [isTranslated, setIsTranslated] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false);

  const { title, description, content, source, author, url, urlToImage, publishedAt } = article;
  const { logReadingEvent, settings, subscription, trackArticleRead } = useAuth();
  
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

  // Paywall locks
  const [paywallActive, setPaywallActive] = useState(false);
  const [paywallType, setPaywallType] = useState('reads'); // 'reads' or 'summaries'

  // Comments/Share settings
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const articleRef = useRef(null);

  // Voice Reader States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Hover state for reading tracking
  const [hovered, setHovered] = useState(false);

  // Caching helpers
  const getArticleId = (urlStr) => {
    if (!urlStr) return 'unknown_article';
    return urlStr.replace(/[^a-zA-Z0-9]/g, '_');
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

    const textToSpeak = (translatedTitle || title) + ". " + (translatedDescription || description || "");
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
        article_category: article.category || 'world'
      });
    }
  };

  const handleCopyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
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
      onMouseLeave={() => setHovered(false)}
      class="glass-card p-5 flex flex-col justify-between relative group rounded-3xl transition-all w-full shrink-0"
      style={{
        overflow: 'visible',
        height: 'auto',
        maxHeight: 'none'
      }}
    >
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

        {/* Article Title */}
        <h3 class={`font-display font-bold leading-tight text-navy dark:text-white hover:text-primary-glow dark:hover:text-primary-glow transition-colors mb-3 ${
          isLead ? 'text-2xl md:text-3xl line-clamp-3' : 'text-xl md:text-2xl line-clamp-2'
        }`}>
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
            {title}
          </a>
        </h3>

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

      {/* Share & Copy Row */}
      <div class="article-actions" style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={handleCopyLink}
            class="article-btn"
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600'
            }}
          >
            <span>{copiedLink ? '✓ Copied!' : 'Copy Link'}</span>
          </button>
          <button
            onClick={() => {
              setIsShareModalOpen(true);
              const topic = getArticleTopic();
              trackArticleRead(topic, 3);
            }}
            class="article-btn"
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600'
            }}
          >
            <span>Share</span>
          </button>
        </div>
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

export default React.memo(ArticleCard, (prev, next) => {
  return prev.isLead === next.isLead && 
         prev.article.url === next.article.url && 
         prev.article.title === next.article.title && 
         prev.article.publishedAt === next.article.publishedAt;
});
