import React, { useState, useEffect } from 'react';
import DataRouter from '../utils/DataRouter';
import AIRouter from '../ai/AIRouter';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ArrowLeft, Star, Sparkles } from 'lucide-react';

const COUNTRY_MAP = {
  IN: { name: 'India', currency: 'INR', flag: '🇮🇳' },
  US: { name: 'United States', currency: 'USD', flag: '🇺🇸' },
  GB: { name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  AE: { name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪' },
  CN: { name: 'China', currency: 'CNY', flag: '🇨🇳' },
  BR: { name: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
  JP: { name: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  DE: { name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  FR: { name: 'France', currency: 'EUR', flag: '🇫🇷' },
  RU: { name: 'Russia', currency: 'RUB', flag: '🇷🇺' }
};

export default function CountryPage({ setView, countryCode }) {
  const { user } = useAuth();
  const userId = user ? user.uid : 'guest';

  const details = COUNTRY_MAP[countryCode] || { name: countryCode, currency: 'USD', flag: '🏳️' };
  const countryName = details.name;

  const [gdp, setGdp] = useState(null);
  const [inflation, setInflation] = useState(null);
  const [unemployment, setUnemployment] = useState(null);
  const [population, setPopulation] = useState(null);
  const [tradeBalance, setTradeBalance] = useState(null);
  const [currencyRate, setCurrencyRate] = useState(null);

  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);

  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(true);

  const [isWatched, setIsWatched] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const [explanationModal, setExplanationModal] = useState({ open: false, text: '' });
  const [modalLoading, setModalLoading] = useState(false);

  // Check Watchlist state
  const checkWatchlist = async () => {
    if (!db) return;
    try {
      const docRef = doc(db, 'watchlists', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const items = docSnap.data().items || [];
        const exists = items.some(item => item.type === 'country' && item.code === countryCode);
        setIsWatched(exists);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Watchlist state
  const handleToggleWatchlist = async () => {
    if (!db) return;
    setWatchlistLoading(true);
    try {
      const docRef = doc(db, 'watchlists', userId);
      const docSnap = await getDoc(docRef);
      let items = [];
      if (docSnap.exists()) {
        items = docSnap.data().items || [];
      }
      const exists = items.some(item => item.type === 'country' && item.code === countryCode);
      let updatedItems;
      if (exists) {
        updatedItems = items.filter(item => !(item.type === 'country' && item.code === countryCode));
        setIsWatched(false);
      } else {
        updatedItems = [...items, {
          type: 'country',
          code: countryCode,
          name: countryName,
          addedAt: new Date().toISOString()
        }];
        setIsWatched(true);
      }
      await setDoc(docRef, { items: updatedItems });
    } catch (e) {
      console.error(e);
    } finally {
      setWatchlistLoading(false);
    }
  };

  // Generate Gemini Macro overview
  const generateCountryOverview = async () => {
    setAiLoading(true);
    try {
      const prompt = `
      You are Economical Research AI.
      Generate a concise, professional country macroeconomic overview for ${countryName} (${countryCode}).
      Provide a summary of its current economic status, structural strengths, key risks, and 12-month outlook.
      Keep it under 180 words. Never mention AI provider.
      `;
      const summary = await AIRouter.route(prompt, 'research');
      setAiSummary(summary);
    } catch (e) {
      setAiSummary('Macroeconomic briefing temporarily offline.');
    } finally {
      setAiLoading(false);
    }
  };

  const explainStat = async (title, value, source) => {
    setModalLoading(true);
    setExplanationModal({ open: true, text: 'Analyzing statistic...' });
    const prompt = `
    You are Economical Research AI.
    Explain this economic indicator:
    
    Indicator: ${title}
    Value: ${value}
    Source: ${source}
    
    Provide:
    1. What this means (2 sentences)
    2. Why it changed (historical context)
    3. Impact on economy/markets
    4. What to watch next
    
    Keep response under 150 words.
    Professional tone. Never mention AI provider.
    `;
    try {
      const explanation = await AIRouter.route(prompt, 'research');
      setExplanationModal({ open: true, text: explanation });
    } catch (e) {
      setExplanationModal({ open: true, text: 'Explanation temporarily unavailable.' });
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    const loadCountryData = async () => {
      // Reset states
      setGdp(null);
      setInflation(null);
      setUnemployment(null);
      setPopulation(null);
      setTradeBalance(null);
      setCurrencyRate(null);
      setNews([]);
      setNewsLoading(true);

      // Fetch WB indicators
      DataRouter.getGDP(countryCode).then(setGdp).catch(() => setGdp({ error: true }));
      DataRouter.getInflation(countryCode).then(setInflation).catch(() => setInflation({ error: true }));
      DataRouter.getUnemployment(countryCode).then(setUnemployment).catch(() => setUnemployment({ error: true }));
      DataRouter.getPopulation(countryCode).then(setPopulation).catch(() => setPopulation({ error: true }));
      DataRouter.getTradeBalance(countryCode).then(setTradeBalance).catch(() => setTradeBalance({ error: true }));

      // Fetch USD exchange rates and lookup this country's currency
      DataRouter.getCurrencyRates('USD')
        .then(data => {
          if (data && data.rates) {
            const rate = data.rates[details.currency];
            setCurrencyRate(rate ? { value: rate.toFixed(2), code: details.currency, source: data.source } : { error: true });
          } else {
            setCurrencyRate({ error: true });
          }
        })
        .catch(() => setCurrencyRate({ error: true }));

      // Fetch related News
      fetch(`/api/news?q=${encodeURIComponent(countryName)}&pageSize=5`)
        .then(res => res.json())
        .then(data => {
          setNews(data.articles || []);
          setNewsLoading(false);
        })
        .catch(() => {
          setNews([]);
          setNewsLoading(false);
        });

      generateCountryOverview();
      checkWatchlist();
    };

    loadCountryData();
  }, [countryCode]);

  const StatCard = ({ title, data, unit = '' }) => {
    if (!data) return <ShimmerCard title={title} />;
    
    const isError = data.error || data.value === null || data.value === undefined;
    
    if (isError) return (
      <div className="bg-navy-dark border border-border-subtle p-5 rounded-lg flex flex-col justify-between h-36">
        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">{title}</span>
        <p className="text-xs text-red-400 font-mono uppercase tracking-tight leading-normal my-auto">Live data temporarily unavailable</p>
      </div>
    );

    return (
      <div className="bg-[#0A1628]/60 border border-[#F4A726]/10 p-5 rounded-lg flex flex-col justify-between h-36 hover:border-[#F4A726]/30 transition-colors shadow-lg">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{title}</span>
          <button 
            onClick={() => explainStat(title, `${data.value}${unit}`, data.source || 'World Bank')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(244,167,38,0.6)',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '2px 6px'
            }}>
            Why? 💡
          </button>
        </div>

        <div className="my-auto">
          <p className="text-3xl font-black text-[#F4A726] font-mono tracking-tight leading-none">
            {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}{unit}
          </p>
        </div>

        <div className="flex justify-between items-center text-[9px] font-mono text-gray-500 uppercase">
          <span>{data.source || 'World Bank'}</span>
          <span>{data.year || '2023'}</span>
        </div>
      </div>
    );
  };

  const ShimmerCard = ({ title }) => (
    <div className="bg-navy-dark border border-[#F4A726]/5 p-5 rounded-lg h-36 flex flex-col justify-between animate-pulse">
      <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">{title}</span>
      <div className="h-6 bg-white/5 rounded w-1/3 my-auto"></div>
      <div className="h-2.5 bg-white/5 rounded w-1/2"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8 text-white min-h-[calc(100vh-140px)]">
      
      {/* Back Button */}
      <button 
        onClick={() => setView('feed')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gold uppercase tracking-wider transition-colors bg-transparent border-none cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Return to Wire Feed</span>
      </button>

      {/* Header Profile Section */}
      <div className="border-b border-[#F4A726]/10 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
            sovereign profile desk · {countryCode}
          </span>
          <h1 className="font-serif text-4xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <span>{details.flag}</span>
            <span>{countryName} Intelligence Page</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Consolidated real-time macroeconomic indicators, exchange registry updates, regional news, and algorithmic risk assessments.
          </p>
        </div>

        <button
          onClick={handleToggleWatchlist}
          disabled={watchlistLoading}
          className={`px-4 py-2.5 rounded text-xs font-bold uppercase border transition-colors flex items-center gap-2 cursor-pointer shadow-lg ${
            isWatched
              ? 'bg-[#F4A726]/10 border-[#F4A726] text-[#F4A726]'
              : 'bg-transparent border-white/20 text-gray-400 hover:text-white'
          }`}
        >
          <Star size={14} fill={isWatched ? '#F4A726' : 'none'} />
          <span>{isWatched ? 'Watching Country' : 'Watch Country'}</span>
        </button>
      </div>

      {/* Overview and AI summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Statistics Widgets */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#F4A726] uppercase tracking-wide border-b border-white/5 pb-2">
            Real-Time Indicators Ledger
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard title="GDP Growth Rate" data={gdp} unit="%" />
            <StatCard title="Inflation Rate" data={inflation} unit="%" />
            <StatCard title="Unemployment Rate" data={unemployment} unit="%" />
            <StatCard title="Total Population" data={population} />
            <StatCard title="Trade Balance" data={tradeBalance} unit=" USD" />
            <StatCard title={`USD / ${details.currency} Rate`} data={currencyRate} />
          </div>

          {/* Related Country News */}
          <div className="space-y-4 pt-4">
            <h2 className="font-serif text-lg font-bold text-[#F4A726] uppercase tracking-wide border-b border-white/5 pb-2">
              Regional Briefing Updates
            </h2>
            {newsLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-white/5 rounded"></div>
                <div className="h-10 bg-white/5 rounded"></div>
              </div>
            ) : news.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-white/10 rounded-lg text-gray-500 text-xs">
                No recent regional news wire updates found.
              </div>
            ) : (
              <div className="space-y-3">
                {news.map((item, idx) => (
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    key={idx}
                    className="block p-4 bg-[#0A1628]/40 border border-white/5 rounded-lg hover:border-gold/20 hover:scale-[1.005] transition-all"
                  >
                    <span className="text-[9px] font-mono text-gold uppercase tracking-wider block mb-1">
                      {item.source?.name} · {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                    <h3 className="text-sm font-bold text-white mb-1 leading-normal font-serif">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {item.description}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gemini AI summary box */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#142B47] to-[#0A1628] border border-[#F4A726]/25 rounded-lg p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gold/5 blur-xl pointer-events-none"></div>
            
            <h3 className="text-xs font-mono font-bold text-[#F4A726] uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <Sparkles size={14} className="text-[#F4A726]" />
              <span>ER Sovereignty Analysis</span>
            </h3>

            {aiLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-3.5 bg-white/10 rounded w-1/4"></div>
                <div className="h-3 bg-white/5 rounded w-full"></div>
                <div className="h-3 bg-white/5 rounded w-5/6"></div>
                <div className="h-3 bg-white/5 rounded w-full"></div>
              </div>
            ) : (
              <p className="text-xs text-gray-300 font-serif leading-relaxed whitespace-pre-line">
                {aiSummary}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Explanation Modal */}
      {explanationModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#0A1628',
            border: '1px solid rgba(244,167,38,0.3)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{color: '#F4A726', marginBottom: '12px', marginTop: 0}}>
              💡 ER Analysis
            </h3>
            {modalLoading ? (
              <p style={{color: '#fff', fontSize: '13px'}}>Analyzing statistic...</p>
            ) : (
              <p style={{color: '#fff', fontSize: '13px', lineHeight: '1.6', margin: 0}}>
                {explanationModal.text}
              </p>
            )}
            <button onClick={() => setExplanationModal({open: false, text: ''})}
              style={{
                marginTop: '16px',
                padding: '8px 20px',
                background: '#F4A726',
                color: '#0A1628',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: 'pointer'
              }}>
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
