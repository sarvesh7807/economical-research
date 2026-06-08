import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheck, CreditCard, Receipt, Lock, Check, 
  AlertCircle, Loader, ArrowLeft, ToggleLeft, ToggleRight, Sparkles 
} from 'lucide-react';

export default function Billing({ setView }) {
  const { user, subscription, upgradeToPro, cancelSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Billing cycle state
  const [cycle, setCycle] = useState('monthly'); // 'monthly' or 'yearly'

  // Razorpay config status from backend (uses isStripeConfigured legacy state)
  const [isRazorpayConfigured, setIsRazorpayConfigured] = useState(true);
  
  // Waitlist form states
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState(user?.email || '');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [selectedPlanForWaitlist, setSelectedPlanForWaitlist] = useState('PRO');

  const activeTier = subscription?.tier || 'Basic';

  // Load Razorpay Script Dynamically on Mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch Razorpay config status on mount
  useEffect(() => {
    fetch('/api/billing/config-status')
      .then(res => res.json())
      .then(data => setIsRazorpayConfigured(data.isStripeConfigured))
      .catch(err => {
        console.error('Error fetching billing config status:', err);
        setIsRazorpayConfigured(false); // Fallback to Coming Soon waitlist
      });
  }, []);

  // Load Invoice logs from backend
  useEffect(() => {
    if (!user) return;
    setLoadingInvoices(true);
    fetch(`/api/billing/invoices?email=${encodeURIComponent(user.email)}&tier=${activeTier}&cycle=${subscription?.plan || 'monthly'}`)
      .then(res => res.json())
      .then(data => {
        setInvoices(data);
        setLoadingInvoices(false);
      })
      .catch(err => {
        console.error('Error fetching invoices:', err);
        setLoadingInvoices(false);
      });
  }, [user, subscription]);

  const handleCheckout = async (planId, forceSandbox = false) => {
    if (!user) {
      setError('You must log in or register an account before subscribing to a plan.');
      return;
    }

    // If Razorpay is not configured, show Coming Soon Waitlist form
    if (!isRazorpayConfigured && !forceSandbox) {
      setSelectedPlanForWaitlist(planId);
      setShowWaitlist(true);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 1. Create Razorpay Order
      const response = await fetch('/api/billing/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planId,
          cycle: cycle,
          userId: user.uid,
          email: user.email
        })
      });

      if (!response.ok) throw new Error('Order creation failed');
      const order = await response.json();

      // 2. Razorpay Options Config
      const options = {
        key: order.mock ? 'rzp_test_mockkey' : 'rzp_live_Sz6R98zZyCDyWK',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'SARVESH HEMANT DUSANE',
        description: `ER ${planId.toUpperCase()} Subscription`,
        image: '/logo.png',
        order_id: order.id,
        handler: async function (paymentRes) {
          // Success callback
          setLoading(true);
          try {
            const verifyRes = await fetch('/api/billing/verify-razorpay-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: paymentRes.razorpay_order_id,
                razorpay_payment_id: paymentRes.razorpay_payment_id,
                razorpay_signature: paymentRes.razorpay_signature,
                planId: planId,
                cycle: cycle
              })
            });

            if (!verifyRes.ok) throw new Error('Signature verification call failed');
            const verification = await verifyRes.json();

            if (verification.verified) {
              upgradeToPro(planId, cycle);
              setSuccessMessage(`Upgrade successful! Welcome to Economical Research ${planId.toUpperCase()} (${cycle}).`);
              setTimeout(() => setSuccessMessage(null), 8000);
            } else {
              setError('Payment verification failed.');
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            // Fallback for sandboxes
            if (order.mock) {
              upgradeToPro(planId, cycle);
              setSuccessMessage(`Sandbox upgrade completed successfully! Welcome to ER ${planId.toUpperCase()} (${cycle}).`);
              setTimeout(() => setSuccessMessage(null), 8000);
            } else {
              setError('Verification error. Payment was completed but signature check failed.');
            }
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || ''
        },
        notes: {
          userId: user.uid,
          planId: planId,
          cycle: cycle
        },
        theme: {
          color: '#0A1628' // Navy blue
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError('Payment cancelled. Checkout window closed.');
            setTimeout(() => setError(null), 5000);
          }
        }
      };

      // 3. Open checkout modal
      if (order.mock && forceSandbox) {
        // Sandbox checkout bypasses iframe loading
        const mockVerifyResponse = {
          razorpay_order_id: order.id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature'
        };
        setTimeout(() => {
          options.handler(mockVerifyResponse);
        }, 1500);
      } else {
        if (window.Razorpay) {
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          throw new Error('Razorpay SDK failed to load. Please verify your internet connection.');
        }
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'Razorpay order currently unavailable. Please attempt later.');
      setLoading(false);
    }
  };

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;

    // Save waitlist email locally
    const saved = JSON.parse(localStorage.getItem('er_pro_waitlist') || '[]');
    if (!saved.some(item => item.email === waitlistEmail.trim() && item.plan === selectedPlanForWaitlist)) {
      saved.push({ email: waitlistEmail.trim(), plan: selectedPlanForWaitlist, timestamp: new Date().toISOString() });
      localStorage.setItem('er_pro_waitlist', JSON.stringify(saved));
    }

    setWaitlistSuccess(true);
    setTimeout(() => {
      setWaitlistSuccess(false);
      setShowWaitlist(false);
    }, 3500);
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel your premium subscription plan? You will immediately lose access to premium INR intelligence briefs.')) {
      setLoading(true);
      try {
        await cancelSubscription();
        setSuccessMessage('Subscription successfully cancelled. Your account has been reverted to the Basic tier.');
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err) {
        console.error(err);
        setError('Failed to cancel subscription.');
      } finally {
        setLoading(false);
      }
    }
  };

  const planList = [
    {
      id: 'BASIC',
      name: 'ER Basic',
      subText: 'Free news wire reader',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        '10 article reads per day limit',
        'Standard ad displays',
        '3 AI summaries per day limit',
        'Access to basic chatbot drawer'
      ],
      buttonText: 'Current Plan',
      isPopular: false
    },
    {
      id: 'PRO',
      name: 'ER Pro',
      subText: 'For active news followers',
      monthlyPrice: 399,
      yearlyPrice: 3990,
      features: [
        'Unlimited news article access',
        '100% Ad-Free reading experience',
        'Unlimited AI summaries & chat queries',
        'Interactive Research Mode panel',
        'Download articles as premium JPG',
        'Priority email desk support'
      ],
      buttonText: 'Upgrade to PRO',
      isPopular: true
    },
    {
      id: 'SCHOLAR',
      name: 'ER Scholar',
      subText: 'For deep analytical research',
      monthlyPrice: 799,
      yearlyPrice: 7990,
      features: [
        'Everything included in ER PRO',
        'Detailed Deep Research Reports',
        'Export reports & articles as PDF',
        'Academic style source citation indexes',
        'Full interactive data visualizations',
        'Exclusive research-grade briefs',
        'Early access to newly deployed features'
      ],
      buttonText: 'Upgrade to Scholar',
      isPopular: false
    },
    {
      id: 'ENTERPRISE',
      name: 'ER Enterprise',
      subText: 'For corporate teams & APIs',
      monthlyPrice: 1999,
      yearlyPrice: 19990,
      features: [
        'Everything in ER SCHOLAR',
        'Multi-user team desk seat (5 users)',
        'Custom SMS/Email news alerts',
        'Developer API endpoint key access',
        'White label editorial report exports',
        'Dedicated account manager support',
        'Custom corporate branding on PDFs',
        'Advanced visual analytics dashboard'
      ],
      buttonText: 'Upgrade to Enterprise',
      isPopular: false
    }
  ];

  return (
    <div class="max-w-6xl mx-auto px-4 md:px-6 py-8 font-sans select-none text-navy dark:text-gray-150">
      
      {/* 1. BACK CONTROLLER */}
      <button 
        onClick={() => setView('feed')}
        class="inline-flex items-center gap-1.5 text-[10px] font-black text-navy hover:text-gold dark:text-gray-300 dark:hover:text-gold uppercase tracking-widest mb-6 transition-colors font-mono"
      >
        <ArrowLeft size={12} />
        <span>Return to Wire Feed</span>
      </button>

      {/* Success banner */}
      {successMessage && (
        <div class="mb-6 bg-green-500/10 border border-green-500/40 text-green-700 dark:text-green-400 text-xs font-semibold px-4 py-3.5 rounded-lg flex items-center gap-2 animate-[pulse_2s_infinite]">
          <ShieldCheck size={16} class="shrink-0 text-green-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div class="mb-6 bg-red-500/10 border border-red-500/40 text-red-655 dark:text-red-400 text-xs font-bold px-4 py-3.5 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} class="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. HEADER INTRO */}
      <div class="text-center max-w-2xl mx-auto mb-10">
        <span class="text-[9px] font-black uppercase tracking-widest text-gold font-mono block mb-1">economical research press ledger</span>
        <h1 class="font-serif text-3xl md:text-4xl font-black uppercase tracking-tight text-navy dark:text-gold">Subscribers Access Console</h1>
        <p class="mt-2.5 text-[11px] leading-relaxed text-gray-400 font-serif max-w-lg mx-auto">
          Lift article paywalls, unlock our Claude-style economic chatbot, and generate detailed PDF intelligence reports directly from global desks. Supporting Indian Rupee payment checkouts.
        </p>
      </div>

      {/* 3. CURRENT PLAN PANEL */}
      <div class="bg-white dark:bg-[#0A1628]/40 border border-paper-border dark:border-paper-borderDark rounded-lg p-5 shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="text-[8.5px] uppercase font-bold text-gray-455 block font-mono">Current Active Desk Profile</span>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="font-serif text-lg font-black text-navy dark:text-gold uppercase tracking-wide">
              {activeTier === 'Basic' ? 'ER Basic (Free Tier)' : `ER ${activeTier} Press Tier`}
            </span>
            {activeTier !== 'Basic' && (
              <span class="bg-gold/15 text-gold-dark dark:text-gold text-[8.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono border border-gold/10">PRO USER</span>
            )}
          </div>
          <p class="text-[10px] text-gray-400 mt-1 max-w-md">
            {activeTier === 'Basic' 
              ? 'You are on the standard ad-supported reading profile. Upgrade to remove limits.' 
              : `Renews via Razorpay on ${subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Next Month'}. Billing cycle: ${subscription.plan || 'monthly'}.`}
          </p>
        </div>
        {activeTier !== 'Basic' && (
          <button
            onClick={handleCancel}
            disabled={loading}
            class="px-4 py-2 bg-red-655/10 hover:bg-red-650 text-red-600 hover:text-white border border-red-600/35 rounded text-[10px] font-black uppercase tracking-widest transition-all"
          >
            {loading ? 'Processing...' : 'Cancel subscription'}
          </button>
        )}
      </div>

      {/* 4. BILLING CYCLE TOGGLE */}
      <div class="flex items-center justify-center gap-3 mb-10 select-none">
        <span class={`text-[10.5px] font-bold uppercase tracking-wider transition-colors ${cycle === 'monthly' ? 'text-navy dark:text-gold' : 'text-gray-400'}`}>Monthly</span>
        <button 
          onClick={() => setCycle(cycle === 'monthly' ? 'yearly' : 'monthly')}
          class="text-navy dark:text-gold transition-transform hover:scale-105"
        >
          {cycle === 'monthly' ? (
            <ToggleLeft size={36} strokeWidth={1.5} />
          ) : (
            <ToggleRight size={36} strokeWidth={1.5} />
          )}
        </button>
        <div class="flex items-center gap-1.5">
          <span class={`text-[10.5px] font-bold uppercase tracking-wider transition-colors ${cycle === 'yearly' ? 'text-navy dark:text-gold' : 'text-gray-400'}`}>Yearly</span>
          <span class="bg-green-500/10 text-green-600 dark:text-green-400 text-[8.5px] font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-wider border border-green-500/10">Save 17%</span>
        </div>
      </div>

      {/* 5. PRICING CARDS GRID */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-14">
        {planList.map((plan) => {
          const isCurrentPlan = activeTier.toUpperCase() === plan.id;
          const displayPrice = cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          
          return (
            <div 
              key={plan.id}
              class={`bg-white dark:bg-paper-cardDark border rounded-lg p-5 flex flex-col justify-between relative transition-all duration-300 hover:-translate-y-1 ${
                plan.isPopular 
                  ? 'border-2 border-gold shadow-lg ring-1 ring-gold/25' 
                  : 'border-paper-border dark:border-paper-borderDark shadow-sm'
              }`}
            >
              {plan.isPopular && (
                <div class="absolute top-0 right-5 transform -translate-y-1/2 bg-gold text-navy font-black uppercase text-[8.5px] tracking-widest px-2.5 py-0.5 rounded-full shadow-sm font-mono">
                  Most Popular
                </div>
              )}

              <div>
                <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono block mb-1">{plan.subText}</span>
                <h3 class="font-serif text-base font-black text-navy dark:text-white uppercase mb-2 flex items-center gap-1.5">
                  {plan.name}
                  {plan.id === 'SCHOLAR' && <Sparkles size={13} class="text-gold animate-pulse" />}
                </h3>
                <div class="flex items-baseline gap-0.5 mb-5">
                  <span class="text-3xl font-black font-mono tracking-tight text-navy dark:text-white">₹{displayPrice.toLocaleString('en-IN')}</span>
                  <span class="text-[10px] text-gray-400 font-semibold uppercase">/{cycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>

                <ul class="space-y-2.5 text-[11px] text-gray-650 dark:text-gray-300 border-t border-paper-border dark:border-paper-borderDark pt-4 mb-6 leading-snug">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} class="flex items-start gap-1.5">
                      <Check size={13} class={`shrink-0 mt-0.5 ${plan.isPopular ? 'text-gold' : 'text-green-500'}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {plan.id === 'BASIC' ? (
                <button
                  disabled
                  class="w-full bg-gray-100 dark:bg-gray-800 text-gray-450 dark:text-gray-500 font-bold text-[10px] uppercase py-2.5 rounded-lg cursor-not-allowed font-mono tracking-widest"
                >
                  {isCurrentPlan ? 'Current Plan' : 'Free tier'}
                </button>
              ) : (
                <button
                  onClick={() => isCurrentPlan ? null : handleCheckout(plan.id)}
                  disabled={loading || isCurrentPlan}
                  class={`w-full text-[10px] font-black uppercase py-2.5 rounded-lg tracking-widest transition-all shadow-sm font-mono ${
                    isCurrentPlan
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed border border-transparent'
                      : plan.isPopular
                        ? 'bg-gold hover:bg-gold-light text-navy border border-gold/25 hover:scale-[1.02]'
                        : 'bg-navy hover:bg-navy-light text-gold border border-gold/15 hover:scale-[1.02]'
                  }`}
                >
                  {loading ? 'Initiating...' : isCurrentPlan ? 'Current Plan' : plan.buttonText}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 6. FEATURE COMPARISON TABLE */}
      <div class="mb-14 select-none">
        <h3 class="font-serif text-base font-black text-navy dark:text-gold uppercase tracking-wider mb-4 border-b border-paper-border dark:border-paper-borderDark pb-2 flex items-center gap-1.5">
          <span>Plan Feature comparison</span>
        </h3>
        
        <div class="border border-paper-border dark:border-paper-borderDark rounded-lg overflow-hidden font-sans">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-[10.5px]">
              <thead>
                <tr class="bg-gray-50 dark:bg-navy text-navy dark:text-gold uppercase font-black tracking-wider border-b border-paper-border dark:border-paper-borderDark">
                  <th class="px-4 py-3">Core features</th>
                  <th class="px-4 py-3">ER Basic</th>
                  <th class="px-4 py-3">ER Pro</th>
                  <th class="px-4 py-3">ER Scholar</th>
                  <th class="px-4 py-3">ER Enterprise</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                <tr>
                  <td class="px-4 py-2.5 font-bold">Daily Article Reads</td>
                  <td class="px-4 py-2.5">10 Articles</td>
                  <td class="px-4 py-2.5 text-gold font-bold">Unlimited</td>
                  <td class="px-4 py-2.5 text-gold font-bold">Unlimited</td>
                  <td class="px-4 py-2.5 text-gold font-bold">Unlimited</td>
                </tr>
                <tr>
                  <td class="px-4 py-2.5 font-bold">Ad integration</td>
                  <td class="px-4 py-2.5">Ad Supported</td>
                  <td class="px-4 py-2.5">Ad Free</td>
                  <td class="px-4 py-2.5">Ad Free</td>
                  <td class="px-4 py-2.5">Ad Free</td>
                </tr>
                <tr>
                  <td class="px-4 py-2.5 font-bold">Daily AI Summaries</td>
                  <td class="px-4 py-2.5">3 Queries</td>
                  <td class="px-4 py-2.5 text-gold font-bold">Unlimited</td>
                  <td class="px-4 py-2.5 text-gold font-bold">Unlimited</td>
                  <td class="px-4 py-2.5 text-gold font-bold">Unlimited</td>
                </tr>
                <tr>
                  <td class="px-4 py-2.5 font-bold">Chatbot Assistance</td>
                  <td class="px-4 py-2.5">Basic Drawer</td>
                  <td class="px-4 py-2.5 font-semibold">Workspace Drawer</td>
                  <td class="px-4 py-2.5 font-semibold">Workspace + Splits</td>
                  <td class="px-4 py-2.5 font-semibold">Workspace + Splits</td>
                </tr>
                <tr>
                  <td class="px-4 py-2.5 font-bold">Economic Research Mode</td>
                  <td class="px-4 py-2.5">❌</td>
                  <td class="px-4 py-2.5">✓ Standard</td>
                  <td class="px-4 py-2.5 text-gold font-bold">✓ Deep Analytical</td>
                  <td class="px-4 py-2.5 text-gold font-bold">✓ Deep Analytical</td>
                </tr>
                <tr>
                  <td class="px-4 py-2.5 font-bold">Report Exports</td>
                  <td class="px-4 py-2.5">❌</td>
                  <td class="px-4 py-2.5">JPG Image</td>
                  <td class="px-4 py-2.5">JPG & PDF Export</td>
                  <td class="px-4 py-2.5">White-Label Custom PDF</td>
                </tr>
                <tr>
                  <td class="px-4 py-2.5 font-bold">Academic Citations</td>
                  <td class="px-4 py-2.5">❌</td>
                  <td class="px-4 py-2.5">❌</td>
                  <td class="px-4 py-2.5">✓ Full Indexes</td>
                  <td class="px-4 py-2.5">✓ Full Indexes</td>
                </tr>
                <tr>
                  <td class="px-4 py-2.5 font-bold">Custom SMS/Email Alerts</td>
                  <td class="px-4 py-2.5">❌</td>
                  <td class="px-4 py-2.5">❌</td>
                  <td class="px-4 py-2.5">❌</td>
                  <td class="px-4 py-2.5 text-gold font-bold">✓ Dedicated custom</td>
                </tr>
                <tr>
                  <td class="px-4 py-2.5 font-bold">Team Desk Seats</td>
                  <td class="px-4 py-2.5">1 seat</td>
                  <td class="px-4 py-2.5">1 seat</td>
                  <td class="px-4 py-2.5">1 seat</td>
                  <td class="px-4 py-2.5 font-semibold">5 Seats Included</td>
                </tr>
                <tr>
                  <td class="px-4 py-2.5 font-bold">Developer API Access</td>
                  <td class="px-4 py-2.5">❌</td>
                  <td class="px-4 py-2.5">❌</td>
                  <td class="px-4 py-2.5">❌</td>
                  <td class="px-4 py-2.5 text-gold font-bold">✓ Full Endpoints</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 7. TRUST AND SECURITY BADGES */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14 text-center select-none font-sans">
        <div class="p-4 bg-white dark:bg-[#0A1628]/35 border border-paper-border dark:border-paper-borderDark rounded-lg">
          <div class="text-gold text-lg mb-1">💳 Razorpay Secure Checkout</div>
          <p class="text-[10px] text-gray-400">Transactions processed securely in India. Supports **UPI (GPay, PhonePe, Paytm)**, Credit/Debit cards, Net Banking, and Wallets.</p>
        </div>
        <div class="p-4 bg-white dark:bg-[#0A1628]/35 border border-paper-border dark:border-paper-borderDark rounded-lg">
          <div class="text-gold text-lg mb-1">🤝 30-Day Guarantee</div>
          <p class="text-[10px] text-gray-400">If you aren't wowed by our deep research reports, contact our desk within 30 days for a full refund.</p>
        </div>
        <div class="p-4 bg-white dark:bg-[#0A1628]/35 border border-paper-border dark:border-paper-borderDark rounded-lg">
          <div class="text-gold text-lg mb-1">📈 Trusted Worldwide</div>
          <p class="text-[10px] text-gray-400">Empowering **10,000+** financial analysts, academic scholars, and monetary researchers global-wide.</p>
        </div>
      </div>

      {/* 8. WAITLIST MODAL OVERLAY */}
      {showWaitlist && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowWaitlist(false)} class="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>
          
          <div class="relative bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark p-6 rounded-lg shadow-2xl max-w-sm w-full text-center space-y-4 z-10 animate-[fadeIn_0.25s_ease-out]">
            <Lock size={26} class="mx-auto text-gold animate-bounce" />
            <h3 class="font-serif text-sm font-black text-navy dark:text-gold uppercase tracking-wider">
              Razorpay Regulatory Setup
            </h3>
            <p class="text-[10px] text-gray-450 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
              Live upgrades to the **ER {selectedPlanForWaitlist}** tier are in regional payment checkups. Join the queue to activate premium access immediately when ready.
            </p>

            {waitlistSuccess ? (
              <span class="block text-xs text-green-500 font-bold uppercase tracking-wider animate-pulse">
                ✓ Registered successfully on Waitlist!
              </span>
            ) : (
              <form onSubmit={handleWaitlistSubmit} class="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email address..."
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  class="flex-grow bg-gray-50 dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                />
                <button
                  type="submit"
                  class="bg-navy hover:bg-navy-light text-gold font-bold px-3 py-1.5 rounded text-[9px] uppercase tracking-widest font-mono"
                >
                  Queue Up
                </button>
              </form>
            )}

            <div class="text-[9.5px] border-t border-gray-150/15 pt-3.5 select-none font-mono">
              <span class="text-gray-450 block mb-1">Evaluate sandbox payment logic:</span>
              <button
                onClick={() => { setShowWaitlist(false); handleCheckout(selectedPlanForWaitlist, true); }}
                class="text-gold hover:underline font-black uppercase tracking-wider text-[8.5px]"
              >
                Simulate Razorpay Sandbox Purchase →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. BILLING HISTORY INVOICE LEDGER */}
      <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded-lg p-5 shadow-sm">
        <div class="border-b border-paper-border dark:border-paper-borderDark pb-2 mb-4 select-none">
          <h3 class="font-serif text-sm font-black text-navy dark:text-gold uppercase tracking-wider flex items-center gap-1.5">
            <Receipt size={14} />
            <span>Filing Ledger & Invoice Records</span>
          </h3>
        </div>

        {loadingInvoices ? (
          <div class="flex items-center justify-center py-6 text-xs text-gray-400 font-bold uppercase tracking-wider gap-2 select-none">
            <Loader size={14} class="animate-spin text-gold" />
            <span>Retrieving Invoice Ledger...</span>
          </div>
        ) : invoices.length === 0 ? (
          <p class="text-[10px] text-gray-455 italic text-center py-4 select-none">No invoice filing records found on register.</p>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-[10px] font-sans text-navy dark:text-gray-300">
              <thead>
                <tr class="border-b border-paper-border dark:border-paper-borderDark text-[8px] uppercase tracking-widest text-gray-455 font-bold select-none">
                  <th class="py-2">Invoice ID</th>
                  <th class="py-2">Date</th>
                  <th class="py-2">Briefing Plan</th>
                  <th class="py-2">Method</th>
                  <th class="py-2">Total Paid</th>
                  <th class="py-2 text-right">Receipt Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-150/10 dark:divide-gray-800">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td class="py-3 font-mono font-bold">{inv.id}</td>
                    <td class="py-3">{new Date(inv.date).toLocaleDateString()}</td>
                    <td class="py-3 font-semibold uppercase">{inv.plan}</td>
                    <td class="py-3 text-gray-400 uppercase text-[9px]">{inv.method}</td>
                    <td class="py-3 font-mono font-bold">{inv.amount}</td>
                    <td class="py-3 text-right">
                      <span class="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded font-black uppercase text-[8px] tracking-wide border border-green-500/5">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
