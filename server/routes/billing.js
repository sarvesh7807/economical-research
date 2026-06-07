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
  const { plan, userId, email } = req.body;

  if (!plan || !userId) {
    return res.status(400).json({ error: 'Plan and User ID required' });
  }

  const isMonthly = plan.toLowerCase() === 'monthly';
  const priceAmount = isMonthly ? 499 : 3999; // $4.99 or $39.99 in cents
  
  if (!stripe) {
    // Return mock checkout URL
    console.log(`Stripe is in sandbox mode. Creating mock session for ${email || 'guest'}`);
    const mockSessionId = `mock_sess_${Date.now()}`;
    return res.json({
      url: `${req.headers.origin}/billing/success?session_id=${mockSessionId}&plan=${plan}`,
      mock: true
    });
  }

  try {
    // Real Stripe Checkout Session creation
    // For production, create a product and price in your Stripe dashboard first.
    // Here we use ad-hoc line item parameters for convenience:
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Economical Research PRO - ${isMonthly ? 'Monthly' : 'Annual'} Subscription`,
              description: 'Unlimited news articles, full AI summaries, and ER Research Mode.',
            },
            unit_amount: priceAmount,
            recurring: {
              interval: isMonthly ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        email,
        plan
      },
      mode: 'subscription',
      success_url: `${req.headers.origin}?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
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
    // Simulated successful checkout session response
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
      customer_email: session.customer_details?.email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. RETRIEVE BILLING HISTORY / INVOICES
router.get('/invoices', async (req, res) => {
  const { email } = req.query;

  // Since this is a demonstration setup, we return structured mock invoice lists
  // representing payments made to the platform, ensuring the billing history page renders nicely.
  const now = new Date();
  const mockInvoices = [
    {
      id: `INV-2026-${Math.floor(Math.random() * 9000) + 1000}`,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
      amount: '$4.99',
      plan: 'Economical Research PRO (Monthly)',
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
