import React, { useState, useCallback, useRef } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Globe, Newspaper, ExternalLink, ChevronLeft, RefreshCw, Search, X, Loader } from 'lucide-react';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const NEWS_API_KEY = '6f075b0f9ff24eff9cebc5eb569e4731';

// Country name (from world-atlas topojson) → ISO 2-letter code for NewsAPI
const COUNTRY_CODE_MAP = {
  'Afghanistan': 'af',
  'Argentina': 'ar',
  'Australia': 'au',
  'Austria': 'at',
  'Belgium': 'be',
  'Brazil': 'br',
  'Bulgaria': 'bg',
  'Canada': 'ca',
  'China': 'cn',
  'Colombia': 'co',
  'Cuba': 'cu',
  'Czech Republic': 'cz',
  'Czechia': 'cz',
  'Egypt': 'eg',
  'France': 'fr',
  'Germany': 'de',
  'Greece': 'gr',
  'Hong Kong': 'hk',
  'Hungary': 'hu',
  'India': 'in',
  'Indonesia': 'id',
  'Ireland': 'ie',
  'Israel': 'il',
  'Italy': 'it',
  'Japan': 'jp',
  'Latvia': 'lv',
  'Lithuania': 'lt',
  'Malaysia': 'my',
  'Mexico': 'mx',
  'Morocco': 'ma',
  'Netherlands': 'nl',
  'New Zealand': 'nz',
  'Nigeria': 'ng',
  'Norway': 'no',
  'Philippines': 'ph',
  'Poland': 'pl',
  'Portugal': 'pt',
  'Romania': 'ro',
  'Russia': 'ru',
  'Saudi Arabia': 'sa',
  'Serbia': 'rs',
  'Singapore': 'sg',
  'Slovakia': 'sk',
  'Slovenia': 'si',
  'South Africa': 'za',
  'South Korea': 'kr',
  'Spain': 'es',
  'Sweden': 'se',
  'Switzerland': 'ch',
  'Taiwan': 'tw',
  'Thailand': 'th',
  'Turkey': 'tr',
  'Ukraine': 'ua',
  'United Arab Emirates': 'ae',
  'United Kingdom': 'gb',
  'United States of America': 'us',
  'United States': 'us',
  'Venezuela': 've',
};

// Country flag emoji by ISO code
const getFlagEmoji = (code) => {
  if (!code) return '🌐';
  const codePoints = code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Format relative time
const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
};

export default function WorldMap({ setView }) {
  const [tooltip, setTooltip] = useState({ visible: false, name: '', x: 0, y: 0 });
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCode, setSelectedCode] = useState(null);
  const [countryNews, setCountryNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [position, setPosition] = useState({ coordinates: [0, 20], zoom: 1 });

  const mapRef = useRef(null);

  const fetchCountryNews = useCallback(async (countryName) => {
    const code = COUNTRY_CODE_MAP[countryName];
    if (!code) {
      setSelectedCountry(countryName);
      setSelectedCode(null);
      setCountryNews([]);
      setError(`Live news feed not yet available for ${countryName}. Coverage expanding soon.`);
      return;
    }

    setSelectedCountry(countryName);
    setSelectedCode(code);
    setLoading(true);
    setError(null);
    setCountryNews([]);
    setSearchFilter('');

    try {
      const res = await fetch(
        `https://newsapi.org/v2/top-headlines?country=${code}&pageSize=20&apiKey=${NEWS_API_KEY}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.status === 'error') {
        throw new Error(data.message || 'NewsAPI error');
      }

      const articles = (data.articles || []).filter(a => a.title && a.title !== '[Removed]');
      setCountryNews(articles);

      if (articles.length === 0) {
        setError(`No live articles available for ${countryName} right now. Try again shortly.`);
      }
    } catch (err) {
      console.error('WorldMap news fetch error:', err);
      setError(`Could not load news for ${countryName}. ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCountryClick = useCallback((geo) => {
    const name = geo.properties.name;
    fetchCountryNews(name);
  }, [fetchCountryNews]);

  const handleMouseEnter = useCallback((geo, evt) => {
    setTooltip({
      visible: true,
      name: geo.properties.name,
      hasNews: !!COUNTRY_CODE_MAP[geo.properties.name],
      x: evt.clientX,
      y: evt.clientY,
    });
  }, []);

  const handleMouseMove = useCallback((evt) => {
    setTooltip(prev => prev.visible ? { ...prev, x: evt.clientX, y: evt.clientY } : prev);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleRefresh = () => {
    if (selectedCountry) fetchCountryNews(selectedCountry);
  };

  const filteredNews = countryNews.filter(a =>
    searchFilter === '' ||
    a.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    a.source?.name?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const supportedCount = Object.keys(COUNTRY_CODE_MAP).length;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #070E1A 0%, #0A1628 50%, #0D1F3C 100%)' }}>

      {/* Header Bar */}
      <div className="w-full border-b border-white/10 backdrop-blur-sm sticky top-0 z-30" style={{ background: 'rgba(10,22,40,0.95)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('feed')}
              className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-yellow-400 uppercase tracking-wider transition-colors"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Back to Feed</span>
            </button>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-yellow-400 animate-pulse" />
              <h1 className="font-serif text-base sm:text-lg font-black text-white tracking-wide">
                LIVE WORLD NEWS MAP
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
            <span className="text-green-400 font-bold hidden sm:inline">LIVE</span>
            <span className="text-white/40">{supportedCount} Countries</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

        {/* Instruction banner */}
        <div className="text-center mb-5">
          <p className="text-white/50 text-xs font-sans tracking-wide">
            🖱️ Click any country to load its real-time top headlines from NewsAPI.
            Highlighted countries have live feeds.
          </p>
        </div>

        {/* Map Container */}
        <div
          ref={mapRef}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #0A1628 0%, #051020 100%)',
            border: '1px solid rgba(244,167,38,0.25)',
            boxShadow: '0 0 60px rgba(244,167,38,0.08), inset 0 0 60px rgba(0,0,0,0.3)'
          }}
          onMouseMove={handleMouseMove}
        >
          {/* Map glow overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(244,167,38,0.04) 0%, transparent 70%)'
          }} />

          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 130, center: [0, 20] }}
            style={{ width: '100%', height: 'auto' }}
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates}
              onMoveEnd={({ coordinates, zoom }) => setPosition({ coordinates, zoom })}
              maxZoom={8}
              minZoom={0.8}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const isSelected = selectedCountry === geo.properties.name;
                    const hasLiveFeed = !!COUNTRY_CODE_MAP[geo.properties.name];
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => handleCountryClick(geo)}
                        onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                        onMouseLeave={handleMouseLeave}
                        style={{
                          default: {
                            fill: isSelected
                              ? '#F4A726'
                              : hasLiveFeed
                              ? '#1E4A7A'
                              : '#112240',
                            stroke: '#0A1628',
                            strokeWidth: 0.4,
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'fill 0.15s ease',
                          },
                          hover: {
                            fill: isSelected ? '#F4A726' : '#2A6FA8',
                            stroke: '#F4A726',
                            strokeWidth: 0.6,
                            outline: 'none',
                            cursor: 'pointer',
                          },
                          pressed: {
                            fill: '#D4943A',
                            outline: 'none',
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
            <button
              onClick={() => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }))}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-yellow-400/20 border border-white/20 hover:border-yellow-400/50 text-white font-bold text-sm flex items-center justify-center transition-all backdrop-blur-sm"
              title="Zoom In"
            >+</button>
            <button
              onClick={() => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 0.8) }))}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-yellow-400/20 border border-white/20 hover:border-yellow-400/50 text-white font-bold text-sm flex items-center justify-center transition-all backdrop-blur-sm"
              title="Zoom Out"
            >−</button>
            <button
              onClick={() => setPosition({ coordinates: [0, 20], zoom: 1 })}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-yellow-400/20 border border-white/20 hover:border-yellow-400/50 text-white font-bold text-[9px] flex items-center justify-center transition-all backdrop-blur-sm"
              title="Reset View"
            >↺</button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-10 backdrop-blur-sm bg-black/30 rounded-lg px-3 py-2 border border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#1E4A7A' }}></span>
              <span className="text-[9px] text-white/60 font-mono">Live Feed Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#F4A726' }}></span>
              <span className="text-[9px] text-white/60 font-mono">Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#112240' }}></span>
              <span className="text-[9px] text-white/60 font-mono">No Feed Yet</span>
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {tooltip.visible && (
          <div
            className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg text-xs font-bold text-white shadow-2xl border"
            style={{
              left: tooltip.x + 14,
              top: tooltip.y - 36,
              background: 'rgba(10,22,40,0.97)',
              borderColor: tooltip.hasNews ? 'rgba(244,167,38,0.6)' : 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              transform: 'translateY(-50%)',
            }}
          >
            <span className="mr-1.5">{getFlagEmoji(COUNTRY_CODE_MAP[tooltip.name])}</span>
            {tooltip.name}
            {tooltip.hasNews ? (
              <span className="ml-2 text-[9px] text-yellow-400 font-black uppercase tracking-wider">● LIVE</span>
            ) : (
              <span className="ml-2 text-[9px] text-white/30 font-mono">no feed</span>
            )}
          </div>
        )}

        {/* News Panel */}
        {selectedCountry && (
          <div className="mt-6 rounded-2xl overflow-hidden" style={{
            border: '1px solid rgba(244,167,38,0.2)',
            background: 'rgba(15,31,53,0.95)',
            backdropFilter: 'blur(10px)',
          }}>
            {/* Panel Header */}
            <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl shrink-0">{getFlagEmoji(selectedCode)}</span>
                <div className="min-w-0">
                  <h2 className="font-serif text-lg font-black text-white leading-tight truncate">
                    {selectedCountry}
                  </h2>
                  <p className="text-[10px] font-mono text-yellow-400/70 uppercase tracking-widest">
                    {loading ? 'Fetching live headlines...' : `${filteredNews.length} Articles Loaded`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-yellow-400/10 border border-white/10 hover:border-yellow-400/30 text-white/60 hover:text-yellow-400 transition-all disabled:opacity-30"
                  title="Refresh news"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => { setSelectedCountry(null); setCountryNews([]); setError(null); }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-400 transition-all"
                  title="Close panel"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Search filter */}
            {!loading && countryNews.length > 0 && (
              <div className="px-5 py-3 border-b border-white/5">
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Filter articles..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400/40 focus:ring-1 focus:ring-yellow-400/20"
                  />
                  {searchFilter && (
                    <button onClick={() => setSearchFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="p-5 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: 'rgba(30,74,122,0.25)' }}>
                    <div className="flex gap-3">
                      <div className="w-20 h-16 rounded-lg bg-white/10 shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-white/10 rounded w-full"></div>
                        <div className="h-3.5 bg-white/10 rounded w-4/5"></div>
                        <div className="h-2.5 bg-white/5 rounded w-1/3 mt-2"></div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-center gap-2 py-4 text-yellow-400/70 text-xs font-mono">
                  <Loader size={14} className="animate-spin" />
                  <span>Loading live headlines from NewsAPI...</span>
                </div>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="p-8 text-center">
                <Globe size={36} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/50 text-sm font-sans leading-relaxed max-w-md mx-auto">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold uppercase tracking-wider hover:bg-yellow-400/20 transition-all"
                >
                  Retry
                </button>
              </div>
            )}

            {/* No results after filter */}
            {!loading && !error && filteredNews.length === 0 && countryNews.length > 0 && (
              <div className="p-8 text-center">
                <p className="text-white/40 text-sm">No articles match your filter.</p>
                <button onClick={() => setSearchFilter('')} className="mt-2 text-yellow-400 text-xs underline">Clear filter</button>
              </div>
            )}

            {/* Article Grid */}
            {!loading && filteredNews.length > 0 && (
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredNews.map((article, i) => (
                    <a
                      key={i}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex gap-3 rounded-xl p-3.5 transition-all duration-200 hover:scale-[1.01]"
                      style={{
                        background: 'rgba(26,58,92,0.4)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(30,74,122,0.6)';
                        e.currentTarget.style.borderColor = 'rgba(244,167,38,0.25)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(26,58,92,0.4)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="shrink-0 w-20 h-16 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                        {article.urlToImage ? (
                          <img
                            src={article.urlToImage}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <Newspaper size={20} className="text-white/20" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <h3 className="text-white text-[12px] font-bold leading-snug line-clamp-3 group-hover:text-yellow-300 transition-colors">
                          {article.title}
                        </h3>
                        <div className="flex items-center justify-between mt-1.5 gap-2">
                          <span className="text-[9px] font-mono text-yellow-400/60 uppercase tracking-wider truncate">
                            {article.source?.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] text-white/30 font-mono">{getRelativeTime(article.publishedAt)}</span>
                            <ExternalLink size={9} className="text-white/20 group-hover:text-yellow-400/60 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Footer note */}
                <p className="text-center text-[9px] text-white/20 font-mono mt-5 pt-4 border-t border-white/5">
                  POWERED BY NEWSAPI.ORG · {filteredNews.length} ARTICLES · {getFlagEmoji(selectedCode)} {selectedCountry?.toUpperCase()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Country Selector (mobile-friendly fallback) */}
        {!selectedCountry && (
          <div className="mt-6 rounded-2xl p-5" style={{
            background: 'rgba(15,31,53,0.7)',
            border: '1px solid rgba(255,255,255,0.07)'
          }}>
            <h3 className="text-xs font-black text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Globe size={12} className="text-yellow-400" />
              Quick Select — Countries with Live Feeds
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(COUNTRY_CODE_MAP)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([name, code]) => (
                  <button
                    key={code}
                    onClick={() => fetchCountryNews(name)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white/70 hover:text-yellow-400 transition-all hover:scale-105"
                    style={{
                      background: 'rgba(30,74,122,0.3)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(244,167,38,0.4)';
                      e.currentTarget.style.background = 'rgba(30,74,122,0.6)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.background = 'rgba(30,74,122,0.3)';
                    }}
                  >
                    <span>{getFlagEmoji(code)}</span>
                    <span>{name}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
