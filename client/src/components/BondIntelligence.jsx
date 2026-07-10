// client/src/components/BondIntelligence.jsx
import React, { useState } from 'react';
import { callGemini } from '../utils/geminiCaller';

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
    setBondReport('');
    
    const result = await callGemini(`
  You are Economical Research AI.
  Generate COMPREHENSIVE bond market 
  intelligence for: ${country}
  
  ## Bond Market Overview
  [Detailed overview of bond market size,
   structure and importance]
  [3-4 paragraphs]
  
  ## Government Bonds Analysis
  Current 10-year yield: [estimate]
  Credit rating: [rating + explanation]
  Historical yield trend: [analysis]
  [3-4 paragraphs]
  
  ## Yield Curve Analysis
  [Detailed shape and implications]
  [2-3 paragraphs]
  
  ## Central Bank Policy Impact
  [How monetary policy affects bonds]
  [3 paragraphs]
  
  ## Inflation & Bond Relationship
  [Real yields and inflation expectations]
  [2-3 paragraphs]
  
  ## Foreign Investment in Bonds
  [FPI flows, currency risk for foreign investors]
  [2 paragraphs]
  
  ## Corporate Bond Market
  [Overview of corporate bond landscape]
  [2-3 paragraphs]
  
  ## Risk Factors
  Interest rate risk: [detailed]
  Credit risk: [detailed]
  Currency risk: [detailed]
  [3 paragraphs]
  
  ## ER Bond Intelligence Verdict
  Government Bond Rating: [AAA to CCC]
  Investment Grade: [Yes/No]
  Yield Attractiveness: [High/Medium/Low]
  [3-4 paragraph comprehensive verdict]
  
  ## 12-Month Yield Outlook
  [Detailed interest rate forecast]
  [2-3 paragraphs]
  
  Write 800-1000 words minimum.
  Never mention Gemini.
  `, 3000);
    
    if (result) setBondReport(result);
    else setBondReport('Report failed. Try again.');
    setLoading(false);
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
