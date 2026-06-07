import React, { useState, useEffect, useRef } from 'react';
import ArticleCard from './ArticleCard';
import ResearchMode from './ResearchMode';
import { useAuth } from '../contexts/AuthContext';
import { Newspaper, HelpCircle, RefreshCw, Loader, Sparkles, Lock, Send } from 'lucide-react';

export default function NewsFeed({ activeCategory, searchQuery, triggerRefresh }) {
  const { user, subscription } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);

  const [activeStream, setActiveStream] = useState('21X5lGlDOfg'); // Default Al Jazeera
  const streams = [
    { name: 'Al Jazeera', id: '21X5lGlDOfg' },
    { name: 'DW News', id: 'mGC74ktp0Zg' },
    { name: 'NDTV 24x7', id: 'FPSzDkQkHdU' },
    { name: 'Sky News', id: '9Auq9mYxFEE' }
  ];

  // Research Desk states
  const [researchInput, setResearchInput] = useState('');
  const [activeResearchTopic, setActiveResearchTopic] = useState(null);
  const [isResearchOpen, setIsResearchOpen] = useState(false);

  const loaderRef = useRef(null);

  // Core Data Fetcher
  const fetchArticles = (pageNum, clear = false) => {
    if (clear) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    const queryParams = new URLSearchParams();
    if (searchQuery) {
      queryParams.append('q', searchQuery);
    } else {
      queryParams.append('category', activeCategory);
    }
    queryParams.append('page', pageNum);
    queryParams.append('pageSize', 20);

    const fetchUrl = `/api/news?${queryParams.toString()}`;

    fetch(fetchUrl)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then(data => {
        const fetched = data.articles || [];
        setArticles(prev => clear ? fetched : [...prev, ...fetched]);
        // If we get fewer than 20 articles or total results are met, there are no more articles
        const currentTotal = clear ? fetched.length : (articles.length + fetched.length);
        setHasMore(fetched.length === 20 && currentTotal < (data.totalResults || 100));
        
        if (data.warning) {
          setWarning(data.warning);
        } else {
          setWarning(null);
        }
        setLoading(false);
        setLoadingMore(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError('Failed to contact editorial database. Please verify the proxy is active.');
        setLoading(false);
        setLoadingMore(false);
      });
  };

  // Reset page and reload on filters/category changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setTimeLeft(60);
    fetchArticles(1, true);
  }, [activeCategory, searchQuery, triggerRefresh]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (loading || loadingMore || !hasMore || articles.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage(prev => {
          const nextPage = prev + 1;
          fetchArticles(nextPage, false);
          return nextPage;
        });
      }
    }, { threshold: 0.5 });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, articles]);

  // 60 Seconds Auto-Refresh Timer
  useEffect(() => {
    setTimeLeft(60);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Trigger a refresh call which reloads the initial page
          fetchArticles(1, true);
          setPage(1);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCategory, searchQuery]);

  const getFeedTitle = () => {
    if (searchQuery) {
      return `SEARCH ARCHIVE: "${searchQuery}"`;
    }
    const catTitles = {
      world: 'WORLD BULLETIN',
      india: 'INDIA CORRESPONDENCE',
      politics: 'POLITICAL DESK',
      tech: 'TECHNOLOGY & LOGIC',
      business: 'BUSINESS TELEGRAM',
      finance: 'MONETARY AND FISCAL RECORD',
      sports: 'ATHLETIC CHRONICLE',
      entertainment: 'CULTURE & EXHIBITIONS',
      science: 'SCIENTIFIC INQUIRY',
      environment: 'ENVIRONMENTAL DESK',
      health: 'HEALTH & HYGIENE',
      education: 'EDUCATIONAL LEDGER',
      travel: 'DISCOVERY AND EXCURSIONS',
      lifestyle: 'LIFESTYLE & SOCIETY',
      law: 'LAW & CRIMINOLOGY DESK',
      research: 'ACADEMIC WIRE REPORTS'
    };
    return catTitles[activeCategory.toLowerCase()] || 'DAILY BULLETIN';
  };

  const renderLiveTV = () => {
    return (
      <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded p-4 shadow-sm">
        <div class="flex items-center justify-between border-b border-paper-border dark:border-paper-borderDark pb-2 mb-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-red-650 animate-ping"></span>
            <h3 class="font-serif text-xs font-black text-navy dark:text-gold uppercase tracking-wider">
              ER Sat Broadcasts
            </h3>
          </div>
          <span class="text-[9px] font-mono font-bold text-gray-400">SAT FEED</span>
        </div>
        
        <div class="relative w-full aspect-video rounded overflow-hidden bg-black border border-gray-200 dark:border-gray-800">
          <iframe 
            src={`https://www.youtube.com/embed/${activeStream}?autoplay=1&mute=1`}
            title="Live Broadcast"
            class="absolute top-0 left-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        
        <div class="grid grid-cols-4 gap-1.5 mt-3">
          {streams.map((stream) => (
            <button
              key={stream.id}
              onClick={() => setActiveStream(stream.id)}
              class={`py-1.5 px-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-center transition-all ${
                activeStream === stream.id
                  ? 'bg-navy text-gold dark:bg-gold dark:text-navy'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {stream.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const handleResearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!researchInput.trim()) return;
    setActiveResearchTopic(researchInput.trim());
    setIsResearchOpen(true);
    setResearchInput('');
  };

  const renderResearchDesk = () => {
    const isPro = subscription?.tier === 'PRO';
    
    return (
      <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded p-4 shadow-sm">
        <div class="flex items-center justify-between border-b border-paper-border dark:border-paper-borderDark pb-2 mb-3">
          <div class="flex items-center gap-2">
            <Sparkles size={13} class="text-gold" />
            <h3 class="font-serif text-xs font-black text-navy dark:text-gold uppercase tracking-wider">
              Deep Research Desk
            </h3>
          </div>
          <span class="text-[9px] font-mono font-bold text-gray-400">PRO MODE</span>
        </div>
        
        {isPro ? (
          <form onSubmit={handleResearchSubmit} class="space-y-2">
            <p class="text-[10px] text-gray-500 leading-relaxed font-sans mb-1">
              Synthesize comprehensive research briefs mapping core market signals.
            </p>
            <div class="flex gap-2">
              <input
                type="text"
                placeholder="Enter topic (e.g. GDP, Supply Chains)..."
                value={researchInput}
                onChange={(e) => setResearchInput(e.target.value)}
                class="flex-grow bg-gray-50 dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
              />
              <button
                type="submit"
                disabled={!researchInput.trim()}
                class="bg-navy hover:bg-navy-light text-gold px-2.5 py-1 rounded text-[10px] uppercase font-bold shrink-0 transition-all"
              >
                Compile
              </button>
            </div>
          </form>
        ) : (
          <div class="text-center py-2 space-y-2.5">
            <div class="flex items-center justify-center gap-1 text-red-500 font-bold text-[10px] uppercase">
              <Lock size={11} />
              <span>Access Restricted</span>
            </div>
            <p class="text-[10px] text-gray-400 font-sans leading-normal">
              Deep Research compiles extensive intelligence briefs. Upgrading to PRO lifts this block.
            </p>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('change-view', { detail: 'billing' }));
              }}
              class="w-full bg-gold hover:bg-gold-light text-navy font-bold text-[9px] uppercase py-1.5 rounded tracking-wider transition-all"
            >
              Upgrade to PRO
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSidePanel = () => {
    return (
      <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded p-4 shadow-sm text-center">
        <div class="bg-gray-50 dark:bg-navy-light/10 py-6 px-4 border border-dashed border-gray-300 dark:border-gray-800 rounded">
          <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">- SPONSORED BRIEFING -</span>
          <h4 class="font-serif text-xs font-black text-navy dark:text-gold uppercase tracking-wide mb-1">Global Capital Yields</h4>
          <p class="text-[10px] text-gray-450 dark:text-gray-400 leading-normal">
            Discover audited alternative asset reports synthesized for macro analysts.
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div class="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div class="border-double-bottom-navy pb-3 mb-6">
          <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-shimmer"></div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="col-span-1 md:col-span-2 lg:col-span-2 border border-paper-border dark:border-paper-borderDark p-5 space-y-4">
            <div class="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-800 animate-shimmer"></div>
            <div class="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-800 animate-shimmer"></div>
            <div class="h-44 w-full rounded bg-gray-200 dark:bg-gray-800 animate-shimmer"></div>
            <div class="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-800 animate-shimmer"></div>
            <div class="space-y-2">
              <div class="h-3 rounded bg-gray-200 dark:bg-gray-800 animate-shimmer"></div>
              <div class="h-3 rounded bg-gray-200 dark:bg-gray-800 animate-shimmer"></div>
            </div>
          </div>
          
          {[1, 2, 3, 4].map(i => (
            <div key={i} class="border border-paper-border dark:border-paper-borderDark p-5 space-y-4">
              <div class="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-800 animate-shimmer"></div>
              <div class="h-5 w-5/6 rounded bg-gray-200 dark:bg-gray-800 animate-shimmer"></div>
              <div class="h-36 w-full rounded bg-gray-200 dark:bg-gray-800 animate-shimmer"></div>
              <div class="space-y-2">
                <div class="h-3 rounded bg-gray-200 dark:bg-gray-800 animate-shimmer"></div>
                <div class="h-3 rounded bg-gray-200 dark:bg-gray-800 animate-shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="max-w-7xl mx-auto px-4 md:px-6 py-16 text-center">
        <HelpCircle size={48} class="mx-auto text-red-500 mb-4 animate-bounce" />
        <h3 class="font-serif text-2xl font-bold text-navy dark:text-white mb-2">Editorial Connection Interrupted</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">{error}</p>
        <button 
          onClick={() => fetchArticles(1, true)}
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-navy text-gold hover:bg-navy-light rounded font-semibold text-xs transition-colors"
        >
          <RefreshCw size={14} />
          <span>RETRY CONNECTION</span>
        </button>
      </div>
    );
  }

  return (
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Feed Title and Header */}
      <div class="border-double-bottom-navy pb-2.5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 class="font-serif text-2xl md:text-3xl font-black tracking-tight text-navy dark:text-gold uppercase">
          {getFeedTitle()}
        </h2>
        <div class="flex items-center gap-3">
          {/* 60s Countdown indicator */}
          <span class="flex items-center gap-1.5 text-[10px] text-navy/70 dark:text-gold/80 font-bold uppercase tracking-wider bg-navy/5 dark:bg-gold/10 px-2.5 py-1 rounded">
            <RefreshCw size={10} class="animate-spin text-gold shrink-0" />
            <span>Wire Sync: {timeLeft}s</span>
          </span>
          <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest shrink-0">
            {articles.length} Wire Bulletins Loaded
          </span>
        </div>
      </div>

      {/* Warning banner */}
      {warning && (
        <div class="mb-6 bg-gold/10 border border-gold/40 text-navy dark:text-gold-light text-xs font-semibold px-4 py-3 rounded flex items-center gap-2">
          <span class="animate-ping w-1.5 h-1.5 rounded-full bg-gold shrink-0"></span>
          <span>{warning}</span>
        </div>
      )}

      {/* No articles state */}
      {articles.length === 0 ? (
        <div class="text-center py-16 border border-dashed border-paper-border dark:border-paper-borderDark rounded bg-white dark:bg-paper-cardDark">
          <Newspaper size={40} class="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <h3 class="font-serif text-xl font-bold text-navy dark:text-white mb-1">Archive Clean</h3>
          <p class="text-xs text-gray-400 dark:text-gray-500">No wire articles match the current filter parameters.</p>
        </div>
      ) : (
        /* Newspaper Grid Layout */
        <div>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left/Middle: Lead Story & Standard Stories */}
            <div class="col-span-1 lg:col-span-2 space-y-6">
              <ArticleCard article={articles[0]} isLead={true} />
              
              {/* Grid for standard items on homepage */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articles.slice(1, 5).map((article, idx) => (
                  <ArticleCard key={`${article.url}-${idx}`} article={article} />
                ))}
              </div>
            </div>

            {/* Right Side: Live Broadcast, Research Desk & Side Panel */}
            <div class="col-span-1 space-y-6">
              {renderLiveTV()}
              {renderResearchDesk()}
              {renderSidePanel()}
            </div>
          </div>

          {/* Remaining articles in standard 3-column layout */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {articles.slice(5).map((article, idx) => (
              <ArticleCard key={`${article.url}-${idx + 5}`} article={article} />
            ))}
          </div>

          {/* Loader Element for Infinite Scroll or Load More button */}
          {hasMore && (
            <div ref={loaderRef} class="mt-8 pt-4 border-t border-dashed border-paper-border dark:border-paper-borderDark flex flex-col items-center justify-center">
              {loadingMore ? (
                <div class="flex items-center gap-2 text-xs font-bold text-navy dark:text-gold uppercase tracking-widest">
                  <Loader size={16} class="animate-spin text-gold" />
                  <span>Loading next page...</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const nextPage = page + 1;
                    fetchArticles(nextPage, false);
                    setPage(nextPage);
                  }}
                  class="px-5 py-2.5 bg-navy text-gold hover:bg-navy-light text-xs font-bold uppercase tracking-wider rounded border border-transparent transition-all"
                >
                  Load More Reports
                </button>
              )}
            </div>
          )}

          {!hasMore && articles.length > 0 && (
            <div class="mt-12 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest py-4 border-t border-double border-paper-border dark:border-paper-borderDark">
              ✦ End of Editorial Ledger Wire ✦
            </div>
          )}
        </div>
      )}
      
      {isResearchOpen && (
        <ResearchMode topic={activeResearchTopic} onClose={() => setIsResearchOpen(false)} />
      )}
    </div>
  );
}
