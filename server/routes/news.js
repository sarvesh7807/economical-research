import express from 'express';
import axios from 'axios';
import Parser from 'rss-parser';

const router = express.Router();

const parser = new Parser({
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
});

const NEWS_API_BASE = 'https://newsapi.org/v2';
const getNewsApiKey = () => process.env.NEWS_API_KEY || '6f075b0f9ff24eff9cebc5eb569e4731';

const RSS_FEEDS = {
  BBC: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  Reuters: 'https://news.google.com/rss/search?q=source:Reuters&hl=en-US&gl=US&ceid=US:en',
  AlJazeera: 'https://www.aljazeera.com/xml/rss/all.xml',
  TheHindu: 'https://www.thehindu.com/feeder/default.rss',
  TechCrunch: 'https://techcrunch.com/feed/',
  ESPN: 'https://www.espn.com/espn/rss/news'
};

// Map all 16 categories to relevant RSS feeds
const getRSSFeedsForCategory = (category) => {
  const cat = category.toLowerCase();
  switch (cat) {
    case 'world':
    case 'politics':
      return [
        { name: 'BBC News', url: RSS_FEEDS.BBC },
        { name: 'Reuters', url: RSS_FEEDS.Reuters },
        { name: 'Al Jazeera', url: RSS_FEEDS.AlJazeera }
      ];
    case 'india':
      return [
        { name: 'The Hindu', url: RSS_FEEDS.TheHindu },
        { name: 'Reuters', url: RSS_FEEDS.Reuters }
      ];
    case 'tech':
    case 'tech & ai':
      return [{ name: 'TechCrunch', url: RSS_FEEDS.TechCrunch }];
    case 'business':
    case 'finance':
      return [{ name: 'Reuters', url: RSS_FEEDS.Reuters }];
    case 'sports':
      return [{ name: 'ESPN', url: RSS_FEEDS.ESPN }];
    case 'entertainment':
    case 'lifestyle':
      return [
        { name: 'BBC News', url: RSS_FEEDS.BBC },
        { name: 'Al Jazeera', url: RSS_FEEDS.AlJazeera }
      ];
    case 'science':
    case 'health':
    case 'environment':
    case 'education':
    case 'travel':
    case 'law & crime':
    case 'research':
      return [
        { name: 'BBC News', url: RSS_FEEDS.BBC },
        { name: 'Reuters', url: RSS_FEEDS.Reuters }
      ];
    default:
      return [
        { name: 'BBC News', url: RSS_FEEDS.BBC },
        { name: 'Reuters', url: RSS_FEEDS.Reuters }
      ];
  }
};

// Map all 16 categories to NewsAPI query mappings
const mapCategoryToQuery = (category) => {
  const cat = category.toLowerCase();
  switch (cat) {
    case 'world':
      return { endpoint: 'top-headlines', params: { country: 'us' } };
    case 'india':
      return { endpoint: 'top-headlines', params: { country: 'in' } };
    case 'politics':
      return { endpoint: 'everything', params: { q: 'politics', language: 'en', sortBy: 'publishedAt' } };
    case 'tech':
    case 'tech & ai':
      return { endpoint: 'top-headlines', params: { category: 'technology', language: 'en' } };
    case 'business':
      return { endpoint: 'top-headlines', params: { category: 'business', language: 'en' } };
    case 'finance':
      return { endpoint: 'everything', params: { q: 'finance OR economics OR markets OR wall-street', language: 'en', sortBy: 'relevance' } };
    case 'sports':
      return { endpoint: 'top-headlines', params: { category: 'sports', language: 'en' } };
    case 'entertainment':
      return { endpoint: 'top-headlines', params: { category: 'entertainment', language: 'en' } };
    case 'science':
      return { endpoint: 'top-headlines', params: { category: 'science', language: 'en' } };
    case 'health':
      return { endpoint: 'top-headlines', params: { category: 'health', language: 'en' } };
    case 'environment':
      return { endpoint: 'everything', params: { q: 'environment OR climate OR green-energy OR recycling', language: 'en', sortBy: 'relevance' } };
    case 'education':
      return { endpoint: 'everything', params: { q: 'education OR university OR learning OR schools', language: 'en', sortBy: 'relevance' } };
    case 'travel':
      return { endpoint: 'everything', params: { q: 'travel OR tourism OR airlines OR hotels', language: 'en', sortBy: 'relevance' } };
    case 'lifestyle':
      return { endpoint: 'everything', params: { q: 'lifestyle OR food OR fashion OR home-decor', language: 'en', sortBy: 'relevance' } };
    case 'law & crime':
      return { endpoint: 'everything', params: { q: 'law OR crime OR police OR court OR judge', language: 'en', sortBy: 'publishedAt' } };
    case 'research':
      return { endpoint: 'everything', params: { q: 'scientific research OR breakthrough OR innovation OR academia', language: 'en', sortBy: 'publishedAt' } };
    default:
      return { endpoint: 'top-headlines', params: { country: 'us' } };
  }
};

const parseRSSFeed = async (feedName, url) => {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map(item => {
      let imageUrl = null;
      if (item.enclosure && item.enclosure.url) {
        imageUrl = item.enclosure.url;
      } else if (item.content) {
        const match = item.content.match(/<img[^>]+src="([^">]+)"/);
        if (match) imageUrl = match[1];
      }

      if (!imageUrl) {
        const fallbacks = {
          'BBC News': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600',
          'Reuters': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600',
          'Al Jazeera': 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=600',
          'The Hindu': 'https://images.unsplash.com/photo-1532375811409-90d165c859d0?q=80&w=600',
          'TechCrunch': 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600',
          'ESPN': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600'
        };
        imageUrl = fallbacks[feedName] || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600';
      }

      return {
        title: item.title,
        description: item.contentSnippet || item.summary || item.content || '',
        content: item.content || item.contentSnippet || '',
        source: { name: feedName },
        author: item.creator || item.author || feedName,
        url: item.link,
        urlToImage: imageUrl,
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString()
      };
    });
  } catch (error) {
    console.error(`Error parsing RSS feed ${feedName}:`, error.message);
    return [];
  }
};

// In-Memory cache (5 min TTL)
const feedCache = {};
const CACHE_EXPIRY = 5 * 60 * 1000;

const getCachedFeed = (key) => {
  const cached = feedCache[key];
  if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY)) {
    return cached.data;
  }
  return null;
};

const setCachedFeed = (key, data) => {
  feedCache[key] = {
    timestamp: Date.now(),
    data
  };
};

router.get('/', async (req, res) => {
  const { category = 'world', q = '', page = 1, pageSize = 20, country, language } = req.query;
  const apiKey = getNewsApiKey();
  const pageNum = parseInt(page, 10) || 1;
  const pageSizeNum = parseInt(pageSize, 10) || 20;

  const langCode = language ? language.toLowerCase() : 'en';
  const cacheKey = country
    ? `country_${country.toLowerCase()}_lang_${langCode}`
    : (q ? `search_${q.toLowerCase()}_lang_${langCode}` : `cat_${category.toLowerCase()}_lang_${langCode}`);
  let aggregatedArticles = getCachedFeed(cacheKey);

  if (!aggregatedArticles) {
    let newsApiArticles = [];
    if (apiKey && !apiKey.includes('YAHAN')) {
      try {
        if (country) {
          const response = await axios.get(`${NEWS_API_BASE}/top-headlines`, {
            params: {
              apiKey,
              country: country.toLowerCase(),
              pageSize: 60
            }
          });
          newsApiArticles = response.data.articles || [];
        } else if (q) {
          const response = await axios.get(`${NEWS_API_BASE}/everything`, {
            params: {
              apiKey,
              q,
              language: langCode,
              sortBy: 'relevance',
              pageSize: 80
            }
          });
          newsApiArticles = response.data.articles || [];
        } else {
          if (langCode !== 'en' && category.toLowerCase() === 'world') {
            // Fetch top-headlines in the target language
            const response = await axios.get(`${NEWS_API_BASE}/top-headlines`, {
              params: {
                apiKey,
                language: langCode,
                pageSize: 60
              }
            });
            newsApiArticles = response.data.articles || [];
          } else if (category.toLowerCase() === 'world') {
            const [usRes, gbRes, auRes] = await Promise.all([
              axios.get(`${NEWS_API_BASE}/top-headlines`, { params: { apiKey, country: 'us', pageSize: 30 } }).catch(() => ({ data: { articles: [] } })),
              axios.get(`${NEWS_API_BASE}/top-headlines`, { params: { apiKey, country: 'gb', pageSize: 20 } }).catch(() => ({ data: { articles: [] } })),
              axios.get(`${NEWS_API_BASE}/top-headlines`, { params: { apiKey, country: 'au', pageSize: 20 } }).catch(() => ({ data: { articles: [] } }))
            ]);
            newsApiArticles = [
              ...(usRes.data.articles || []),
              ...(gbRes.data.articles || []),
              ...(auRes.data.articles || [])
            ];
          } else {
            const mapping = mapCategoryToQuery(category);
            const params = {
              apiKey,
              ...mapping.params,
              pageSize: 60
            };
            if (!params.country) {
              params.language = langCode;
            }
            const response = await axios.get(`${NEWS_API_BASE}/${mapping.endpoint}`, { params });
            newsApiArticles = response.data.articles || [];
          }
        }
      } catch (apiErr) {
        console.error('NewsAPI fetch error in route:', apiErr.message);
      }
    }

    // Parse RSS
    let rssArticles = [];
    if (q) {
      const searchRssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
      try {
        const searchResults = await parseRSSFeed(`Google News: ${q}`, searchRssUrl);
        rssArticles = searchResults || [];
      } catch (err) {
        console.error('RSS Search Fetch Error:', err.message);
      }
    } else {
      const feeds = getRSSFeedsForCategory(country ? 'world' : category);
      const parsePromises = feeds.map(feed => parseRSSFeed(feed.name, feed.url));
      const parsedResults = await Promise.all(parsePromises);
      rssArticles = parsedResults.flat();
    }

    let rawMerged = [...newsApiArticles, ...rssArticles];
    
    let cleaned = [];
    const seenUrls = new Set();

    const filterAndClean = (list) => {
      return list.filter(article => {
        if (!article.title || article.title === '[Removed]') return false;
        if (seenUrls.has(article.url)) return false;
        if (!verifyArticleCategory(article, country ? 'world' : category)) return false;
        seenUrls.add(article.url);
        return true;
      });
    };

    cleaned = filterAndClean(rawMerged);

    // Fallback to mock data ONLY if everything else fails or is filtered out
    if (cleaned.length === 0) {
      const mocks = getMockArticles(country ? 'world' : category, q);
      cleaned = filterAndClean(mocks);
    }

    cleaned.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    aggregatedArticles = cleaned;
    setCachedFeed(cacheKey, aggregatedArticles);
  }

  const startIdx = (pageNum - 1) * pageSizeNum;
  const slicedArticles = aggregatedArticles.slice(startIdx, startIdx + pageSizeNum);

  res.json({
    status: 'ok',
    articles: slicedArticles,
    totalResults: aggregatedArticles.length,
    page: pageNum,
    pageSize: pageSizeNum
  });
});

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

// Helper for Mock Articles
function getMockArticles(category, query) {
  const mockPools = {
    sports: [
      {
        title: "Champions League Thriller: Real Madrid Clinches Victory with Late Goal",
        description: "A dramatic 90th-minute striker goal seals a historic win in the European championship tournament.",
        content: "The match was locked in a tense struggle until a brilliant pass found the striker in the box...",
        source: { name: "ESPN Football" },
        author: "Marcus Vance",
        url: "https://example.com/champions-league-win",
        urlToImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600",
        publishedAt: new Date().toISOString()
      },
      {
        title: "Virat Kohli Smashes Record Century to Lead India to Triumph",
        description: "An incredible batting performance in the cricket world cup match seals a dominant victory over rivals.",
        content: "Kohli displayed masterclass batting, scoring runs all over the pitch and hitting multiple boundaries...",
        source: { name: "Cricinfo Desk" },
        author: "Rohan Sharma",
        url: "https://example.com/kohli-century",
        urlToImage: "https://images.unsplash.com/photo-1532375811409-90d165c859d0?q=80&w=600",
        publishedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        title: "Formula 1: Monaco Grand Prix Highlights Epic Driver Rivalry",
        description: "A flawless race by the championship leader secures first place on the iconic street circuit.",
        content: "The driver defended the pole position from start to finish, navigating the narrow streets with precision...",
        source: { name: "F1 Chronicle" },
        author: "Sarah Jenkins",
        url: "https://example.com/f1-monaco",
        urlToImage: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=600",
        publishedAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        title: "UFC Championship: Title Fight Decided in Intense Five-Round Battle",
        description: "The featherweight champion retains the title in a spectacular MMA matchup.",
        content: "Both fighters went the distance, showcasing elite striking and wrestling in the octagon...",
        source: { name: "MMA Weekly" },
        author: "Helena Rostova",
        url: "https://example.com/ufc-title-fight",
        urlToImage: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600",
        publishedAt: new Date(Date.now() - 10800000).toISOString()
      }
    ],
    tech: [
      {
        title: "AI Breakthrough: Next-Generation Language Models Unveiled",
        description: "Developers release highly efficient software models performing complex logical reasoning tasks.",
        content: "The new architecture reduces computational requirements while excelling at programming and logic...",
        source: { name: "TechCrunch" },
        author: "Marcus Vance",
        url: "https://example.com/ai-software-breakthrough",
        urlToImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600",
        publishedAt: new Date().toISOString()
      },
      {
        title: "Silicon Foundries Scale Up Production to Meet Cybersecurity Demand",
        description: "New semiconductor manufacturing chips introduce hardware-level security protections.",
        content: "Tech manufacturers are shifting towards custom microchips designed for high security cloud databases...",
        source: { name: "Wired" },
        author: "Sarah Jenkins",
        url: "https://example.com/silicon-cybersecurity",
        urlToImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600",
        publishedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    business: [
      {
        title: "Global Supply Chains Stabilize as Corporate Logistical Bottlenecks Ease",
        description: "Manufacturing output increases and corporate retail sales show steady quarterly growth.",
        content: "Logistics companies report faster delivery times and reduced shipping costs across oceans...",
        source: { name: "Business Telegram" },
        author: "Helena Rostova",
        url: "https://example.com/supply-chain-growth",
        urlToImage: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=600",
        publishedAt: new Date().toISOString()
      },
      {
        title: "Venture Capital Funding Surges in Industrial Technology Sectors",
        description: "Startups focused on manufacturing efficiency receive significant private equity investments.",
        content: "Investors are looking for companies that streamline logistics and reduce operational overhead...",
        source: { name: "Bloomberg" },
        author: "Marcus Vance",
        url: "https://example.com/vc-investment",
        urlToImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600",
        publishedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    finance: [
      {
        title: "Global Inflation Eases as Central Banks Review Interest Rate Policy",
        description: "Macroeconomic indicators suggest stabilizing markets in the next fiscal quarter.",
        content: "The federal reserve indicated a potential freeze on rates as economic indicators remain strong...",
        source: { name: "Financial Times" },
        author: "Helena Rostova",
        url: "https://example.com/inflation-rates",
        urlToImage: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=600",
        publishedAt: new Date().toISOString()
      },
      {
        title: "India Projects Strong GDP Growth Driven by Infrastructure Investment",
        description: "The finance ministry outlines ambitious spending plans and monetary policy adjustments.",
        content: "Bond yields remain stable as domestic investments boost the national economy and markets...",
        source: { name: "The Economic Times" },
        author: "Rohan Sharma",
        url: "https://example.com/india-gdp-growth",
        urlToImage: "https://images.unsplash.com/photo-1532375811409-90d165c859d0?q=80&w=600",
        publishedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    politics: [
      {
        title: "Global Leaders Convene for Diplomatic Summit on Trade and Foreign Policy",
        description: "Heads of state debate legislative measures and international security frameworks.",
        content: "The prime minister and president discussed bilateral agreements to stabilize regional security...",
        source: { name: "Reuters Politics" },
        author: "Sarah Jenkins",
        url: "https://example.com/diplomatic-summit",
        urlToImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600",
        publishedAt: new Date().toISOString()
      },
      {
        title: "Parliament Passes Landmark Bill After Lengthy Senate Debate",
        description: "The new legislation outlines regulatory changes for national infrastructure funding.",
        content: "Voters expressed mixed reactions to the policy candidate debates leading up to the election...",
        source: { name: "BBC Parliament" },
        author: "Helena Rostova",
        url: "https://example.com/parliament-bill",
        urlToImage: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=600",
        publishedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    environment: [
      {
        title: "Renewable Energy Capacity Reaches Record Highs in Western Europe",
        description: "Wind and solar power generated more electricity than traditional coal sources.",
        content: "Ecology studies confirm wind and solar generated more than 40% of the continent's power...",
        source: { name: "Reuters Green" },
        author: "Sarah Jenkins",
        url: "https://example.com/renewable-records",
        urlToImage: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=600",
        publishedAt: new Date().toISOString()
      },
      {
        title: "Global Ocean Initiative Targets Waste Reduction and Marine Species Protection",
        description: "Conservation efforts aim to reduce plastic emissions and clean up coastlines.",
        content: "Scientists and researchers announce new measures to protect endangered marine ecosystems...",
        source: { name: "Nature Climate" },
        author: "Marcus Vance",
        url: "https://example.com/ocean-conservation",
        urlToImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600",
        publishedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  };

  const cat = (category || 'world').toLowerCase();
  let pool = [];
  if (['sports', 'cricket', 'football', 'mma'].includes(cat)) {
    pool = mockPools.sports;
  } else if (['tech', 'tech & ai'].includes(cat)) {
    pool = mockPools.tech;
  } else if (cat === 'business') {
    pool = mockPools.business;
  } else if (cat === 'finance') {
    pool = mockPools.finance;
  } else if (cat === 'politics') {
    pool = mockPools.politics;
  } else if (cat === 'environment') {
    pool = mockPools.environment;
  } else {
    pool = [
      ...mockPools.sports,
      ...mockPools.tech,
      ...mockPools.business,
      ...mockPools.finance,
      ...mockPools.politics,
      ...mockPools.environment
    ];
  }

  let filtered = pool;
  if (query) {
    const qLower = query.toLowerCase();
    filtered = pool.filter(art => art.title.toLowerCase().includes(qLower) || art.description.toLowerCase().includes(qLower));
    if (filtered.length === 0) {
      filtered = pool;
    }
  }

  const replicated = [];
  for (let i = 0; i < 90; i++) {
    const original = filtered[i % filtered.length] || pool[0];
    replicated.push({
      ...original,
      title: `${original.title} [Wire Bulletin #${i + 1} - ${category.toUpperCase()}]`,
      url: `${original.url}?id=${i + 1}&cat=${category}`,
      publishedAt: new Date(Date.now() - i * 12 * 60 * 1000).toISOString()
    });
  }
  return replicated;
}

// WORLD MAP: Proxy NewsAPI top-headlines by country code (bypasses browser CORS)
router.get('/country-headlines', async (req, res) => {
  const { country, q } = req.query;
  if (!country || country.length !== 2) {
    return res.status(400).json({ error: 'Valid 2-letter country code required', articles: [] });
  }

  const apiKey = getNewsApiKey();
  const countryCode = country.toLowerCase();

  // Supported country codes by NewsAPI top-headlines
  const supportedNewsApiCountries = [
    'ae', 'ar', 'at', 'au', 'be', 'bg', 'br', 'ca', 'ch', 'cn', 'co', 'cu', 'cz', 'de', 'eg', 'fr', 'gb', 'gr', 
    'hk', 'hu', 'id', 'ie', 'il', 'in', 'it', 'jp', 'kr', 'lt', 'lv', 'ma', 'mx', 'my', 'ng', 'nl', 'no', 'nz', 
    'ph', 'pl', 'pt', 'ro', 'rs', 'ru', 'sa', 'se', 'sg', 'si', 'sk', 'th', 'tr', 'tw', 'ua', 'us', 've', 'za'
  ];

  let articles = [];

  // 1. Try NewsAPI top-headlines first (only if country is supported and key is set/not rate-limited)
  if (supportedNewsApiCountries.includes(countryCode) && apiKey && !apiKey.includes('YAHAN')) {
    try {
      const response = await axios.get(`${NEWS_API_BASE}/top-headlines`, {
        params: {
          country: countryCode,
          pageSize: 20,
          apiKey
        },
        timeout: 8000
      });

      if (response.data && response.data.status === 'ok') {
        articles = (response.data.articles || []).filter(
          a => a.title && a.title !== '[Removed]' && a.url
        );
      }
    } catch (err) {
      console.error('country-headlines NewsAPI top-headlines error:', err.message);
    }
  }

  // 2. Try RSS Fallback if NewsAPI top-headlines failed or is unsupported/rate-limited
  if (articles.length === 0) {
    try {
      // Look up full country name for RSS search query
      let searchQuery = q || countryCode;
      
      const codeToName = {
        'af': 'Afghanistan', 'ar': 'Argentina', 'au': 'Australia', 'at': 'Austria', 'be': 'Belgium', 
        'br': 'Brazil', 'bg': 'Bulgaria', 'ca': 'Canada', 'cn': 'China', 'co': 'Colombia', 
        'cu': 'Cuba', 'cz': 'Czech Republic', 'eg': 'Egypt', 'fr': 'France', 'de': 'Germany', 
        'gr': 'Greece', 'hk': 'Hong Kong', 'hu': 'Hungary', 'in': 'India', 'id': 'Indonesia', 
        'ie': 'Ireland', 'il': 'Israel', 'it': 'Italy', 'jp': 'Japan', 'lv': 'Latvia', 
        'lt': 'Lithuania', 'my': 'Malaysia', 'mx': 'Mexico', 'ma': 'Morocco', 'nl': 'Netherlands', 
        'nz': 'New Zealand', 'ng': 'Nigeria', 'no': 'Norway', 'ph': 'Philippines', 'pl': 'Poland', 
        'pt': 'Portugal', 'ro': 'Romania', 'ru': 'Russia', 'sa': 'Saudi Arabia', 'rs': 'Serbia', 
        'sg': 'Singapore', 'sk': 'Slovakia', 'si': 'Slovenia', 'za': 'South Africa', 'kr': 'South Korea', 
        'es': 'Spain', 'se': 'Sweden', 'ch': 'Switzerland', 'tw': 'Taiwan', 'th': 'Thailand', 
        'tr': 'Turkey', 'ua': 'Ukraine', 'ae': 'United Arab Emirates', 'gb': 'United Kingdom', 
        'us': 'United States', 've': 'Venezuela'
      };

      if (!q && codeToName[countryCode]) {
        searchQuery = codeToName[countryCode];
      }

      console.log(`Using RSS fallback for country: ${countryCode}, query: ${searchQuery}`);
      
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`;
      const rssArticles = await parseRSSFeed(`Google News: ${searchQuery}`, rssUrl);
      
      articles = (rssArticles || []).filter(
        a => a.title && a.title !== '[Removed]'
      );
    } catch (rssErr) {
      console.error('country-headlines RSS fallback error:', rssErr.message);
    }
  }

  // 3. Try Mock data fallback if both NewsAPI and RSS failed
  if (articles.length === 0) {
    let countryName = q;
    if (!countryName) {
      const codeToName = { 
        'af': 'Afghanistan', 'ar': 'Argentina', 'au': 'Australia', 'at': 'Austria', 'be': 'Belgium', 
        'br': 'Brazil', 'bg': 'Bulgaria', 'ca': 'Canada', 'cn': 'China', 'co': 'Colombia', 
        'cu': 'Cuba', 'cz': 'Czech Republic', 'eg': 'Egypt', 'fr': 'France', 'de': 'Germany', 
        'gr': 'Greece', 'hk': 'Hong Kong', 'hu': 'Hungary', 'in': 'India', 'id': 'Indonesia', 
        'ie': 'Ireland', 'il': 'Israel', 'it': 'Italy', 'jp': 'Japan', 'lv': 'Latvia', 
        'lt': 'Lithuania', 'my': 'Malaysia', 'mx': 'Mexico', 'ma': 'Morocco', 'nl': 'Netherlands', 
        'nz': 'New Zealand', 'ng': 'Nigeria', 'no': 'Norway', 'ph': 'Philippines', 'pl': 'Poland', 
        'pt': 'Portugal', 'ro': 'Romania', 'ru': 'Russia', 'sa': 'Saudi Arabia', 'rs': 'Serbia', 
        'sg': 'Singapore', 'sk': 'Slovakia', 'si': 'Slovenia', 'za': 'South Africa', 'kr': 'South Korea', 
        'es': 'Spain', 'se': 'Sweden', 'ch': 'Switzerland', 'tw': 'Taiwan', 'th': 'Thailand', 
        'tr': 'Turkey', 'ua': 'Ukraine', 'ae': 'United Arab Emirates', 'gb': 'United Kingdom', 
        'us': 'United States', 've': 'Venezuela' 
      };
      countryName = codeToName[countryCode] || countryCode;
    }
    console.log(`Using mock data fallback for country: ${countryName}`);
    articles = getMockArticles('world', countryName).slice(0, 10);
  }

  return res.json({ status: 'ok', totalResults: articles.length, articles });
});

export default router;
