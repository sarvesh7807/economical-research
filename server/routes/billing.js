import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

// Initialize Stripe (fallback to mock if key is empty)
const stripeKey = process.env.STRIPE_KEY;
let stripe = null;
const isStripeConfigured = stripeKey && stripeKey.trim() !== '' && !stripeKey.includes('your_key');

if (isStripeConfigured) {
  try {
    stripe = new Stripe(stripeKey);
  } catch (err) {
    console.error('Error initializing Stripe:', err.message);
  }
}

// 1. CREATE CHECKOUT SESSION
router.post('/create-checkout-session', async (req, res) => {
  const { planId, cycle, userId, email } = req.body;

  if (!planId || !cycle || !userId) {
    return res.status(400).json({ error: 'Plan ID, Cycle, and User ID required' });
  }

  // Price mapping in cents
  const prices = {
    pro: { monthly: 499, yearly: 4990 },
    scholar: { monthly: 999, yearly: 9990 },
    enterprise: { monthly: 2499, yearly: 24990 }
  };

  const key = planId.toLowerCase();
  const cycleKey = cycle.toLowerCase();

  if (!prices[key] || !prices[key][cycleKey]) {
    return res.status(400).json({ error: 'Invalid plan ID or billing cycle' });
  }

  const priceAmount = prices[key][cycleKey];
  const productName = `Economical Research ${planId.toUpperCase()} - ${cycle.toUpperCase()}`;
  
  const productDesc = 
    key === 'pro' ? 'Unlimited news articles, no ads, unlimited AI summaries, and ER Research Mode.' :
    key === 'scholar' ? 'PRO features + Deep Research reports, PDF exports, and academic citations.' :
    'SCHOLAR features + Team access (5 users), custom alerts, and API developer key.';

  if (!stripe) {
    // Return mock checkout URL
    console.log(`Stripe is in sandbox mode. Creating mock session for ${email || 'guest'} on ${planId} (${cycle})`);
    const mockSessionId = `mock_sess_${Date.now()}`;
    return res.json({
      url: `${req.headers.origin}?session_id=${mockSessionId}&plan=${planId}&cycle=${cycle}`,
      mock: true
    });
  }

  try {
    // Real Stripe Checkout Session creation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: productDesc,
            },
            unit_amount: priceAmount,
            recurring: {
              interval: cycleKey === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        email,
        planId,
        cycle
      },
      mode: 'subscription',
      success_url: `${req.headers.origin}?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&cycle=${cycle}`,
      cancel_url: `${req.headers.origin}?view=billing&cancelled=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    res.status(500).json({ error: 'Failed to create payment session.' });
  }
});

// 2. RETRIEVE SESSION STATUS
router.get('/session-status', async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  if (session_id.startsWith('mock_')) {
    return res.json({
      status: 'complete',
      payment_status: 'paid',
      customer_email: 'subscriber.er@economicalresearch.com'
    });
  }

  if (!stripe) {
    return res.status(400).json({ error: 'Stripe is not configured and session is not mock' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    res.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      planId: session.metadata?.planId,
      cycle: session.metadata?.cycle
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. RETRIEVE BILLING HISTORY / INVOICES
router.get('/invoices', async (req, res) => {
  const { email, tier = 'Basic', cycle = 'monthly' } = req.query;

  if (tier === 'Basic' || tier === 'Free') {
    return res.json([]);
  }

  const now = new Date();
  const prices = {
    PRO: { monthly: '$4.99', yearly: '$49.90' },
    SCHOLAR: { monthly: '$9.99', yearly: '$99.90' },
    ENTERPRISE: { monthly: '$24.99', yearly: '$249.90' }
  };

  const cost = prices[tier.toUpperCase()]?.[cycle.toLowerCase()] || '$4.99';

  const mockInvoices = [
    {
      id: `INV-2026-${Math.floor(Math.random() * 9000) + 1000}`,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
      amount: cost,
      plan: `Economical Research ${tier.toUpperCase()} (${cycle.toUpperCase()})`,
      status: 'Paid',
      method: 'Stripe Credit (Card Ending 4242)'
    }
  ];

  res.json(mockInvoices);
});

// 4. STRIPE STATUS FLAG QUERY
router.get('/config-status', (req, res) => {
  res.json({ isStripeConfigured });
});

export default router;
