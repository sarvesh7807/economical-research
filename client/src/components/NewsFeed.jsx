import React, { useState, useEffect, useRef } from 'react';
import ArticleCard from './ArticleCard';
import ResearchMode from './ResearchMode';
import { useAuth } from '../contexts/AuthContext';
import { Newspaper, HelpCircle, RefreshCw, Loader, Sparkles, Lock, Send, Play } from 'lucide-react';

function NewsSection({ title, fetchUrl, autoScroll = true }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const fetchSectionNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      
      const raw = data.articles || [];
      // Filter duplicate articles by title
      const unique = raw.filter((article, index, self) =>
        article.title && index === self.findIndex(a => a.title === article.title)
      );
      
      setArticles(unique);
      setLoading(false);
    } catch (err) {
      console.error(`Error fetching section ${title}:`, err);
      setError('Refreshing news...');
      setLoading(false);
      setRetrySeconds(30);
    }
  };

  useEffect(() => {
    fetchSectionNews();
    const refreshInterval = setInterval(fetchSectionNews, 120000);
    return () => clearInterval(refreshInterval);
  }, [fetchUrl]);

  useEffect(() => {
    if (retrySeconds <= 0) return;
    const timer = setTimeout(() => {
      if (retrySeconds === 1) {
        fetchSectionNews();
      }
      setRetrySeconds(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [retrySeconds]);

  useEffect(() => {
    if (articles.length === 0 || isHovered || !autoScroll) return;
    
    const interval = setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;
      
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll - 15) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: 360, behavior: 'smooth' });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [articles, isHovered, autoScroll]);

  if (loading && articles.length === 0) {
    return (
      <div class="mb-8">
        <h3 class="font-display text-lg font-black text-navy dark:text-gold uppercase tracking-wider mb-4 border-b border-gray-150 dark:border-white/10 pb-1.5 flex items-center gap-2">
          <span>{title}</span>
          <span class="w-1.5 h-1.5 rounded-full bg-gold animate-ping"></span>
        </h3>
        <div class="flex overflow-x-auto gap-5 pb-4 scrollbar-none">
          {[1, 2, 3, 4].map(i => (
            <div key={i} class="w-[340px] shrink-0 border border-paper-border dark:border-paper-borderDark p-5 space-y-4 rounded-3xl bg-white dark:bg-black/20">
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

  return (
    <div class="mb-8">
      <h3 class="font-display text-lg font-black text-navy dark:text-gold uppercase tracking-wider mb-4 border-b border-gray-150 dark:border-white/10 pb-1.5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span>{title}</span>
          <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        </div>
        {error && (
          <span class="text-[10px] text-red-500 font-mono font-bold animate-pulse">
            ⚠️ {error} (retrying in {retrySeconds}s)
          </span>
        )}
      </h3>

      {articles.length === 0 && !loading ? (
        <div class="py-8 text-center border border-dashed border-paper-border dark:border-paper-borderDark rounded-2xl bg-white/50 dark:bg-black/10">
          <p class="text-xs text-gray-400">No wire articles available for this section.</p>
        </div>
      ) : (
        <div 
          ref={scrollRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          class="flex overflow-x-auto gap-5 pb-4 scrollbar-none scroll-smooth relative"
        >
          {articles.map((article, idx) => (
            <div key={`${article.url}-${idx}`} class="w-[340px] shrink-0">
              <ArticleCard article={article} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewsFeed({ activeCategory, searchQuery, triggerRefresh }) {
  const { user, subscription } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [timeLeft, setTimeLeft] = useState(120);
  const [retrySeconds, setRetrySeconds] = useState(0);

  const INITIAL_CHANNELS = [
    { name: 'Al Jazeera', channelId: 'UCcA31iA8h4b11fNn1X8G_xw', id: 'gCNeDWCI0vo' },
    { name: 'BBC News', channelId: 'UC16niRr50-MSBwiO3YDb3RA', id: 'pZz4lG8K4H8' },
    { name: 'Sky News', channelId: 'UCoMdktPbSTixAyNGWB-PUiA', id: '9Auq9mYxFEE' },
    { name: 'DW News', channelId: 'UCknLrEdhRCp1aegoMqRaCZg', id: 'mGC74ktp0Zg' },
    { name: 'NDTV 24x7', channelId: 'UCZFMm1mMw0F81Z37aaEzTUA', id: 'FPSzDkQkHdU' },
    { name: 'Republic World', channelId: 'UCwvdjc8Q82DkP3_YvJm_Pug', id: 'jS1684B2l08' }
  ];

  const [liveChannels, setLiveChannels] = useState(INITIAL_CHANNELS);
  const [activeStream, setActiveStream] = useState(INITIAL_CHANNELS[0].id);
  const [isPlayingLive, setIsPlayingLive] = useState(false);

  // Fetch Live YouTube Video IDs
  useEffect(() => {
    const fetchLiveStreams = async () => {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) return;

      try {
        const cached = localStorage.getItem('er_youtube_live_streams');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 3600 * 1000 * 6) { // 6 hours TTL
            setLiveChannels(parsed.channels);
            setActiveStream(parsed.channels[0].id);
            return;
          }
        }

        const updatedChannels = await Promise.all(INITIAL_CHANNELS.map(async (ch) => {
          try {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ch.channelId}&eventType=live&type=video&key=${apiKey}`);
            const data = await res.json();
            if (data.items && data.items.length > 0) {
              return { ...ch, id: data.items[0].id.videoId };
            }
          } catch (err) {
            console.error('Failed to fetch live stream for', ch.name, err);
          }
          return ch; // fallback
        }));

        setLiveChannels(updatedChannels);
        setActiveStream(updatedChannels[0].id);
        
        localStorage.setItem('er_youtube_live_streams', JSON.stringify({
          timestamp: Date.now(),
          channels: updatedChannels
        }));
      } catch (e) {
        console.error('YouTube API Error:', e);
      }
    };
    fetchLiveStreams();
  }, []);

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
        setArticles(prev => {
          const combined = clear ? fetched : [...prev, ...fetched];
          // Filter duplicates by title
          return combined.filter((article, index, self) =>
            article.title && index === self.findIndex(a => a.title === article.title)
          );
        });

        const currentTotal = clear ? fetched.length : (articles.length + fetched.length);
        setHasMore(fetched.length === 20 && currentTotal < (data.totalResults || 100));
        
        if (data.warning) {
          setWarning(data.warning);
        } else {
          setWarning(null);
        }
        setLoading(false);
        setLoadingMore(false);
        setError(null);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError('Refreshing news...');
        setLoading(false);
        setLoadingMore(false);
        setRetrySeconds(30);
      });
  };

  const isHomepage = activeCategory.toLowerCase() === 'world' && !searchQuery;
  const detectedCountry = localStorage.getItem('er_weather_country_pref');

  // Reset page and reload on filters/category changes
  useEffect(() => {
    if (isHomepage) {
      setLoading(false);
      setArticles([]);
      setError(null);
      return;
    }
    setPage(1);
    setHasMore(true);
    setTimeLeft(120);
    fetchArticles(1, true);
  }, [activeCategory, searchQuery, triggerRefresh]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (loading || loadingMore || !hasMore || articles.length === 0 || isHomepage) return;

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
  }, [loading, loadingMore, hasMore, articles, isHomepage]);

  // 120 Seconds Auto-Refresh Timer
  useEffect(() => {
    if (isHomepage) return;
    setTimeLeft(120);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          fetchArticles(1, true);
          setPage(1);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCategory, searchQuery, isHomepage]);

  // Main view retry timer
  useEffect(() => {
    if (retrySeconds <= 0 || isHomepage) return;
    const timer = setTimeout(() => {
      if (retrySeconds === 1) {
        fetchArticles(page, page === 1);
      }
      setRetrySeconds(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [retrySeconds, isHomepage]);

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
      <div class="glass-card p-5 rounded-3xl">
        <div class="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 mb-4">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.7)]"></span>
            <h3 class="font-display text-sm font-black text-navy dark:text-primary-glow uppercase tracking-wider">
              ER Sat Broadcasts
            </h3>
          </div>
          <span class="text-[9px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full">SAT FEED</span>
        </div>
        
        <div class="video-container relative w-full aspect-video rounded overflow-hidden bg-black border border-gray-200 dark:border-gray-800">
          {!isPlayingLive && (
            <div 
              class="absolute inset-0 flex items-center justify-center bg-black/50 z-10 cursor-pointer md:hidden"
              onClick={() => setIsPlayingLive(true)}
            >
              <div class="bg-red-600 rounded-full p-4 hover:bg-red-700 transition-colors shadow-lg flex items-center justify-center">
                <Play size={40} class="text-white ml-2" />
              </div>
            </div>
          )}
          <iframe 
            src={`https://www.youtube.com/embed/${activeStream}?autoplay=${isPlayingLive ? 1 : 0}&mute=1&playsinline=1&rel=0`}
            title="Live Broadcast"
            class="absolute top-0 left-0 w-full h-full border-0"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            muted={true}
            loading="lazy"
            style={{ width: '100%', height: '100%' }}
          ></iframe>
        </div>
        
        <div class="grid grid-cols-3 gap-2 mt-4">
          {liveChannels.map((stream) => (
            <button
              key={stream.channelId}
              onClick={() => setActiveStream(stream.id)}
              class={`py-2 px-1 rounded-xl text-[9px] font-bold uppercase tracking-wider text-center transition-all ${
                activeStream === stream.id
                  ? 'bg-primary text-white shadow-purple-glow'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {stream.name.replace(' English', '')}
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
      <div class="glass-card p-5 rounded-3xl">
        <div class="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 mb-4">
          <div class="flex items-center gap-2">
            <Sparkles size={14} class="text-accent-pink" />
            <h3 class="font-display text-sm font-black text-navy dark:text-accent-pink uppercase tracking-wider">
              Deep Research Desk
            </h3>
          </div>
          <span class="text-[9px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full">PRO MODE</span>
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
                class="flex-grow bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-[11px] focus:outline-none focus:ring-2 focus:ring-primary text-navy dark:text-white"
              />
              <button
                type="submit"
                disabled={!researchInput.trim()}
                class="bg-navy hover:bg-navy-light text-accent-neon px-4 py-2 rounded-xl text-[10px] uppercase font-bold shrink-0 transition-all hover:shadow-neon"
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
              class="w-full bg-gradient-to-r from-primary to-accent-purple hover:from-primary-glow hover:to-accent-pink text-white font-bold text-[10px] uppercase py-2.5 rounded-xl tracking-wider transition-all shadow-purple-glow hover:scale-105"
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
      <div class="glass-card p-5 rounded-3xl text-center relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-br from-primary-glow/20 to-accent-pink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div class="bg-gray-50 dark:bg-white/5 py-8 px-5 border border-gray-200 dark:border-white/10 rounded-2xl relative z-10 backdrop-blur-sm">
          <span class="text-[9px] font-bold text-accent-pink uppercase tracking-widest block mb-3 animate-pulse">- SPONSORED BRIEFING -</span>
          <h4 class="font-display text-sm font-black text-navy dark:text-white uppercase tracking-wide mb-2">Global Capital Yields</h4>
          <p class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
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
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-8">
      {/* Feed Title and Header */}
      <div class="border-b border-gray-200 dark:border-white/10 pb-4 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 class="font-display text-3xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-navy to-primary dark:from-white dark:to-gray-400 uppercase drop-shadow-md">
          {getFeedTitle()}
        </h2>
        <div class="flex items-center gap-3">
          {isHomepage ? (
            <span class="flex items-center gap-1.5 text-[10px] text-white font-bold uppercase tracking-wider bg-navy dark:bg-white/10 px-3 py-1.5 rounded-full">
              <span class="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span>Live Broadcast Desk</span>
            </span>
          ) : (
            <>
              <span class="flex items-center gap-1.5 text-[10px] text-white font-bold uppercase tracking-wider bg-navy dark:bg-white/10 px-3 py-1.5 rounded-full shadow-neon">
                <RefreshCw size={12} class="animate-spin text-accent-neon shrink-0" />
                <span>Sync: {timeLeft}s</span>
              </span>
              <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest shrink-0 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                {articles.length} Bulletins
              </span>
            </>
          )}
        </div>
      </div>

      {/* Warning banner */}
      {warning && (
        <div class="mb-6 bg-gold/10 border border-gold/40 text-navy dark:text-gold-light text-xs font-semibold px-4 py-3 rounded flex items-center gap-2">
          <span class="animate-ping w-1.5 h-1.5 rounded-full bg-gold shrink-0"></span>
          <span>{warning}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left/Middle: News Sections (Home) or Category Grid */}
          <div class="col-span-1 lg:col-span-2 space-y-6">
            {isHomepage ? (
              <div class="space-y-2">
                {detectedCountry && (
                  <NewsSection 
                    title="News from Your Region" 
                    fetchUrl={`/api/news?country=${detectedCountry}`} 
                  />
                )}
                <NewsSection title="World News" fetchUrl="/api/news?category=world" />
                <NewsSection title="India News" fetchUrl="/api/news?category=india" />
                <NewsSection title="Business News" fetchUrl="/api/news?category=business" />
                <NewsSection title="Technology News" fetchUrl="/api/news?category=tech" />
                <NewsSection title="Sports News" fetchUrl="/api/news?category=sports" />
                <NewsSection title="Health News" fetchUrl="/api/news?category=health" />
                <NewsSection title="Science News" fetchUrl="/api/news?category=science" />
                <NewsSection title="Entertainment News" fetchUrl="/api/news?category=entertainment" />
              </div>
            ) : articles.length === 0 ? (
              <div class="text-center py-16 border border-dashed border-paper-border dark:border-paper-borderDark rounded bg-white dark:bg-paper-cardDark">
                <Newspaper size={40} class="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                <h3 class="font-serif text-xl font-bold text-navy dark:text-white mb-1">Archive Clean</h3>
                <p class="text-xs text-gray-400 dark:text-gray-500">No wire articles match the current filter parameters.</p>
              </div>
            ) : (
              <>
                <ArticleCard article={articles[0]} isLead={true} />
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {articles.slice(1, 5).map((article, idx) => (
                    <ArticleCard key={`${article.url}-${idx}`} article={article} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Side: Live Broadcast, Research Desk & Side Panel */}
          <div class="col-span-1 space-y-6">
            {renderLiveTV()}
            {renderResearchDesk()}
            {renderSidePanel()}
          </div>
        </div>

        {/* Remaining articles in standard 3-column layout (Non-Homepage only) */}
        {!isHomepage && articles.length > 5 && (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {articles.slice(5).map((article, idx) => (
              <ArticleCard key={`${article.url}-${idx + 5}`} article={article} />
            ))}
          </div>
        )}

        {/* Loader Element for Infinite Scroll or Load More button (Non-Homepage only) */}
        {!isHomepage && hasMore && articles.length > 0 && (
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
                class="px-6 py-3 bg-gradient-to-r from-navy to-primary dark:from-white/10 dark:to-white/5 text-white hover:scale-105 text-xs font-bold uppercase tracking-wider rounded-full shadow-3d-light dark:shadow-3d-dark transition-all"
              >
                Load More Reports
              </button>
            )}
          </div>
        )}

        {!isHomepage && !hasMore && articles.length > 0 && (
          <div class="mt-12 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest py-4 border-t border-double border-paper-border dark:border-paper-borderDark">
            ✦ End of Editorial Ledger Wire ✦
          </div>
        )}
      </div>
      
      {isResearchOpen && (
        <ResearchMode topic={activeResearchTopic} onClose={() => setIsResearchOpen(false)} />
      )}
    </div>
  );
}
