import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Billing from './components/Billing';
import AdminPanel from './components/AdminPanel';
import AiAssistant from './components/AiAssistant';
import AuthModal from './components/AuthModal';
import EPaper from './components/EPaper';
import LiveTV from './components/LiveTV';
import LegalPages from './components/LegalPages';
import CookieConsent from './components/CookieConsent';
import ErAssistantFull from './components/ErAssistantFull';
import FakeNewsChecker from './components/FakeNewsChecker';
import BiasDetector from './components/BiasDetector';
import WorldMap from './components/WorldMap';
import OutcomeTracker from './components/OutcomeTracker';
import OutcomeDetail from './components/OutcomeDetail';
import ErrorBoundary from './components/ErrorBoundary';
import BillingHistory from './components/BillingHistory';
import SocialLinks from './components/SocialLinks';
import InterestSelectorModal from './components/InterestSelectorModal';

function AppContent() {
  const { settings, updateSettings, incrementTimeSpent, loading, userPreferences } = useAuth();
  const [user, setUser] = useState(null);
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [isInterestUpdate, setIsInterestUpdate] = useState(false);

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
  
  // Theme state synced with Context preferences
  const [theme, setTheme] = useState(() => {
    const cached = localStorage.getItem('er_theme');
    if (cached) return cached;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [activeCategory, setActiveCategory] = useState('world');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrackerId, setSelectedTrackerId] = useState(null);
  
  const setView = (newView, detailId = null) => {
    setViewLoading(true);
    setTimeout(() => {
      setViewInternal(newView);
      if (detailId) {
        setSelectedTrackerId(detailId);
      }
      setViewLoading(false);
      
      // Update history state URL path to provide pricing route and clean parameters
      if (newView === 'billing') {
        window.history.pushState({}, '', '/pricing');
      } else if (newView === 'billing-history') {
        window.history.pushState({}, '', '/billing-history');
      } else if (newView === 'feed') {
        window.history.pushState({}, '', '/');
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
    window.addEventListener('change-view', handleViewChange);
    window.addEventListener('change-view-detail', handleViewDetailChange);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    window.addEventListener('open-interest-modal', handleOpenInterest);
    return () => {
      window.removeEventListener('change-view', handleViewChange);
      window.removeEventListener('change-view-detail', handleViewDetailChange);
      window.removeEventListener('open-auth-modal', handleOpenAuth);
      window.removeEventListener('open-interest-modal', handleOpenInterest);
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
    } else if (path.startsWith('/outcome-tracker/')) {
      const id = path.split('/').pop();
      setSelectedTrackerId(id);
      setViewInternal('outcome-detail');
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
    <div class="min-h-screen flex flex-col bg-paper dark:bg-paper-dark text-navy dark:text-gray-100 transition-colors duration-200 relative max-w-full overflow-x-hidden">
      
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
        ) : view === 'livetv' ? (
          <ErrorBoundary>
            <LiveTV 
              setView={setView}
            />
          </ErrorBoundary>
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
      </main>

      {/* FOOTER */}
      {view !== 'assistant' && (
        <footer class="w-full bg-navy text-white mt-12 py-8 px-4 md:px-6 border-t border-gold/40">
          <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left text-xs text-gray-300 font-sans">
            {/* Column 1: Editorial Info */}
            <div class="space-y-2">
              <h4 class="font-serif font-black text-gold text-sm uppercase tracking-wide">ECONOMICAL RESEARCH</h4>
              <p class="italic text-gray-400">&ldquo;Your World. Your News. Researched.&rdquo;</p>
              <p class="leading-relaxed">
                A premium intelligence wire providing structural economic, political, and technical news briefings synthesized with analytical clarity.
              </p>
            </div>

            {/* Column 2: Sections Map */}
            <div class="space-y-2">
              <h4 class="font-serif font-black text-gold text-sm uppercase tracking-wide">WIRE DESKS</h4>
              <div class="grid grid-cols-2 gap-1 font-semibold text-left">
                <button onClick={() => handleCategoryChange('world')} class="hover:text-gold text-left uppercase">World Bulletin</button>
                <button onClick={() => handleCategoryChange('india')} class="hover:text-gold text-left uppercase">India Reports</button>
                <button onClick={() => handleCategoryChange('politics')} class="hover:text-gold text-left uppercase">Political Desk</button>
                <button onClick={() => handleCategoryChange('tech')} class="hover:text-gold text-left uppercase">Technology</button>
                <button onClick={() => handleCategoryChange('business')} class="hover:text-gold text-left uppercase">Business</button>
                <button onClick={() => handleCategoryChange('finance')} class="hover:text-gold text-left uppercase">Monetary Desk</button>
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
