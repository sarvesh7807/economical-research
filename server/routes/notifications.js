import express from 'express';

const router = express.Router();

// In-Memory store for registered FCM tokens per user
const fcmTokens = {}; // userId -> token

// 1. REGISTER FCM TOKEN
router.post('/register-token', (req, res) => {
  const { userId, token } = req.body;
  if (!userId || !token) {
    return res.status(400).json({ error: 'User ID and FCM token are required' });
  }

  fcmTokens[userId] = token;
  console.log(`Registered FCM token for user ${userId}: ${token.substring(0, 15)}...`);
  res.json({ success: true, message: 'FCM Token registered successfully' });
});

// 2. BROADCAST PUSH NOTIFICATION (to all tokens)
router.post('/send-broadcast', (req, res) => {
  const { title, text, url, type = 'breaking' } = req.body;
  if (!title || !text) {
    return res.status(400).json({ error: 'Title and text are required' });
  }

  const newBroadcast = {
    id: `broadcast-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    text,
    url,
    type,
    timestamp: new Date().toISOString()
  };

  req.app.locals.broadcasts = req.app.locals.broadcasts || [];
  req.app.locals.broadcasts.unshift(newBroadcast);
  if (req.app.locals.broadcasts.length > 50) req.app.locals.broadcasts.pop();

  const tokens = Object.values(fcmTokens);
  console.log(`📡 BROADCAST PUSH ALERT: [${title}] "${text}" to ${tokens.length} users.`);
  
  res.json({
    success: true,
    sentCount: tokens.length,
    message: `Broadcast sent to ${tokens.length} registered FCM tokens.`,
    broadcast: newBroadcast
  });
});

// 2.5. GET ACTIVE BROADCASTS (for client polling)
router.get('/broadcasts', (req, res) => {
  const list = req.app.locals.broadcasts || [];
  res.json(list);
});

// 3. SEND DIRECT PUSH NOTIFICATION (to specific user)
router.post('/send-user', (req, res) => {
  const { userId, title, text, url, type } = req.body;
  if (!userId || !title || !text) {
    return res.status(400).json({ error: 'User ID, title, and text are required' });
  }

  const token = fcmTokens[userId];
  if (!token) {
    console.warn(`Attempted to send direct push to user ${userId}, but no FCM token is registered.`);
    return res.json({ success: false, error: 'No FCM token registered' });
  }

  console.log(`📡 DIRECT PUSH ALERT: [User: ${userId}] [${title}] "${text}".`);
  res.json({ success: true, message: 'FCM Direct Notification sent.' });
});

// 4. DISPATCH EMAIL NOTIFICATION
router.post('/dispatch-email', (req, res) => {
  const { email, type, data = {} } = req.body;
  if (!email || !type) {
    return res.status(400).json({ error: 'Email and email type are required' });
  }

  // Formatting subject and logs based on type
  let subject = '';
  switch (type.toLowerCase()) {
    case 'welcome':
      subject = 'Welcome to Economical Research';
      console.log(`📧 [EMAIL LOG] Welcome email dispatched to ${email}`);
      break;
    case 'digest':
      subject = 'Your Daily News Digest - Economical Research';
      console.log(`📧 [EMAIL LOG] Daily news digest email dispatched to ${email}`);
      break;
    case 'breaking':
      subject = `🔴 BREAKING NEWS: ${data.headline || 'Global Wire Alert'}`;
      console.log(`📧 [EMAIL LOG] Breaking news email alert dispatched to ${email}`);
      break;
    case 'subscription':
      subject = 'Subscription Confirmation - Economical Research PRO';
      console.log(`📧 [EMAIL LOG] Subscription confirmation email dispatched to ${email}`);
      break;
    case 'receipt':
      subject = `Payment Receipt - Invoice #${data.invoiceId || 'N/A'}`;
      console.log(`📧 [EMAIL LOG] Payment receipt email dispatched to ${email}`);
      break;
    case 'password_reset':
      subject = 'Reset Your Account Password - Economical Research';
      console.log(`📧 [EMAIL LOG] Password reset email dispatched to ${email}`);
      break;
    default:
      subject = 'Notification Alert - Economical Research';
      console.log(`📧 [EMAIL LOG] Notification email of type "${type}" dispatched to ${email}`);
  }

  res.json({
    success: true,
    message: `Simulated email of type "${type}" successfully dispatched to ${email}.`,
    subject
  });
});

export default router;
