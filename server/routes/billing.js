import express from 'express';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

// Initialize Razorpay credentials
const rzpKeyId = process.env.RAZORPAY_KEY_ID;
const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;
const isRazorpayConfigured = rzpKeyId && rzpKeyId.trim() !== '' && rzpKeySecret && rzpKeySecret.trim() !== '';

// Helper to get authorization header for Razorpay
const getAuthHeader = () => {
  if (!isRazorpayConfigured) return '';
  return 'Basic ' + Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64');
};

// 1. CREATE RAZORPAY ORDER
router.post('/create-razorpay-order', async (req, res) => {
  const { planId, cycle, userId, email } = req.body;

  if (!planId || !cycle || !userId) {
    return res.status(400).json({ error: 'Plan ID, Cycle, and User ID required' });
  }

  // Price mapping in INR
  const prices = {
    pro: { monthly: 399, yearly: 3990 },
    scholar: { monthly: 799, yearly: 7990 },
    enterprise: { monthly: 1999, yearly: 19990 }
  };

  const key = planId.toLowerCase();
  const cycleKey = cycle.toLowerCase();

  if (!prices[key] || !prices[key][cycleKey]) {
    return res.status(400).json({ error: 'Invalid plan ID or billing cycle' });
  }

  // Razorpay accepts amount in paise (1 INR = 100 Paise)
  const priceAmountInPaise = prices[key][cycleKey] * 100;

  if (!isRazorpayConfigured) {
    // Return mock order details
    console.log(`Razorpay is in sandbox mode. Creating mock order for ${email || 'guest'} on ${planId} (${cycle})`);
    const mockOrderId = `mock_order_${Date.now()}`;
    return res.json({
      id: mockOrderId,
      amount: priceAmountInPaise,
      currency: 'INR',
      mock: true
    });
  }

  try {
    const authHeader = getAuthHeader();
    const response = await axios.post(
      'https://api.razorpay.com/v1/orders',
      {
        amount: priceAmountInPaise,
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`,
        notes: {
          userId,
          email,
          planId,
          cycle
        }
      },
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      id: response.data.id,
      amount: response.data.amount,
      currency: response.data.currency
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initiate Razorpay order.' });
  }
});

// 2. VERIFY RAZORPAY SIGNATURE & PAYMENT
router.post('/verify-razorpay-payment', (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    planId,
    cycle
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment signature components' });
  }

  if (razorpay_order_id.startsWith('mock_')) {
    // Simulated successful verification
    return res.json({
      status: 'complete',
      verified: true
    });
  }

  if (!isRazorpayConfigured) {
    return res.status(400).json({ error: 'Razorpay credentials not loaded and request is not mock' });
  }

  try {
    // Generate signature locally using Key Secret
    const signData = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', rzpKeySecret)
      .update(signData)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      res.json({
        status: 'complete',
        verified: true
      });
    } else {
      res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
    }
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
    PRO: { monthly: '₹399', yearly: '₹3,990' },
    SCHOLAR: { monthly: '₹799', yearly: '₹7,990' },
    ENTERPRISE: { monthly: '₹1,999', yearly: '₹19,990' }
  };

  const cost = prices[tier.toUpperCase()]?.[cycle.toLowerCase()] || '₹399';

  const mockInvoices = [
    {
      id: `INV-2026-RZP-${Math.floor(Math.random() * 9000) + 1000}`,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
      amount: cost,
      plan: `Economical Research ${tier.toUpperCase()} (${cycle.toUpperCase()})`,
      status: 'Paid',
      method: 'Razorpay UPI / Card Transfer'
    }
  ];

  res.json(mockInvoices);
});

// 4. RAZORPAY CONFIG STATUS FLAG
router.get('/config-status', (req, res) => {
  res.json({ isStripeConfigured: isRazorpayConfigured }); // Keeping Stripe name to match current client mount
});

export default router;
