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
    
    // Fallback to mock data ONLY if everything else fails
    if (rawMerged.length === 0) {
      rawMerged = getMockArticles(country ? 'world' : category, q);
    }

    const seenUrls = new Set();
    const cleaned = rawMerged.filter(article => {
      if (!article.title || article.title === '[Removed]') return false;
      if (seenUrls.has(article.url)) return false;
      seenUrls.add(article.url);
      return true;
    });

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

// Helper for Mock Articles
function getMockArticles(category, query) {
  const baseArticles = [
    {
      title: "Global Inflation Cools down as Supply Chains Rebalance",
      description: "Economists project a stabilizing market in the next fiscal quarter as supply pressures ease globally.",
      content: "Central banks around the world have indicated a potential freeze on interest rate hikes...",
      source: { name: "Financial Times" },
      author: "Helena Rostova",
      url: "https://example.com/inflation-cools",
      urlToImage: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=600",
      publishedAt: new Date().toISOString()
    },
    {
      title: "Venture Capital Shifts Focus to Hard Science and Space Technologies",
      description: "A major shift is occurring in private equity investments, moving away from consumer SaaS towards deep tech.",
      content: "Silicon Valley investors are raising multi-billion dollar funds specifically earmarked for deep tech...",
      source: { name: "TechCrunch" },
      author: "Marcus Vance",
      url: "https://example.com/deeptech-vc",
      urlToImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600",
      publishedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      title: "India Sets Ambitious 8.2% GDP Target for Next Fiscal Year",
      description: "Finance ministry sources outline bold spending targets and infrastructure projects.",
      content: "New Delhi is planning to roll out significant capital expenditure initiatives, focusing on highway networks...",
      source: { name: "The Economic Times" },
      author: "Rohan Sharma",
      url: "https://example.com/india-gdp",
      urlToImage: "https://images.unsplash.com/photo-1532375811409-90d165c859d0?q=80&w=600",
      publishedAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      title: "Renewable Energy Capacity Surpasses Coal for the First Time in EU",
      description: "A landmark report confirms wind and solar generated more than 40% of the European continent's electricity.",
      content: "The energy transition has hit an inflection point in Western Europe...",
      source: { name: "Reuters" },
      author: "Sarah Jenkins",
      url: "https://example.com/renewable-coal",
      urlToImage: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=600",
      publishedAt: new Date(Date.now() - 10800000).toISOString()
    }
  ];

  let filtered = baseArticles;
  if (query) {
    const qLower = query.toLowerCase();
    filtered = baseArticles.filter(art => art.title.toLowerCase().includes(qLower) || art.description.toLowerCase().includes(qLower));
  }

  // Generate 80+ mock articles for pagination/infinite scroll tests
  const replicated = [];
  for (let i = 0; i < 90; i++) {
    const original = filtered[i % filtered.length] || baseArticles[0];
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
