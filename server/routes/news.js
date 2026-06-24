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

// In-Memory cache (15 min TTL for quota saving)
const feedCache = {};
const CACHE_EXPIRY = 15 * 60 * 1000;

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

// API Key Resolvers
const getGNewsKey = () => process.env.GNEWS_KEY || 'c115ad6c999a544e461f5742c85f6d54';
const getNewsDataKey = () => process.env.NEWSDATA_KEY || 'pub_8604840f11334dfc8574700a63216e68';

// Category Mappers for APIs
const getGNewsCategory = (category) => {
  const cat = category.toLowerCase();
  switch (cat) {
    case 'world': return 'world';
    case 'india': return 'nation';
    case 'business': return 'business';
    case 'finance': return 'business';
    case 'tech':
    case 'tech & ai': return 'technology';
    case 'sports':
    case 'cricket':
    case 'football':
    case 'mma': return 'sports';
    case 'science': return 'science';
    case 'health': return 'health';
    case 'entertainment': return 'entertainment';
    default: return null;
  }
};

const getNewsDataCategory = (category) => {
  const cat = category.toLowerCase();
  switch (cat) {
    case 'world': return 'world';
    case 'india': return 'top';
    case 'business': return 'business';
    case 'finance': return 'business';
    case 'tech':
    case 'tech & ai': return 'technology';
    case 'sports':
    case 'cricket':
    case 'football':
    case 'mma': return 'sports';
    case 'science': return 'science';
    case 'health': return 'health';
    case 'entertainment': return 'entertainment';
    case 'politics': return 'politics';
    case 'environment': return 'environment';
    case 'education': return 'education';
    case 'travel': return 'tourism';
    case 'lifestyle': return 'lifestyle';
    case 'law & crime': return 'crime';
    default: return null;
  }
};

// Image Pools and Entity matching databases (16:9 premium Unsplash images)
const CATEGORY_IMAGES_POOLS = {
  world: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop'
  ],
  india: [
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1532375811409-90d165c859d0?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop'
  ],
  politics: [
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800&auto=format&fit=crop'
  ],
  business: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop'
  ],
  finance: [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=800&auto=format&fit=crop'
  ],
  tech: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop'
  ],
  sports: [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop'
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop'
  ],
  science: [
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop'
  ],
  environment: [
    'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=800&auto=format&fit=crop'
  ],
  health: [
    'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop'
  ],
  education: [
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop'
  ],
  travel: [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop'
  ],
  lifestyle: [
    'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop'
  ],
  law: [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505664194779-8bebcb35da44?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?q=80&w=800&auto=format&fit=crop'
  ],
  research: [
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=800&auto=format&fit=crop'
  ]
};

const ENTITY_IMAGES = [
  { keywords: ['chatgpt', 'openai', 'gemini', 'copilot', 'llm', 'artificial intelligence', 'ai chip', 'ai model', 'midjourney'], url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=800&auto=format&fit=crop' },
  { keywords: ['apple', 'iphone', 'ipad', 'macbook', 'tim cook', 'ios'], url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=800&auto=format&fit=crop' },
  { keywords: ['google', 'sundar pichai', 'alphabet', 'android'], url: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?q=80&w=800&auto=format&fit=crop' },
  { keywords: ['microsoft', 'windows', 'satya nadella', 'xbox'], url: 'https://images.unsplash.com/photo-1625014020771-13721990414b?q=80&w=800&auto=format&fit=crop' },
  { keywords: ['tesla', 'elon musk', 'cybercab', 'spacex', 'starship'], url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=800&auto=format&fit=crop' },
  { keywords: ['nvidia', 'jensen huang', 'gpu', 'blackwell', 'h100', 'ai chip'], url: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?q=80&w=800&auto=format&fit=crop' },
  { keywords: ['cricket', 'kohli', 'rohit', 'dhoni', 'ipl', 't20', 'icc', 'wicket', 'bcci'], url: 'https://images.unsplash.com/photo-1532375811409-90d165c859d0?q=80&w=800&auto=format&fit=crop' },
  { keywords: ['football', 'soccer', 'messi', 'ronaldo', 'mbappe', 'fifa', 'champions league', 'premier league'], url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop' },
  { keywords: ['mma', 'ufc', 'fight', 'fighter', 'octagon', 'knockout', 'conor'], url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop' },
  { keywords: ['stocks', 'wall street', 'nasdaq', 'bull market', 'dow jones', 'stock market', 'trading'], url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800&auto=format&fit=crop' },
  { keywords: ['bitcoin', 'crypto', 'cryptocurrency', 'ethereum', 'btc', 'blockchain'], url: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=800&auto=format&fit=crop' },
  { keywords: ['court', 'judge', 'lawsuit', 'supreme court', 'verdict', 'attorney', 'prosecutors'], url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800&auto=format&fit=crop' },
  { keywords: ['space', 'telescope', 'nasa', 'galaxy', 'exoplanet', 'mars', 'moon', 'orbit'], url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop' }
];

// Helper to check for generic or broken thumbnails
function isGenericPlaceholder(url) {
  if (!url) return true;
  const genericDomains = ['placeholder', 'default', 'logo', 'fallback', 'avatar', 'dummy', 'favicon'];
  return genericDomains.some(d => url.includes(d));
}

// Smart Image Matching Resolver
function resolveArticleImage(article, category, usedImagesSet) {
  let img = article.urlToImage;
  if (img && img.startsWith('http') && !isGenericPlaceholder(img) && !usedImagesSet.has(img)) {
    usedImagesSet.add(img);
    return img;
  }

  const title = (article.title || '').toLowerCase();
  const desc = (article.description || '').toLowerCase();
  const text = `${title} ${desc}`;

  // 1. Entity Match
  for (const ent of ENTITY_IMAGES) {
    for (const key of ent.keywords) {
      if (text.includes(key)) {
        let finalUrl = ent.url;
        if (!usedImagesSet.has(finalUrl)) {
          usedImagesSet.add(finalUrl);
          return finalUrl;
        }
      }
    }
  }

  // 2. Category Pool Match
  const cat = (category || 'world').toLowerCase();
  let targetCat = cat;
  if (cat === 'tech & ai') targetCat = 'tech';
  if (cat === 'law & crime') targetCat = 'law';

  const pool = CATEGORY_IMAGES_POOLS[targetCat] || CATEGORY_IMAGES_POOLS.world;
  
  // Use a hash of the title to consistently choose a unique image index
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % pool.length;
  let finalUrl = pool[index];

  // Prevent generic duplication across siblings
  if (usedImagesSet.has(finalUrl)) {
    for (let i = 0; i < pool.length; i++) {
      const altUrl = pool[(index + i) % pool.length];
      if (!usedImagesSet.has(altUrl)) {
        usedImagesSet.add(altUrl);
        return altUrl;
      }
    }
  }

  usedImagesSet.add(finalUrl);
  return finalUrl;
}

// Normalization functions
const normalizeGNews = (articles) => 
  (articles || []).map(a => ({
    title: a.title || '',
    description: a.description || '',
    content: a.content || a.description || '',
    url: a.url || '',
    urlToImage: a.image || '',
    publishedAt: a.publishedAt || new Date().toISOString(),
    source: { name: a.source?.name || 'GNews' },
    author: a.source?.name || 'GNews'
  })).filter(a => a.title && a.title !== '[Removed]');

const normalizeNewsData = (articles) =>
  (articles || []).map(a => ({
    title: a.title || '',
    description: a.description || '',
    content: a.content || a.description || '',
    url: a.link || '',
    urlToImage: a.image_url || '',
    publishedAt: a.pubDate || new Date().toISOString(),
    source: { name: a.source_id || 'NewsData' },
    author: a.creator?.[0] || a.source_id || 'NewsData'
  })).filter(a => a.title && a.title !== '[Removed]');

// Headline Similarity ( intersection word matching )
function getHeadlineSimilarity(h1, h2) {
  if (h1 === h2) return 1.0;
  const clean = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const w1 = clean(h1);
  const w2 = clean(h2);
  if (w1.length === 0 || w2.length === 0) return 0.0;
  const intersection = w1.filter(w => w2.includes(w));
  return intersection.length / Math.min(w1.length, w2.length);
}

// Deduplication
function deduplicateArticles(articles) {
  const unique = [];
  for (const article of articles) {
    let isDup = false;
    for (const existing of unique) {
      if (article.url && existing.url && article.url === existing.url) {
        isDup = true;
        break;
      }
      const headlineSim = getHeadlineSimilarity(article.title, existing.title);
      if (headlineSim > 0.65) {
        isDup = true;
        break;
      }
    }
    if (!isDup) {
      unique.push(article);
    }
  }
  return unique;
}

// Category Classifier Engine
function classifyArticle(article) {
  const title = (article.title || '').toLowerCase();
  const desc = (article.description || '').toLowerCase();
  const content = (article.content || '').toLowerCase();
  const fullText = `${title} ${desc} ${content}`;

  const categoryScores = {
    india: 0,
    politics: 0,
    business: 0,
    finance: 0,
    tech: 0,
    sports: 0,
    entertainment: 0,
    science: 0,
    environment: 0,
    health: 0,
    education: 0,
    travel: 0,
    lifestyle: 0,
    law: 0,
    research: 0,
    world: 0.1
  };

  const keywords = {
    india: ['india', 'indian', 'delhi', 'mumbai', 'bengaluru', 'modi', 'bollywood', 'gandhi', 'hindu', 'sachin', 'kohli', 'rupee', 'isro'],
    politics: ['politics', 'political', 'election', 'elections', 'parliament', 'senate', 'congress', 'legislative', 'government', 'minister', 'president', 'governor', 'mayor', 'white house', 'democrat', 'republican', 'biden', 'trump', 'ballot', 'policy', 'candidate', 'diplomacy', 'summit'],
    business: ['business', 'corporate', 'company', 'companies', 'acquisition', 'merger', 'industry', 'industries', 'startup', 'startups', 'ceo', 'coo', 'cfo', 'revenue', 'earnings', 'profit', 'sales', 'retail', 'manufacturing', 'logistics', 'supply chain', 'firm'],
    finance: ['finance', 'financial', 'stock market', 'stocks', 'wall street', 'dow jones', 'nasdaq', 'currency', 'trading', 'inflation', 'economy', 'economic', 'gdp', 'central bank', 'federal reserve', 'fed', 'interest rate', 'rates', 'yield', 'bonds', 'investment', 'investors', 'banking', 'banks', 'fiscal', 'monetary'],
    tech: ['tech', 'technology', 'technologies', 'software', 'hardware', 'ai', 'artificial intelligence', 'robot', 'robotics', 'app', 'apps', 'algorithm', 'cyber', 'cybersecurity', 'quantum', 'semiconductor', 'microchip', 'chip', 'coding', 'programming', 'developer', 'chatgpt', 'openai', 'smartphone', 'gadget', 'cloud computing'],
    sports: ['sport', 'sports', 'athlete', 'game', 'match', 'tournament', 'cup', 'trophy', 'league', 'team', 'player', 'coach', 'stadium', 'championship', 'victory', 'score', 'cricket', 'football', 'soccer', 'tennis', 'basketball', 'mma', 'ufc', 'baseball', 'rugby', 'golf', 'athletics', 'olympics', 'fifa', 'ipl'],
    entertainment: ['entertainment', 'movie', 'movies', 'film', 'films', 'cinema', 'actor', 'actress', 'celebrity', 'celebrities', 'hollywood', 'bollywood', 'album', 'song', 'music', 'concert', 'artist', 'singer', 'band', 'box office', 'show', 'television', 'tv series', 'streaming', 'netflix', 'oscar', 'grammy'],
    science: ['science', 'scientific', 'astronomy', 'planet', 'planets', 'exoplanet', 'telescope', 'nasa', 'space', 'galaxy', 'physics', 'chemistry', 'biology', 'fusion', 'reactor', 'fossils', 'archaeology', 'microscope', 'scientist', 'laboratory', 'universe'],
    environment: ['environment', 'environmental', 'climate', 'green energy', 'renewable', 'solar', 'wind power', 'recycling', 'emissions', 'conservation', 'wildlife', 'forest', 'ocean', 'oceans', 'carbon', 'warming', 'pollution', 'species', 'ecology'],
    health: ['health', 'hygiene', 'medical', 'medicine', 'vaccine', 'vaccines', 'virus', 'pandemic', 'disease', 'diseases', 'doctor', 'hospital', 'patient', 'therapy', 'nutrition', 'diet', 'fitness', 'mental health', 'clinical'],
    education: ['education', 'educational', 'school', 'schools', 'university', 'college', 'student', 'students', 'teacher', 'teachers', 'learning', 'study', 'curriculum', 'academy', 'academic', 'degree', 'tuition', 'classroom'],
    travel: ['travel', 'tourism', 'tourist', 'flight', 'flights', 'airline', 'airlines', 'hotel', 'hotels', 'resort', 'destination', 'wanderlust', 'cruise', 'trip', 'vacation', 'baggage', 'exploration'],
    lifestyle: ['lifestyle', 'fashion', 'food', 'decor', 'home', 'recipe', 'recipes', 'cuisine', 'design', 'styling', 'trends', 'beauty', 'wellness', 'cosmetics', 'makeup', 'gardening'],
    law: ['law', 'legal', 'court', 'judge', 'trial', 'attorney', 'lawyer', 'crime', 'criminal', 'police', 'arrest', 'prison', 'jail', 'supreme court', 'lawsuit', 'prosecute', 'prosecution', 'custody', 'verdict'],
    research: ['research', 'academic', 'study', 'studies', 'journal', 'publisher', 'breakthroughs', 'innovation', 'findings', 'thesis', 'scientists', 'university', 'research institute', 'peer-reviewed', 'experiment', 'data analysis']
  };

  for (const [cat, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (fullText.includes(word)) {
        categoryScores[cat] += 1;
      }
    }
  }

  let maxCat = 'world';
  let maxScore = 0;
  for (const [cat, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      maxCat = cat;
    }
  }

  const catMapping = {
    world: 'World',
    india: 'India',
    politics: 'Politics',
    business: 'Business',
    finance: 'Finance',
    tech: 'Tech & AI',
    sports: 'Sports',
    entertainment: 'Entertainment',
    science: 'Science',
    environment: 'Environment',
    health: 'Health',
    education: 'Education',
    travel: 'Travel',
    lifestyle: 'Lifestyle',
    law: 'Law & Crime',
    research: 'Research'
  };

  return catMapping[maxCat] || 'World';
}

// Fetchers for GNews
const fetchGNews = async (category, q, country) => {
  const key = getGNewsKey();
  if (!key || key.includes('YAHAN')) return [];

  try {
    let url = 'https://gnews.io/api/v4/top-headlines?lang=en';
    const gnewsCat = getGNewsCategory(category);

    if (q) {
      url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en`;
    } else if (country && country.toLowerCase() === 'in') {
      url += `&country=in`;
    } else if (gnewsCat) {
      url += `&category=${gnewsCat}`;
    } else {
      url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(category)}&lang=en`;
    }

    url += `&apikey=${key}&max=25`;
    const response = await axios.get(url, { timeout: 6000 });
    return response.data?.articles || [];
  } catch (err) {
    console.error('GNews API fetch error:', err.message);
    return [];
  }
};

// Fetchers for NewsData
const fetchNewsData = async (category, q, country) => {
  const key = getNewsDataKey();
  if (!key || key.includes('YAHAN')) return [];

  try {
    let url = `https://newsdata.io/api/1/news?apikey=${key}&language=en`;
    const newsDataCat = getNewsDataCategory(category);

    if (q) {
      url += `&q=${encodeURIComponent(q)}`;
    } else if (country && country.toLowerCase() === 'in') {
      url += `&country=in`;
    } else if (newsDataCat) {
      url += `&category=${newsDataCat}`;
    } else {
      url += `&q=${encodeURIComponent(category)}`;
    }

    const response = await axios.get(url, { timeout: 6000 });
    return response.data?.results || [];
  } catch (err) {
    console.error('NewsData.io API fetch error:', err.message);
    return [];
  }
};

router.get('/', async (req, res) => {
  const { category = 'world', q = '', page = 1, pageSize = 20, country, language } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const pageSizeNum = parseInt(pageSize, 10) || 20;

  const langCode = language ? language.toLowerCase() : 'en';
  const cacheKey = country
    ? `country_${country.toLowerCase()}_lang_${langCode}`
    : (q ? `search_${q.toLowerCase()}_lang_${langCode}` : `cat_${category.toLowerCase()}_lang_${langCode}`);
  
  let aggregatedArticles = getCachedFeed(cacheKey);

  if (!aggregatedArticles) {
    console.log(`Cache miss. Executing multi-source news pipeline for category: ${category}, query: ${q}`);
    
    // 1. Fetch from GNews (Primary)
    const gnewsRaw = await fetchGNews(category, q, country);
    const gnewsNormalized = normalizeGNews(gnewsRaw);

    // 2. Fetch from NewsData.io (Secondary / Fallback)
    const newsDataRaw = await fetchNewsData(category, q, country);
    const newsDataNormalized = normalizeNewsData(newsDataRaw);

    // Merge normalized articles
    let merged = [...gnewsNormalized, ...newsDataNormalized];

    // Deduplicate
    let deduplicated = deduplicateArticles(merged);

    // 3. Fallback to RSS if APIs are rate-limited or return zero articles
    if (deduplicated.length === 0) {
      console.log('API sources failed or returned empty. Running RSS tertiary fallback...');
      let rssArticles = [];
      if (q) {
        const searchRssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
        rssArticles = await parseRSSFeed(`Google News: ${q}`, searchRssUrl);
      } else {
        const feeds = getRSSFeedsForCategory(country ? 'world' : category);
        const parsedResults = await Promise.all(feeds.map(feed => parseRSSFeed(feed.name, feed.url)));
        rssArticles = parsedResults.flat();
      }
      deduplicated = deduplicateArticles(rssArticles);
    }

    // 4. Fallback to Mock wire data if everything else fails
    if (deduplicated.length === 0) {
      console.log('All live sources exhausted. Rendering mock fallback...');
      const mocks = getMockArticles(country ? 'world' : category, q);
      deduplicated = deduplicateArticles(mocks);
    }

    // 5. Automatic Category Classifier
    const classifiedList = deduplicated.map(article => {
      const detectedCat = classifyArticle(article);
      return {
        ...article,
        classifiedCategory: detectedCat
      };
    });

    // Filter strictly by the requested category
    let filtered = classifiedList;
    const requestedCatLower = category.toLowerCase();
    const isGeneralFeed = ['world', 'foryou', 'general'].includes(requestedCatLower);

    if (!isGeneralFeed) {
      filtered = classifiedList.filter(article => {
        const articleCat = article.classifiedCategory.toLowerCase();
        
        let match = false;
        if (requestedCatLower === 'tech & ai') {
          match = ['tech & ai', 'tech'].includes(articleCat);
        } else if (requestedCatLower === 'law & crime') {
          match = ['law & crime', 'law'].includes(articleCat);
        } else {
          match = articleCat === requestedCatLower;
        }

        // Hard rule: Never show business/finance in sports
        if (requestedCatLower === 'sports') {
          const isBizOrFinance = ['business', 'finance'].includes(articleCat);
          if (isBizOrFinance) return false;
        }

        const passesKeywords = verifyArticleCategory(article, category);
        return match || passesKeywords;
      });
    }

    // Backfill with mock items if classification is too restrictive to preserve high card density
    if (filtered.length < 8) {
      console.log(`Category ${category} has low density (${filtered.length}). Backfilling with editorial mocks.`);
      const mocks = getMockArticles(country ? 'world' : category, q).map(m => ({
        ...m,
        classifiedCategory: category
      }));
      const additional = mocks.filter(m => !filtered.some(f => getHeadlineSimilarity(f.title, m.title) > 0.65));
      filtered = [...filtered, ...additional].slice(0, 20);
    }

    // 6. Premium Image matching system
    const usedImages = new Set();
    const finalArticles = filtered.map(article => {
      const resolvedImg = resolveArticleImage(article, category, usedImages);
      return {
        ...article,
        urlToImage: resolvedImg
      };
    });

    // Sort by publication date
    finalArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    aggregatedArticles = finalArticles;
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

// WORLD MAP: Proxy GNews / NewsData.io headlines by country code
router.get('/country-headlines', async (req, res) => {
  const { country, q } = req.query;
  if (!country || country.length !== 2) {
    return res.status(400).json({ error: 'Valid 2-letter country code required', articles: [] });
  }

  const countryCode = country.toLowerCase();
  let articles = [];

  // 1. Try GNews countryheadlines first
  try {
    const gnewsRaw = await fetchGNews('world', q, countryCode);
    const normalized = normalizeGNews(gnewsRaw);
    if (normalized.length > 0) {
      articles = normalized;
    }
  } catch (err) {
    console.error('country-headlines GNews error:', err.message);
  }

  // 2. Try NewsData.io countryheadlines secondary
  if (articles.length === 0) {
    try {
      const newsdataRaw = await fetchNewsData('world', q, countryCode);
      const normalized = normalizeNewsData(newsdataRaw);
      if (normalized.length > 0) {
        articles = normalized;
      }
    } catch (err) {
      console.error('country-headlines NewsData error:', err.message);
    }
  }

  // 3. Try RSS Fallback if both APIs failed
  if (articles.length === 0) {
    try {
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
      articles = (rssArticles || []).filter(a => a.title && a.title !== '[Removed]');
    } catch (rssErr) {
      console.error('country-headlines RSS fallback error:', rssErr.message);
    }
  }

  // 4. Try Mock data fallback if everything fails
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

  // Image Matching for country headlines
  const usedImages = new Set();
  const finalArticles = articles.map(article => ({
    ...article,
    urlToImage: resolveArticleImage(article, 'world', usedImages)
  }));

  return res.json({ status: 'ok', totalResults: finalArticles.length, articles: finalArticles });
});

export default router;

