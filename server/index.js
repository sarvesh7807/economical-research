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

// 2. SEARCH SUGGESTIONS ENDPOINT (Maintained in core server)
const NEWS_API_BASE = 'https://newsapi.org/v2';
const getNewsApiKey = () => process.env.NEWS_API_KEY;

app.get('/api/suggestions', async (req, res) => {
  const { q = '' } = req.query;
  if (!q || q.length < 2) {
    return res.json([]);
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
