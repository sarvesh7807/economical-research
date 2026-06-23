import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, Search, LogIn, LogOut, User as UserIcon, Trash2, X, Settings as SettingsIcon, Menu, Tv, Newspaper, Bell, BellRing, Sparkles, ClipboardList, Instagram } from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';
import SocialLinks from './SocialLinks';
import { FaXTwitter, FaInstagram } from 'react-icons/fa6';

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

export default function Header({ theme, setTheme, onSearchSubmit, onCategoryChange, activeCategory, openAuthModal, setView, view }) {
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

    setWeather({
      city: data.name,
      temp: data.main?.temp || 0,
      feels: data.main?.feels_like || 0,
      humidity: humidity,
      description: description,
      country: country,
      monsoonActive: monsoonActive
    });
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
    { id: 'world', name: 'World' },
    { id: 'india', name: 'India' },
    { id: 'politics', name: 'Politics' },
    { id: 'tech', name: 'Tech & AI' },
    { id: 'business', name: 'Business' },
    { id: 'finance', name: 'Finance' },
    { id: 'sports', name: 'Sports' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'science', name: 'Science' },
    { id: 'environment', name: 'Environment' },
    { id: 'health', name: 'Health' },
    { id: 'education', name: 'Education' },
    { id: 'travel', name: 'Travel' },
    { id: 'lifestyle', name: 'Lifestyle' },
    { id: 'law', name: 'Law & Crime' },
    { id: 'research', name: 'Research' }
  ];

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const activeAlertsCount = userAlerts ? userAlerts.length : 0;
  const totalBadgeCount = unreadNotificationsCount + activeAlertsCount;

  return (
    <header class="w-full bg-paper dark:bg-paper-dark border-b border-paper-border dark:border-paper-borderDark overflow-hidden">
      {/* 1. BREAKING NEWS TICKER */}
      <div class="w-full bg-navy text-white py-1 px-4 text-xs font-semibold overflow-hidden flex items-center h-8">
        <div class="bg-gold text-navy px-2 py-0.5 mr-3 rounded text-[10px] uppercase font-bold tracking-wider animate-pulse shrink-0">
          Breaking
        </div>
        <div class="relative w-full overflow-hidden h-full flex items-center">
          {tickerNews.length > 0 ? (
            <span class="hover:text-gold transition-colors font-medium truncate block max-w-full">
              ✦ {tickerNews[tickerIndex]?.title}
            </span>
          ) : (
            <span class="text-gray-400">✦ Loading global feeds... ✦ Striving for truth... ✦ Researching world events...</span>
          )}
        </div>
      </div>

      {/* STOCKS TICKER */}
      <div class="w-full bg-[#0A1628]/95 border-y border-gold/20 text-white py-1 px-4 text-[10px] overflow-hidden flex items-center h-7 font-mono">
        <div class="whitespace-nowrap flex gap-12 animate-[marquee_35s_linear_infinite] hover:[animation-play-state:paused] cursor-pointer">
          {stocks.map((stock, idx) => (
            <span key={idx} class="flex items-center gap-1">
              <span class="font-bold text-gold">{stock.symbol}:</span>
              <span class="font-semibold">{stock.price}</span>
              <span class={`font-bold ${stock.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stock.pct >= 0 ? '▲' : '▼'} {stock.pct >= 0 ? '+' : ''}{stock.pct}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* 2. SUB HEADER (CLOCK & WEATHER & AUTH & THEME & LANGUAGE & BELL) */}
      <div class="max-w-7xl mx-auto px-4 md:px-6 py-2 flex justify-between items-center text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-paper-border dark:border-paper-borderDark">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-navy dark:text-gold font-bold">LIVE:</span>
          <span>{formatDate(time)}</span>
          {weather && !weather.error ? (
              <>
                <span class="text-gray-300 dark:text-gray-700">|</span>
                <span class="flex items-center gap-2 flex-wrap font-semibold">
                  <span 
                    class="cursor-pointer hover:underline flex items-center gap-1 text-navy dark:text-gold" 
                    title="Click to change city preference"
                    onClick={handleCityChangePrompt}
                  >
                    {getWeatherEmoji(weather.description)} {weather.city} {Math.round(weather.temp)}°C ✏️
                  </span>
                  <span class="text-gray-300 dark:text-gray-700">|</span>
                  <span>💧 Humidity {weather.humidity}%</span>
                  {weather.monsoonActive && (
                    <>
                      <span class="text-gray-300 dark:text-gray-700">|</span>
                      <span class="text-blue-500 font-bold animate-pulse flex items-center gap-1">🌧️ Monsoon Active</span>
                    </>
                  )}
                  <span class="text-gray-300 dark:text-gray-700">|</span>
                  <span class="flex items-center gap-1 font-mono tabular-nums">🕐 {getLocalTimeStr()} {getTimezoneAbbr()}</span>
                </span>
              </>
          ) : (
            <>
              <span class="text-gray-300 dark:text-gray-700">|</span>
              <span class="flex items-center gap-1 font-mono tabular-nums">🕐 {getLocalTimeStr()} {getTimezoneAbbr()}</span>
            </>
          )}
        </div>

        <div class="flex items-center gap-4 flex-wrap justify-end">
          {/* Custom Language Selector */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 border border-paper-border dark:border-paper-borderDark rounded px-2 py-0.5 bg-gray-50/55 dark:bg-navy-light/10 text-gray-650 dark:text-gray-300 hover:border-gold/50 transition-all font-bold text-[10px] focus:outline-none"
            >
              <span>🌐</span>
              <span>{languages.find(l => l.code === selectedLang)?.flag}</span>
              <span className="font-serif">{languages.find(l => l.code === selectedLang)?.name}</span>
              <span className="text-[7px] opacity-75">▼</span>
            </button>
            {isLangOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-[#0a192f] text-white border border-[#d4af37]/45 rounded-md shadow-2xl z-[100] p-2 font-sans">
                {/* Search Box */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Search language..."
                    className="w-full bg-[#112240] text-white border border-[#d4af37]/20 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-[#d4af37] placeholder-gray-400 font-medium"
                  />
                </div>
                {/* Language list */}
                <div className="max-h-60 overflow-y-auto scrollbar-none flex flex-col gap-0.5">
                  {languages
                    .filter(l => l.name.toLowerCase().includes(langSearch.toLowerCase()) || l.code.includes(langSearch.toLowerCase()))
                    .map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`flex items-center justify-between w-full text-left px-2.5 py-1.5 rounded text-[11px] font-semibold transition-all ${
                          selectedLang === lang.code
                            ? 'bg-[#d4af37] text-[#0a192f]'
                            : 'hover:bg-[#112240] text-gray-200'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                        {selectedLang === lang.code && (
                          <span className="text-[9px] font-black">✓</span>
                        )}
                      </button>
                    ))}
                  {languages.filter(l => l.name.toLowerCase().includes(langSearch.toLowerCase()) || l.code.includes(langSearch.toLowerCase())).length === 0 && (
                    <div className="text-center py-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      No matching language
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Settings Button */}
          <button 
            onClick={() => setView('settings')}
            class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all"
            title="Settings"
          >
            <SettingsIcon size={15} />
          </button>

          {/* X (Twitter) Follow Icon */}
          <a
            href="https://x.com/ERNewsDesk"
            target="_blank"
            rel="noopener noreferrer"
            class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white transition-all flex items-center justify-center"
            title="Follow us on X (Twitter)"
          >
            <FaXTwitter size={15} />
          </a>

          {/* Instagram Follow Icon */}
          <a
            href="https://www.instagram.com/economical.research"
            target="_blank"
            rel="noopener noreferrer"
            class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-[#E1306C] hover:text-[#ff4783] transition-all flex items-center justify-center"
            title="Follow us on Instagram"
          >
            <FaInstagram size={15} />
          </a>

          {/* Notifications In-App Bell Dropdown */}
          {user && (
            <div ref={notifRef} class="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all relative flex items-center justify-center focus:outline-none"
                title="Alert Ledger"
              >
                {totalBadgeCount > 0 ? (
                  <>
                    <BellRing size={15} class="text-gold animate-bounce" />
                    <span class="absolute top-0 right-0 w-3.5 h-3.5 bg-red-600 rounded-full border border-paper dark:border-paper-dark text-[7.5px] font-black text-white flex items-center justify-center scale-95 shadow">
                      {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
                    </span>
                    {activeAlertsCount > 0 && (
                      <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-gold rounded-full border border-paper dark:border-paper-dark animate-ping" style={{ animationDuration: '2s' }}></span>
                    )}
                  </>
                ) : (
                  <Bell size={15} />
                )}
              </button>

              {isNotifOpen && (
                <div class="absolute right-0 mt-2 w-80 bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded shadow-2xl z-50 overflow-hidden font-sans">
                  {/* Panel Header */}
                  <div class="bg-navy text-white px-3 py-2 flex items-center justify-between border-b border-gold/10 shrink-0">
                    <span class="font-serif text-[10px] font-black uppercase tracking-wider text-gold">Alert Registry Ledger</span>
                    <div class="flex gap-2">
                      {notifications.length > 0 && (
                        <>
                          <button
                            onClick={markAllRead}
                            class="text-[8.5px] hover:text-gold uppercase tracking-wider font-bold border border-white/10 px-1.5 py-0.5 rounded transition-colors"
                          >
                            Read All
                          </button>
                          <button
                            onClick={clearAllNotifications}
                            class="text-[8.5px] hover:text-gold uppercase tracking-wider font-bold border border-white/10 px-1.5 py-0.5 rounded transition-colors"
                          >
                            Clear
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Panel list */}
                  <div class="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 scrollbar-none">
                    {notifications.length === 0 ? (
                      <div class="p-8 text-center text-gray-400 text-[10px] font-bold uppercase tracking-wider">
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
                          class={`p-3 text-left transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-light/10 flex items-start gap-2.5 ${
                            notif.read ? 'opacity-60' : 'bg-gold/5 dark:bg-gold/5 font-semibold'
                          }`}
                        >
                          <span class="text-xs shrink-0 mt-0.5">
                            {notif.type === 'breaking' ? '🔴' : notif.type === 'topic' ? '📰' : notif.type === 'subscription' ? '💳' : notif.type === 'welcome' ? '👋' : '🔐'}
                          </span>
                          
                          <div class="min-w-0 flex-grow text-[11px] leading-relaxed">
                            <div class="flex justify-between items-start gap-1.5">
                              <h4 class="text-navy dark:text-gray-300 truncate font-bold text-[10.5px] leading-tight">{notif.title}</h4>
                              {!notif.read && (
                                <span class="w-1.5 h-1.5 shrink-0 rounded-full bg-red-655 mt-1"></span>
                              )}
                            </div>
                            <p class="text-gray-450 dark:text-gray-400 mt-0.5 leading-normal text-[9.5px]">{notif.text}</p>
                            <span class="text-[8px] text-gray-500 font-mono mt-1 block">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Feature 2: Active Topic Alerts panel */}
                  {userAlerts && userAlerts.length > 0 && (
                    <div class="border-t border-gray-100 dark:border-gray-800 px-3 py-2 bg-gold/5">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-[9px] font-black text-gold uppercase tracking-widest flex items-center gap-1">
                          <BellRing size={9} />
                          Your Topic Alerts
                        </span>
                        <button
                          onClick={() => { setIsNotifOpen(false); setView('profile'); }}
                          class="text-[8px] font-bold text-navy/60 dark:text-gray-400 hover:text-gold uppercase tracking-wider"
                        >
                          Manage ↗
                        </button>
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        {userAlerts.slice(0, 5).map((alert) => (
                          <span
                            key={alert.id}
                            class="px-2 py-0.5 bg-gold/10 border border-gold/30 text-navy dark:text-gold text-[9px] font-bold rounded-full"
                          >
                            🔔 {alert.topic}
                          </span>
                        ))}
                        {userAlerts.length > 5 && (
                          <span class="text-[9px] text-gray-400 font-bold self-center">+{userAlerts.length - 5} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          <span class="text-gray-300 dark:text-gray-700">|</span>

          {/* User Auth Info */}
          {user ? (
            <div class="flex items-center gap-3">
              {/* Gold Upgrade to PRO button for Basic users */}
              {subscription?.tier !== 'PRO' && (
                <button
                  onClick={() => setView('billing')}
                  class="bg-gold hover:bg-gold-light text-[#0A1628] font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded shadow transition-all hover:scale-105 shrink-0"
                >
                  Upgrade to PRO
                </button>
              )}

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
                <ProfileAvatar user={user} size={38} />
                <span class="hidden sm:inline max-w-[120px] truncate text-navy dark:text-gray-200 font-semibold hover:text-gold transition-colors">{user.displayName || user.email}</span>
                {subscription?.tier === 'PRO' && (
                  <span class="bg-gold/20 text-gold-dark text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-95 border border-gold/10 ml-1">PRO</span>
                )}
              </button>
              <button 
                onClick={logout}
                class="flex items-center gap-1 text-red-655 hover:text-red-700 font-semibold"
                title="Logout"
              >
                <LogOut size={14} />
                <span class="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={openAuthModal}
              class="flex items-center gap-1.5 hover:text-navy dark:hover:text-gold font-bold text-gray-700 dark:text-gray-300 transition-colors"
            >
              <LogIn size={14} />
              <span>Log In / Sign Up</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. MAIN LOGO / MASTHEAD */}
      <div class="max-w-7xl mx-auto px-4 md:px-6 py-6 text-center relative">
        {/* Hamburger icon on mobile */}
        <button 
          onClick={() => {
            console.log('Hamburger clicked');
            setIsMenuOpen(true);
          }}
          class="hamburger md:hidden absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-navy dark:text-gold z-[100000]"
          style={{ minWidth: '44px', minHeight: '44px', cursor: 'pointer' }}
          title="Open Menu Dropdown"
        >
          <Menu size={22} />
        </button>

        <h1 
          onClick={() => { onCategoryChange('world'); setSearchQuery(''); setView('feed'); }}
          class="font-serif text-xl min-[350px]:text-2xl min-[400px]:text-3xl min-[480px]:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-navy dark:text-gold cursor-pointer hover:opacity-90 select-none transition-all duration-300 leading-none px-10 md:px-0"
        >
          ECONOMICAL RESEARCH
        </h1>
        <p class="mt-2 text-xs sm:text-sm font-serif italic text-navy/70 dark:text-white/80 tracking-widest uppercase font-semibold">
          &ldquo;Your World. Your News. Researched.&rdquo;
        </p>
      </div>

      {/* 4. SEARCH AND NAVBAR */}
      <div class="max-w-7xl mx-auto px-4 md:px-6 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-double-navy py-3">
        {/* Category Navbar */}
        <nav class="header-nav flex items-center gap-2 overflow-x-auto lg:overflow-x-visible lg:flex-wrap pb-2 lg:pb-0 scrollbar-none font-serif font-bold text-sm tracking-wide shrink-0 lg:shrink max-w-full">
          
          {/* E-Paper navbar action */}
          <button
            onClick={() => setView('epaper')}
            class={`px-2.5 py-1.5 flex items-center gap-1.5 border-b-2 font-sans font-black uppercase tracking-wider text-xs shrink-0 transition-all ${
              view === 'epaper'
                ? 'border-navy dark:border-gold text-navy dark:text-gold'
                : 'border-transparent text-navy hover:text-gold dark:text-gold-light dark:hover:text-gold'
            }`}
          >
            <Newspaper size={13} class="text-gold" />
            <span>E-Paper</span>
          </button>

          {/* Live TV navbar action */}
          <button
            onClick={() => setView('livetv')}
            class={`px-2.5 py-1.5 flex items-center gap-1.5 border-b-2 font-sans font-black uppercase tracking-wider text-xs shrink-0 transition-all ${
              view === 'livetv'
                ? 'border-navy dark:border-gold text-red-655'
                : 'border-transparent text-red-655 hover:text-red-750'
            }`}
          >
            <Tv size={13} class="animate-pulse" />
            <span>Live satellite TV</span>
          </button>

          {/* ER Assistant navbar action */}
          <button
            onClick={() => setView('assistant')}
            class={`px-2.5 py-1.5 flex items-center gap-1.5 border-b-2 font-sans font-black uppercase tracking-wider text-xs shrink-0 transition-all ${
              view === 'assistant'
                ? 'border-navy dark:border-gold text-navy dark:text-gold'
                : 'border-transparent text-navy hover:text-gold dark:text-gold-light dark:hover:text-gold'
            }`}
          >
            <Sparkles size={13} class="text-gold" />
            <span>ER Assistant</span>
          </button>

          {/* Fake News Checker navbar action */}
          <button
            onClick={() => setView('fake-news')}
            class={`px-2.5 py-1.5 flex items-center gap-1.5 border-b-2 font-sans font-black uppercase tracking-wider text-xs shrink-0 transition-all ${
              view === 'fake-news'
                ? 'border-navy dark:border-gold text-navy dark:text-gold'
                : 'border-transparent text-navy hover:text-gold dark:text-gold-light dark:hover:text-gold'
            }`}
          >
            <span>🔍</span>
            <span>Fake News Checker</span>
          </button>

          {/* Bias Detector navbar action */}
          <button
            onClick={() => setView('bias-detector')}
            class={`px-2.5 py-1.5 flex items-center gap-1.5 border-b-2 font-sans font-black uppercase tracking-wider text-xs shrink-0 transition-all ${
              view === 'bias-detector'
                ? 'border-navy dark:border-gold text-navy dark:text-gold'
                : 'border-transparent text-navy hover:text-gold dark:text-gold-light dark:hover:text-gold'
            }`}
          >
            <span>⚖️</span>
            <span>Bias Detector</span>
          </button>

          {/* World Map navbar action */}
          <button
            onClick={() => setView('world-map')}
            class={`px-2.5 py-1.5 flex items-center gap-1.5 border-b-2 font-sans font-black uppercase tracking-wider text-xs shrink-0 transition-all ${
              view === 'world-map'
                ? 'border-navy dark:border-gold text-navy dark:text-gold'
                : 'border-transparent text-navy hover:text-gold dark:text-gold-light dark:hover:text-gold'
            }`}
          >
            <span>🌍</span>
            <span>World Map</span>
          </button>

          {/* Outcome Tracker navbar action */}
          <button
            onClick={() => setView('outcome-tracker')}
            class={`px-2.5 py-1.5 flex items-center gap-1.5 border-b-2 font-sans font-black uppercase tracking-wider text-xs shrink-0 transition-all ${
              view === 'outcome-tracker' || view === 'outcome-detail'
                ? 'border-navy dark:border-gold text-navy dark:text-gold'
                : 'border-transparent text-navy hover:text-gold dark:text-gold-light dark:hover:text-gold'
            }`}
          >
            <ClipboardList size={13} class="text-gold" />
            <span>Outcome Tracker</span>
          </button>

          <span class="text-gray-300 dark:text-gray-700 shrink-0 font-light mx-1">|</span>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSearchQuery('');
                onCategoryChange(cat.id);
                setView('feed');
              }}
              class={`px-3 py-1.5 border-b-2 whitespace-nowrap transition-all uppercase ${
                activeCategory === cat.id && !searchQuery
                  ? 'border-navy dark:border-gold text-navy dark:text-gold'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </nav>

        {/* Search Bar with live suggestions */}
        <div ref={suggestionsRef} class="relative w-full lg:w-80">
          <form onSubmit={handleSearchSubmit} class="relative flex items-center">
            <input
              type="text"
              placeholder="Search wire reports..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              class="w-full pl-8 pr-8 py-2 text-xs font-semibold rounded bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark text-navy dark:text-white focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <Search size={14} class="absolute left-2.5 text-gray-400" />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => { setSearchQuery(''); setSuggestions([]); }} 
                class="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Autocomplete Suggestions & History popup */}
          {showSuggestions && (searchQuery.trim().length >= 2 || searchHistory.length > 0) && (
            <div class="absolute z-50 w-full mt-1.5 bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded shadow-lg overflow-hidden text-xs">
              {/* Live suggestions */}
              {suggestions.length > 0 && (
                <div class="py-1">
                  <div class="px-3 py-1 font-semibold text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Live Matches
                  </div>
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(item)}
                      class="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-navy-light text-navy dark:text-white font-medium truncate"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              {/* Search History */}
              {searchHistory.length > 0 && (
                <div class="border-t border-paper-border dark:border-paper-borderDark py-1 bg-gray-50/50 dark:bg-paper-dark/30">
                  <div class="px-3 py-1 flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <span>Recent Searches</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); clearSearchHistory(); }}
                      class="hover:text-red-500 font-bold"
                    >
                      Clear All
                    </button>
                  </div>
                  {searchHistory.map((item, idx) => (
                    <div 
                      key={idx} 
                      class="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-navy-light px-3 py-1.5 text-navy dark:text-white"
                    >
                      <button
                        onClick={() => handleSuggestionClick(item)}
                        class="text-left font-medium truncate flex-grow"
                      >
                        {item}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSearchQuery(item); }}
                        class="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                        title="Delete from history"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. MOBILE DRAWER OVERLAY */}
      <div class="md:hidden font-sans">
        <div 
          class={`mobile-menu-backdrop ${isMenuOpen ? 'open' : ''}`} 
          onClick={() => setIsMenuOpen(false)}
        ></div>
        <div class={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <div class="mobile-menu-header">
            <span style={{ color: '#F4A726', fontWeight: 'bold', fontSize: '18px', letterSpacing: '2px' }}>MENU</span>
            <button class="mobile-menu-close" onClick={() => setIsMenuOpen(false)}>✕</button>
          </div>
          <div style={{ paddingBottom: '40px' }}>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('foryou'); setView('feed'); setIsMenuOpen(false); }}>For You ⭐</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('world'); setView('feed'); setIsMenuOpen(false); }}>Home</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('world'); setView('feed'); setIsMenuOpen(false); }}>World News</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('india'); setView('feed'); setIsMenuOpen(false); }}>India News</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('politics'); setView('feed'); setIsMenuOpen(false); }}>Politics</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('tech'); setView('feed'); setIsMenuOpen(false); }}>Technology</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('business'); setView('feed'); setIsMenuOpen(false); }}>Business</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('finance'); setView('feed'); setIsMenuOpen(false); }}>Finance</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('sports'); setView('feed'); setIsMenuOpen(false); }}>Sports</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('entertainment'); setView('feed'); setIsMenuOpen(false); }}>Entertainment</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('science'); setView('feed'); setIsMenuOpen(false); }}>Science</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('environment'); setView('feed'); setIsMenuOpen(false); }}>Environment</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('health'); setView('feed'); setIsMenuOpen(false); }}>Health</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('education'); setView('feed'); setIsMenuOpen(false); }}>Education</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('travel'); setView('feed'); setIsMenuOpen(false); }}>Travel</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('lifestyle'); setView('feed'); setIsMenuOpen(false); }}>Lifestyle</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('law'); setView('feed'); setIsMenuOpen(false); }}>Law & Crime</button>
            <button class="mobile-menu-item" onClick={() => { onCategoryChange('research'); setView('feed'); setIsMenuOpen(false); }}>Research</button>
            
            <button class="mobile-menu-item" onClick={() => { setView('fake-news'); setIsMenuOpen(false); }} style={{ marginTop: '10px', borderTop: '1px solid #1A3A5C' }}>Fake News Checker</button>
            <button class="mobile-menu-item" onClick={() => { setView('bias-detector'); setIsMenuOpen(false); }}>Bias Detector</button>
            <button class="mobile-menu-item" onClick={() => { setView('world-map'); setIsMenuOpen(false); }}>World News Map</button>
            <button class="mobile-menu-item" onClick={() => { setView('outcome-tracker'); setIsMenuOpen(false); }}>Outcome Tracker</button>
            <button class="mobile-menu-item" onClick={() => { setView('epaper'); setIsMenuOpen(false); }}>E-Paper</button>
            <button class="mobile-menu-item" onClick={() => { setView('livetv'); setIsMenuOpen(false); }}>Live TV</button>
            <button class="mobile-menu-item" onClick={() => { setView('assistant'); setIsMenuOpen(false); }}>Deep Research Desk</button>
            <button class="mobile-menu-item" onClick={() => { setView('billing'); setIsMenuOpen(false); }}>Pricing</button>
            
            {user ? (
              <>
                <div onClick={() => { setView('profile'); setIsMenuOpen(false); }} style={{ cursor: 'pointer' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    background: 'rgba(244,167,38,0.1)',
                    borderRadius: '10px',
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
                <button class="mobile-menu-item" onClick={() => { setView('profile'); setIsMenuOpen(false); }}>Profile Settings</button>
              </>
            ) : (
              <button class="mobile-menu-item" onClick={() => { openAuthModal(); setIsMenuOpen(false); }}>Login</button>
            )}

            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '16px',
              marginTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <p style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '12px',
                margin: 0
              }}>Follow Us</p>
              <SocialLinks />
            </div>
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
      <div className="header-border w-full"></div>
    </header>
  );
}
