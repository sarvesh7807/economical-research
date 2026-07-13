// client/src/components/CountryIntelligencePage.jsx
import React, { useState, useEffect } from 'react';
import { callGemini } from '../utils/geminiCaller';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CN', name: 'China' },
  { code: 'BR', name: 'Brazil' },
  { code: 'DE', name: 'Germany' }
];

export default function CountryIntelligencePage({ setView, defaultCountry }) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.name === defaultCountry) || COUNTRIES[0]);
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [customCountry, setCustomCountry] = useState('');

  // Compile Live AI Country Report
  const generateCountryReport = async (country) => {
    const countryName = typeof country === 'string' ? country : country?.name;
    if (!countryName?.trim()) return;
    setLoading(true);
    setReportText('');
    
    try {
      const result = await Promise.race([
        callGemini(`
      You are Economical Research AI.
      Generate a COMPREHENSIVE and DETAILED 
      country intelligence report for: ${countryName}
      
      Write a LONG, DETAILED report covering:
      
      ## Executive Summary
      [3-4 paragraphs overview]
      
      ## Economic Overview
      GDP: [estimate with year]
      GDP Growth Rate: [%]
      GDP Per Capita: [estimate]
      Inflation Rate: [%]
      Unemployment: [%]
      Currency: [name and recent performance]
      
      [3-4 paragraphs of economic analysis]
      
      ## Political Landscape
      Government type: [type]
      Current leadership: [leader, party]
      Political stability: [assessment]
      [2-3 paragraphs]
      
      ## Trade & Investment
      Major exports: [list top 5]
      Major imports: [list top 5]
      Top trading partners: [list top 5]
      FDI inflows: [estimate]
      [2-3 paragraphs]
      
      ## Key Industries & Sectors
      [Top 5 industries with detailed analysis]
      [3-4 paragraphs]
      
      ## Demographics & Social
      Population: [number]
      Legal age: [age]
      Urbanization: [%]
      Literacy rate: [%]
      [2 paragraphs]
      
      ## Infrastructure & Technology
      [Assessment of key infrastructure]
      [2 paragraphs]
      
      ## Investment Climate
      Ease of doing business: [rank/assessment]
      Key investment opportunities: [list]
      Key risks: [list]
      [2-3 paragraphs]
      
      ## ER Country Rating
      Economic Score: [0-100]/100
      Political Risk: [Low/Medium/High]
      Investment Rating: [AAA to CCC]
      Overall Assessment: [2-3 paragraphs]
      
      ## 12-Month Outlook
      [Detailed 3-4 paragraph forecast]
      
      Write at least 800-1000 words.
      Be specific with data and analysis.
      Professional tone like The Economist.
      Never mention Gemini or AI provider.
      `, 3000),
        new Promise(resolve => 
          setTimeout(() => resolve(null), 45000)
        )
      ]);

      if (result) {
        setReportText(result);
        // Auto-save to Research Memory
        try {
          await addDoc(collection(db, 'er_research_reports'), {
            userId: 'guest',
            query: `${countryName} Country Report`,
            title: `${countryName} Sovereignty Briefing`,
            report: result,
            createdAt: new Date().toISOString(),
            isFavorite: false,
            tags: ['country', 'sovereign']
          });
        } catch (fsErr) {
          console.error('Failed to auto-save to research library:', fsErr);
        }
      } else {
        setReportText('Service busy. Please try again in 2 minutes.');
      }
    } catch (e) {
      console.error(e);
      setReportText('Error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateCountryReport(selectedCountry);
    checkWatchlist(selectedCountry.code);
  }, [selectedCountry]);

  // Check Watchlist (FEATURE 6)
  const checkWatchlist = async (code) => {
    try {
      const q = query(
        collection(db, 'er_user_watchlists'),
        where('userId', '==', 'guest'),
        where('itemId', '==', code)
      );
      const snap = await getDocs(q);
      setIsWatched(!snap.empty);
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Watchlist (FEATURE 6)
  const handleToggleWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      if (isWatched) {
        const q = query(
          collection(db, 'er_user_watchlists'),
          where('userId', '==', 'guest'),
          where('itemId', '==', selectedCountry.code)
        );
        const snap = await getDocs(q);
        const promises = snap.docs.map(d => deleteDoc(doc(db, 'er_user_watchlists', d.id)));
        await Promise.all(promises);
        setIsWatched(false);
      } else {
        await addDoc(collection(db, 'er_user_watchlists'), {
          userId: 'guest',
          itemId: selectedCountry.code,
          itemName: selectedCountry.name,
          itemType: 'country',
          addedAt: new Date().toISOString()
        });
        setIsWatched(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWatchlistLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      
      {/* Header */}
      <div className="border-b border-[#F4A726]/10 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
            sovereign profile intelligence desk
          </span>
          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
            Country Intelligence Page
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Consolidated macroeconomic indicators, regulatory policies, trade portfolios, and political risk evaluations.
          </p>
        </div>
      </div>

      {/* Custom Country Search */}
      <div style={{marginBottom: '24px'}}>
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <input
            value={customCountry}
            onChange={e => setCustomCountry(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && generateCountryReport(customCountry)}
            placeholder="Search any country or state... e.g. Maharashtra, California, Scotland"
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '12px 16px',
              background: 'rgba(26,58,92,0.8)',
              border: '1px solid rgba(244,167,38,0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => generateCountryReport(customCountry)}
            disabled={loading || !customCountry.trim()}
            style={{
              padding: '12px 24px',
              background: '#F4A726',
              color: '#0A1628',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: !customCountry.trim() ? 0.6 : 1
            }}>
            🔍 Research
          </button>
        </div>
      </div>

      {/* Selectors & Follow */}
      <div className="flex flex-wrap gap-3 items-center justify-between border-b border-white/5 pb-4">
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map(c => (
            <button
              key={c.code}
              onClick={() => setSelectedCountry(c)}
              className={`px-4 py-2 border rounded-md text-xs uppercase font-mono font-bold tracking-wide transition-all cursor-pointer ${
                selectedCountry.code === c.code
                  ? 'bg-[#F4A726] border-[#F4A726] text-navy'
                  : 'bg-[#0A1628] border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleToggleWatchlist}
          disabled={watchlistLoading}
          className={`px-4 py-2 rounded text-xs font-bold uppercase border transition-colors cursor-pointer ${
            isWatched
              ? 'bg-[#F4A726]/10 border-[#F4A726] text-[#F4A726]'
              : 'bg-transparent border-gray-650 text-gray-400 hover:text-white'
          }`}
        >
          {isWatched ? '⭐ Watching Country' : '☆ Watch Country'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left 3 Cols: Sovereign report content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#0A1628] border border-white/5 rounded-lg p-6 min-h-[400px]">
            {loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-6 bg-gray-800 rounded w-1/3"></div>
                <div className="h-4 bg-gray-800 rounded w-2/3"></div>
                <div className="h-32 bg-gray-850 rounded"></div>
              </div>
            ) : (
              <div className="prose prose-invert text-xs text-gray-300 font-serif leading-relaxed max-w-none space-y-4">
                {reportText.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-xl font-bold font-serif text-white uppercase pt-4 border-b border-white/5 pb-1">{line.slice(2)}</h1>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-base font-bold font-serif text-[#F4A726] uppercase pt-3">{line.slice(3)}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-sm font-bold text-white uppercase pt-2">{line.slice(4)}</h3>;
                  }
                  return <p key={i} className="leading-relaxed">{line}</p>;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Related Intelligence (FEATURE 5) */}
        <div className="space-y-6">
          <div className="bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 shadow space-y-4">
            <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2">
              Related Intelligence
            </h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Related Countries</span>
                <span className="text-gray-300 font-bold">
                  {selectedCountry.name === 'India' ? 'China, Bangladesh, Pakistan' : 'Canada, Mexico, United Kingdom'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Related Industries</span>
                <span className="text-gray-300 font-bold">Agriculture, Technology, Manufacturing, Energy</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Related Companies</span>
                <span className="text-gray-300 font-bold">Sovereign Enterprises, Global Conglomerates</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Related Reports</span>
                <span 
                  onClick={() => setView('er-research')}
                  className="text-[#F4A726] hover:underline cursor-pointer font-bold block mt-1"
                >
                  {selectedCountry.name} Inflation Forecast 2026 →
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
