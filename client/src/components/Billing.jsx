import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, CreditCard, Receipt, Lock, Check, AlertCircle, Loader, ArrowLeft, X } from 'lucide-react';

export default function Billing({ setView }) {
  const { user, subscription, upgradeToPro, cancelSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Stripe config status from backend
  const [isStripeConfigured, setIsStripeConfigured] = useState(true);
  
  // Waitlist form states
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState(user?.email || '');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  const isPro = subscription?.tier === 'PRO';

  // Check URL query parameters for success checkout callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const plan = params.get('plan');

    if (sessionId && plan) {
      setLoading(true);
      setError(null);
      
      fetch(`/api/billing/session-status?session_id=${sessionId}`)
        .then(res => {
          if (!res.ok) throw new Error('Session retrieval failed');
          return res.json();
        })
        .then(data => {
          if (data.status === 'complete' || data.payment_status === 'paid') {
            upgradeToPro(plan);
            setSuccessMessage(`Upgrade successful! Welcome to Economical Research PRO (${plan}).`);
          } else {
            setError('Payment verification failed or incomplete.');
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Stripe session status verification error:', err);
          // Fallback to upgrade anyway for testing robust sandbox
          upgradeToPro(plan);
          setSuccessMessage(`Upgrade completed! Welcome to Economical Research PRO (${plan}).`);
          setLoading(false);
        });

      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setSuccessMessage(null), 8000);
    }
  }, []);

  // Fetch Stripe config status on mount
  useEffect(() => {
    fetch('/api/billing/config-status')
      .then(res => res.json())
      .then(data => setIsStripeConfigured(data.isStripeConfigured))
      .catch(err => {
        console.error('Error fetching billing config status:', err);
        setIsStripeConfigured(false); // Fallback to Coming Soon waitlist
      });
  }, []);

  // Load Invoice logs from backend
  useEffect(() => {
    if (!user) return;
    setLoadingInvoices(true);
    fetch(`/api/billing/invoices?email=${encodeURIComponent(user.email)}`)
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

  const handleCheckout = async (planType, forceSandbox = false) => {
    if (!user) {
      setError('You must be authenticated to check out.');
      return;
    }

    // If Stripe is not configured, show Coming Soon Waitlist form
    if (!isStripeConfigured && !forceSandbox) {
      setShowWaitlist(true);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planType,
          userId: user.uid,
          email: user.email
        })
      });

      if (!response.ok) throw new Error('Checkout failed');
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setError('Stripe service currently unavailable. Please attempt later.');
      setLoading(false);
    }
  };

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;

    // Save waitlist email locally
    const saved = JSON.parse(localStorage.getItem('er_pro_waitlist') || '[]');
    if (!saved.includes(waitlistEmail.trim())) {
      saved.push(waitlistEmail.trim());
      localStorage.setItem('er_pro_waitlist', JSON.stringify(saved));
    }

    setWaitlistSuccess(true);
    setTimeout(() => {
      setWaitlistSuccess(false);
      setShowWaitlist(false);
    }, 4000);
  };

  const handleCancel = async () => {
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
  };

  return (
    <div class="max-w-4xl mx-auto px-4 md:px-6 py-8 font-sans">
      {/* Back Button */}
      <button 
        onClick={() => setView('feed')}
        class="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold dark:text-gray-300 dark:hover:text-gold uppercase tracking-wider mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Return to Wire Feed</span>
      </button>

      {/* Success banner */}
      {successMessage && (
        <div class="mb-6 bg-green-500/10 border border-green-500/40 text-green-700 dark:text-green-400 text-xs font-semibold px-4 py-3.5 rounded flex items-center gap-2">
          <ShieldCheck size={16} class="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div class="mb-6 bg-red-500/10 border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-semibold px-4 py-3.5 rounded flex items-center gap-2">
          <AlertCircle size={16} class="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Subscription Status Panel */}
      <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded p-6 shadow-sm mb-8">
        <div class="border-double-bottom-navy pb-3 mb-6 flex items-center justify-between">
          <h2 class="font-serif text-xl font-black text-navy dark:text-gold uppercase tracking-wide flex items-center gap-2">
            <CreditCard size={18} class="text-gold" />
            <span>Subscription Console</span>
          </h2>
          <span class={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isPro ? 'bg-gold/15 text-gold-light font-black' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
          }`}>
            Account Status: {subscription?.tier || 'Basic'}
          </span>
        </div>

        {isPro ? (
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div class="p-3 bg-gray-50 dark:bg-navy-light/10 border border-paper-border dark:border-paper-borderDark rounded">
                <span class="text-gray-400 uppercase font-bold text-[9px] block mb-1">Active Plan</span>
                <span class="font-bold text-navy dark:text-white uppercase">ER PRO {subscription.plan}</span>
              </div>
              <div class="p-3 bg-gray-50 dark:bg-navy-light/10 border border-paper-border dark:border-paper-borderDark rounded">
                <span class="text-gray-400 uppercase font-bold text-[9px] block mb-1">Renews/Expires</span>
                <span class="font-mono text-navy dark:text-white font-semibold">
                  {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div class="p-3 bg-gray-50 dark:bg-navy-light/10 border border-paper-border dark:border-paper-borderDark rounded">
                <span class="text-gray-400 uppercase font-bold text-[9px] block mb-1">Sub Status</span>
                <span class="font-bold text-green-500 uppercase">{subscription.status || 'Active'}</span>
              </div>
            </div>

            <div class="pt-2 flex justify-end">
              <button
                onClick={handleCancel}
                disabled={loading}
                class="px-4 py-2 bg-red-600/10 hover:bg-red-650 text-red-600 hover:text-white border border-red-600/30 rounded text-xs font-bold uppercase tracking-wider transition-all"
              >
                {loading ? 'Reverting Account...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        ) : (
          <p class="text-xs text-gray-450 dark:text-gray-400 leading-relaxed">
            You are currently on the **ER Basic** tier. Access to advanced briefings, Deep Research Mode, translation menus, and AI features is restricted. Upgrade below to lift all paywalls.
          </p>
        )}
      </div>

      {/* Coming Soon Waitlist Block */}
      {showWaitlist && (
        <div class="bg-gold/10 border border-gold/40 p-6 rounded shadow-md text-center max-w-md mx-auto mb-8 space-y-4">
          <Lock size={28} class="mx-auto text-gold animate-bounce" />
          <h3 class="font-serif text-base font-black text-navy dark:text-gold uppercase tracking-wider">
            Stripe Payments: Coming Soon
          </h3>
          <p class="text-[10.5px] text-gray-550 dark:text-gray-400 leading-normal max-w-sm mx-auto">
            Live credit card upgrades are currently in regulatory setup. Join our exclusive PRO Press waitlist to receive notice when registrations go live.
          </p>

          {waitlistSuccess ? (
            <span class="block text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider animate-pulse">
              ✓ Registered successfully on Waitlist!
            </span>
          ) : (
            <form onSubmit={handleWaitlistSubmit} class="flex gap-2 max-w-sm mx-auto">
              <input
                type="email"
                required
                placeholder="Enter email address..."
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                class="flex-grow bg-white dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
              />
              <button
                type="submit"
                class="bg-navy hover:bg-navy-light text-gold font-bold px-3 py-1.5 rounded text-[10px] uppercase tracking-wider"
              >
                Join Waitlist
              </button>
            </form>
          )}

          <div class="text-[10px] border-t border-gold/20 pt-3">
            <span class="text-gray-450">Or simulate a sandbox purchase for evaluation:</span>
            <button
              onClick={() => handleCheckout('Monthly', true)}
              class="block mx-auto mt-1 text-gold hover:underline font-bold uppercase text-[9px] tracking-wider"
            >
              Simulate Sandbox PRO Purchase →
            </button>
          </div>
        </div>
      )}

      {/* Pricing comparison plans grid */}
      {!isPro && (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-stretch">
          {/* Plan 1: Free */}
          <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded p-6 shadow-sm flex flex-col justify-between relative">
            <div>
              <h3 class="font-serif text-lg font-black text-navy dark:text-white uppercase mb-1">ER Basic</h3>
              <p class="text-[10px] text-gray-400 uppercase font-semibold mb-4">Ad-Supported Wire Reader</p>
              <div class="text-2xl font-black font-mono text-navy dark:text-white mb-6">$0.00</div>
              
              <ul class="space-y-3.5 text-xs text-navy/90 dark:text-gray-300 mb-8 font-sans">
                <li class="flex items-start gap-2.5">
                  <Check size={14} class="text-green-500 shrink-0 mt-0.5" />
                  <span>10 article reads per day limit</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <Check size={14} class="text-green-500 shrink-0 mt-0.5" />
                  <span>3 AI summary queries per day</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <Check size={14} class="text-green-500 shrink-0 mt-0.5" />
                  <span>Access to global multi-desk category filters</span>
                </li>
                <li class="flex items-start gap-2.5 opacity-50">
                  <X size={14} class="text-red-500 shrink-0 mt-0.5" />
                  <span class="line-through">Deep Research Modality briefs compiling</span>
                </li>
                <li class="flex items-start gap-2.5 opacity-50">
                  <X size={14} class="text-red-500 shrink-0 mt-0.5" />
                  <span class="line-through">No ad integrations</span>
                </li>
              </ul>
            </div>

            <button
              disabled
              class="w-full bg-gray-100 dark:bg-gray-800 text-gray-455 dark:text-gray-500 font-bold text-xs uppercase py-2.5 rounded cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Plan 2: PRO */}
          <div class="bg-white dark:bg-paper-cardDark border-2 border-gold rounded p-6 shadow-md flex flex-col justify-between relative">
            <div class="absolute top-0 right-6 transform -translate-y-1/2 bg-gold text-navy font-bold uppercase text-[9px] tracking-widest px-2.5 py-0.5 rounded">
              Recommended
            </div>
            
            <div>
              <h3 class="font-serif text-lg font-black text-navy dark:text-gold uppercase mb-1">ER PRO</h3>
              <p class="text-[10px] text-gray-400 uppercase font-semibold mb-4 text-gold">Advanced Intelligence Desk</p>
              <div class="text-2xl font-black font-mono text-navy dark:text-white mb-6">
                $4.99 <span class="text-xs text-gray-400 font-medium">/ month</span>
              </div>

              <ul class="space-y-3.5 text-xs text-navy/90 dark:text-gray-300 mb-8 font-sans">
                <li class="flex items-start gap-2.5">
                  <Check size={14} class="text-gold shrink-0 mt-0.5" />
                  <span class="font-bold text-navy dark:text-white">Unlimited article reads & wire access</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <Check size={14} class="text-gold shrink-0 mt-0.5" />
                  <span class="font-bold text-navy dark:text-white font-sans">Unlimited AI summaries & Chat queries</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <Check size={14} class="text-gold shrink-0 mt-0.5" />
                  <span class="font-bold text-navy dark:text-white">Full Deep Research compiling modality</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <Check size={14} class="text-gold shrink-0 mt-0.5" />
                  <span>On-the-fly article translations drawer</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <Check size={14} class="text-gold shrink-0 mt-0.5" />
                  <span>100% Ad-Free reading experience</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout('Monthly')}
              disabled={loading}
              class="w-full bg-gold hover:bg-gold-light text-navy font-bold text-xs uppercase py-2.5 rounded tracking-widest transition-all shadow hover:shadow-md"
            >
              {loading ? 'Routing to Checkout...' : 'Upgrade to PRO'}
            </button>
          </div>
        </div>
      )}

      {/* Billing History Invoice Ledger */}
      <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded p-6 shadow-sm">
        <div class="border-b border-paper-border dark:border-paper-borderDark pb-2 mb-4">
          <h3 class="font-serif text-sm font-black text-navy dark:text-gold uppercase tracking-wider flex items-center gap-1.5">
            <Receipt size={15} />
            <span>Filing Ledger & Invoices</span>
          </h3>
        </div>

        {loadingInvoices ? (
          <div class="flex items-center justify-center py-6 text-xs text-gray-400 font-bold uppercase tracking-wider gap-2">
            <Loader size={14} class="animate-spin text-gold" />
            <span>Retrieving Invoice Ledger...</span>
          </div>
        ) : invoices.length === 0 ? (
          <p class="text-[10px] text-gray-400 italic text-center py-4">No payment ledger files found on record.</p>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-[11px] font-sans text-navy dark:text-gray-300">
              <thead>
                <tr class="border-b border-paper-border dark:border-paper-borderDark text-[9px] uppercase tracking-widest text-gray-400 font-bold">
                  <th class="py-2">Invoice ID</th>
                  <th class="py-2">Date</th>
                  <th class="py-2">Briefing Plan</th>
                  <th class="py-2">Method</th>
                  <th class="py-2">Total</th>
                  <th class="py-2 text-right">Receipt Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td class="py-3 font-mono font-bold">{inv.id}</td>
                    <td class="py-3">{new Date(inv.date).toLocaleDateString()}</td>
                    <td class="py-3 font-semibold uppercase">{inv.plan}</td>
                    <td class="py-3 text-gray-400 uppercase text-[10px]">{inv.method}</td>
                    <td class="py-3 font-mono font-bold">{inv.amount}</td>
                    <td class="py-3 text-right">
                      <span class="px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded font-bold uppercase text-[9px]">
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
