import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheck, CreditCard, Receipt, Lock, Check, 
  AlertCircle, Loader, ArrowLeft, ToggleLeft, ToggleRight, Sparkles 
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import confetti from 'canvas-confetti';
export default function Billing({ setView }) {
  const { user, subscription, upgradeToPro, cancelSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Billing cycle state
  const [cycle, setCycle] = useState('monthly'); // 'monthly' or 'yearly'

  useEffect(() => {
    if (showSuccessPopup) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      const timer = setTimeout(() => {
        setView('profile');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup, setView]);

  // Razorpay config status from backend (uses isStripeConfigured legacy state)
  const [isRazorpayConfigured, setIsRazorpayConfigured] = useState(true);
  
  // Waitlist form states
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState(user?.email || '');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [selectedPlanForWaitlist, setSelectedPlanForWaitlist] = useState('PRO');

  const activeTier = subscription?.tier || 'Basic';

  // Helper to load Razorpay script only on demand
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

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

  const handlePaymentSuccess = async (paymentId, orderId, planId, cycle) => {
    // 1. Save Transaction to Firestore
    try {
      const selectedPlan = planList.find(p => p.id === planId) || planList.find(p => p.id === 'PRO');
      const amount = cycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
      const planName = `ER ${selectedPlan.name.replace('ER ', '')}`;

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Subscriber',
        plan: planName,
        amount: amount,
        currency: 'INR',
        paymentId: paymentId,
        orderId: orderId,
        status: 'success',
        date: new Date(),
        billingCycle: cycle
      });
      console.log('Transaction saved to Firestore successfully.');
      if (window.gtag) {
        window.gtag('event', 'purchase', {
          transaction_id: orderId || paymentId,
          value: amount,
          currency: 'INR',
          items: [{
            item_id: planId,
            item_name: planName,
            price: amount,
            quantity: 1
          }]
        });
      }
    } catch (dbErr) {
      console.error('Error saving transaction to Firestore:', dbErr);
    }

    // 2. Trigger Confetti and Success Popup
    setShowSuccessPopup(true);

    // 3. Send Email Receipt via EmailJS
    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_default';
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_default';
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key_default';

      const selectedPlan = planList.find(p => p.id === planId) || planList.find(p => p.id === 'PRO');
      const amount = cycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
      const planName = `ER ${selectedPlan.name.replace('ER ', '')}`;

      // Email template params matching the request
      const templateParams = {
        to_email: user.email,
        to_name: user.displayName || 'Subscriber',
        plan_name: planName,
        amount: `INR ${amount}`,
        payment_id: paymentId,
        date: new Date().toLocaleDateString(),
        company_name: 'Economical Research'
      };

      // Send to customer
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log('Customer receipt email sent successfully.');

      // Send copy to admin
      const adminParams = {
        ...templateParams,
        to_email: 'sarveshdusane7807@gmail.com',
        to_name: 'Admin',
        admin_subject: `New PRO Subscription - ${user.displayName || 'Subscriber'}`
      };
      await emailjs.send(serviceId, templateId, adminParams, publicKey);
      console.log('Admin notification email sent successfully.');
    } catch (emailErr) {
      console.error('EmailJS notification dispatch error:', emailErr);
    }
  };

  const handleCheckout = async (planId, forceSandbox = false) => {
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', {
        plan_id: planId,
        checkout_cycle: cycle,
        force_sandbox: forceSandbox
      });
    }

    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
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

    // Lazy load Razorpay script on demand
    const scriptLoaded = await loadRazorpay();
    if (!scriptLoaded && !forceSandbox) {
      setError('Razorpay SDK failed to load. Please verify your internet connection.');
      setLoading(false);
      return;
    }

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
              await upgradeToPro(planId, cycle);
              await handlePaymentSuccess(
                paymentRes.razorpay_payment_id,
                paymentRes.razorpay_order_id,
                planId,
                cycle
              );
            } else {
              setError('Payment verification failed.');
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            // Fallback for sandboxes
            if (order.mock) {
              await upgradeToPro(planId, cycle);
              await handlePaymentSuccess(
                paymentRes.razorpay_payment_id,
                paymentRes.razorpay_order_id,
                planId,
                cycle
              );
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

    if (window.gtag) {
      window.gtag('event', 'join_waitlist', {
        plan_id: selectedPlanForWaitlist,
        waitlist_email: waitlistEmail.trim()
      });
    }

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
        class="inline-flex items-center gap-2 text-xs font-bold text-navy hover:text-primary dark:text-gray-300 dark:hover:text-primary uppercase tracking-widest mb-8 transition-colors font-display bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full hover:shadow-neon"
      >
        <ArrowLeft size={14} />
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
      <div class="text-center max-w-3xl mx-auto mb-12">
        <span class="text-xs font-black uppercase tracking-widest text-primary font-mono block mb-3 animate-pulse">economical research press ledger</span>
        <h1 class="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-navy to-primary dark:from-white dark:to-gray-400 drop-shadow-md">
          Subscribers Access Console
        </h1>
        <p class="mt-4 text-sm md:text-base leading-relaxed text-gray-500 font-sans max-w-2xl mx-auto">
          Lift article paywalls, unlock our AI-powered economic chatbot, and generate detailed PDF intelligence reports directly from global desks. Supporting Indian Rupee payment checkouts.
        </p>
      </div>

      {/* 3. CURRENT PLAN PANEL */}
      <div class="glass-card p-6 md:p-8 rounded-md mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-3d-light dark:shadow-3d-dark border border-white/20">
        <div>
          <span class="text-xs uppercase font-bold text-gray-500 block font-mono mb-2">Current Active Desk Profile</span>
          <div class="flex items-center gap-3 mt-1">
            <span class="font-display text-2xl font-black text-navy dark:text-white uppercase tracking-tight">
              {activeTier === 'Basic' ? 'ER Basic (Free Tier)' : `ER ${activeTier} Press Tier`}
            </span>
            {activeTier !== 'Basic' && (
              <span class="bg-primary/20 text-primary dark:text-accent-neon text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider font-mono border border-primary/30 shadow-neon">
                PRO USER
              </span>
            )}
          </div>
          <p class="text-sm text-gray-500 mt-2 max-w-md font-sans">
            {activeTier === 'Basic' 
              ? 'You are on the standard ad-supported reading profile. Upgrade to remove limits.' 
              : `Renews via Razorpay on ${subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Next Month'}. Billing cycle: ${subscription.plan || 'monthly'}.`}
          </p>
          {user && (
            <button 
              onClick={() => setView('billing-history')}
              class="mt-3 text-xs font-bold text-navy hover:text-navy-light dark:text-gold dark:hover:text-gold/80 flex items-center gap-1 uppercase tracking-wider font-mono bg-navy/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-navy/10 dark:border-white/10 transition-colors"
            >
              <Receipt size={12} /> View Billing & Receipt History
            </button>
          )}
        </div>
        {activeTier !== 'Basic' && (
          <button
            onClick={handleCancel}
            disabled={loading}
            class="px-6 py-3 bg-red-50 hover:bg-red-500 dark:bg-red-500/10 dark:hover:bg-red-500 text-red-600 hover:text-white border border-red-200 dark:border-red-500/30 rounded-md text-xs font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-lg"
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
              class={`glass-card p-6 md:p-8 flex flex-col justify-between relative transition-all duration-300 hover:-translate-y-2 ${
                plan.isPopular 
                  ? 'rounded-md border-2 border-primary shadow-purple-glow ring-2 ring-primary/20 scale-105 z-10' 
                  : 'rounded-md border border-gray-200 dark:border-white/10 shadow-lg'
              }`}
            >
              {plan.isPopular && (
                <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-accent-purple text-white font-black uppercase text-[10px] tracking-widest px-4 py-1 rounded-full shadow-neon font-mono whitespace-nowrap">
                  Most Popular
                </div>
              )}

              <div>
                <span class="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono block mb-2">{plan.subText}</span>
                <h3 class="font-display text-xl font-black text-navy dark:text-white uppercase mb-4 flex items-center gap-2">
                  {plan.name}
                  {plan.id === 'SCHOLAR' && <Sparkles size={16} class="text-accent-pink animate-pulse" />}
                </h3>
                <div class="flex items-baseline gap-1 mb-6">
                  <span class="text-4xl font-black font-display tracking-tight text-navy dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-navy to-primary dark:from-white dark:to-gray-300">
                    ₹{displayPrice.toLocaleString('en-IN')}
                  </span>
                  <span class="text-xs text-gray-400 font-bold uppercase">/{cycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>

                <ul class="space-y-4 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-white/10 pt-6 mb-8 font-sans">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} class="flex items-start gap-3">
                      <Check size={18} class={`shrink-0 mt-0.5 ${plan.isPopular ? 'text-primary' : 'text-green-500'}`} />
                      <span class="leading-relaxed">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {plan.id === 'BASIC' ? (
                <button
                  disabled
                  class="w-full bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 font-bold text-xs uppercase py-4 rounded-md cursor-not-allowed font-mono tracking-widest"
                >
                  {isCurrentPlan ? 'Current Plan' : 'Free tier'}
                </button>
              ) : (
                <button
                  onClick={() => isCurrentPlan ? null : handleCheckout(plan.id)}
                  disabled={loading || isCurrentPlan}
                  class={`w-full text-xs font-black uppercase py-4 rounded-md tracking-widest transition-all font-mono ${
                    isCurrentPlan
                      ? 'bg-gray-100 dark:bg-white/5 text-gray-500 cursor-not-allowed border border-transparent'
                      : plan.isPopular
                        ? 'bg-gradient-to-r from-primary to-accent-purple hover:from-primary-glow hover:to-accent-pink text-white shadow-purple-glow hover:scale-[1.02]'
                        : 'bg-navy dark:bg-white/10 hover:bg-primary dark:hover:bg-white/20 text-white dark:text-white border border-transparent hover:scale-[1.02] shadow-lg'
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          paddingBottom: '12px',
          borderBottom: '2px solid var(--gold-primary)'
        }}>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '20px',
            color: '#fff',
            margin: 0,
            fontWeight: '700'
          }}>Plan Feature Comparison</h2>
        </div>
        
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
                  <td class="px-4 py-2.5 font-bold">AI Chatbot Queries</td>
                  <td class="px-4 py-2.5">21 Total (Lifetime)</td>
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          paddingBottom: '12px',
          borderBottom: '2px solid var(--gold-primary)'
        }} className="select-none">
          <Receipt size={16} style={{ color: 'var(--gold-primary)' }} />
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '20px',
            color: '#fff',
            margin: 0,
            fontWeight: '700'
          }}>Filing Ledger & Invoice Records</h2>
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

      {/* 8. INSTANT SUCCESS MODAL OVERLAY */}
      {showSuccessPopup && (
        <div class="fixed inset-0 z-50 bg-[#07111E]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div class="glass-card max-w-md w-full p-8 rounded-md border border-gold/30 text-center relative overflow-hidden shadow-2xl bg-navy/80">
            {/* Confetti effect is triggered on load */}
            <div class="absolute -top-12 -left-12 w-24 h-24 bg-gold/10 rounded-full blur-2xl"></div>
            <div class="absolute -bottom-12 -right-12 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
            
            <div class="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/30 shadow-md">
              <Sparkles size={30} class="animate-pulse" />
            </div>
            
            <h2 class="font-serif text-2xl font-black text-white uppercase tracking-wider mb-2">
              🎉 Payment Successful!
            </h2>
            <h3 class="font-serif text-base font-bold text-gold uppercase tracking-widest mb-4">
              Welcome to ER PRO
            </h3>
            
            <p class="text-xs text-gray-350 leading-relaxed font-sans max-w-xs mx-auto mb-6">
              Your premium subscription profile is now fully active. All reading limits and AI assistant paywalls have been lifted.
            </p>
            
            <div class="bg-white/5 border border-white/10 rounded-md p-3 mb-6 text-[10px] font-mono text-gray-400">
              Receipt statement has been sent to your email.
            </div>

            <div class="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 font-mono">
              <span class="inline-block w-2 h-2 rounded-full bg-gold animate-ping"></span>
              Redirecting to profile in a moment...
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
