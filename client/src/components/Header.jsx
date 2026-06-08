import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, Search, LogIn, LogOut, User as UserIcon, Trash2, X, Settings as SettingsIcon, Menu, Tv, Newspaper, Bell, BellRing, Sparkles } from 'lucide-react';

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
    clearAllNotifications
  } = useAuth();
  
  const [time, setTime] = useState(new Date());
  const [tickerNews, setTickerNews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const suggestionsRef = useRef(null);
  const notifRef = useRef(null);

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

  // Geolocation weather fetch
  useEffect(() => {
    const fetchWeather = (lat = 28.6139, lon = 77.2090, cityName = 'New Delhi') => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(res => res.json())
        .then(data => {
          if (data && data.current_weather) {
            setWeather({
              temp: Math.round(data.current_weather.temperature),
              code: data.current_weather.weathercode,
              city: cityName
            });
          }
        })
        .catch(err => console.error('Error fetching weather:', err));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude, 'Local');
        },
        () => {
          fetchWeather(); // Fallback to New Delhi
        }
      );
    } else {
      fetchWeather();
    }
  }, []);

  const getWeatherIcon = (code) => {
    if (code === 0) return '☀️';
    if ([1, 2, 3].includes(code)) return '🌤️';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
    if ([95, 96, 99].includes(code)) return '⛈️';
    return '⛅';
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

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request HTML5 Push Notification permissions on visit
  useEffect(() => {
    if (settings?.pushAlerts && 'Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        Notification.requestPermission().then(permission => {
          console.log(`Browser push notifications authorization status: ${permission}`);
        });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [settings?.pushAlerts]);

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

  return (
    <header class="w-full bg-paper dark:bg-paper-dark border-b border-paper-border dark:border-paper-borderDark">
      {/* 1. BREAKING NEWS TICKER */}
      <div class="w-full bg-navy text-white py-1 px-4 text-xs font-semibold overflow-hidden flex items-center h-8">
        <div class="bg-gold text-navy px-2 py-0.5 mr-3 rounded text-[10px] uppercase font-bold tracking-wider animate-pulse shrink-0">
          Breaking
        </div>
        <div class="relative w-full overflow-hidden h-full flex items-center">
          <div class="whitespace-nowrap flex gap-12 animate-[marquee_40s_linear_infinite] hover:[animation-play-state:paused] cursor-pointer">
            {tickerNews.length > 0 ? (
              tickerNews.map((art, idx) => (
                <span key={idx} class="hover:text-gold transition-colors font-medium">
                  ✦ {art.title}
                </span>
              ))
            ) : (
              <span class="text-gray-400">✦ Loading global feeds... ✦ Striving for truth... ✦ Researching world events...</span>
            )}
          </div>
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
      <div class="max-w-7xl mx-auto px-4 md:px-6 py-2 flex justify-between items-center text-xs font-medium text-gray-550 dark:text-gray-400 border-b border-paper-border dark:border-paper-borderDark">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-navy dark:text-gold font-bold">LIVE:</span>
          <span>{formatDate(time)}</span>
          <span class="text-gray-300 dark:text-gray-700">|</span>
          <span class="font-mono tabular-nums">{formatTime(time)}</span>
          {weather && (
            <>
              <span class="text-gray-300 dark:text-gray-700">|</span>
              <span class="flex items-center gap-1 font-semibold" title={`Weather code: ${weather.code}`}>
                <span>{getWeatherIcon(weather.code)}</span>
                <span>{weather.city}:</span>
                <span class="font-mono">{weather.temp}°C</span>
              </span>
            </>
          )}
        </div>

        <div class="flex items-center gap-4">
          {/* Language Selector */}
          <div class="flex items-center gap-1 border border-paper-border dark:border-paper-borderDark rounded px-1.5 py-0.5 bg-gray-50/50 dark:bg-navy-light/10">
            <span class="text-[10px] text-gray-400">🌐</span>
            <select
              value={settings?.language || 'English'}
              onChange={(e) => updateSettings({ language: e.target.value })}
              class="bg-transparent text-gray-600 dark:text-gray-300 font-bold focus:outline-none cursor-pointer border-none text-[10px]"
            >
              <option value="English" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">EN</option>
              <option value="Hindi" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white">HI (हिंदी)</option>
              <option value="Spanish" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white font-serif">ES</option>
              <option value="French" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white font-serif">FR</option>
              <option value="German" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white font-serif">DE</option>
              <option value="Japanese" class="bg-paper dark:bg-paper-cardDark text-navy dark:text-white font-serif">JA</option>
            </select>
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

          {/* Notifications In-App Bell Dropdown */}
          {user && (
            <div ref={notifRef} class="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all relative flex items-center justify-center focus:outline-none"
                title="Alert Ledger"
              >
                {unreadNotificationsCount > 0 ? (
                  <>
                    <BellRing size={15} class="text-gold animate-bounce" />
                    <span class="absolute top-0 right-0 w-3 h-3 bg-red-655 rounded-full border border-paper dark:border-paper-dark text-[7.5px] font-black text-white flex items-center justify-center scale-95 shadow">
                      {unreadNotificationsCount}
                    </span>
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
                              <h4 class="text-navy dark:text-gray-250 truncate font-bold text-[10.5px] leading-tight">{notif.title}</h4>
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
                class="flex items-center gap-1.5 hover:text-gold font-semibold text-navy dark:text-gray-200 transition-colors"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" class="w-5 h-5 rounded-full object-cover border border-gold" />
                ) : (
                  <UserIcon size={14} class="text-gold" />
                )}
                <span class="hidden sm:inline max-w-[120px] truncate">{user.displayName || user.email}</span>
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
          onClick={() => setIsMenuOpen(true)}
          class="md:hidden absolute left-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-navy dark:text-gold"
          title="Open Menu Drawer"
        >
          <Menu size={22} />
        </button>

        <h1 
          onClick={() => { onCategoryChange('world'); setSearchQuery(''); setView('feed'); }}
          class="font-serif text-2xl min-[350px]:text-3xl min-[480px]:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-navy dark:text-gold cursor-pointer hover:opacity-90 select-none transition-all duration-300 leading-none"
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
        <nav class="flex items-center gap-2 overflow-x-auto lg:overflow-x-visible lg:flex-wrap pb-2 lg:pb-0 scrollbar-none font-serif font-bold text-sm tracking-wide shrink-0 lg:shrink max-w-full">
          
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
      {isMenuOpen && (
        <div class="fixed inset-0 z-50 flex md:hidden font-sans">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setIsMenuOpen(false)}
            class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          ></div>
          
          {/* Drawer body */}
          <div class="relative flex w-full max-w-[280px] flex-col bg-paper dark:bg-paper-cardDark p-5 overflow-y-auto shadow-2xl border-r border-paper-border dark:border-paper-borderDark text-navy dark:text-gray-200 transition-transform animate-slide-right">
            {/* Drawer Header */}
            <div class="flex items-center justify-between pb-3 border-b border-paper-border dark:border-paper-borderDark mb-5">
              <span class="font-serif font-black uppercase tracking-widest text-gold text-xs">ER News Bureau</span>
              <button 
                onClick={() => setIsMenuOpen(false)}
                class="text-gray-400 hover:text-navy dark:hover:text-white p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* User Session section */}
            <div class="mb-6 p-3 bg-gray-50 dark:bg-navy-light/10 border border-paper-border dark:border-paper-borderDark rounded">
              {user ? (
                <div class="space-y-3">
                  <div class="flex items-center gap-2">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" class="w-7 h-7 rounded-full object-cover border border-gold" />
                    ) : (
                      <UserIcon size={18} class="text-gold shrink-0" />
                    )}
                    <div class="min-w-0 flex-grow">
                      <p class="text-xs font-black truncate">{user.displayName || user.email}</p>
                      <span class="text-[9px] text-gray-450 block font-mono">
                        Status: {subscription?.tier === 'PRO' ? 'PRO Press' : 'Basic Wire'}
                      </span>
                    </div>
                  </div>
                  
                  <div class="flex gap-2">
                    <button
                      onClick={() => { setView('profile'); setIsMenuOpen(false); }}
                      class="flex-grow py-1 bg-navy text-gold text-[10px] font-bold uppercase tracking-wider rounded text-center border border-gold/15"
                    >
                      Profile
                    </button>
                    {subscription?.tier !== 'PRO' && (
                      <button
                        onClick={() => { setView('billing'); setIsMenuOpen(false); }}
                        class="flex-grow py-1 bg-gold text-navy text-[10px] font-black uppercase tracking-wider rounded text-center border border-gold/30"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { openAuthModal(); setIsMenuOpen(false); }}
                  class="w-full py-2 bg-navy text-gold text-[10px] font-black uppercase tracking-widest rounded flex items-center justify-center gap-1.5 border border-gold/15"
                >
                  <LogIn size={12} />
                  <span>Log In Credentials</span>
                </button>
              )}
            </div>

            {/* Mobile notifications ledger */}
            {user && (
              <div class="mb-6 p-3 bg-gray-50 dark:bg-navy-light/10 border border-paper-border dark:border-paper-borderDark rounded">
                <div class="flex items-center justify-between pb-2 border-b border-paper-border dark:border-paper-borderDark mb-3">
                  <span class="text-[9px] font-bold text-gray-450 uppercase tracking-widest font-mono">Notification Ledger</span>
                  {unreadNotificationsCount > 0 && (
                    <span class="bg-red-655 text-white font-black text-[8px] px-1.5 py-0.5 rounded-full scale-95">{unreadNotificationsCount}</span>
                  )}
                </div>
                
                <div class="max-h-40 overflow-y-auto space-y-2.5 divide-y divide-gray-150/10 scrollbar-none pr-1">
                  {notifications.length === 0 ? (
                    <p class="text-[10px] text-gray-450 italic text-center py-2">No active notifications</p>
                  ) : (
                    notifications.slice(0, 5).map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => { markAsRead(n.id); setIsMenuOpen(false); if (n.url) window.open(n.url, '_blank'); else setView('feed'); }}
                        class={`text-[10.5px] leading-relaxed cursor-pointer hover:text-gold pt-1.5 flex items-start gap-1.5 ${n.read ? 'opacity-60' : 'font-bold'}`}
                      >
                        <span class="shrink-0">{n.type === 'breaking' ? '🔴' : n.type === 'topic' ? '📰' : n.type === 'subscription' ? '💳' : n.type === 'welcome' ? '👋' : '🔐'}</span>
                        <div class="min-w-0 flex-grow">
                          <div class="flex justify-between items-center gap-1.5">
                            <span class="truncate block font-bold">{n.title}</span>
                            {!n.read && <span class="w-1.5 h-1.5 shrink-0 bg-red-655 rounded-full"></span>}
                          </div>
                          <span class="text-[8px] text-gray-500 font-mono block mt-0.5">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Premium Dispatches section */}
            <div class="space-y-2 mb-6">
              <span class="text-[9px] font-bold text-gray-450 uppercase tracking-widest block font-mono mb-1">Premium Desks</span>
              <button
                onClick={() => { setView('epaper'); setIsMenuOpen(false); }}
                class="w-full flex items-center gap-2.5 p-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-navy-light/10 text-left border border-transparent hover:border-paper-border dark:hover:border-paper-borderDark"
              >
                <Newspaper size={15} class="text-gold" />
                <span>Broadsheet E-Paper</span>
              </button>
              <button
                onClick={() => { setView('livetv'); setIsMenuOpen(false); }}
                class="w-full flex items-center gap-2.5 p-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-navy-light/10 text-left border border-transparent hover:border-paper-border dark:hover:border-paper-borderDark"
              >
                <Tv size={15} class="text-red-500 animate-pulse" />
                <span>Live Satellite TV</span>
              </button>
              <button
                onClick={() => { setView('assistant'); setIsMenuOpen(false); }}
                class="w-full flex items-center gap-2.5 p-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-navy-light/10 text-left border border-transparent hover:border-paper-border dark:hover:border-paper-borderDark text-gold-dark dark:text-gold"
              >
                <Sparkles size={15} class="text-gold" />
                <span>ER Claude Assistant</span>
              </button>
            </div>

            {/* Categories section */}
            <div class="space-y-1 mb-6">
              <span class="text-[9px] font-bold text-gray-455 uppercase tracking-widest block font-mono mb-2">News Categories</span>
              <div class="grid grid-cols-2 gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSearchQuery('');
                      onCategoryChange(cat.id);
                      setView('feed');
                      setIsMenuOpen(false);
                    }}
                    class={`p-2 rounded text-[10.5px] font-bold uppercase tracking-wide hover:bg-gray-55 dark:hover:bg-navy-light/5 text-left truncate border border-transparent ${
                      activeCategory === cat.id && !searchQuery
                        ? 'bg-navy/5 text-gold-dark dark:bg-gold/10 dark:text-gold-light border-navy/20 dark:border-gold/25'
                        : 'text-gray-500'
                    }`}
                  >
                    ✦ {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick settings footer */}
            <div class="border-t border-paper-border dark:border-paper-borderDark pt-4 mt-auto flex justify-between items-center gap-3">
              {/* Theme toggle */}
              <button 
                onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setIsMenuOpen(false); }}
                class="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500 hover:text-navy dark:hover:text-gold transition-colors"
              >
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                <span>{theme === 'dark' ? 'Day' : 'Night'} Mode</span>
              </button>
              
              {/* Logout */}
              {user && (
                <button
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  class="flex items-center gap-1 text-[10px] font-bold uppercase text-red-655 hover:text-red-700"
                >
                  <LogOut size={13} />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
