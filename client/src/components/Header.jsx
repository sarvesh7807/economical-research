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

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      saveSearchQuery(searchQuery);
      onSearchSubmit(searchQuery);
      setShowSuggestions(false);
      setView('feed');
    }
  };

  const handleSuggestionClick = (val) => {
    setSearchQuery(val);
    saveSearchQuery(val);
    onSearchSubmit(val);
    setShowSuggestions(false);
    setView('feed');
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

  return (
    <header style={{
      background: 'var(--navy-darkest)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }}>
      {/* Top mini bar with market data and toolbar */}
      <div style={{
        padding: '6px 24px',
        fontSize: '11px',
        fontFamily: 'IBM Plex Mono, monospace',
        color: 'var(--text-tertiary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)',
        letterSpacing: '0.5px'
      }} className="flex-wrap gap-2">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }} className="flex-wrap">
          <span>SENSEX <span style={{color: stocks.find(s=>s.symbol==='SENSEX')?.pct >= 0 ? 'var(--success)' : 'var(--danger)'}}>{stocks.find(s=>s.symbol==='SENSEX')?.price || '82,456.23'} {stocks.find(s=>s.symbol==='SENSEX')?.pct >= 0 ? '▲' : '▼'}{stocks.find(s=>s.symbol==='SENSEX')?.pct || '0.4'}%</span></span>
          <span>USD/INR <span style={{color:'var(--text-secondary)'}}>83.42</span></span>
          <span>GOLD <span style={{color:'var(--gold-light)'}}>${stocks.find(s=>s.symbol==='GOLD/OZ')?.price || '2,345.67'}</span></span>
          <span style={{ color: 'var(--text-tertiary)' }} className="hidden sm:inline">| &nbsp; {formatDate(time)} &nbsp; {getLocalTimeStr()} {getTimezoneAbbr()}</span>
          {weather && !weather.error && (
            <span 
              style={{ color: 'var(--gold-light)', cursor: 'pointer' }} 
              onClick={handleCityChangePrompt}
              className="hidden md:inline"
              title="Click to edit city"
            >
              | &nbsp; {getWeatherEmoji(weather.description)} {weather.city} {Math.round(weather.temp)}°C
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Custom Language Selector */}
          <div ref={langRef} className="relative" translate="no">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                padding: '2px 8px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px'
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

          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>

          {/* Settings Button */}
          <button 
            onClick={() => setView('settings')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="Settings"
          >
            <SettingsIcon size={13} />
          </button>

          {/* X (Twitter) */}
          <a
            href="https://x.com/ERNewsDesk"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
            title="Follow us on X"
          >
            <FaXTwitter size={13} />
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/economical.research"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
            title="Follow us on Instagram"
          >
            <FaInstagram size={13} />
          </a>
        </div>
      </div>
      
      {/* Main nav */}
      <div style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Brand Logo and Title */}
        <div 
          style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}
          onClick={() => { onCategoryChange('world'); setSearchQuery(''); setView('feed'); }}
        >
          <div style={{
            width: '32px', height: '32px',
            background: 'var(--gold-primary)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            color: 'var(--navy-darkest)',
            fontFamily: 'Playfair Display, serif'
          }}>ER</div>
          <span style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: '700',
            fontSize: '20px',
            color: '#fff',
            letterSpacing: '0.5px'
          }}>ECONOMICAL RESEARCH</span>
        </div>
        
        {/* Navigation Categories */}
        <nav style={{display: 'flex', gap: '28px', alignItems: 'center'}} className="hidden md:flex">
          {[
            { name: 'Markets', id: 'business', isCat: true },
            { name: 'Dashboard', id: 'live-dashboard' },
            { name: 'Calendar', id: 'calendar' },
            { name: 'Comparison', id: 'comparison' },
            { name: 'Watchlist', id: 'watchlist' },
            { name: 'News Intel', id: 'news-intel' }
          ].map(item => (
            <a 
              key={item.name} 
              onClick={() => {
                setSearchQuery('');
                if (item.isCat) {
                  onCategoryChange(item.id);
                  setView('feed');
                } else {
                  setView(item.id);
                }
              }}
              style={{
                color: (item.isCat ? (activeCategory === item.id && view === 'feed' && !searchQuery) : (view === item.id)) ? 'var(--gold-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                cursor: 'pointer',
                transition: 'color 0.2s',
                paddingBottom: '2px',
                borderBottom: (item.isCat ? (activeCategory === item.id && view === 'feed' && !searchQuery) : (view === item.id)) ? '2px solid var(--gold-primary)' : 'none'
              }}
            >
              {item.name}
            </a>
          ))}
          <button
            onClick={() => {
              setSearchQuery('');
              setView('er-research');
            }}
            style={{
              background: 'rgba(244,167,38,0.1)',
              border: '1px solid var(--gold-primary)',
              color: 'var(--gold-primary)',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            className="hover:bg-[#F4A726] hover:text-navy"
          >
            🔬 Deep Research
          </button>
          <button
            onClick={() => {
              setSearchQuery('');
              setView('research-library');
            }}
            style={{
              background: 'rgba(244,167,38,0.05)',
              border: '1px solid rgba(244,167,38,0.4)',
              color: 'var(--gold-primary)',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginLeft: '8px'
            }}
            className="hover:bg-[#F4A726] hover:text-navy"
          >
            📁 Library
          </button>
        </nav>
        
        {/* Right Area: Search, Notifications, Auth CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Smart Universal Search Bar */}
          <div className="relative hidden lg:block w-72">
            <SmartSearch 
              setView={setView} 
              onSelectCountry={onSelectCountry} 
              onSelectCompany={onSelectCompany} 
              onSelectAsset={onSelectAsset} 
              onSelectComparison={onSelectComparison} 
            />
          </div>

          {/* Notifications bell */}
          {user && (
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="text-white hover:text-[#F4A726] transition-colors focus:outline-none flex items-center justify-center p-1 bg-transparent border-none cursor-pointer"
                title="Alert Ledger"
              >
                {totalBadgeCount > 0 ? (
                  <>
                    <BellRing size={16} className="text-[#F4A726] animate-bounce" />
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-600 rounded-full text-[7px] font-black text-white flex items-center justify-center">
                      {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
                    </span>
                  </>
                ) : (
                  <Bell size={16} />
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#060D17] border border-[#F4A726]/30 rounded shadow-2xl z-50 overflow-hidden font-sans text-left">
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
                            🔔 {alert.topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Header Action Button (GO PRO / PRO / LOGIN) */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setView('profile')} 
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ProfileAvatar user={user} size={28} />
              </button>
              {subscription?.tier !== 'PRO' ? (
                <button 
                  onClick={() => setView('billing')}
                  style={{
                    background: 'var(--gold-primary)',
                    color: 'var(--navy-darkest)',
                    padding: '8px 20px',
                    borderRadius: '4px',
                    fontWeight: '700',
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  GO PRO
                </button>
              ) : (
                <button
                  onClick={() => setView('profile')}
                  style={{
                    background: 'rgba(244,167,38,0.1)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--gold-primary)',
                    padding: '8px 20px',
                    borderRadius: '4px',
                    fontWeight: '700',
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                    cursor: 'pointer'
                  }}
                >
                  PRO PROFILE
                </button>
              )}
            </div>
          ) : (
            <button 
              onClick={openAuthModal}
              style={{
                background: 'var(--gold-primary)',
                color: 'var(--navy-darkest)',
                padding: '8px 20px',
                borderRadius: '4px',
                fontWeight: '700',
                fontSize: '12px',
                letterSpacing: '0.5px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              GO PRO
            </button>
          )}
        </div>
      </div>

      {/* Breaking news marquee sub-strip */}
      <div style={{
        background: '#040910',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '4px 24px',
        fontSize: '10px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        height: '24px',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'var(--gold-primary)',
          color: 'var(--navy-darkest)',
          padding: '1px 6px',
          fontWeight: '900',
          fontSize: '9px',
          marginRight: '12px',
          borderRadius: '2px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }} className="animate-pulse">
          Breaking
        </div>
        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', flexGrow: 1 }}>
          {tickerNews.length > 0 ? (
            <span style={{ cursor: 'pointer', fontFamily: 'Inter, sans-serif' }} className="hover:text-gold transition-colors">
              ✦ {tickerNews[tickerIndex]?.title}
            </span>
          ) : (
            <span style={{ color: 'var(--text-tertiary)' }}>✦ Loading global macroeconomic updates... ✦ Deep synthesis online...</span>
          )}
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      <div className="md:hidden font-sans">
        <div 
          className={`mobile-menu-backdrop ${isMenuOpen ? 'open' : ''}`} 
          onClick={() => setIsMenuOpen(false)}
        ></div>
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <span style={{ color: '#F4A726', fontWeight: 'bold', fontSize: '18px', letterSpacing: '2px' }}>MENU</span>
            <button className="mobile-menu-close" onClick={() => setIsMenuOpen(false)}>✕</button>
          </div>
          <div style={{ paddingBottom: '40px' }}>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('foryou'); setView('feed'); setIsMenuOpen(false); }}>For You ⭐</button>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('world'); setView('feed'); setIsMenuOpen(false); }}>Home</button>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('world'); setView('feed'); setIsMenuOpen(false); }}>Global Affairs</button>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('india'); setView('feed'); setIsMenuOpen(false); }}>India News</button>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('politics'); setView('feed'); setIsMenuOpen(false); }}>Policy & Regulation</button>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('tech'); setView('feed'); setIsMenuOpen(false); }}>Tech & Innovation</button>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('business'); setView('feed'); setIsMenuOpen(false); }}>Markets & Business</button>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('finance'); setView('feed'); setIsMenuOpen(false); }}>Economics & Finance</button>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('science'); setView('feed'); setIsMenuOpen(false); }}>Research & Science</button>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('environment'); setView('feed'); setIsMenuOpen(false); }}>Climate & Energy</button>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('health'); setView('feed'); setIsMenuOpen(false); }}>Health</button>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('education'); setView('feed'); setIsMenuOpen(false); }}>Education</button>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('law'); setView('feed'); setIsMenuOpen(false); }}>Law & Crime</button>
            <button className="mobile-menu-item" onClick={() => { onCategoryChange('research'); setView('feed'); setIsMenuOpen(false); }}>Research</button>
            
            <button className="mobile-menu-item" onClick={() => { setView('fake-news'); setIsMenuOpen(false); }} style={{ marginTop: '10px', borderTop: '1px solid #1A3A5C' }}>Fake News Checker</button>
            <button className="mobile-menu-item" onClick={() => { setView('bias-detector'); setIsMenuOpen(false); }}>Bias Detector</button>
            <button className="mobile-menu-item" onClick={() => { setView('world-map'); setIsMenuOpen(false); }}>World News Map</button>
            <button className="mobile-menu-item" onClick={() => { setView('outcome-tracker'); setIsMenuOpen(false); }}>Outcome Tracker</button>
            <button className="mobile-menu-item" onClick={() => { setView('epaper'); setIsMenuOpen(false); }}>E-Paper</button>
            <button className="mobile-menu-item text-gold font-bold" onClick={() => { setView('er-research'); setIsMenuOpen(false); }}>🔬 Deep Research</button>
            <button className="mobile-menu-item text-gold font-bold" onClick={() => { setView('research-library'); setIsMenuOpen(false); }}>📁 Research Library</button>
            <button className="mobile-menu-item text-gold font-bold" onClick={() => { setView('live-dashboard'); setIsMenuOpen(false); }}>📊 Live Dashboard</button>
            <button className="mobile-menu-item text-gold font-bold" onClick={() => { setView('calendar'); setIsMenuOpen(false); }}>📅 Economic Calendar</button>
            <button className="mobile-menu-item text-gold font-bold" onClick={() => { setView('comparison'); setIsMenuOpen(false); }}>⚖️ Global Comparison</button>
            <button className="mobile-menu-item text-gold font-bold" onClick={() => { setView('watchlist'); setIsMenuOpen(false); }}>⭐ Watchlist</button>
            <button className="mobile-menu-item text-gold font-bold" onClick={() => { setView('news-intel'); setIsMenuOpen(false); }}>📰 News Intelligence</button>
            <button className="mobile-menu-item" onClick={() => { setView('assistant'); setIsMenuOpen(false); }}>Intelligence Assistant</button>
            <button className="mobile-menu-item" onClick={() => { setView('billing'); setIsMenuOpen(false); }}>Pricing</button>
            
            {user ? (
              <>
                <div onClick={() => { setView('profile'); setIsMenuOpen(false); }} style={{ cursor: 'pointer' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    background: 'rgba(244,167,38,0.1)',
                    borderRadius: '4px',
                    border: '1px solid rgba(244,167,38,0.3)',
                    marginBottom: '16px'
                  }}>
                    <ProfileAvatar user={user} size={48} />
                    <div>
                      <p style={{
                        color: '#F4A726',
                        fontWeight: '700',
                        fontSize: '15px',
                        margin: 0
                      }}>
                        {user.displayName || 'User'}
                      </p>
                      <p style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '12px',
                        margin: 0
                      }}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
                <button className="mobile-menu-item" onClick={() => { setView('profile'); setIsMenuOpen(false); }}>Profile Settings</button>
              </>
            ) : (
              <button className="mobile-menu-item" onClick={() => { openAuthModal(); setIsMenuOpen(false); }}>Login</button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-right {
          animation: slideRight 0.25s ease-out forwards;
        }
      `}</style>
    </header>
  );
}
