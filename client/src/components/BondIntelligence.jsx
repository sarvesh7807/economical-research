// client/src/components/BondIntelligence.jsx
import React, { useState } from 'react';
import { callGeminiWithRotation } from '../utils/GeminiRotator';

export default function BondIntelligence() {
  const [country, setCountry] = useState('India');
  const [bondReport, setBondReport] = useState('');
  const [loading, setLoading] = useState(false);

  const countries = [
    'India', 'USA', 'UK', 'Germany', 
    'Japan', 'China', 'Brazil', 'UAE'
  ];

  const generateBondReport = async () => {
    setLoading(true);
    try {
      const prompt = `
      You are Economical Research AI.
      Generate bond market intelligence for: ${country} in 2025-2026.
      
      ## Government Bond Overview
      [10-year yield estimate, credit rating]
      
      ## Bond Market Status
      [Market size, liquidity, key metrics]
      
      ## Yield Curve Analysis
      [Short/medium/long term yields, shape]
      
      ## Interest Rate Outlook
      [Central bank policy direction]
      
      ## Investment Considerations
      [For foreign and domestic investors]
      
      ## ER Bond Rating
      Rating: [Strong Buy/Buy/Hold/Avoid]
      Risk: [Low/Medium/High]
      
      Max 300 words. Professional tone. Write as Economical Research AI.
      Never mention Gemini.
      `;
      const response = await callGeminiWithRotation(prompt);
      setBondReport(response);
    } catch(e) {
      console.error('Bond report error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      {/* Title Header */}
      <div className="border-b border-[#F4A726]/10 pb-5">
        <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
          sovereign debt ledger
        </span>
        <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
          📋 Bond Market Intelligence
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
          Monitor global yield curves, interest rate outlooks, and credit rating evaluations for sovereign bonds.
        </p>
      </div>

      {/* Select country & trigger */}
      <div className="bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-5 shadow-lg space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Sovereign State</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="bg-[#060D17] border border-white/10 rounded px-4 py-3 text-xs text-white focus:outline-none focus:border-[#F4A726]/40 transition-colors cursor-pointer flex-grow"
            >
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={generateBondReport}
              disabled={loading}
              className="bg-[#F4A726] hover:bg-[#D48E19] disabled:bg-gray-700 text-[#0A1628] disabled:text-gray-400 font-mono font-bold px-6 py-3 rounded text-xs uppercase tracking-wide transition-all shadow shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Compiling Yields...' : '📋 Generate Bond Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4A726] mx-auto mb-4"></div>
          <p className="text-xs font-mono text-[#F4A726] uppercase tracking-widest animate-pulse">
            Calculating central bank yield spreads...
          </p>
        </div>
      ) : bondReport ? (
        <div className="bg-[#0A1628]/35 border border-[#F4A726]/15 rounded-lg p-6 space-y-4">
          <h3 className="font-serif text-lg font-black text-[#F4A726] uppercase border-b border-[#F4A726]/10 pb-2 flex items-center gap-2">
            📊 {country} Government Bonds — ER Report
          </h3>
          <div className="font-serif leading-relaxed text-sm text-gray-200 prose max-w-none whitespace-pre-wrap">
            {bondReport}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-[#0A1628]/20 border border-white/5 rounded-lg p-6">
          <span className="text-3xl block mb-3">📊</span>
          <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">
            Debt Report Ledger Vacant
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Select a sovereign state and generate a report to run yield curve spread analysis.
          </p>
        </div>
      )}
    </div>
  );
}
