import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Lock } from 'lucide-react';
import ShareModal from './ShareModal';
import { getPremiumArticleImage } from '../utils/imageSystem';

function ArticleCard({ article, isLead, layout = 'grid' }) {
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (articleRef.current) observer.observe(articleRef.current);
    return () => observer.disconnect();
  }, [articleRef]);

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

  if (layout === 'list') {
    return (
      <div 
        ref={articleRef}
        style={{
          display: 'flex',
          gap: '16px',
          padding: '16px',
          borderBottom: '1px solid rgba(244,167,38,0.1)',
          alignItems: 'flex-start',
          transition: 'opacity 0.5s ease, transform 0.5s ease, background 0.2s ease',
          cursor: 'pointer',
          position: 'relative',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          background: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(244,167,38,0.03)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
        className="group news-feed-container"
      >
        <div style={{ position: 'relative', width: '140px', height: '95px', overflow: 'hidden', flexShrink: 0, borderRadius: '4px', background: 'var(--navy-darkest)' }}>
          <img 
            src={imageUrl} 
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.85)',
              transition: 'transform 0.7s ease-out'
            }}
            className="group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontSize: '10px',
              color: '#F4A726',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>{getArticleTopic()}</span>
          </div>
          
          <h3 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '16px',
            color: '#fff',
            margin: '6px 0',
            lineHeight: '1.35',
            fontWeight: '700'
          }} className="hover:text-gold transition-colors">
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
              {title}
            </a>
          </h3>
          
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '13px',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: 0
          }}>
            {description || 'Full report details are available in the linked release archive.'}
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            fontSize: '11px',
            fontFamily: 'IBM Plex Mono, monospace',
            color: 'rgba(255,255,255,0.35)'
          }} className="flex-wrap gap-2">
            <div>
              <span>{source?.name || 'Unknown'}</span>
              <span style={{ margin: '0 8px' }}>·</span>
              <span>{getRelativeTime(publishedAt)}</span>
            </div>

            {/* Voice News Reader & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="font-sans">
              <span className="flex items-center gap-1 shrink-0" style={{ fontSize: '9px' }}>
                {!isPlaying ? (
                  <button
                    onClick={handleListen}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0 }}
                    className="hover:text-gold"
                    title="Listen to Article"
                  >
                    🔊 Listen
                  </button>
                ) : (
                  <span className="flex items-center gap-1">
                    <button
                      onClick={handlePause}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0 }}
                      className="hover:text-gold"
                      title={isPaused ? "Resume" : "Pause"}
                    >
                      {isPaused ? '▶' : '⏸'}
                    </button>
                    <button
                      onClick={handleStop}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}
                      title="Stop"
                    >
                      ⏹
                    </button>
                  </span>
                )}
              </span>

              {/* Share & Copy Link */}
              <button
                onClick={handleCopyLink}
                style={{
                  padding: '2px 8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '3px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: '600'
                }}
                className="hover:bg-white/10"
              >
                {copiedLink ? '✓' : 'Copy'}
              </button>
              <button
                onClick={() => {
                  setIsShareModalOpen(true);
                  const topic = getArticleTopic();
                  trackArticleRead(topic, 3);
                }}
                style={{
                  padding: '2px 8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '3px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: '600'
                }}
                className="hover:bg-white/10"
              >
                Share
              </button>
            </div>
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
      </div>
    );
  }

  return (
    <article 
      ref={articleRef}
      onMouseEnter={(e) => {
        setHovered(true);
        e.currentTarget.style.borderColor = 'var(--gold-primary)';
        e.currentTarget.style.transform = layout === 'featured' ? 'scale(1.005) translateY(-4px)' : 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = layout === 'featured' ? 'scale(1) translateY(0)' : 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      style={{
        background: 'var(--navy-medium)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'opacity 0.5s ease, transform 0.5s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        width: '100%',
        shrink: 0,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        gridColumn: layout === 'featured' ? 'span 2' : 'auto'
      }}
      className="group news-feed-container"
    >
      <div>
        {/* Featured Image */}
        <div 
          style={{ 
            position: 'relative', 
            width: '100%', 
            height: isLead ? '240px' : '180px', 
            overflow: 'hidden',
            background: 'var(--navy-darkest)'
          }}
        >
          <img 
            src={imageUrl} 
            alt={title} 
            loading={isLead ? "eager" : "lazy"}
            fetchPriority={isLead ? "high" : "low"}
            decoding="async"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.85)',
              transition: 'transform 0.7s ease-out'
            }}
            className="group-hover:scale-110"
            onError={() => setImgError(true)}
          />
          {/* Category Overlay */}
          <div style={{ position: 'absolute', bottom: '12px', left: '16px', zIndex: 10 }}>
            <span style={{
              fontSize: '10px',
              color: 'var(--gold-primary)',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              background: 'rgba(6, 13, 23, 0.75)',
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)'
            }}>
              {getArticleTopic()}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: '18px' }}>
          <h3 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: isLead ? '21px' : '17px',
            color: '#fff',
            margin: '0 0 10px',
            lineHeight: '1.3',
            fontWeight: '700'
          }} className="hover:text-gold transition-colors">
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
              {title}
            </a>
          </h3>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '13px',
            lineHeight: '1.5',
            fontFamily: 'Inter, sans-serif',
            margin: '0 0 16px'
          }} className={isLead ? 'line-clamp-4' : 'line-clamp-2'}>
            {description || 'Full report details are available in the linked release archive.'}
          </p>
        </div>
      </div>

      {/* Footer Area with Info & Actions */}
      <div style={{ padding: '0 18px 18px' }}>
        <p style={{
          color: 'var(--text-tertiary)',
          fontSize: '11px',
          fontFamily: 'IBM Plex Mono, monospace',
          margin: '0 0 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{source?.name || 'Unknown'} · {getRelativeTime(publishedAt)}</span>
          
          {/* Voice News Reader */}
          <span className="flex items-center gap-1 shrink-0 font-sans" style={{ fontSize: '9px' }}>
            {!isPlaying ? (
              <button
                onClick={handleListen}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
                className="hover:text-gold"
                title="Listen to Article"
              >
                🔊 Listen
              </button>
            ) : (
              <span className="flex items-center gap-1">
                <button
                  onClick={handlePause}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
                  className="hover:text-gold"
                  title={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? '▶' : '⏸'}
                </button>
                <button
                  onClick={handleStop}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}
                  title="Stop"
                >
                  ⏹
                </button>
              </span>
            )}
          </span>
        </p>

        {/* Share & Copy Row */}
        <div className="article-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={handleCopyLink}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600'
            }}
            className="hover:bg-white/10"
          >
            <span>{copiedLink ? '✓' : 'Copy Link'}</span>
          </button>
          <button
            onClick={() => {
              setIsShareModalOpen(true);
              const topic = getArticleTopic();
              trackArticleRead(topic, 3);
            }}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600'
            }}
            className="hover:bg-white/10"
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
