import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, Search, LogIn, LogOut, User as UserIcon, Trash2, X, Settings as SettingsIcon, Menu, Tv, Newspaper, Bell, BellRing, Sparkles, ClipboardList, Instagram } from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';
import SocialLinks from './SocialLinks';
import { FaXTwitter, FaInstagram } from 'react-icons/fa6';
import SmartSearch from './SmartSearch';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰' },
];

export default function Header({ 
  theme, 
  setTheme, 
  onSearchSubmit, 
  onCategoryChange, 
  activeCategory, 
  openAuthModal, 
  setView, 
  view,
  onSelectCountry,
  onSelectCompany,
  onSelectAsset,
  onSelectComparison
}) {
  const { 
    user, 
    logout, 
    searchHistory, 
    saveSearchQuery, 
    deleteSearchQuery, 
    clearSearchHistory, 
    settings, 
    updateSettings, 
    subscription,
    notifications,
    markAsRead,
    markAllRead,
    clearAllNotifications,
    userAlerts
  } = useAuth();
  
  const totalBadgeCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;
  
  const [time, setTime] = useState(new Date());
  const [tickerNews, setTickerNews] = useState([]);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('userLanguage') || 'en');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');

  const suggestionsRef = useRef(null);
  const notifRef = useRef(null);
  const langRef = useRef(null);

  // Dynamic stock ticker data with simulated live random walk
  const [stocks, setStocks] = useState([
    { symbol: 'SENSEX', price: 74520.15, pct: 0.60 },
    { symbol: 'NIFTY 50', price: 22640.80, pct: 0.42 },
    { symbol: 'NASDAQ', price: 16340.25, pct: -0.12 },
    { symbol: 'BTC/USD', price: 68450.50, pct: 1.25 },
    { symbol: 'GOLD/OZ', price: 2312.10, pct: -0.08 },
    { symbol: 'EUR/USD', price: 1.0845, pct: 0.11 }
  ]);

  // Open-Meteo local weather state
  const [weather, setWeather] = useState(null);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Breaking News for Ticker
  useEffect(() => {
    fetch('/api/news?category=world')
      .then(res => res.json())
      .then(data => {
        if (data.articles && data.articles.length > 0) {
          setTickerNews(data.articles.slice(0, 10));
        }
      })
      .catch(err => console.error('Error fetching ticker news:', err));
  }, []);

  // Breaking news ticker rotation (every 3 seconds)
  useEffect(() => {
    if (tickerNews.length === 0) return;
    const interval = setInterval(() => {
      setTickerIndex(prev => 
        prev + 1 >= tickerNews.length ? 0 : prev + 1
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [tickerNews]);

  // Simulated live stock walk
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prev => prev.map(stock => {
        const factor = stock.symbol === 'EUR/USD' ? 0.0001 : stock.price * 0.0002;
        const drift = (Math.random() - 0.48) * factor;
        const nextPrice = Math.max(0.0001, stock.price + drift);
        const deltaPct = (drift / stock.price) * 100;
        
        return {
          ...stock,
          price: stock.symbol === 'EUR/USD' ? Math.round(nextPrice * 10000) / 10000 : Math.round(nextPrice * 100) / 100,
          pct: Math.round((stock.pct + deltaPct) * 100) / 100
        };
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Track window size to adapt layout responsively
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const API_KEY = '3ab51435ffdbc33e719cf21fd42d8dfc';

  const updateWeatherState = (data) => {
    const currentMonth = new Date().getMonth();
    const isMonsoonMonth = currentMonth >= 5 && currentMonth <= 8; // June to Sept (0-indexed 5 to 8)
    const country = data.sys?.country || '';
    const humidity = data.main?.humidity || 0;
    const description = data.weather?.[0]?.description || '';
    
    const isIndia = country === 'IN';
    const isHighHumidity = humidity > 70;
    const hasRainDescription = description.toLowerCase().includes('rain') || description.toLowerCase().includes('drizzle');
    const monsoonActive = isMonsoonMonth && isIndia && isHighHumidity && hasRainDescription;

    if (country) {
      localStorage.setItem('er_weather_country_pref', country);
    }

    const weatherData = {
      city: data.name,
      temp: Math.round(data.main?.temp || 0),
      feels: data.main?.feels_like || 0,
      humidity: humidity,
      description: description,
      country: country,
      monsoonActive: monsoonActive
    };

    setWeather(weatherData);
    localStorage.setItem('er_weather_data', JSON.stringify(weatherData));
    window.dispatchEvent(new CustomEvent('weather-updated', { detail: weatherData }));
  };

  const fetchWeather = async (lat, lon) => {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error('Weather API failed:', res.status);
        setWeather(null);
        return;
      }
      const data = await res.json();
      updateWeatherState(data);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setWeather(null);
    }
  };

  const fetchWeatherByCity = async (cityName) => {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error('Weather API failed:', res.status);
        setWeather(null);
        return;
      }
      const data = await res.json();
      updateWeatherState(data);
      localStorage.setItem('er_weather_city_pref', data.name);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setWeather(null);
    }
  };

  const handleCityChangePrompt = () => {
    const newCity = prompt('Enter your preferred city name for local weather:', weather?.city || '');
    if (newCity && newCity.trim().length > 0) {
      fetchWeatherByCity(newCity.trim());
    }
  };

  // Weather and geolocation manager
  useEffect(() => {
    const loadWeather = () => {
      const savedCity = localStorage.getItem('er_weather_city_pref');
      if (savedCity) {
        fetchWeatherByCity(savedCity);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
          },
          (err) => {
            console.warn('Geolocation failed or denied, using Mumbai fallback:', err);
            fetchWeatherByCity('Mumbai');
          }
        );
      } else {
        fetchWeatherByCity('Mumbai');
      }
    };

    loadWeather();

    // Auto-update weather every 30 minutes
    const weatherInterval = setInterval(loadWeather, 30 * 60 * 1000);
    return () => clearInterval(weatherInterval);
  }, []);

  const getWeatherEmoji = (desc) => {
    if (!desc) return '⛅';
    const d = desc.toLowerCase();
    if (d.includes('thunderstorm') || d.includes('storm')) return '⛈️';
    if (d.includes('rain')) return '🌧️';
    if (d.includes('drizzle')) return '🌧️';
    if (d.includes('snow') || d.includes('ice') || d.includes('hail')) return '❄️';
    if (d.includes('mist') || d.includes('smoke') || d.includes('haze') || d.includes('fog')) return '🌫️';
    if (d.includes('clear') || d.includes('sunny')) return '☀️';
    if (d.includes('cloud')) return '☁️';
    return '⛅';
  };

  const getLocalTimeStr = () => {
    return time.toLocaleTimeString('en-IN', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getTimezoneAbbr = () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Asia/Kolkata') return 'IST';
    try {
      return new Intl.DateTimeFormat('en-IN', { timeZoneName: 'short', timeZone: tz })
        .formatToParts(new Date())
        .find(part => part.type === 'timeZoneName').value;
    } catch (e) {
      return 'LT';
    }
  };


  // Fetch Search Suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const handler = setTimeout(() => {
      fetch(`/api/suggestions?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => setSuggestions(data))
        .catch(err => console.error('Error fetching suggestions:', err));
    }, 300); // Debounce

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleLanguageChange = (langCode) => {
    if (window.gtag) {
      window.gtag('event', 'language_switch', {
        language_code: langCode,
        transport: 'beacon'
      });
    }

    localStorage.setItem('userLanguage', langCode);
    
    // Set cookie
    const host = window.location.hostname;
    document.cookie = `googtrans=/en/${langCode}; path=/`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${host}`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${host}`;
    
    if (host.includes('.')) {
      const parts = host.split('.');
      if (parts.length > 2) {
        const domain = parts.slice(-2).join('.');
        document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${domain}`;
      }
    }
    
    setSelectedLang(langCode);
    setIsLangOpen(false);
    
    // Update user context if settings exists
    if (updateSettings && settings) {
      updateSettings({ language: langCode });
    }
    
    // Dispatch a custom event to notify components that language changed
    window.dispatchEvent(new CustomEvent('language-changed', { detail: langCode }));
    
    // Reload page to force translate reload and fetch localized news
    window.location.reload();
  };

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request HTML5 Push Notification permissions on visit
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        Notification.requestPermission().then(permission => {
          console.log(`Browser push notifications authorization status: ${permission}`);
        });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const detectIntent = (query) => {
    const q = query.toLowerCase().trim()
    
    // Country detection
    const countryMap = {
      'india': 'IN', 'usa': 'US', 'america': 'US',
      'uk': 'GB', 'britain': 'GB', 'uae': 'AE',
      'china': 'CN', 'brazil': 'BR', 'japan': 'JP',
      'germany': 'DE', 'france': 'FR', 'russia': 'RU'
    }
    
    for (const [name, code] of Object.entries(countryMap)) {
      if (q.includes(name)) {
        return { type: 'country', code, name }
      }
    }
    
    // Crypto detection
    if (['bitcoin', 'btc', 'ethereum', 'eth', 
         'crypto'].some(c => q.includes(c))) {
      return { type: 'crypto' }
    }
    
    // Comparison detection
    if (q.includes(' vs ') || q.includes(' versus ')) {
      return { type: 'comparison' }
    }
    
    // Default: deep research
    return { type: 'research', query }
  }

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      saveSearchQuery(query);
      const intent = detectIntent(query);
      if (intent.type === 'country') {
        window.dispatchEvent(new CustomEvent('navigate-country', { detail: intent.code }));
      } else if (intent.type === 'crypto') {
        setView('live-dashboard');
      } else if (intent.type === 'comparison') {
        const parts = query.split(/\s+vs\s+|\s+versus\s+/i);
        if (parts.length >= 2) {
          if (onSelectComparison) onSelectComparison(parts[0].trim(), parts[1].trim());
        }
        setView('comparison');
      } else {
        window.dispatchEvent(new CustomEvent('er-research-prefill', { detail: { query } }));
        setView('er-research');
      }
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (val) => {
    setSearchQuery(val);
    saveSearchQuery(val);
    const intent = detectIntent(val);
    if (intent.type === 'country') {
      window.dispatchEvent(new CustomEvent('navigate-country', { detail: intent.code }));
    } else if (intent.type === 'crypto') {
      setView('live-dashboard');
    } else if (intent.type === 'comparison') {
      const parts = val.split(/\s+vs\s+|\s+versus\s+/i);
      if (parts.length >= 2) {
        if (onSelectComparison) onSelectComparison(parts[0].trim(), parts[1].trim());
      }
      setView('comparison');
    } else {
      window.dispatchEvent(new CustomEvent('er-research-prefill', { detail: { query: val } }));
      setView('er-research');
    }
    setShowSuggestions(false);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const categories = [
    { id: 'foryou', name: 'For You ⭐' },
    { id: 'world', name: 'Global Affairs' },
    { id: 'india', name: 'India' },
    { id: 'politics', name: 'Policy & Regulation' },
    { id: 'tech', name: 'Tech & Innovation' },
    { id: 'business', name: 'Markets & Business' },
    { id: 'finance', name: 'Economics & Finance' },
    { id: 'science', name: 'Research & Science' },
    { id: 'environment', name: 'Climate & Energy' },
    { id: 'health', name: 'Health' },
    { id: 'education', name: 'Education' },
    { id: 'law', name: 'Law & Crime' },
    { id: 'research', name: 'Research' }
  ];

  const handleNavClick = (label) => {
    setSearchQuery('');
    if (label === 'Markets') {
      onCategoryChange('business');
      setView('feed');
    } else if (label === 'Dashboard') {
      setView('live-dashboard');
    } else if (label === 'Calendar') {
      setView('calendar');
    } else if (label === 'Comparison') {
      setView('comparison');
    } else if (label === 'Watchlist') {
      setView('watchlist');
    } else if (label === 'News Intel' || label === 'News Intelligence') {
      setView('news-intel');
    } else if (label === 'Deep Research' || label === '🔬 Deep Research') {
      setView('er-research');
    } else if (label === 'Library' || label === '📁 Library') {
      setView('research-library');
    } else if (label === 'Profile') {
      setView('profile');
    } else if (label === 'PRO Plans') {
      setView('billing');
    } else if (label === 'Company') {
      setView('company');
    } else if (label === 'Forecasting') {
      setView('forecasting');
    } else if (label === 'Debate') {
      setView('debate');
    } else if (label === 'Charts') {
      setView('charts');
    } else if (label === 'Timeline') {
      setView('timeline');
    } else if (label === 'Forex') {
      setView('forex');
    } else if (label === 'Crypto') {
      setView('crypto');
    } else if (label === 'Bonds') {
      setView('bonds');
    } else if (label === 'Knowledge Graph') {
      setView('knowledge-graph');
    }
  };

  const breakingNews = tickerNews.length > 0 
    ? tickerNews.map(n => n.title).join(' \u00a0\u00a0\u00a0\u00a0✦\u00a0\u00a0\u00a0\u00a0 ') 
    : 'Loading global macroeconomic updates...';

  return (
    <header style={{
      background: 'var(--navy-darkest)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }}>
      {/* LAYER 1 - Top Info Bar */}
      <div style={{
        background: '#060D17',
        borderBottom: '1px solid rgba(244,167,38,0.1)',
        padding: '4px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {/* Left: Market ticker - scrolling */}
        <div style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          flexShrink: 1,
          minWidth: 0,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }} className="scrollbar-none">
          {stocks.map(stock => {
            const isUp = stock.pct >= 0;
            return (
              <span key={stock.symbol} style={{ color: stock.symbol === 'GOLD/OZ' ? '#F4A726' : (isUp ? '#00C896' : '#CC0000'), whiteSpace: 'nowrap' }}>
                {stock.symbol} {stock.symbol === 'EUR/USD' ? stock.price : Math.round(stock.price).toLocaleString('en-IN')} {isUp ? '▲' : '▼'}{Math.abs(stock.pct)}%
              </span>
            );
          })}
        </div>
        
        {/* Right: Date + Weather - hide on small mobile */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexShrink: 0,
          whiteSpace: 'nowrap'
        }}
          className="hide-on-small-mobile">
          <span style={{color: 'rgba(255,255,255,0.4)'}}>
            {formatDate(time)} {getLocalTimeStr()} {getTimezoneAbbr()}
          </span>
          {weather && !weather.error && (
            <span 
              style={{color: 'rgba(255,255,255,0.4)', cursor: 'pointer'}}
              onClick={handleCityChangePrompt}
              title="Click to edit city"
            >
              {getWeatherEmoji(weather.description)} {weather.city} {Math.round(weather.temp)}°C
            </span>
          )}
        </div>
      </div>

      {/* LAYER 2 - Main Header */}
      <div style={{
        background: '#0A1628',
        borderBottom: '1px solid rgba(244,167,38,0.15)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Logo - always visible */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
            cursor: 'pointer'
          }}
          onClick={() => { onCategoryChange('world'); setSearchQuery(''); setView('feed'); }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            background: '#F4A726',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            color: '#0A1628',
            fontSize: '14px',
            flexShrink: 0,
            fontFamily: 'Playfair Display, serif'
          }}>ER</div>
          
          {/* Hide full name on mobile */}
          <span style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: '700',
            fontSize: '16px',
            color: '#fff',
            whiteSpace: 'nowrap'
          }}
            className="hide-on-mobile">
            ECONOMICAL RESEARCH
          </span>
        </div>

        {/* Search - hide on mobile */}
        <div className="relative hide-on-mobile" style={{ flex: 1, maxWidth: '380px' }}>
          <SmartSearch 
            setView={setView} 
            onSelectCountry={onSelectCountry} 
            onSelectCompany={onSelectCompany} 
            onSelectAsset={onSelectAsset} 
            onSelectComparison={onSelectComparison} 
          />
        </div>
        
        {/* Right side actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0
        }}>
          {/* Theme Toggle - hide on mobile */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hide-on-mobile"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 0, display: 'flex', alignItems: 'center' }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Settings - hide on mobile */}
          <button 
            onClick={() => setView('settings')}
            className="hide-on-mobile"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 0, display: 'flex', alignItems: 'center' }}
            title="Settings"
          >
            <SettingsIcon size={16} />
          </button>

          {/* Language selector - hide on mobile */}
          <div ref={langRef} className="relative hide-on-mobile" translate="no">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                padding: '2px 8px',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px'
              }}
            >
              <span>{languages.find(l => l.code === selectedLang)?.flag}</span>
              <span style={{ fontFamily: 'Inter, sans-serif' }}>{languages.find(l => l.code === selectedLang)?.name}</span>
              <span style={{ fontSize: '7px' }}>▼</span>
            </button>
            {isLangOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-[#060D17] text-white border border-[#F4A726]/40 rounded shadow-2xl z-[100] p-2 font-sans">
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Search language..."
                    className="w-full bg-[#0A1628] text-white border border-[#F4A726]/20 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-[#F4A726] placeholder-gray-400 font-medium"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto scrollbar-none flex flex-col gap-0.5">
                  {languages
                    .filter(l => l.name.toLowerCase().includes(langSearch.toLowerCase()) || l.code.includes(langSearch.toLowerCase()))
                    .map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`flex items-center justify-between w-full text-left px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                          selectedLang === lang.code
                            ? 'bg-[#F4A726] text-[#060D17]'
                            : 'hover:bg-[#142B47] text-gray-200 bg-transparent'
                        }`}
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-xs">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                        {selectedLang === lang.code && (
                          <span className="text-[9px] font-black">✓</span>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Notification badge */}
          {user && (
            <div ref={notifRef} style={{position: 'relative', cursor: 'pointer'}}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                title="Alert Ledger"
              >
                {totalBadgeCount > 0 ? (
                  <>
                    <BellRing size={18} className="text-[#F4A726] animate-bounce" />
                    <span style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#CC0000',
                      color: '#fff',
                      fontSize: '9px',
                      fontWeight: '700',
                      borderRadius: '50%',
                      width: '14px',
                      height: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>{totalBadgeCount > 9 ? '9+' : totalBadgeCount}</span>
                  </>
                ) : (
                  <Bell size={18} />
                )}
              </button>

              {isNotifOpen && (
                <div
                  style={{
                    position: isMobile ? 'fixed' : 'absolute',
                    top: isMobile ? '60px' : '100%',
                    left: isMobile ? '0' : 'auto',
                    right: '0',
                    width: isMobile ? '100%' : '360px',
                    minWidth: isMobile ? 'unset' : '360px',
                    background: '#0A1628',
                    border: '1px solid rgba(244,167,38,0.2)',
                    borderRadius: isMobile ? '0' : '12px',
                    zIndex: 9999,
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}
                  className="font-sans text-left"
                >
                  <div className="bg-[#0A1628] text-white px-3 py-2 flex items-center justify-between border-b border-[#F4A726]/15">
                    <span className="font-serif text-[9px] font-black uppercase tracking-wider text-[#F4A726]">Alert Registry Ledger</span>
                    <div className="flex gap-2">
                      {notifications.length > 0 && (
                        <>
                          <button
                            onClick={markAllRead}
                            className="text-[8px] hover:text-[#F4A726] uppercase tracking-wider font-bold border border-white/10 px-1 py-0.5 rounded transition-colors bg-transparent cursor-pointer"
                          >
                            Read All
                          </button>
                          <button
                            onClick={clearAllNotifications}
                            className="text-[8px] hover:text-[#F4A726] uppercase tracking-wider font-bold border border-white/10 px-1 py-0.5 rounded transition-colors bg-transparent cursor-pointer"
                          >
                            Clear
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-white/5 scrollbar-none">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                        No active reports registered.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markAsRead(notif.id);
                            setIsNotifOpen(false);
                            if (notif.url) {
                              window.open(notif.url, '_blank');
                            } else {
                              setView('feed');
                            }
                          }}
                          className={`p-3 transition-all cursor-pointer hover:bg-[#142B47]/30 flex items-start gap-2.5 ${
                            notif.read ? 'opacity-50' : 'bg-[#F4A726]/5 font-semibold'
                          }`}
                        >
                          <span className="text-xs shrink-0 mt-0.5">
                            {notif.type === 'breaking' ? '🔴' : notif.type === 'topic' ? '📰' : notif.type === 'subscription' ? '💳' : notif.type === 'welcome' ? '👋' : '🔐'}
                          </span>
                          
                          <div className="min-w-0 flex-grow text-[11px] leading-relaxed">
                            <div className="flex justify-between items-start gap-1.5">
                              <h4 className="text-white truncate font-bold text-[10.5px] leading-tight">{notif.title}</h4>
                            </div>
                            <p className="text-gray-400 mt-0.5 leading-normal text-[9.5px]">{notif.text}</p>
                            <span className="text-[8px] text-gray-500 font-mono mt-1 block">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {userAlerts && userAlerts.length > 0 && (
                    <div className="border-t border-white/5 px-3 py-2 bg-[#F4A726]/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-[#F4A726] uppercase tracking-widest flex items-center gap-1">
                          <BellRing size={9} />
                          Your Topic Alerts
                        </span>
                        <button
                          onClick={() => { setIsNotifOpen(false); setView('profile'); }}
                          className="text-[8px] font-bold text-gray-400 hover:text-[#F4A726] uppercase tracking-wider bg-transparent border-none cursor-pointer"
                        >
                          Manage ↗
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {userAlerts.slice(0, 5).map((alert) => (
                          <span
                            key={alert.id}
                            className="px-1.5 py-0.5 bg-[#F4A726]/10 border border-[#F4A726]/20 text-[#F4A726] text-[8.5px] font-bold rounded"
                          >
                            {alert.topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* PRO button - hide text on mobile */}
          {!user ? (
            <button 
              onClick={openAuthModal}
              style={{
                background: '#F4A726',
                color: '#0A1628',
                padding: '6px 12px',
                borderRadius: '4px',
                fontWeight: '700',
                fontSize: '11px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              PRO
            </button>
          ) : (
            <>
              {subscription?.tier !== 'PRO' ? (
                <button 
                  onClick={() => setView('billing')}
                  style={{
                    background: '#F4A726',
                    color: '#0A1628',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontWeight: '700',
                    fontSize: '11px',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  GO PRO
                </button>
              ) : (
                <button 
                  onClick={() => setView('profile')}
                  style={{
                    background: 'rgba(244,167,38,0.1)',
                    border: '1px solid #F4A726',
                    color: '#F4A726',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontWeight: '700',
                    fontSize: '11px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  PRO
                </button>
              )}
              
              {/* Profile - always visible */}
              <button 
                onClick={() => setView('profile')} 
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <ProfileAvatar user={user} size={32} />
              </button>
            </>
          )}
          
          {/* Hamburger - ONLY on mobile */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="show-on-mobile-only"
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* LAYER 3 - Navigation Bar */}
      <nav style={{
        background: '#0A1628',
        borderBottom: '2px solid rgba(244,167,38,0.1)',
        padding: '0 16px',
        display: 'flex',
        gap: '4px',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}
        className="hide-on-mobile">
        {[
          'Markets', 'Dashboard', 'Calendar', 
          'Comparison', 'Watchlist', 'News Intel',
          'Company', 'Forecasting', 'Debate',
          'Charts', 'Timeline', 'Forex', 'Crypto', 'Bonds',
          'Knowledge Graph',
          '🔬 Deep Research', '📁 Library'
        ].map(item => {
          const isActive = (item === 'Markets' && activeCategory === 'business' && view === 'feed' && !searchQuery) || 
                           (item === 'Dashboard' && view === 'live-dashboard') ||
                           (item === 'Calendar' && view === 'calendar') ||
                           (item === 'Comparison' && view === 'comparison') ||
                           (item === 'Watchlist' && view === 'watchlist') ||
                           (item === 'News Intel' && view === 'news-intel') ||
                           (item === 'Company' && view === 'company') ||
                           (item === 'Forecasting' && view === 'forecasting') ||
                           (item === 'Debate' && view === 'debate') ||
                           (item === 'Charts' && view === 'charts') ||
                           (item === 'Timeline' && view === 'timeline') ||
                           (item === 'Forex' && view === 'forex') ||
                           (item === 'Crypto' && view === 'crypto') ||
                           (item === 'Bonds' && view === 'bonds') ||
                           (item === 'Knowledge Graph' && view === 'knowledge-graph') ||
                           (item === '🔬 Deep Research' && view === 'er-research') ||
                           (item === '📁 Library' && view === 'research-library');
          return (
            <button 
              key={item} 
              onClick={() => handleNavClick(item)}
              style={{
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                color: isActive ? '#F4A726' : 'rgba(255,255,255,0.6)',
                fontSize: '12px',
                fontWeight: isActive ? '700' : '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                borderBottom: isActive ? '2px solid #F4A726' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {item}
            </button>
          );
        })}
      </nav>

      {/* LAYER 4 - Breaking News Ticker */}
      <div style={{
        background: '#CC0000',
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        overflow: 'hidden'
      }}>
        <span style={{
          background: '#fff',
          color: '#CC0000',
          padding: '2px 8px',
          borderRadius: '2px',
          fontSize: '10px',
          fontWeight: '900',
          flexShrink: 0
        }}>BREAKING</span>
        <div style={{
          overflow: 'hidden',
          flex: 1
        }}>
          <div 
            className="breaking-news-text"
            style={{
              color: '#fff',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              display: 'inline-block',
              animation: 'marquee 50s linear infinite'
            }}
          >
            {breakingNews}
          </div>
        </div>
      </div>

      {/* STEP 2 - Mobile Menu (Full Screen Overlay) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: '#0A1628',
        zIndex: 99999,
        display: isMenuOpen ? 'flex' : 'none',
        flexDirection: 'column',
        padding: '20px',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {/* Close button */}
        <button onClick={() => setIsMenuOpen(false)}
          style={{
            alignSelf: 'flex-end',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '28px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}>✕</button>
        
        {/* All nav items as full width buttons */}
        {[
          { label: 'Markets', icon: '📈' },
          { label: 'Dashboard', icon: '📊' },
          { label: 'Calendar', icon: '📅' },
          { label: 'Comparison', icon: '⚖️' },
          { label: 'Company', icon: '🏢' },
          { label: 'Forecasting', icon: '🔮' },
          { label: 'Debate', icon: '💬' },
          { label: 'Charts', icon: '📊' },
          { label: 'Timeline', icon: '📅' },
          { label: 'Forex', icon: '💱' },
          { label: 'Crypto', icon: '₿' },
          { label: 'Bonds', icon: '📋' },
          { label: 'Knowledge Graph', icon: '🕸️' },
          { label: 'Watchlist', icon: '👁️' },
          { label: 'News Intelligence', icon: '📰' },
          { label: 'Deep Research', icon: '🔬' },
          { label: 'Library', icon: '📁' },
          { label: 'Profile', icon: '👤' },
          { label: 'PRO Plans', icon: '💎' }
        ].map(item => (
          <button key={item.label}
            onClick={() => {
              handleNavClick(item.label)
              setIsMenuOpen(false)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px 12px',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%'
            }}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        
        {/* Social links at bottom */}
        <div style={{
          marginTop: 'auto',
          display: 'flex',
          gap: '16px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <a href="https://x.com/ERNewsDesk" 
            target="_blank"
            rel="noopener noreferrer"
            style={{color: 'rgba(255,255,255,0.4)',
              fontSize: '13px'}}>
            X (Twitter)
          </a>
          <a href="https://instagram.com/economical.research"
            target="_blank"
            rel="noopener noreferrer"
            style={{color: 'rgba(255,255,255,0.4)',
              fontSize: '13px'}}>
            Instagram
          </a>
        </div>
      </div>
    </header>
  );
}
