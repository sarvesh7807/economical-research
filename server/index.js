import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

// Import routers
import newsRouter from './routes/news.js';
import aiRouter from './routes/ai.js';
import billingRouter from './routes/billing.js';
import adminRouter from './routes/admin.js';
import notificationsRouter from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize shared app variables
app.locals.customArticles = [];

// Mount modular routing middlewares
app.use('/api/news', newsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/billing', billingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);

// YOUTUBE LIVE SCRAPER ENDPOINT WITH MEMORY CACHE
const ytCache = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

app.get('/api/youtube-live', async (req, res) => {
  const { channelId } = req.query;
  if (!channelId) {
    return res.status(400).json({ error: 'channelId is required' });
  }

  const now = Date.now();
  if (ytCache[channelId] && (now - ytCache[channelId].timestamp) < CACHE_TTL) {
    return res.json({ videoId: ytCache[channelId].videoId });
  }

  try {
    const url = `https://www.youtube.com/channel/${channelId}/live`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 8000
    });

    const html = response.data;
    const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"]+)">/);
    let videoId = null;
    if (canonicalMatch) {
      videoId = canonicalMatch[1];
    } else {
      const videoIdMatch = html.match(/"videoId":"([^"]+)"/);
      if (videoIdMatch) {
        videoId = videoIdMatch[1];
      }
    }

    if (videoId) {
      ytCache[channelId] = { videoId, timestamp: now };
      return res.json({ videoId });
    }

    if (ytCache[channelId]) {
      return res.json({ videoId: ytCache[channelId].videoId, stale: true });
    }

    return res.json({ videoId: channelId, isFallback: true });
  } catch (err) {
    console.error(`Error scraping live stream for ${channelId}:`, err.message);
    if (ytCache[channelId]) {
      return res.json({ videoId: ytCache[channelId].videoId, stale: true });
    }
    return res.json({ videoId: channelId, isFallback: true });
  }
});

// 2. SEARCH SUGGESTIONS ENDPOINT (Maintained in core server)
const NEWS_API_BASE = 'https://newsapi.org/v2';
const getNewsApiKey = () => process.env.NEWS_API_KEY;

const suggestionsCache = {};
const SUGGESTIONS_TTL = 15 * 60 * 1000; // 15 minutes

app.get('/api/suggestions', async (req, res) => {
  const { q = '' } = req.query;
  if (!q || q.length < 2) {
    return res.json([]);
  }

  const queryKey = q.toLowerCase();
  const cached = suggestionsCache[queryKey];
  if (cached && (Date.now() - cached.timestamp < SUGGESTIONS_TTL)) {
    return res.json(cached.data);
  }

  const apiKey = getNewsApiKey();
  if (!apiKey || apiKey.includes('YAHAN')) {
    const items = ['Market trends', 'Tech innovations', 'World economy', 'India GDP', 'Space discovery', 'Healthcare reform'];
    const filtered = items.filter(item => item.toLowerCase().includes(q.toLowerCase()));
    return res.json(filtered);
  }

  try {
    const response = await axios.get(`${NEWS_API_BASE}/everything`, {
      params: {
        apiKey,
        q,
        language: 'en',
        pageSize: 5
      }
    });

    const suggestions = Array.from(new Set(
      (response.data.articles || [])
        .map(a => a.title.split(' - ')[0])
        .filter(t => t && t.length < 80)
    )).slice(0, 5);

    suggestionsCache[queryKey] = {
      timestamp: Date.now(),
      data: suggestions
    };

    res.json(suggestions);
  } catch (error) {
    res.json([]);
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
