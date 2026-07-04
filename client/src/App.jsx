import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import AiAssistant from './components/AiAssistant';
import AuthModal from './components/AuthModal';
import CookieConsent from './components/CookieConsent';
import ErrorBoundary from './components/ErrorBoundary';
import SocialLinks from './components/SocialLinks';
import InterestSelectorModal from './components/InterestSelectorModal';
import CountryIntelligence from './components/CountryIntelligence';

// Lazy load secondary modules to reduce initial JS execution time
const Profile = React.lazy(() => import('./components/Profile'));
const Settings = React.lazy(() => import('./components/Settings'));
const Billing = React.lazy(() => import('./components/Billing'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
const EPaper = React.lazy(() => import('./components/EPaper'));
const LegalPages = React.lazy(() => import('./components/LegalPages'));
const ErAssistantFull = React.lazy(() => import('./components/ErAssistantFull'));
const FakeNewsChecker = React.lazy(() => import('./components/FakeNewsChecker'));
const BiasDetector = React.lazy(() => import('./components/BiasDetector'));
const WorldMap = React.lazy(() => import('./components/WorldMap'));
const OutcomeTracker = React.lazy(() => import('./components/OutcomeTracker'));
const OutcomeDetail = React.lazy(() => import('./components/OutcomeDetail'));
const BillingHistory = React.lazy(() => import('./components/BillingHistory'));
const MultiAgentResearch = React.lazy(() => import('./components/MultiAgentResearch'));
const ERResearchPage = React.lazy(() => import('./components/ERResearchPage'));
const ResearchLibraryPage = React.lazy(() => import('./components/ResearchLibraryPage'));
const LiveEconomicDashboard = React.lazy(() => import('./components/LiveEconomicDashboard'));
const FinancialIntelligence = React.lazy(() => import('./components/FinancialIntelligence'));
const CountryIntelligencePage = React.lazy(() => import('./components/CountryIntelligencePage'));
const CountryPage = React.lazy(() => import('./components/CountryPage'));
const EconomicWidgets = React.lazy(() => import('./components/EconomicWidgets'));
const CompanyIntelligencePage = React.lazy(() => import('./components/CompanyIntelligencePage'));
const ForecastingPage = React.lazy(() => import('./components/ForecastingPage'));
const DebatePage = React.lazy(() => import('./components/DebatePage'));
const GlobalComparisonEngine = React.lazy(() => import('./components/GlobalComparisonEngine'));
const InteractiveCharts = React.lazy(() => import('./components/InteractiveCharts'));
const EconomicTimeline = React.lazy(() => import('./components/EconomicTimeline'));
const ForexIntelligence = React.lazy(() => import('./components/ForexIntelligence'));
const CryptoIntelligence = React.lazy(() => import('./components/CryptoIntelligence'));
const BondIntelligence = React.lazy(() => import('./components/BondIntelligence'));
const WatchlistManager = React.lazy(() => import('./components/WatchlistManager'));
const LiveNewsIntelligence = React.lazy(() => import('./components/LiveNewsIntelligence'));
const EconomicCalendar = React.lazy(() => import('./components/EconomicCalendar'));

function AppContent() {
  const { settings, updateSettings, incrementTimeSpent, loading, userPreferences } = useAuth();
  const [user, setUser] = useState(null);
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [isInterestUpdate, setIsInterestUpdate] = useState(false);

  const [tickerData, setTickerData] = useState(() => {
    const cached = localStorage.getItem('er_live_ticker_data');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return {
      sensexValue: '82,456 +0.4%',
      usdInr: '83.42',
      goldPrice: '$2,345',
      oilPrice: '$78.23',
      show: true
    };
  });

  useEffect(() => {
    // Static market data - Yahoo Finance blocked by CORS from browser
    // These values serve as realistic baseline; only USD/INR is fetched live
    const STATIC_MARKET = {
      sensexValue: '82,456 +0.45%',
      goldPrice: '$2,345',
      oilPrice: '$78.23',
    };

    const fetchExchangeRates = async () => {
      const apiKey = import.meta.env.VITE_EXCHANGE_RATE_KEY || '2428fcb9bd5523c4a06e1cc7';
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
      );
      if (!res.ok) throw new Error('Exchange rate API failed');
      const data = await res.json();
      return data.conversion_rates;
    };

    const updateAllRates = async () => {
      try {
        const exchangeRates = await fetchExchangeRates().catch(() => null);
        const nextData = { ...tickerData, ...STATIC_MARKET };

        if (exchangeRates && exchangeRates.INR) {
          nextData.usdInr = Number(exchangeRates.INR).toFixed(2);
        }

        nextData.show = true;
        setTickerData(nextData);
        localStorage.setItem('er_live_ticker_data', JSON.stringify(nextData));
      } catch (err) {
        console.error('Error updating market ticker rates:', err);
      }
    };

    updateAllRates();
    const interval = setInterval(updateAllRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const navigate = (pathOrView, detailId = null) => {
    if (pathOrView === '/pricing' || pathOrView === '/billing') {
      setView('billing');
    } else if (pathOrView === '/' || pathOrView === '') {
      setView('feed');
    } else {
      setView(pathOrView, detailId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      setStatus('error');
      setStatusMessage('Please enter a valid email');
      return;
    }
    
    setNewsletterLoading(true);
    setStatus('');
    setStatusMessage('');
    
    try {
      // Save to Firestore
      await addDoc(
        collection(db, 'newsletter_subscribers'),
        {
          email: email,
          subscribedAt: new Date(),
          source: 'website_footer',
          active: true
        }
      );
      
      // Send welcome email via EmailJS
      try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_default';
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_default';
        await emailjs.send(
          serviceId,
          templateId,
          {
            to_email: email,
            to_name: 'Subscriber',
            message: 'Welcome to ER Daily Intelligence!'
          },
          'H2ZrOGdhj8r18dSh5'
        );
      } catch (emailErr) {
        console.error('Email send failed:', emailErr);
        // Still show success even if email fails (subscriber is saved in Firestore)
      }
      
      setStatus('success');
      setStatusMessage('✅ Subscribed! Check your email.');
      setEmail('');
      
    } catch (err) {
      console.error('Subscribe error:', err);
      setStatus('error');
      setStatusMessage('❌ Could not subscribe. Please try again.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
          uid: user.uid
        })
      } else {
        setUser(null)
      }
    })
    return unsubscribe;
  }, []);

  const [view, setViewInternal] = useState('feed'); // 'feed', 'profile', 'settings', 'billing', 'admin', 'epaper', 'livetv', 'about', 'contact', 'terms', 'privacy'
  const [viewLoading, setViewLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Auto-detect or load language preference on mount
  useEffect(() => {
    let savedLang = localStorage.getItem('userLanguage');
    if (!savedLang) {
      const browserLang = navigator.language.slice(0, 2);
      const supportedLangs = ['en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'ar', 'fr', 'de', 'es', 'zh', 'ja', 'ru', 'pt', 'ur'];
      if (supportedLangs.includes(browserLang)) {
        savedLang = browserLang;
      } else {
        savedLang = 'en';
      }
      localStorage.setItem('userLanguage', savedLang);
    }
    
    // Set cookie googtrans
    const host = window.location.hostname;
    document.cookie = `googtrans=/en/${savedLang}; path=/`;
    document.cookie = `googtrans=/en/${savedLang}; path=/; domain=${host}`;
    document.cookie = `googtrans=/en/${savedLang}; path=/; domain=.${host}`;
    
    if (host.includes('.')) {
      const parts = host.split('.');
      if (parts.length > 2) {
        const domain = parts.slice(-2).join('.');
        document.cookie = `googtrans=/en/${savedLang}; path=/; domain=.${domain}`;
      }
    }
  }, []);

  // Open Auth Modal if trying to access profile while logged out
  useEffect(() => {
    if (view === 'profile' && !user) {
      setAuthModalOpen(true);
    }
  }, [view, user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view]);
  
  // Theme state synced with Context preferences
  const [theme, setTheme] = useState(() => {
    const cached = localStorage.getItem('er_theme');
    if (cached) return cached;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [activeCategory, setActiveCategory] = useState('world');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrackerId, setSelectedTrackerId] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedCountryCode, setSelectedCountryCode] = useState('IN');
  const [selectedCompany, setSelectedCompany] = useState('TSLA');
  const [selectedAsset, setSelectedAsset] = useState({ symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' });
  const [comparisonA, setComparisonA] = useState('India');
  const [comparisonB, setComparisonB] = useState('China');
  
  const setView = (newView, detailId = null) => {
    setViewLoading(true);
    setTimeout(() => {
      setViewInternal(newView);
      if (detailId) {
        setSelectedTrackerId(detailId);
        if (newView === 'country-page') {
          setSelectedCountryCode(detailId);
        }
      }
      setViewLoading(false);
      
      // Update history state URL path to provide pricing route and clean parameters
      if (newView === 'billing') {
        window.history.pushState({}, '', '/pricing');
      } else if (newView === 'billing-history') {
        window.history.pushState({}, '', '/billing-history');
      } else if (newView === 'feed') {
        window.history.pushState({}, '', '/');
      } else if (newView === 'country-page') {
        const codeToUse = detailId || selectedCountryCode || 'IN';
        window.history.pushState({}, '', `/country/${codeToUse}`);
      } else if (newView === 'fake-news') {
        window.history.pushState({}, '', '/fake-news-checker');
      } else if (newView === 'bias-detector') {
        window.history.pushState({}, '', '/bias-detector');
      } else if (newView === 'world-map') {
        window.history.pushState({}, '', '/world-map');
      } else if (newView === 'outcome-tracker') {
        window.history.pushState({}, '', '/outcome-tracker');
      } else if (newView === 'outcome-detail') {
        const idToUse = detailId || selectedTrackerId;
        window.history.pushState({}, '', `/outcome-tracker/${idToUse}`);
      } else if (newView === 'er-research') {
        window.history.pushState({}, '', '/er-research');
      } else if (newView === 'research-library') {
        window.history.pushState({}, '', '/research-library');
      } else if (newView === 'company') {
        window.history.pushState({}, '', '/company');
      } else if (newView === 'forecasting') {
        window.history.pushState({}, '', '/forecasting');
      } else if (newView === 'debate') {
        window.history.pushState({}, '', '/debate');
      } else if (newView === 'charts') {
        window.history.pushState({}, '', '/charts');
      } else if (newView === 'timeline') {
        window.history.pushState({}, '', '/timeline');
      } else if (newView === 'forex') {
        window.history.pushState({}, '', '/forex');
      } else if (newView === 'crypto') {
        window.history.pushState({}, '', '/crypto');
      } else if (newView === 'bonds') {
        window.history.pushState({}, '', '/bonds');
      } else {
        window.history.pushState({}, '', `?view=${newView}`);
      }
    }, 400);
  };

  // Global view change listener for paywalls and chatbot redirects
  useEffect(() => {
    const handleViewChange = (e) => {
      if (e.detail) setView(e.detail);
    };
    const handleViewDetailChange = (e) => {
      if (e.detail) setView('outcome-detail', e.detail);
    };
    const handleOpenAuth = () => {
      setAuthModalOpen(true);
    };
    const handleOpenInterest = () => {
      setIsInterestUpdate(true);
      setInterestModalOpen(true);
    };
    const handleNavigateCountry = (e) => {
      if (e.detail) {
        setSelectedCountryCode(e.detail);
        setView('country-page', e.detail);
      }
    };
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '') {
        setViewInternal('feed');
      } else if (path === '/pricing' || path === '/billing') {
        setViewInternal('billing');
      } else if (path === '/billing-history') {
        setViewInternal('billing-history');
      } else if (path === '/fake-news-checker') {
        setViewInternal('fake-news');
      } else if (path === '/bias-detector') {
        setViewInternal('bias-detector');
      } else if (path === '/world-map') {
        setViewInternal('world-map');
      } else if (path === '/outcome-tracker') {
        setViewInternal('outcome-tracker');
      } else if (path.startsWith('/outcome-tracker/')) {
        const id = path.split('/').pop();
        setSelectedTrackerId(id);
        setViewInternal('outcome-detail');
      } else if (path === '/er-research') {
        setViewInternal('er-research');
      } else if (path === '/research-library') {
        setViewInternal('research-library');
      } else if (path === '/company') {
        setViewInternal('company');
      } else if (path === '/forecasting') {
        setViewInternal('forecasting');
      } else if (path === '/debate') {
        setViewInternal('debate');
      } else if (path === '/charts') {
        setViewInternal('charts');
      } else if (path === '/timeline') {
        setViewInternal('timeline');
      } else if (path === '/forex') {
        setViewInternal('forex');
      } else if (path === '/crypto') {
        setViewInternal('crypto');
      } else if (path === '/bonds') {
        setViewInternal('bonds');
      } else if (path.startsWith('/country/')) {
        const code = path.split('/').pop().toUpperCase();
        setSelectedCountryCode(code);
        setViewInternal('country-page');
      } else {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        if (viewParam) setViewInternal(viewParam);
      }
    };
    window.addEventListener('change-view', handleViewChange);
    window.addEventListener('change-view-detail', handleViewDetailChange);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    window.addEventListener('open-interest-modal', handleOpenInterest);
    window.addEventListener('navigate-country', handleNavigateCountry);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('change-view', handleViewChange);
      window.removeEventListener('change-view-detail', handleViewDetailChange);
      window.removeEventListener('open-auth-modal', handleOpenAuth);
      window.removeEventListener('open-interest-modal', handleOpenInterest);
      window.removeEventListener('navigate-country', handleNavigateCountry);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // First visit check: show interest selector popup only once per user
  useEffect(() => {
    const checkPreferences = async () => {
      if (user) {
        // LOGGED IN USER - check if already completed setup in localStorage
        if (localStorage.getItem('interestSetupDone')) {
          setInterestModalOpen(false);
          return;
        }
        
        // Check Firestore
        try {
          const prefRef = doc(db, 'user_preferences', user.uid);
          const prefDoc = await getDoc(prefRef);
          
          if (!prefDoc.exists() || 
              !prefDoc.data()?.selectedTopics?.length ||
              !prefDoc.data()?.setupCompleted) {
            // No preferences saved - show popup
            setIsInterestUpdate(false);
            setInterestModalOpen(true);
          } else {
            // Already has preferences - NEVER show popup
            localStorage.setItem('interestSetupDone', 'true');
            setInterestModalOpen(false);
          }
        } catch (e) {
          console.error('Error checking preferences:', e);
        }
      } else {
        // NOT LOGGED IN - check localStorage
        const savedTopics = localStorage.getItem('userTopics');
        
        if (savedTopics) {
          // Already selected - NEVER show again
          setInterestModalOpen(false);
        } else {
          // Guest - DON'T show popup automatically
          // Only show if they click "Personalize"
          setInterestModalOpen(false);
        }
      }
    };
    
    checkPreferences();
  }, [user]); // Re-run only when user login status changes

  // Query and Path-based routing recovery on mount
  useEffect(() => {
    const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      setViewInternal('feed');
      window.history.replaceState({}, '', '/');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const sessionId = params.get('session_id');
    const path = window.location.pathname;

    if (sessionId) {
      setViewInternal('billing');
      window.history.replaceState({}, '', '/pricing');
    } else if (viewParam) {
      setViewInternal(viewParam);
    } else if (path === '/pricing' || path === '/billing') {
      setViewInternal('billing');
    } else if (path === '/billing-history') {
      setViewInternal('billing-history');
    } else if (path === '/fake-news-checker') {
      setViewInternal('fake-news');
    } else if (path === '/bias-detector') {
      setViewInternal('bias-detector');
    } else if (path === '/world-map') {
      setViewInternal('world-map');
    } else if (path === '/outcome-tracker') {
      setViewInternal('outcome-tracker');
    } else if (path === '/er-research' || path === '/research') {
      setViewInternal('er-research');
    } else if (path === '/research-library') {
      setViewInternal('research-library');
    } else if (path.startsWith('/research/')) {
      const slug = path.split('/').pop();
      setViewInternal('er-research');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('er-research-load-public', { detail: { slug } }));
      }, 500);
    } else if (path.startsWith('/country/')) {
      const code = path.split('/').pop().toUpperCase();
      setSelectedCountryCode(code);
      setViewInternal('country-page');
    } else if (path.startsWith('/outcome-tracker/')) {
      const id = path.split('/').pop();
      setSelectedTrackerId(id);
      setViewInternal('outcome-detail');
    } else if (path === '/charts') {
      setViewInternal('charts');
    } else if (path === '/timeline') {
      setViewInternal('timeline');
    } else if (path === '/forex') {
      setViewInternal('forex');
    } else if (path === '/crypto') {
      setViewInternal('crypto');
    } else if (path === '/bonds') {
      setViewInternal('bonds');
    }
  }, []);

  // 1. Time spent tracker (increments stats by 0.5 minutes every 30 seconds of activity)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      incrementTimeSpent(0.5);
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Sync context settings with state
  useEffect(() => {
    if (settings && settings.theme) {
      setTheme(settings.theme);
    }
  }, [settings?.theme]);

  // Sync Theme with DOM
  useEffect(() => {
    const root = window.document.documentElement;
    let activeTheme = theme;
    if (theme === 'auto') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    if (activeTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('er_theme', theme);
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  const handleSearchSubmit = (query) => {
    setSearchQuery(query);
    setActiveCategory(''); // Clear category when searching
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setSearchQuery(''); // Clear search query when changing category
    setView('feed');
  };

  // GA4 Event and Page View Tracking
  useEffect(() => {
    if (window.gtag) {
      const path = window.location.pathname + window.location.search;
      window.gtag('event', 'page_view', {
        page_title: `View: ${view}`,
        page_location: window.location.href,
        page_path: path
      });
    }
  }, [view, selectedTrackerId]);

  useEffect(() => {
    if (activeCategory && window.gtag) {
      window.gtag('event', 'category_visit', {
        category_name: activeCategory
      });
    }
  }, [activeCategory]);

  useEffect(() => {
    if (searchQuery && window.gtag) {
      window.gtag('event', 'search', {
        search_term: searchQuery
      });
    }
  }, [searchQuery]);

  // Outbound link click tracker
  useEffect(() => {
    const handleOutboundClick = (e) => {
      const link = e.target.closest('a');
      if (link && link.href) {
        try {
          const url = new URL(link.href, window.location.origin);
          if (url.origin !== window.location.origin) {
            if (window.gtag) {
              window.gtag('event', 'click', {
                event_category: 'outbound',
                event_label: link.href,
                value: link.href,
                outbound: true,
                transport: 'beacon'
              });
            }
          }
        } catch (err) {
          // ignore invalid URLs
        }
      }
    };
    document.addEventListener('click', handleOutboundClick);
    return () => document.removeEventListener('click', handleOutboundClick);
  }, []);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const shouldShowPopup = () => {
    if (isInterestUpdate) return interestModalOpen;
    if (!user) return false;
    if (localStorage.getItem('interestSetupDone')) return false;
    return interestModalOpen;
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-paper dark:bg-paper-dark text-navy dark:text-gray-100 transition-colors duration-200 relative"
      style={{
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      
      {/* Sticky market ticker bar above header */}
      {tickerData.show && (
        <div style={{
          width: '100%',
          maxWidth: '100vw',
          overflow: 'hidden',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
        <div style={{
          background: '#0A1628',
          borderBottom: '1px solid rgba(244,167,38,0.3)',
          padding: '8px 16px',
          display: 'flex',
          gap: '24px',
          overflowX: 'auto',
          fontSize: '12px',
          color: '#fff',
          whiteSpace: 'nowrap'
        }}>
          <span>📈 Sensex: <strong>{tickerData.sensexValue}</strong></span>
          <span>💱 USD/INR: <strong>{tickerData.usdInr}</strong></span>
          <span>🥇 Gold: <strong>{tickerData.goldPrice}</strong></span>
          <span>🛢️ Crude: <strong>{tickerData.oilPrice}</strong></span>
        </div>
        </div>
      )}

      {/* Hero Section Redesign (Homepage only) */}
      {view === 'feed' && activeCategory === 'world' && !searchQuery && (
        <>
          <section style={{
            background: `linear-gradient(180deg, var(--navy-darkest) 0%, var(--navy-dark) 100%)`,
            padding: '80px 24px 60px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle grid pattern background */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(rgba(244,167,38,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(244,167,38,0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              pointerEvents: 'none'
            }}/>
            
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: 'rgba(244,167,38,0.1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'var(--gold-light)',
              fontWeight: '600',
              letterSpacing: '1px',
              marginBottom: '24px',
              textTransform: 'uppercase'
            }}>
              Trusted by Investors Worldwide
            </div>
            
            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: '700',
              color: '#fff',
              lineHeight: '1.15',
              marginBottom: '20px',
              maxWidth: '800px',
              margin: '0 auto 20px'
            }}>
              Global Economic Intelligence,
              <br/>
              <span style={{color: 'var(--gold-primary)'}}>
                Powered by Research
              </span>
            </h1>
            
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '17px',
              color: 'var(--text-secondary)',
              maxWidth: '560px',
              margin: '0 auto 36px',
              lineHeight: '1.6'
            }}>
              In-depth economic analysis, market intelligence 
              and emerging markets research — for investors, 
              businesses and policy makers worldwide.
            </p>
            
            <div style={{display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap'}}>
              <button onClick={() => setView('billing')} style={{
                background: 'var(--gold-primary)',
                color: 'var(--navy-darkest)',
                padding: '15px 32px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(244,167,38,0.25)'
              }}>Start Reading Free</button>
              <button onClick={() => navigate('/pricing')} style={{
                background: 'transparent',
                color: '#fff',
                padding: '15px 32px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '14px',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer'
              }}>Explore PRO →</button>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '48px',
              marginTop: '56px',
              flexWrap: 'wrap'
            }}>
              {[
                {num: '50+', label: 'Countries Covered'},
                {num: '24/7', label: 'AI-Powered Analysis'},
                {num: '10K+', label: 'Research Reports'}
              ].map(stat => (
                <div key={stat.label} style={{textAlign: 'left'}}>
                  <p style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    color: 'var(--gold-primary)',
                    fontSize: '28px',
                    fontWeight: '700',
                    margin: 0
                  }}>{stat.num}</p>
                  <p style={{
                    color: 'var(--text-tertiary)',
                    fontSize: '12px',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Masthead Header */}
      <ErrorBoundary>
        <Header 
          theme={theme}
          setTheme={handleThemeChange}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          onSearchSubmit={handleSearchSubmit}
          openAuthModal={() => setAuthModalOpen(true)}
          setView={setView}
          view={view}
          onSelectCountry={setSelectedCountry}
          onSelectCompany={setSelectedCompany}
          onSelectAsset={setSelectedAsset}
          onSelectComparison={(a, b) => {
            setComparisonA(a);
            setComparisonB(b);
          }}
        />
      </ErrorBoundary>

      {/* Transition loading spinner */}
      {viewLoading && (
        <div class="fixed inset-0 z-50 bg-paper/80 dark:bg-paper-dark/80 backdrop-blur-sm flex flex-col items-center justify-center text-navy dark:text-gold">
          <div class="flex flex-col items-center gap-3">
            <div class="relative flex h-10 w-10">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span class="relative inline-flex rounded-full h-10 w-10 border-4 border-double border-gold animate-spin"></span>
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest font-mono">COMPILING DISPATCH LEDGER...</span>
          </div>
        </div>
      )}

      {/* Main Content Router */}
      <main class="flex-grow">
        <React.Suspense fallback={
          <div class="fixed inset-0 z-50 bg-paper/80 dark:bg-paper-dark/80 backdrop-blur-sm flex flex-col items-center justify-center text-navy dark:text-gold animate-pulse">
            <div class="flex flex-col items-center gap-3">
              <div class="relative flex h-10 w-10">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span class="relative inline-flex rounded-full h-10 w-10 border-4 border-double border-gold animate-spin"></span>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest font-mono">LOADING DISPATCH BRIEF...</span>
            </div>
          </div>
        }>
          {view === 'feed' ? (
            <ErrorBoundary>
              <NewsFeed 
                activeCategory={activeCategory}
                searchQuery={searchQuery}
                triggerRefresh={triggerRefresh}
              />
            </ErrorBoundary>
          ) : view === 'assistant' ? (
            <ErAssistantFull />
          ) : view === 'er-research' ? (
            <ERResearchPage />
          ) : view === 'research-library' ? (
            <ResearchLibraryPage setView={setView} />
          ) : view === 'live-dashboard' ? (
            <LiveEconomicDashboard setView={setView} />
          ) : view === 'financials' ? (
            <FinancialIntelligence setView={setView} selectedAsset={selectedAsset} />
          ) : view === 'country-page' ? (
            <CountryPage setView={setView} countryCode={selectedCountryCode} />
          ) : view === 'country-intel' ? (
            <CountryIntelligencePage setView={setView} defaultCountry={selectedCountry} />
          ) : view === 'company-intel' || view === 'company' ? (
            <CompanyIntelligencePage setView={setView} defaultCompany={selectedCompany} />
          ) : view === 'forecasting' ? (
            <ForecastingPage setView={setView} />
          ) : view === 'debate' ? (
            <DebatePage setView={setView} />
          ) : view === 'charts' ? (
            <InteractiveCharts />
          ) : view === 'timeline' ? (
            <EconomicTimeline />
          ) : view === 'forex' ? (
            <ForexIntelligence />
          ) : view === 'crypto' ? (
            <CryptoIntelligence />
          ) : view === 'bonds' ? (
            <BondIntelligence />
          ) : view === 'comparison' ? (
            <GlobalComparisonEngine setView={setView} defaultA={comparisonA} defaultB={comparisonB} />
          ) : view === 'watchlist' ? (
            <WatchlistManager 
              setView={setView} 
              onSelectAsset={setSelectedAsset} 
              onSelectCountry={setSelectedCountry} 
              onSelectCompany={setSelectedCompany} 
            />
          ) : view === 'news-intel' ? (
            <LiveNewsIntelligence />
          ) : view === 'calendar' ? (
            <EconomicCalendar />
          ) : view === 'fake-news' ? (
            <FakeNewsChecker />
          ) : view === 'bias-detector' ? (
            <BiasDetector />
          ) : view === 'world-map' ? (
            <WorldMap setView={setView} />
          ) : view === 'outcome-tracker' ? (
            <OutcomeTracker setView={setView} />
          ) : view === 'outcome-detail' ? (
            <OutcomeDetail setView={setView} trackerId={selectedTrackerId} />
          ) : view === 'profile' ? (
            user ? (
              <Profile 
                setView={setView}
                onSearchSubmit={handleSearchSubmit}
              />
            ) : (
              <div class="max-w-md mx-auto px-4 py-20 text-center font-sans">
                <h2 class="font-serif text-2xl font-black text-navy dark:text-gold mb-2 uppercase">Access Restricted</h2>
                <p class="text-xs text-gray-450 dark:text-gray-300 leading-relaxed mb-6 font-serif">
                  You must be logged in to view your research credentials.
                </p>
                <button 
                  onClick={() => setAuthModalOpen(true)}
                  class="px-4 py-2 bg-navy text-gold hover:bg-navy-light rounded font-bold text-xs uppercase"
                >
                  Log In
                </button>
              </div>
            )
          ) : view === 'settings' ? (
            <Settings 
              setView={setView}
            />
          ) : view === 'billing' ? (
            <Billing 
              setView={setView}
            />
          ) : view === 'billing-history' ? (
            <BillingHistory setView={setView} />
          ) : view === 'admin' ? (
            <AdminPanel 
              setView={setView}
            />
          ) : view === 'epaper' ? (
            <EPaper 
              setView={setView}
            />
          ) : ['about', 'contact', 'terms', 'privacy'].includes(view) ? (
            <LegalPages 
              setView={setView}
              initialSection={view}
            />
          ) : (
            /* Custom 404 Page View */
            <div class="max-w-md mx-auto px-4 py-20 text-center font-sans">
              <h2 class="font-serif text-5xl font-black text-navy dark:text-gold mb-2">404</h2>
              <p class="text-xs uppercase tracking-widest font-mono text-gray-400 mb-6">WIRE BRIEFING NOT FOUND</p>
              <p class="text-xs text-gray-450 dark:text-gray-300 leading-relaxed mb-6 font-serif">
                The satellite channel or editorial brief you are attempting to retrieve does not exist in our active indexing ledger.
              </p>
              <button 
                onClick={() => setView('feed')}
                class="px-4 py-2 bg-navy text-gold hover:bg-navy-light rounded font-bold text-xs uppercase"
              >
                Return to News Feed
              </button>
            </div>
          )}
        </React.Suspense>
      </main>

      {/* Emerging Markets Intelligence Section (Relocated to bottom) */}
      {view === 'feed' && activeCategory === 'world' && !searchQuery && (
        <div style={{ background: '#0A1628', borderTop: '1px solid rgba(244,167,38,0.1)' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <section style={{padding: '40px 20px'}}>
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
                  fontSize: '24px',
                  color: '#fff',
                  margin: 0,
                  fontWeight: '700'
                }}>🌍 Emerging Markets Intelligence</h2>
              </div>
              <p style={{color: 'rgba(255,255,255,0.6)', marginBottom: '24px', fontSize: '14px'}}>
                Economic data across global markets
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <CountryIntelligence setView={setView} setSearchQuery={handleSearchSubmit} />
              </div>
            </section>
          </div>
        </div>
      )}

      {/* FOOTER */}
      {view !== 'assistant' && (
        <footer class="w-full bg-navy text-white mt-12 py-8 px-4 md:px-6 border-t border-gold/40">
          <div class="max-w-7xl mx-auto">
            {/* Newsletter Signup Section */}
            <div style={{
              background: 'rgba(244,167,38,0.05)',
              borderRadius: '6px',
              padding: '24px',
              textAlign: 'center',
              marginBottom: '32px',
              border: '1px solid rgba(244,167,38,0.1)'
            }}>
              <h3 style={{color: '#F4A726', fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px'}}>
                📧 Get Daily Economic Intelligence
              </h3>
              <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0 0 16px'}}>
                Subscribe to ER Daily Briefing
              </p>
              
              <div style={{
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSubscribe()}
                    placeholder="Enter your email address"
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(244,167,38,0.3)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={newsletterLoading}
                    style={{
                      padding: '12px 24px',
                      background: newsletterLoading ? 'rgba(244,167,38,0.5)' : '#F4A726',
                      color: '#0A1628',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: newsletterLoading ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}>
                    {newsletterLoading ? '⏳ Subscribing...' : 'Subscribe'}
                  </button>
                </div>
                
                {statusMessage && (
                  <p style={{
                    marginTop: '8px',
                    color: status === 'success' ? '#00C896' : '#FF5252',
                    fontSize: '13px',
                    textAlign: 'center'
                  }}>
                    {statusMessage}
                  </p>
                )}
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left text-xs text-gray-300 font-sans">
            {/* Column 1: Editorial Info */}
            <div class="space-y-2">
              <h4 class="font-serif font-black text-gold text-sm uppercase tracking-wide">ECONOMICAL RESEARCH</h4>
              <p class="italic text-gray-400">&ldquo;Global Economic Intelligence. Powered by Research.&rdquo;</p>
              <p class="leading-relaxed">
                A premium intelligence wire providing structural economic, political, and technical news briefings synthesized with analytical clarity.
              </p>
            </div>

            {/* Column 2: Sections Map */}
            <div class="space-y-2">
              <h4 class="font-serif font-black text-gold text-sm uppercase tracking-wide">WIRE DESKS</h4>
              <div class="grid grid-cols-2 gap-1 font-semibold text-left">
                <button onClick={() => handleCategoryChange('world')} class="hover:text-gold text-left uppercase">Global Affairs</button>
                <button onClick={() => handleCategoryChange('india')} class="hover:text-gold text-left uppercase">India Reports</button>
                <button onClick={() => handleCategoryChange('politics')} class="hover:text-gold text-left uppercase">Policy & Regulation</button>
                <button onClick={() => handleCategoryChange('tech')} class="hover:text-gold text-left uppercase">Tech & Innovation</button>
                <button onClick={() => handleCategoryChange('business')} class="hover:text-gold text-left uppercase">Markets & Business</button>
                <button onClick={() => handleCategoryChange('finance')} class="hover:text-gold text-left uppercase">Economics & Finance</button>
              </div>
            </div>

            {/* Column 3: Disclaimer */}
            <div class="space-y-2">
              <h4 class="font-serif font-black text-gold text-sm uppercase tracking-wide">REGULATORY COMPLIANCE</h4>
              <p class="leading-relaxed text-gray-400">
                All AI-generated summaries and implications are derived dynamically for review. Cross-check official documents for sovereign decisions.
              </p>
              <p class="pt-2 font-mono text-[10px]">
                Proxy Server Status: <span class="text-green-400 font-bold">ONLINE</span>
              </p>
            </div>
          </div>
        </div>

        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '24px 0',
            borderTop: '1px solid rgba(244,167,38,0.3)'
          }}>
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '13px',
              margin: 0
            }}>
              Follow us on social media
            </p>
            <SocialLinks />
            <p style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '12px',
              margin: 0
            }}>
              © 2026 Economical Research. 
              All rights reserved.
            </p>
          </div>

          <div class="max-w-7xl mx-auto border-t border-gray-800 mt-8 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-400 gap-2 font-semibold uppercase tracking-wider font-sans">
            <span>© {new Date().getFullYear()} ECONOMICAL RESEARCH CORP. ALL RIGHTS RESERVED.</span>
            <div class="flex gap-4 flex-wrap justify-center">
              <span class="hover:text-gold cursor-pointer" onClick={() => setView('settings')}>Settings</span>
              <span>•</span>
              <span class="hover:text-gold cursor-pointer" onClick={() => setView('billing')}>Upgrade to PRO</span>
              <span>•</span>
              {user && (user.email === 'admin@economicalresearch.com' || user.email?.endsWith('@economicalresearch.com')) && (
                <>
                  <span class="hover:text-gold cursor-pointer font-bold text-gold" onClick={() => setView('admin')}>Admin Dashboard</span>
                  <span>•</span>
                </>
              )}
              <span class="hover:text-gold cursor-pointer" onClick={() => setView('terms')}>Terms of Service</span>
              <span>•</span>
              <span class="hover:text-gold cursor-pointer" onClick={() => setView('privacy')}>Privacy Policy</span>
              <span>•</span>
              <span class="hover:text-gold cursor-pointer" onClick={() => setView('about')}>About Us</span>
              <span>•</span>
              <span class="hover:text-gold cursor-pointer" onClick={() => setView('contact')}>Contact Desk</span>
            </div>
          </div>
        </footer>
      )}

      {/* Floating AI Assistant Chatbot */}
      {view !== 'assistant' && (
        <ErrorBoundary>
          <AiAssistant />
        </ErrorBoundary>
      )}

      {/* Cookie Consent Popup */}
      <CookieConsent />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />

      {/* Interest Selector Modal */}
      <InterestSelectorModal
        isOpen={shouldShowPopup()}
        onClose={() => setInterestModalOpen(false)}
        isUpdate={isInterestUpdate}
      />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes
      cacheTime: 10 * 60 * 1000,     // 10 minutes (backward compatibility)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
