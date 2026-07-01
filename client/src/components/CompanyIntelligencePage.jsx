// client/src/components/CompanyIntelligencePage.jsx
import React, { useState, useEffect } from 'react';
import DataRouter from '../providers/DataRouter';
import AIRouter from '../ai/AIRouter';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const COMPANIES = [
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' }
];

export default function CompanyIntelligencePage({ setView, defaultCompany }) {
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES.find(c => c.symbol === defaultCompany || c.name === defaultCompany) || COMPANIES[0]);
  const [secData, setSecData] = useState(null);
  const [aiReport, setAiReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Fetch live SEC EDGAR stubs & compile complete AI corporate profile
  const loadCompanyData = async (company) => {
    setLoading(true);
    setAiReport('');
    try {
      const data = await DataRouter.route(company.symbol, { providerType: 'sec' });
      setSecData(data);

      const prompt = `You are a Lead Equity Analyst. Compile a comprehensive, mock-free Corporate Analysis Briefing for "${company.name} (${company.symbol})" utilizing filings data.
      Provide detailed sections covering:
      1. Business Overview & Market Capitalization
      2. Revenue Dynamics, Net Profit Margins, and Debt-to-Equity ratios
      3. Global Market Share & Competitors
      4. SWOT Analysis (SWOT - Strengths, Weaknesses, Opportunities, Risks)
      5. Recent Developments & 12-Month Shareholder Forecast
      Provide real data, verified financial details, and strict corporate phrasings. Do not mention Gemini or AI.`;

      const response = await AIRouter.route(prompt, 'research');
      setAiReport(response);

      // Auto-save to Research Memory (FEATURE 4)
      try {
        await addDoc(collection(db, 'er_research_reports'), {
          userId: 'guest',
          query: `${company.symbol} Corporate Report`,
          title: `${company.symbol} Equity Briefing`,
          report: response,
          createdAt: new Date().toISOString(),
          isFavorite: false,
          tags: ['company', company.symbol.toLowerCase(), 'equity']
        });
      } catch (fsErr) {
        console.error('Failed to auto-save to library:', fsErr);
      }
    } catch (e) {
      console.error(e);
      setAiReport('Corporate analysis failed. Live data temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyData(selectedCompany);
    checkWatchlist(selectedCompany.symbol);
  }, [selectedCompany]);

  // Check Watchlist (FEATURE 6)
  const checkWatchlist = async (symbol) => {
    try {
      const q = query(
        collection(db, 'er_user_watchlists'),
        where('userId', '==', 'guest'),
        where('itemId', '==', symbol)
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
          where('itemId', '==', selectedCompany.symbol)
        );
        const snap = await getDocs(q);
        const promises = snap.docs.map(d => deleteDoc(doc(db, 'er_user_watchlists', d.id)));
        await Promise.all(promises);
        setIsWatched(false);
      } else {
        await addDoc(collection(db, 'er_user_watchlists'), {
          userId: 'guest',
          itemId: selectedCompany.symbol,
          itemName: selectedCompany.name,
          itemType: 'company',
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
            corporate securities monitoring console
          </span>
          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
            Company Intelligence Page
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Consolidated SEC Edgar filings, SWOT profiles, net revenue tables, and corporate debt sheets.
          </p>
        </div>
      </div>

      {/* Selectors & Follow */}
      <div className="flex flex-wrap gap-3 items-center justify-between border-b border-white/5 pb-4">
        <div className="flex flex-wrap gap-2">
          {COMPANIES.map(c => (
            <button
              key={c.symbol}
              onClick={() => setSelectedCompany(c)}
              className={`px-4 py-2 border rounded-md text-xs uppercase font-mono font-bold tracking-wide transition-all cursor-pointer ${
                selectedCompany.symbol === c.symbol
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
          {isWatched ? '⭐ Watching Company' : '☆ Watch Company'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left 3 Cols: Corporate brief content */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Filings Summary */}
          {secData && (
            <div className="bg-[#0A1628] border border-white/5 rounded-lg p-5">
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-2">
                Attributed Filings Registry ({secData.source})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {secData.filings?.map((f, i) => (
                  <div key={i} className="p-2.5 bg-[#060D17] border border-white/5 rounded flex justify-between items-center">
                    <div>
                      <span className="font-mono text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded uppercase block w-max mb-1">
                        {f.form}
                      </span>
                      <span className="font-bold text-white block truncate max-w-[180px]">{f.title}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{new Date(f.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI corporate analysis */}
          <div className="bg-[#0A1628] border border-white/5 rounded-lg p-6 min-h-[400px]">
            {loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-6 bg-gray-800 rounded w-1/3"></div>
                <div className="h-4 bg-gray-800 rounded w-2/3"></div>
                <div className="h-32 bg-gray-850 rounded"></div>
              </div>
            ) : (
              <div className="prose prose-invert text-xs text-gray-300 font-serif leading-relaxed max-w-none space-y-4">
                {aiReport.split('\n').map((line, i) => {
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
                <span className="text-gray-300 font-bold">United States, European Markets, Asia-Pacific</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Related Industries</span>
                <span className="text-gray-300 font-bold">Technology, Electric Vehicles, Cloud Computing, Retail</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Related Companies</span>
                <span className="text-gray-300 font-bold">Competitors: BYD, Nvidia, Microsoft, Amazon</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Related Reports</span>
                <span 
                  onClick={() => setView('er-research')}
                  className="text-[#F4A726] hover:underline cursor-pointer font-bold block mt-1"
                >
                  Sovereign semiconductor supply chain report 2026 →
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
