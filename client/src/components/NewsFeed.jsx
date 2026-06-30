import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Chart from 'chart.js/auto';
import ArticleCard from './ArticleCard';
import ResearchMode from './ResearchMode';
import { useAuth } from '../contexts/AuthContext';
import { Newspaper, HelpCircle, RefreshCw, Loader, Sparkles, Lock, Send, Play, ClipboardList, ArrowRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { fetchNews, removeDuplicates } from '../utils/newsFetcher';

// Category verification logic
function verifyArticleCategory(article, category) {
  if (!category) return true;
  const cat = category.toLowerCase();
  
  if (['world', 'india', 'foryou', 'general'].includes(cat)) {
    return true;
  }
  
  const title = (article.title || '').toLowerCase();
  const desc = (article.description || '').toLowerCase();
  const content = (article.content || '').toLowerCase();
  const fullText = `${title} ${desc} ${content}`;

  const keywords = {
    sports: {
      inc: ['sport', 'sports', 'athlete', 'game', 'match', 'tournament', 'cup', 'trophy', 'league', 'team', 'player', 'coach', 'stadium', 'championship', 'victory', 'score', 'arena', 'gold medal', 'olympics', 'fifa', 'ufc', 'nba', 'nfl', 'ipl', 'icc', 'cricket', 'football', 'soccer', 'tennis', 'basketball', 'mma', 'baseball', 'rugby', 'golf', 'wicket', 'striker', 'defender', 'goalkeeper', 'pitch', 'race', 'grand prix', 'messi', 'ronaldo', 'mbappe', 'neymar', 'kohli', 'dhoni', 'tendulkar', 'formula 1', 'f1', 'batsman', 'bowler'],
      exc: ['inflation', 'gdp', 'stock market', 'venture capital', 'central bank', 'fiscal', 'macroeconomic', 'quantum computing', 'semiconductor', 'parliament', 'legislative', 'senate', 'election', 'clinical trial', 'vaccine', 'fusion reactor', 'exoplanet']
    },
    cricket: {
      inc: ['cricket', 'kohli', 'rohit', 'dhoni', 'tendulkar', 'bumrah', 'gill', 'babar', 'stokes', 'root', 'cummins', 'smith', 'williamson', 'head', 'khan', 'buttler', 'ipl', 'bbl', 'psl', 'sa20', 'cpl', 'icc', 't20', 'odi', 'test match', 'wicket', 'run', 'runs', 'bowler', 'batsman', 'all-rounder', 'crease', 'umpire'],
      exc: ['football', 'soccer', 'nba', 'ufc', 'mma', 'gdp', 'inflation', 'stock market']
    },
    football: {
      inc: ['football', 'soccer', 'messi', 'ronaldo', 'mbappe', 'neymar', 'fifa', 'premier league', 'la liga', 'serie a', 'bundesliga', 'champions league', 'world cup', 'striker', 'midfielder', 'defender', 'goalkeeper', 'pitch', 'referee', 'goal', 'goals', 'transfer'],
      exc: ['cricket', 'wicket', 'baseball', 'nba', 'gdp', 'inflation', 'stock market']
    },
    mma: {
      inc: ['mma', 'ufc', 'fight', 'fighter', 'knockout', 'ko', 'tko', 'submission', 'octagon', 'champion', 'heavyweight', 'featherweight', 'lightweight', 'welterweight'],
      exc: ['cricket', 'football', 'soccer', 'gdp', 'inflation']
    },
    politics: {
      inc: ['politics', 'political', 'election', 'elections', 'parliament', 'senate', 'congress', 'legislative', 'legislation', 'government', 'diplomat', 'diplomacy', 'summit', 'treaty', 'minister', 'president', 'governor', 'mayor', 'bill passed', 'white house', 'kremlin', 'downing street', 'prime minister', 'coalition', 'voters', 'vote', 'voting', 'ballot', 'policy', 'candidate', 'debate'],
      exc: ['sports', 'match', 'championship', 'game', 'player', 'wicket', 'goal', 'semiconductor', 'quantum computing', 'box office', 'movie', 'album', 'clinical trial', 'vaccine']
    },
    tech: {
      inc: ['tech', 'technology', 'technologies', 'software', 'hardware', 'ai', 'artificial intelligence', 'robot', 'robotics', 'app', 'apps', 'algorithm', 'cyber', 'cybersecurity', 'quantum computing', 'semiconductor', 'microchip', 'chip', 'startup', 'saas', 'smartphone', 'cloud computing', 'database', 'coding', 'programming'],
      exc: ['sports', 'match', 'championship', 'wicket', 'goal', 'parliament', 'senate', 'election', 'inflation', 'gdp', 'fiscal', 'clinical trial', 'vaccine']
    },
    business: {
      inc: ['business', 'corporate', 'company', 'companies', 'acquisition', 'merger', 'industry', 'industries', 'startup', 'venture capital', 'executive', 'ceo', 'coo', 'cfo', 'revenue', 'earnings', 'profit', 'quarterly', 'sales', 'trade', 'retail', 'manufacturing', 'logistics', 'supply chain'],
      exc: ['sports', 'match', 'championship', 'game', 'player', 'wicket', 'goal', 'movie', 'album', 'box office', 'clinical trial', 'vaccine']
    },
    finance: {
      inc: ['finance', 'financial', 'stock market', 'stocks', 'wall street', 'dow jones', 'nasdaq', 'currency', 'trading', 'inflation', 'economy', 'economic', 'gdp', 'central bank', 'federal reserve', 'fed', 'interest rate', 'rates', 'yield', 'bonds', 'investment', 'investors', 'banking', 'banks', 'fiscal', 'monetary', 'macroeconomic'],
      exc: ['sports', 'match', 'championship', 'game', 'player', 'wicket', 'goal', 'movie', 'album', 'box office', 'clinical trial', 'vaccine']
    },
    entertainment: {
      inc: ['entertainment', 'movie', 'movies', 'film', 'films', 'cinema', 'actor', 'actress', 'celebrity', 'celebrities', 'hollywood', 'bollywood', 'album', 'song', 'music', 'concert', 'artist', 'singer', 'band', 'box office', 'theater', 'television', 'series', 'streaming', 'show', 'oscar', 'oscars', 'grammy', 'grammys', 'festival'],
      exc: ['inflation', 'gdp', 'stock market', 'monetary', 'venture capital', 'semiconductor', 'quantum computing', 'clinical trial', 'vaccine', 'parliament', 'senate', 'election']
    },
    science: {
      inc: ['science', 'scientific', 'astronomy', 'planet', 'planets', 'exoplanet', 'telescope', 'nasa', 'space', 'galaxy', 'physics', 'chemistry', 'biology', 'fusion', 'reactor', 'archaeology', 'fossil', 'paleontologist', 'scientist', 'researchers', 'discovery', 'breakthrough'],
      exc: ['sports', 'match', 'championship', 'game', 'player', 'wicket', 'goal', 'movie', 'album', 'box office', 'parliament', 'senate', 'election', 'inflation', 'gdp', 'stock market']
    },
    research: {
      inc: ['research', 'academic', 'study', 'studies', 'journal', 'publisher', 'breakthroughs', 'innovation', 'findings', 'thesis', 'scientist', 'scientists', 'university', 'research institute', 'laboratory', 'lab', 'data', 'experiment', 'peer-reviewed'],
      exc: ['sports', 'match', 'championship', 'game', 'player', 'wicket', 'goal', 'movie', 'album', 'box office', 'parliament', 'senate', 'election']
    },
    environment: {
      inc: ['environment', 'environmental', 'climate', 'green energy', 'renewable', 'solar', 'wind power', 'recycling', 'emissions', 'conservation', 'wildlife', 'forest', 'ocean', 'oceans', 'carbon', 'warming', 'pollution', 'species', 'ecology'],
      exc: ['sports', 'match', 'championship', 'game', 'player', 'wicket', 'goal', 'movie', 'album', 'box office', 'stock market', 'gdp', 'inflation']
    },
    health: {
      inc: ['health', 'hygiene', 'medical', 'medicine', 'clinical trial', 'vaccine', 'vaccines', 'virus', 'pandemic', 'disease', 'doctor', 'hospital', 'patient', 'therapy', 'nutrition', 'diet', 'fitness', 'mental health'],
      exc: ['sports', 'match', 'championship', 'game', 'player', 'wicket', 'goal', 'movie', 'album', 'box office', 'stock market', 'gdp', 'inflation', 'parliament', 'senate', 'election']
    },
    education: {
      inc: ['education', 'educational', 'school', 'schools', 'university', 'college', 'student', 'students', 'teacher', 'teachers', 'learning', 'study', 'curriculum', 'academy', 'academic', 'degree', 'tuition'],
      exc: ['sports', 'match', 'championship', 'game', 'player', 'wicket', 'goal', 'movie', 'album', 'box office', 'stock market', 'gdp', 'inflation']
    },
    travel: {
      inc: ['travel', 'tourism', 'tourist', 'flight', 'flights', 'airline', 'airlines', 'hotel', 'hotels', 'resort', 'destination', 'wanderlust', 'cruise', 'trip', 'vacation', 'baggage'],
      exc: ['sports', 'match', 'championship', 'game', 'player', 'wicket', 'goal', 'stock market', 'gdp', 'inflation', 'parliament', 'senate', 'election']
    },
    lifestyle: {
      inc: ['lifestyle', 'fashion', 'food', 'decor', 'home', 'recipe', 'recipes', 'cuisine', 'design', 'styling', 'trends', 'beauty', 'wellness'],
      exc: ['sports', 'match', 'championship', 'game', 'player', 'wicket', 'goal', 'stock market', 'gdp', 'inflation', 'parliament', 'senate', 'election']
    },
    law: {
      inc: ['law', 'legal', 'court', 'judge', 'trial', 'attorney', 'lawyer', 'crime', 'criminal', 'police', 'arrest', 'prison', 'jail', 'supreme court', 'lawsuit', 'prosecute', 'prosecution', 'custody'],
      exc: ['sports', 'match', 'championship', 'game', 'player', 'wicket', 'goal', 'movie', 'album', 'box office', 'science', 'planet']
    }
  };

  let targetCat = cat;
  if (cat === 'tech & ai') targetCat = 'tech';
  if (cat === 'law & crime') targetCat = 'law';

  if (cat === 'sports') {
    const matchSports = verifyProfile(fullText, keywords.sports);
    const matchCricket = verifyProfile(fullText, keywords.cricket);
    const matchFootball = verifyProfile(fullText, keywords.football);
    const matchMma = verifyProfile(fullText, keywords.mma);
    return matchSports || matchCricket || matchFootball || matchMma;
  }

  const profile = keywords[targetCat];
  if (!profile) return true;

  return verifyProfile(fullText, profile);
}

function verifyProfile(text, profile) {
  let incCount = 0;
  for (const word of profile.inc) {
    if (text.includes(word)) {
      incCount++;
    }
  }

  let excCount = 0;
  for (const word of profile.exc) {
    if (text.includes(word)) {
      excCount++;
    }
  }

  return incCount >= 1 && (excCount < 2 || excCount < incCount);
}

function NewsSection({ title, fetchUrl, category, autoScroll = false }) {
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['newsSection', fetchUrl],
    queryFn: async () => {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('Fetch failed');
      return res.json();
    },
    refetchInterval: 120000, // automatic refetch every 2 minutes
  });

  const rawArticles = data?.articles || [];
  const articles = useMemo(() => {
    return rawArticles
      .filter((article, index, self) =>
        article.title && index === self.findIndex(a => a.title === article.title)
      )
      .filter(article => verifyArticleCategory(article, category || 'world'));
  }, [rawArticles, category]);

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

  if (isLoading && articles.length === 0) {
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
            ⚠️ Refreshing news...
          </span>
        )}
      </h3>

      {articles.length === 0 && !isLoading ? (
        <div class="py-8 text-center border border-dashed border-paper-border dark:border-paper-borderDark rounded-2xl bg-white/50 dark:bg-black/10">
          <p class="text-xs text-gray-400 font-bold uppercase tracking-wider">
            {category && category.toLowerCase() === 'sports' ? 'No Sports Articles Available' : 'No wire articles available for this section.'}
          </p>
        </div>
      ) : (
        <div class="relative">
          <div 
            ref={scrollRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            class="flex overflow-x-auto gap-5 pb-4 scrollbar-none scroll-smooth"
          >
            {articles.map((article, idx) => (
              <div key={`${article.url}-${idx}`} class="w-[340px] shrink-0">
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
          {/* Subtle fade overlay on the right to make the horizontal scroll cutoff look smooth */}
          <div class="absolute top-0 right-0 bottom-4 w-16 pointer-events-none bg-gradient-to-r from-transparent to-background-light dark:to-background-dark z-10"></div>
        </div>
      )}
    </div>
  );
}

export default function NewsFeed({ activeCategory, searchQuery, triggerRefresh }) {
  const { user, subscription, guestId, userPreferences, addNotification } = useAuth();
  
  const [weather, setWeather] = useState(() => {
    const cached = localStorage.getItem('er_weather_data');
    return cached ? JSON.parse(cached) : null;
  });

  useEffect(() => {
    const handleWeatherUpdate = (e) => {
      setWeather(e.detail);
    };
    window.addEventListener('weather-updated', handleWeatherUpdate);
    return () => window.removeEventListener('weather-updated', handleWeatherUpdate);
  }, []);

  const navigate = (path) => {
    if (path === '/pricing' || path === '/billing') {
      window.dispatchEvent(new CustomEvent('change-view', { detail: 'billing' }));
    } else {
      window.location.href = path;
    }
  };

  const isHomepage = activeCategory.toLowerCase() === 'world' && !searchQuery;
  const currentId = user ? user.uid : localStorage.getItem('guestId');
  const detectedCountry = weather?.country || localStorage.getItem('er_weather_country_pref') || '';
  const warning = null;

  // React Query for recommendations
  const { data: personalizedNewsData, isLoading: loadingPersonalized } = useQuery({
    queryKey: ['personalizedNews', currentId, userPreferences],
    queryFn: async () => {
      try {
        if (!currentId) return [];
        
        const prefDoc = await getDoc(doc(db, 'user_preferences', currentId));
        if (!prefDoc.exists()) return [];

        const scores = prefDoc.data().topicScores || {};
        if (Object.keys(scores).length === 0) return [];

        const topTopics = Object.entries(scores)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([topic]) => topic);

        const getNewsApiUrlForTopic = (topic) => {
          const supportedCategories = ['business', 'entertainment', 'health', 'science', 'sports', 'technology'];
          if (supportedCategories.includes(topic)) {
            return `/api/news?category=${topic}`;
          }
          if (topic === 'world') return `/api/news?category=world`;
          if (topic === 'politics') return `/api/news?q=politics`;
          if (topic === 'finance') return `/api/news?category=business&q=finance`;
          if (topic === 'cricket') return `/api/news?category=sports&q=cricket`;
          if (topic === 'football') return `/api/news?category=sports&q=football`;
          if (topic === 'mma') return `/api/news?category=sports&q=mma`;
          return `/api/news?q=${encodeURIComponent(topic || '')}`;
        };

        const results = await Promise.all(
          topTopics.map(topic => 
            fetch(getNewsApiUrlForTopic(topic))
              .then(r => {
                if (!r.ok) throw new Error('Fetch failed');
                return r.json();
              })
              .then(d => {
                const rawArticles = d.articles || [];
                return rawArticles
                  .filter(art => art && art.title && art.urlToImage)
                  .slice(0, 3)
                  .map(art => ({ ...art, category: topic }));
              })
              .catch(err => {
                console.error(`Error fetching recommendations for ${topic}:`, err);
                return [];
              })
          )
        );

        const combined = results.flat();
        const unique = combined.filter((art, index, self) =>
          art && art.title && index === self.findIndex(a => a && a.title === art.title)
        );

        // Background breaking news trigger
        if (unique.length > 0 && topTopics.length > 0) {
          const topTopic = topTopics[0];
          const url = getNewsApiUrlForTopic(topTopic);
          fetch(url)
            .then(r => r.json())
            .then(data => {
              const latestArticle = data?.articles?.[0];
              if (latestArticle) {
                const storageKey = `last_notified_${currentId}_${topTopic}`;
                const lastNotifiedUrl = localStorage.getItem(storageKey);
                if (lastNotifiedUrl !== latestArticle.url) {
                  localStorage.setItem(storageKey, latestArticle.url);
                  const categoriesList = [
                    { id: 'business', label: 'Business' },
                    { id: 'technology', label: 'Technology' },
                    { id: 'sports', label: 'Sports' },
                    { id: 'politics', label: 'Politics' },
                    { id: 'health', label: 'Health' },
                    { id: 'science', label: 'Science' },
                    { id: 'entertainment', label: 'Entertainment' },
                    { id: 'world', label: 'World News' },
                    { id: 'finance', label: 'Finance' },
                    { id: 'cricket', label: 'Cricket' },
                    { id: 'football', label: 'Football' },
                    { id: 'mma', label: 'MMA' }
                  ];
                  const topicLabel = categoriesList.find(c => c.id === topTopic)?.label || topTopic;
                  addNotification('breaking', `🔴 Breaking: New [${topicLabel}] news for you!`, latestArticle.title, latestArticle.url);
                }
              }
            })
            .catch(e => console.error('Error fetching breaking alert:', e));
        }

        return unique;
      } catch (err) {
        console.error('Error in recommendations queryFn:', err);
        return [];
      }
    },
    enabled: !!currentId && (activeCategory === 'world' || activeCategory === 'foryou'),
  });

  const personalizedNews = personalizedNewsData || [];

  const [loadingMore, setLoadingMore] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [visibleCount, setVisibleCount] = useState(10); // Progressive rendering count

  const INITIAL_CHANNELS = [
    { name: 'Al Jazeera', channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', id: 'UCNye-wNBqNL5ZzHSJj3l8Bg' },
    { name: 'BBC News', channelId: 'UC16niRr50-MSBwiO3YDb3RA', id: 'UC16niRr50-MSBwiO3YDb3RA' },
    { name: 'Sky News', channelId: 'UCoMdktPbSTixAyNGwb-UYkQ', id: 'UCoMdktPbSTixAyNGwb-UYkQ' },
    { name: 'DW News', channelId: 'UCknLrEdhRCp1aegoMqRaCZg', id: 'UCknLrEdhRCp1aegoMqRaCZg' },
    { name: 'NDTV 24x7', channelId: 'UCZFMm1mMw0F81Z37aaEzTUA', id: 'UCZFMm1mMw0F81Z37aaEzTUA' },
    { name: 'Republic World', channelId: 'UCwqusr8YDwM-3mEYTDeJHzw', id: 'UCwqusr8YDwM-3mEYTDeJHzw' }
  ];

  const [liveChannels, setLiveChannels] = useState(INITIAL_CHANNELS);
  const [activeStream, setActiveStream] = useState(INITIAL_CHANNELS[0].id);
  const [isPlayingLive, setIsPlayingLive] = useState(false);

  // Fetch Live YouTube Video IDs
  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        const cached = localStorage.getItem('er_youtube_live_streams_v2');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.channels) && parsed.channels.length > 0 && parsed.timestamp) {
              if (Date.now() - parsed.timestamp < 3600 * 1000 * 6) { // 6 hours TTL
                setLiveChannels(parsed.channels);
                if (parsed.channels[0] && parsed.channels[0].id) {
                  setActiveStream(parsed.channels[0].id);
                }
                return;
              }
            }
          } catch (e) {
            console.error('Error parsing cached live streams:', e);
          }
        }

        const updatedChannels = await Promise.all(INITIAL_CHANNELS.map(async (ch) => {
          try {
            const url = `/api/youtube-live?channelId=${ch.channelId}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.videoId) {
              return { ...ch, id: data.videoId };
            }
          } catch (err) {
            console.error('Failed to fetch live stream for', ch.name, err);
          }
          return ch; // fallback
        }));

        setLiveChannels(updatedChannels);
        setActiveStream(updatedChannels[0].id);
        
        localStorage.setItem('er_youtube_live_streams_v2', JSON.stringify({
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

  // React Query for primary news feed
  const country = activeCategory === 'india' ? 'in' : '';
  const { data: queryArticles, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['feedNews', activeCategory, searchQuery, triggerRefresh],
    queryFn: async () => {
      if (searchQuery) {
        const queryParams = new URLSearchParams();
        queryParams.append('q', searchQuery);
        queryParams.append('page', '1');
        queryParams.append('pageSize', '20');
        const userLang = localStorage.getItem('userLanguage');
        if (userLang) {
          queryParams.append('language', userLang);
        }
        const res = await fetch(`/api/news?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        let fetched = data.articles || [];
        fetched = fetched.filter(article => article.urlToImage && article.urlToImage.startsWith('http'));
        return removeDuplicates(fetched.map(article => ({ ...article, category: activeCategory })));
      } else {
        const fetched = await fetchNews(activeCategory, country);
        return removeDuplicates(fetched.map(article => ({ ...article, category: activeCategory })));
      }
    },
    enabled: !isHomepage && activeCategory !== 'foryou',
  });

  const articles = queryArticles || [];
  const error = queryError ? 'Refreshing news...' : null;

  const feedArticles = activeCategory === 'foryou' ? personalizedNews : articles;
  const hasMore = visibleCount < feedArticles.length;
  
  const trendingNews = useMemo(() => feedArticles.slice(0, 5), [feedArticles]);
  const latestNews = useMemo(() => {
    let sliced = feedArticles.filter(a => a.urlToImage).slice(5, 10);
    if (sliced.length === 0) {
      sliced = feedArticles.filter(a => a.urlToImage).slice(0, 5);
    }
    return sliced;
  }, [feedArticles]);

  // Reset pagination/slicing count when filters/category changes
  useEffect(() => {
    setVisibleCount(10);
    setTimeLeft(120);
  }, [activeCategory, searchQuery, triggerRefresh]);

  // 120 Seconds Auto-Refresh Timer
  useEffect(() => {
    if (isHomepage) return;
    setTimeLeft(120);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          refetch();
          setVisibleCount(10);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCategory, searchQuery, isHomepage, refetch]);

  // Infinite Scroll Observer for local progressive rendering
  useEffect(() => {
    if (loading || loadingMore || !hasMore || feedArticles.length === 0 || isHomepage) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setLoadingMore(true);
        setTimeout(() => {
          setVisibleCount(prev => prev + 10);
          setLoadingMore(false);
        }, 200);
      }
    }, { threshold: 0.5 });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, feedArticles.length, isHomepage]);

  const getFeedTitle = () => {
    if (searchQuery) {
      return `SEARCH ARCHIVE: "${searchQuery}"`;
    }
    const catTitles = {
      foryou: 'RECOMMENDED FOR YOU',
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
      <div class="hidden lg:block glass-card p-5 rounded-3xl mb-8 border border-white/5 bg-white/5 dark:bg-black/20 backdrop-blur-md">
        <div class="flex flex-col md:flex-row gap-6 items-stretch">
          {/* Player Container */}
          <div class="w-full md:w-[280px] shrink-0 aspect-video rounded-2xl overflow-hidden bg-black border border-gray-200 dark:border-white/10 relative shadow-lg">
            {!isPlayingLive && (
              <div 
                class="absolute inset-0 flex items-center justify-center bg-black/40 z-10 cursor-pointer"
                onClick={() => setIsPlayingLive(true)}
              >
                <div class="bg-red-655 hover:bg-red-700 rounded-full p-3 hover:scale-105 transition-all shadow-lg flex items-center justify-center">
                  <Play size={24} class="text-white ml-0.5" />
                </div>
              </div>
            )}
            <iframe 
              src={activeStream && activeStream.startsWith('UC')
                ? `https://www.youtube.com/embed/live_stream?channel=${activeStream}&autoplay=${isPlayingLive ? 1 : 0}&mute=1&playsinline=1&rel=0`
                : `https://www.youtube.com/embed/${activeStream}?autoplay=${isPlayingLive ? 1 : 0}&mute=1&playsinline=1&rel=0`
              }
              title="Live Broadcast"
              class="absolute top-0 left-0 w-full h-full border-0"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              muted={true}
              loading="lazy"
            ></iframe>
          </div>

          {/* Info & Selectors */}
          <div class="flex-grow flex flex-col justify-between py-1 text-left">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <h4 class="font-display text-[10px] font-black uppercase text-red-500 tracking-wider">
                  Live Satellite Broadcast Desk
                </h4>
                <span class="text-[8px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full uppercase">
                  Sat Feed
                </span>
              </div>
              
              <h3 class="font-display text-base font-black text-navy dark:text-gold uppercase tracking-tight mb-1">
                Now Monitoring: {(Array.isArray(liveChannels) ? liveChannels : []).find(c => c && c.id === activeStream)?.name || 'Live Broadcast'}
              </h3>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-serif line-clamp-2 max-w-2xl">
                Direct satellite feed compiled for macro intelligence monitoring. Switch channels below to monitor real-time broadcasts.
              </p>
            </div>

            <div class="grid grid-cols-6 gap-2 mt-4">
              {Array.isArray(liveChannels) && liveChannels.map((stream) => {
                if (!stream) return null;
                const isSelected = activeStream === stream.id;
                return (
                  <button
                    key={stream.channelId || stream.id}
                    onClick={() => setActiveStream(stream.id)}
                    class={`py-2 px-1.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider text-center transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-purple-glow scale-105 border border-primary-glow/30'
                        : 'bg-gray-100 dark:bg-white/5 text-navy dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {stream.name ? stream.name.replace(' English', '').replace(' Live', '') : 'Channel'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleResearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!researchInput.trim()) return;
    const topic = researchInput.trim();
    if (window.gtag) {
      window.gtag('event', 'compile_research', {
        research_topic: topic
      });
    }
    setActiveResearchTopic(topic);
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
          onClick={() => refetch()}
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
                {feedArticles.length} Bulletins
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

      {/* Main Layout Area */}
      {isHomepage ? (
        <div>
          {renderLiveTV()}
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Middle: News Sections (Home) */}
            <div class="col-span-1 lg:col-span-2 space-y-6">
              {activeCategory === 'foryou' ? (
                personalizedNews.length === 0 ? (
                  <div class="text-center py-16 border border-dashed border-paper-border dark:border-paper-borderDark rounded bg-white dark:bg-paper-cardDark">
                    <Sparkles size={40} class="mx-auto text-gold mb-3 animate-pulse" />
                    <h3 class="font-serif text-xl font-bold text-navy dark:text-white mb-1 uppercase">Recommendation Profile Empty</h3>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mb-6">Choose your favorite topics to compile your personalized intelligence wire.</p>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-interest-modal'))}
                      class="px-5 py-2.5 bg-gold text-[#0A1628] hover:scale-105 transition-all text-xs font-black uppercase tracking-wider rounded-full shadow"
                    >
                      Select Interests
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <ArticleCard article={personalizedNews[0]} isLead={true} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {personalizedNews.slice(1).map((article, idx) => (
                        <ArticleCard key={`${article.url}-${idx}`} article={article} />
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div class="space-y-2">
                  {/* Homepage Personalized Section (Step 4) */}
                  {personalizedNews.length > 0 && (
                    <section className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-gold/10 via-[#0A1628]/10 to-gold/5 border border-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.05)] relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gold/5 blur-2xl pointer-events-none"></div>
                      <h2 className="font-display text-xl md:text-2xl font-black tracking-tight text-gold uppercase mb-1 flex items-center gap-2">
                        ⭐ Your Personalized Feed
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-6">
                        Based on your reading history
                      </p>
                      <div className="relative">
                        <div className="flex overflow-x-auto gap-5 pb-4 scrollbar-none scroll-smooth">
                          {personalizedNews.map((article, i) => (
                            <div key={i} className="w-[340px] shrink-0">
                              <ArticleCard article={article} />
                            </div>
                          ))}
                        </div>
                        {/* Subtle fade overlay on the right to make the horizontal scroll cutoff look smooth */}
                        <div class="absolute top-0 right-0 bottom-4 w-16 pointer-events-none bg-gradient-to-r from-transparent to-background-light dark:to-background-dark z-10"></div>
                      </div>
                    </section>
                  )}
                  {detectedCountry && (
                    <NewsSection 
                      title="News from Your Region" 
                      category="world"
                      fetchUrl={`/api/news?country=${detectedCountry}&pageSize=8${localStorage.getItem('userLanguage') ? `&language=${localStorage.getItem('userLanguage')}` : ''}`} 
                    />
                  )}
                  <NewsSection title="World News" category="world" fetchUrl={`/api/news?category=world&pageSize=8${localStorage.getItem('userLanguage') ? `&language=${localStorage.getItem('userLanguage')}` : ''}`} />
                  <NewsSection title="India News" category="india" fetchUrl={`/api/news?category=india&pageSize=8${localStorage.getItem('userLanguage') ? `&language=${localStorage.getItem('userLanguage')}` : ''}`} />
                  <NewsSection title="Business News" category="business" fetchUrl={`/api/news?category=business&pageSize=8${localStorage.getItem('userLanguage') ? `&language=${localStorage.getItem('userLanguage')}` : ''}`} />
                  <NewsSection title="Technology News" category="tech" fetchUrl={`/api/news?category=tech&pageSize=8${localStorage.getItem('userLanguage') ? `&language=${localStorage.getItem('userLanguage')}` : ''}`} />
                  <NewsSection title="Sports News" category="sports" fetchUrl={`/api/news?category=sports&pageSize=8${localStorage.getItem('userLanguage') ? `&language=${localStorage.getItem('userLanguage')}` : ''}`} />
                  <NewsSection title="Health News" category="health" fetchUrl={`/api/news?category=health&pageSize=8${localStorage.getItem('userLanguage') ? `&language=${localStorage.getItem('userLanguage')}` : ''}`} />
                  <NewsSection title="Science News" category="science" fetchUrl={`/api/news?category=science&pageSize=8${localStorage.getItem('userLanguage') ? `&language=${localStorage.getItem('userLanguage')}` : ''}`} />
                  <NewsSection title="Entertainment News" category="entertainment" fetchUrl={`/api/news?category=entertainment&pageSize=8${localStorage.getItem('userLanguage') ? `&language=${localStorage.getItem('userLanguage')}` : ''}`} />
                </div>
              )}
            </div>
            {/* Right Side: Research Desk & Side Panel */}
            <div class="col-span-1 space-y-6">
              {renderResearchDesk()}
              {isHomepage && <OutcomeTrackerWidget />}
              {isHomepage && <EconomicTrendsWidget />}
              {renderSidePanel()}
              <div class="sticky top-6 space-y-6">
                <TrendingWidget />
                <MarketSignalsWidget />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Category / Search Feed
        <div className="main-content-wrapper">
          <div className="news-feed-main">
            {activeCategory === 'foryou' && personalizedNews.length === 0 ? (
              <div class="text-center py-16 border border-dashed border-paper-border dark:border-paper-borderDark rounded bg-white dark:bg-paper-cardDark">
                <Sparkles size={40} class="mx-auto text-gold mb-3 animate-pulse" />
                <h3 class="font-serif text-xl font-bold text-navy dark:text-white mb-1 uppercase">Recommendation Profile Empty</h3>
                <p class="text-xs text-gray-400 dark:text-gray-500 mb-6">Choose your favorite topics to compile your personalized intelligence wire.</p>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-interest-modal'))}
                  class="px-5 py-2.5 bg-gold text-[#0A1628] hover:scale-105 transition-all text-xs font-black uppercase tracking-wider rounded-full shadow"
                >
                  Select Interests
                </button>
              </div>
            ) : feedArticles.length === 0 ? (
              <div class="text-center py-16 border border-dashed border-paper-border dark:border-paper-borderDark rounded bg-white dark:bg-paper-cardDark">
                <Newspaper size={40} class="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                <h3 class="font-serif text-xl font-bold text-navy dark:text-white mb-1">
                  {activeCategory && activeCategory.toLowerCase() === 'sports' ? 'No Sports Articles Available' : 'Archive Clean'}
                </h3>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  {activeCategory && activeCategory.toLowerCase() === 'sports' 
                    ? 'No sports-related articles are currently available in the editorial desk.' 
                    : 'No wire articles match the current filter parameters.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {visibleCount > 0 && feedArticles.length > 0 && (
                  <ArticleCard article={feedArticles[0]} isLead={true} />
                )}
                
                {visibleCount > 1 && feedArticles.length > 1 && (
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {feedArticles.slice(1, Math.min(5, visibleCount)).map((article, idx) => (
                      <ArticleCard key={`${article.url}-${idx}`} article={article} />
                    ))}
                  </div>
                )}
                
                {visibleCount > 5 && feedArticles.length > 5 && (
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {feedArticles.slice(5, visibleCount).map((article, idx) => (
                      <ArticleCard key={`${article.url}-${idx + 5}`} article={article} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Loader Element for Infinite Scroll or Load More button */}
            {hasMore && feedArticles.length > 0 && (
              <div ref={loaderRef} class="mt-8 pt-4 border-t border-dashed border-paper-border dark:border-paper-borderDark flex flex-col items-center justify-center">
                {loadingMore ? (
                  <div class="flex items-center gap-2 text-xs font-bold text-navy dark:text-gold uppercase tracking-widest">
                    <Loader size={16} class="animate-spin text-gold" />
                    <span>Loading next page...</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setLoadingMore(true);
                      setTimeout(() => {
                        setVisibleCount(prev => prev + 10);
                        setLoadingMore(false);
                      }, 200);
                    }}
                    class="px-6 py-3 bg-gradient-to-r from-navy to-primary dark:from-white/10 dark:to-white/5 text-white hover:scale-105 text-xs font-bold uppercase tracking-wider rounded-full shadow-3d-light dark:shadow-3d-dark transition-all"
                  >
                    Load More Reports
                  </button>
                )}
              </div>
            )}

            {!hasMore && feedArticles.length > 0 && (
              <div class="mt-12 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest py-4 border-t border-double border-paper-border dark:border-paper-borderDark">
                ✦ End of Editorial Ledger Wire ✦
              </div>
            )}
          </div>

          <aside className="sidebar">
            {/* 1. TRENDING NEWS Section */}
            <div className="sidebar-section">
              <h3>🔥 Trending Now</h3>
              {trendingNews.slice(0, 5).map((article, i) => (
                <a href={article.url} target="_blank" rel="noopener noreferrer" key={i}>
                  <div className="trending-item">
                    <span className="trending-number">{i + 1}</span>
                    <p>{article.title}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* 2. LATEST NEWS Section */}
            <div className="sidebar-section">
              <h3>⚡ Latest Updates</h3>
              {latestNews.slice(0, 5).map((article, i) => (
                <a href={article.url} target="_blank" rel="noopener noreferrer" key={i}>
                  <div className="latest-item">
                    <img src={article.urlToImage} 
                      style={{width:'70px', height:'50px',
                        objectFit:'cover', borderRadius:'4px'}}/>
                    <p>{article.title?.slice(0,60)}...</p>
                  </div>
                </a>
              ))}
            </div>

            {/* 3. WEATHER WIDGET Section */}
            <div className="sidebar-section">
              <h3>🌤️ Weather</h3>
              {weather && (
                <div style={{color: '#fff', fontSize: '13px', lineHeight: '1.6'}}>
                  <p style={{fontWeight: 'bold', fontSize: '15px'}}>{weather.city}</p>
                  <p style={{fontSize: '24px', fontWeight: '900', color: '#F4A726', margin: '4px 0'}}>{weather.temp}°C</p>
                  <p style={{textTransform: 'capitalize'}}>{weather.description}</p>
                </div>
              )}
            </div>

            {/* 4. FOLLOW US Section */}
            <div className="sidebar-section">
              <h3>Follow Us</h3>
              <a href="https://x.com/ERNewsDesk" 
                target="_blank" rel="noopener noreferrer"
                style={{display: 'block', color: '#fff', fontSize: '13px', margin: '6px 0', textDecoration: 'none', transition: 'color 0.2s'}}
                onMouseOver={(e) => e.target.style.color = '#F4A726'}
                onMouseOut={(e) => e.target.style.color = '#fff'}
              >X (Twitter)</a>
              <a href="https://www.instagram.com/economical.research"
                target="_blank" rel="noopener noreferrer"
                style={{display: 'block', color: '#fff', fontSize: '13px', margin: '6px 0', textDecoration: 'none', transition: 'color 0.2s'}}
                onMouseOver={(e) => e.target.style.color = '#F4A726'}
                onMouseOut={(e) => e.target.style.color = '#fff'}
              >Instagram</a>
            </div>

            {/* 5. SUBSCRIBE Section */}
            <div className="sidebar-section">
              <h3>📰 Go PRO</h3>
              <p style={{color: '#fff', fontSize: '12px', lineHeight: '1.4', marginBottom: '12px'}}>
                Unlimited AI features, ad-free experience and more!
              </p>
              <button 
                onClick={() => navigate('/pricing')}
                style={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #F4A726, #e09015)',
                  color: '#0A1628',
                  fontWeight: '800',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, opacity 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.opacity = '0.9';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.opacity = '1';
                }}
              >
                Upgrade to PRO
              </button>
            </div>
          </aside>
        </div>
      )}

      {isResearchOpen && (
        <ResearchMode topic={activeResearchTopic} onClose={() => setIsResearchOpen(false)} />
      )}
    </div>
  );
}

function TrendingWidget() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`/api/news?category=world&pageSize=8`);
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        const raw = data.articles || [];
        const filtered = raw
          .filter((a, index, self) => 
            a.title && 
            a.urlToImage && 
            index === self.findIndex(item => item.title === a.title)
          )
          .slice(0, 5);
        setArticles(filtered);
      } catch (err) {
        console.error('Error fetching trending news:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div class="glass-card p-5 rounded-3xl text-left border border-white/5 bg-white/5 dark:bg-black/20 backdrop-blur-md">
      <div class="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 mb-4">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
          <h3 class="font-display text-xs font-black text-navy dark:text-gold uppercase tracking-wider">
            Trending Dispatch Wire
          </h3>
        </div>
        <span class="text-[9px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full">HOT</span>
      </div>

      {loading ? (
        <div class="space-y-3.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} class="flex gap-3 items-center">
              <div class="w-12 h-12 rounded-xl bg-gray-205 dark:bg-gray-800 animate-shimmer shrink-0"></div>
              <div class="flex-grow space-y-2">
                <div class="h-3 w-5/6 rounded bg-gray-205 dark:bg-gray-800 animate-shimmer"></div>
                <div class="h-2 w-1/3 rounded bg-gray-250 dark:bg-gray-800 animate-shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p class="text-[10px] text-gray-400 text-center py-4 font-sans">No trending news available right now.</p>
      ) : (
        <div class="space-y-3.5">
          {articles.map((article, index) => {
            const timeAgo = article.publishedAt
              ? `${Math.max(1, Math.round((Date.now() - new Date(article.publishedAt).getTime()) / 3600000))}h ago`
              : 'Recent';
            
            return (
              <a
                key={`${article.url}-${index}`}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                class="flex gap-3 items-center group/item hover:bg-gray-50 dark:hover:bg-white/5 p-1.5 -m-1.5 rounded-2xl transition-all"
              >
                <img
                  src={article.urlToImage}
                  alt=""
                  class="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100 dark:border-white/5 group-hover/item:scale-105 transition-transform"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div class="min-w-0 flex-grow">
                  <h4 class="text-navy dark:text-white text-[11.5px] font-bold leading-snug group-hover/item:text-primary dark:group-hover/item:text-gold transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                  <div class="flex items-center gap-1.5 mt-1 text-[8.5px] font-mono text-gray-400 uppercase font-semibold">
                    <span class="truncate">{article.source?.name || 'Wire'}</span>
                    <span>•</span>
                    <span>{timeAgo}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EconomicTrendsWidget() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const themeIsDark = document.documentElement.classList.contains('dark');
    const gridColor = themeIsDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = themeIsDark ? '#9CA3AF' : '#4B5563';

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['2020', '2021', '2022', '2023', '2024', '2025', '2026 (Est)'],
        datasets: [
          {
            label: 'US GDP Growth (%)',
            data: [-3.4, 5.7, 2.1, 2.5, 2.7, 2.0, 1.8],
            borderColor: '#F4A726', // Gold
            backgroundColor: 'rgba(244, 167, 38, 0.1)',
            borderWidth: 2,
            tension: 0.35,
            fill: true
          },
          {
            label: 'India GDP Growth (%)',
            data: [-6.6, 8.7, 7.2, 7.0, 7.8, 7.2, 6.8],
            borderColor: '#4CAF50', // Green
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 2,
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor,
              font: { family: 'Inter, sans-serif', size: 9, weight: 'bold' }
            }
          },
          tooltip: {
            backgroundColor: themeIsDark ? '#0A1628' : '#FFFFFF',
            titleColor: themeIsDark ? '#FFFFFF' : '#0A1628',
            bodyColor: '#F4A726',
            borderColor: 'rgba(244, 167, 38, 0.3)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 9 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 9 } }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  return (
    <div class="glass-card p-5 rounded-3xl text-left border border-white/5 bg-white/5 dark:bg-black/20 backdrop-blur-md">
      <div class="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 mb-4">
        <h3 class="font-display text-xs font-black text-navy dark:text-gold uppercase tracking-wider">
          📈 Economic Trend Outlook
        </h3>
        <span class="text-[9px] font-mono font-bold text-gray-405 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full font-bold">ANNUAL</span>
      </div>
      <div style={{ height: '180px', position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

function MarketSignalsWidget() {
  const signals = [
    { name: 'S&P 500', value: '5,472.45', change: '+0.65%', isPositive: true },
    { name: 'US Dollar Index (DXY)', value: '104.18', change: '-0.15%', isPositive: false },
    { name: 'Gold Spot (oz)', value: '$2,364.80', change: '+1.45%', isPositive: true },
    { name: 'Brent Crude', value: '$81.95', change: '-0.78%', isPositive: false },
    { name: 'Bitcoin (BTC)', value: '$68,450', change: '+3.12%', isPositive: true },
    { name: '10Y US Treasury', value: '4.22%', change: '+0.05%', isPositive: true }
  ];

  return (
    <div class="glass-card p-5 rounded-3xl text-left border border-white/5 bg-white/5 dark:bg-black/20 backdrop-blur-md">
      <div class="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 mb-4">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <h3 class="font-display text-xs font-black text-navy dark:text-gold uppercase tracking-wider">
            Global Market Signals
          </h3>
        </div>
        <span class="text-[9px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full">REALTIME</span>
      </div>

      <div class="grid grid-cols-2 gap-3">
        {signals.map((sig, i) => (
          <div key={i} class="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-gold/30 dark:hover:border-gold/30 transition-all duration-300">
            <span class="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block mb-1 truncate">{sig.name}</span>
            <div class="flex justify-between items-baseline gap-1">
              <span class="text-[11px] font-bold text-navy dark:text-white font-mono">{sig.value}</span>
              <span class={`text-[8.5px] font-bold font-mono ${sig.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {sig.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OutcomeTrackerWidget() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWidgetStories = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'tracked_stories'), orderBy('updatedAt', 'desc'), limit(3)));
        const list = [];
        snap.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setStories(list);
      } catch (err) {
        console.error('Error fetching widget stories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWidgetStories();
  }, []);

  const getStatusColor = (stage) => {
    if (stage === 'completed') return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (stage === 'failed') return 'text-red-500 bg-red-500/10 border-red-500/20';
    return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
  };

  return (
    <div class="glass-card p-5 rounded-3xl">
      <div class="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 mb-4">
        <div class="flex items-center gap-2">
          <ClipboardList size={14} class="text-gold" />
          <h3 class="font-display text-sm font-black text-navy dark:text-gold uppercase tracking-wider">
            Promise Outcome Tracker
          </h3>
        </div>
        <span class="text-[9px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full">AUDIT</span>
      </div>

      {loading ? (
        <div class="flex items-center justify-center py-6 text-xs text-gray-400 gap-1.5">
          <Loader size={12} class="animate-spin text-gold" />
          <span>Compiling audits...</span>
        </div>
      ) : stories.length === 0 ? (
        <p class="text-[10px] text-gray-400 text-center py-4 font-sans">No announcements currently tracked.</p>
      ) : (
        <div class="space-y-3">
          {stories.map(story => (
            <div
              key={story.id}
              onClick={() => window.dispatchEvent(new CustomEvent('change-view-detail', { detail: story.id }))}
              class="group rounded-xl p-3 border border-white/5 cursor-pointer hover:border-yellow-400/20 transition-all text-left"
              style={{ background: 'rgba(255,255,255,0.01)' }}
            >
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <span class="text-[8px] font-bold text-yellow-400/80 uppercase tracking-wide truncate">{story.category}</span>
                <span class={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${getStatusColor(story.currentStage)}`}>
                  {story.currentStage}
                </span>
              </div>
              <h4 class="text-white text-[11.5px] font-bold leading-snug group-hover:text-yellow-300 transition-colors line-clamp-2">
                {story.title}
              </h4>
            </div>
          ))}
          
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: 'outcome-tracker' }))}
            class="w-full mt-2 flex items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wider text-yellow-400 hover:text-yellow-300 transition-colors border border-dashed border-white/10 hover:border-yellow-400/25 rounded-xl bg-white/5"
          >
            <span>View Full Audit Ledger</span>
            <ArrowRight size={10} />
          </button>
        </div>
      )}
    </div>
  );
}
