import express from 'express';

const router = express.Router();

// 1. ADMIN DASHBOARD STATS
router.get('/stats', (req, res) => {
  const stats = {
    totalUsers: 1420,
    basicUsers: 1115,
    proUsers: 305,
    activeToday: 218,
    monthlyRevenue: 1980.50,
    adSenseRevenue: 432.10,
    mostReadArticles: [
      { title: "Global Inflation Cools down as Supply Chains Rebalance", reads: 452, category: "World" },
      { title: "India Sets Ambitious 8.2% GDP Target for Next Fiscal Year", reads: 389, category: "India" },
      { title: "Venture Capital Shifts Focus to Hard Science and Space Technologies", reads: 310, category: "Tech" },
      { title: "Renewable Energy Capacity Surpasses Coal for the First Time in EU", reads: 278, category: "Science" }
    ],
    revenueHistory: [
      { month: 'Jan', revenue: 1250 },
      { month: 'Feb', revenue: 1400 },
      { month: 'Mar', revenue: 1550 },
      { month: 'Apr', revenue: 1750 },
      { month: 'May', revenue: 1890 },
      { month: 'Jun', revenue: 1980 }
    ],
    trafficHistory: [
      { day: 'Mon', visits: 1100 },
      { day: 'Tue', visits: 1250 },
      { day: 'Wed', visits: 1400 },
      { day: 'Thu', visits: 1350 },
      { day: 'Fri', visits: 1500 },
      { day: 'Sat', visits: 950 },
      { day: 'Sun', visits: 880 }
    ]
  };

  res.json(stats);
});

// 2. RETRIEVE USER LIST
router.get('/users', (req, res) => {
  // Return mock users table
  const mockUsers = [
    { id: 'usr_001', name: 'Dr. Jane Devlin', email: 'researcher.er@gmail.com', plan: 'PRO', status: 'Active', joined: '2026-01-15' },
    { id: 'usr_002', name: 'Helena Rostova', email: 'helena.ros@yahoo.com', plan: 'Basic', status: 'Active', joined: '2026-02-18' },
    { id: 'usr_003', name: 'Marcus Vance', email: 'marcus.v@techvc.com', plan: 'PRO', status: 'Active', joined: '2026-03-05' },
    { id: 'usr_004', name: 'James Moriarty', email: 'moriarty@london.co.uk', plan: 'Basic', status: 'Banned', joined: '2026-04-10' },
    { id: 'usr_005', name: 'Arthur Dent', email: 'dent.art@galaxy.net', plan: 'Basic', status: 'Active', joined: '2026-05-20' }
  ];

  res.json(mockUsers);
});

// 3. UPDATE USER DETAILS / BAN / UPGRADE
router.post('/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, plan } = req.body;

  console.log(`Admin action on user ${id}: set status=${status || 'unchanged'}, plan=${plan || 'unchanged'}`);
  res.json({ success: true, message: 'User status successfully modified by administrator.' });
});

// 4. PUBLISH CUSTOM ARTICLE (MANUAL PUBLISHING)
router.post('/publish', (req, res) => {
  const { title, description, content, category, urlToImage, author } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Title, Content, and Category are required.' });
  }

  // Construct a new article object matching the standard schema
  const newArticle = {
    title: `[EDITORIAL] ${title}`,
    description: description || content.substring(0, 150) + '...',
    content: content,
    source: { name: 'Economical Research Intelligence Desk' },
    author: author || 'Senior Correspondent',
    url: `https://economicalresearch.com/custom-articles/${Date.now()}`,
    urlToImage: urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600',
    publishedAt: new Date().toISOString()
  };

  // Save the custom article into Express app local variables (shared state)
  req.app.locals.customArticles = req.app.locals.customArticles || [];
  req.app.locals.customArticles.unshift(newArticle);

  // Trigger topic match notification broadcast for subscribers
  const newBroadcast = {
    id: `broadcast-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: `New Article in ${category.toUpperCase()} 📰`,
    text: `New dispatch: ${title}`,
    url: newArticle.url,
    type: 'topic',
    category: category,
    timestamp: new Date().toISOString()
  };

  req.app.locals.broadcasts = req.app.locals.broadcasts || [];
  req.app.locals.broadcasts.unshift(newBroadcast);
  if (req.app.locals.broadcasts.length > 50) req.app.locals.broadcasts.pop();

  console.log(`Custom article successfully published under category: ${category}`);
  res.json({ success: true, article: newArticle, broadcast: newBroadcast });
});

// 5. DISPATCH SYSTEM PUSH NOTIFICATION ALERT
router.post('/push-alert', (req, res) => {
  const { title, text } = req.body;

  if (!title || !text) {
    return res.status(400).json({ error: 'Alert title and text required.' });
  }

  const newBroadcast = {
    id: `broadcast-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    text,
    type: 'breaking',
    timestamp: new Date().toISOString()
  };

  req.app.locals.broadcasts = req.app.locals.broadcasts || [];
  req.app.locals.broadcasts.unshift(newBroadcast);
  if (req.app.locals.broadcasts.length > 50) req.app.locals.broadcasts.pop();

  console.log(`System Push Alert dispatched: [${title}] ${text}`);
  res.json({ success: true, message: 'Push news notification alert broadcasted successfully.', broadcast: newBroadcast });
});

export default router;
