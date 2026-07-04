// client/src/components/ForexIntelligence.jsx
import React, { useState, useEffect } from 'react';
import { callGeminiWithRotation } from '../utils/GeminiRotator';

export default function ForexIntelligence() {
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [rates, setRates] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'INR', 
    'AED', 'SGD', 'AUD', 'CAD', 'CHF',
    'CNY', 'SAR', 'QAR', 'KWD', 'BRL'
  ];

  useEffect(() => {
    fetchRates();
  }, [baseCurrency]);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/2428fcb9bd5523c4a06e1cc7/latest/${baseCurrency}`
      );
      const data = await res.json();
      setRates(data.conversion_rates);
    } catch(e) {
      console.error('Forex fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateForexAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const prompt = `
      You are Economical Research AI.
      Generate professional forex market analysis for ${baseCurrency} in 2025-2026.
      
      Include:
      ## ${baseCurrency} Overview
      [Currency strength, recent trends]
      
      ## Key Drivers
      [3-4 factors affecting this currency]
      
      ## Major Pairs Analysis
      ${baseCurrency}/USD, ${baseCurrency}/EUR, ${baseCurrency}/GBP outlook
      
      ## ER Forex Outlook
      Short-term (1-3 months): [prediction]
      Long-term (6-12 months): [prediction]
      
      ## Risk Factors
      [2-3 main risks to watch]
      
      Never mention Gemini. Max 300 words. Write as Economical Research AI.
      `;
      const response = await callGeminiWithRotation(prompt);
      setAnalysis(response);
    } catch(e) {
      console.error('Analysis error:', e);
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      {/* Title Header */}
      <div className="border-b border-[#F4A726]/10 pb-5">
        <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
          foreign exchange ledger
        </span>
        <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
          💱 Forex Intelligence
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
          Monitor real-time currency conversion coefficients and access deep policy analysis for global fiat currencies.
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-5 shadow-lg space-y-4">
        <div>
          <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-2">Base Currency</label>
          <select
            value={baseCurrency}
            onChange={e => setBaseCurrency(e.target.value)}
            className="bg-[#060D17] border border-white/10 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F4A726]/40 transition-colors cursor-pointer w-full max-w-[200px]"
          >
            {currencies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Live rates grid */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F4A726] mx-auto mb-2"></div>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest animate-pulse">Syncing conversion ledger...</p>
        </div>
      ) : rates && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
          {currencies.filter(c => c !== baseCurrency).map(currency => (
            <div key={currency} className="bg-[#0A1628]/40 border border-white/5 rounded-lg p-4 transition-all hover:border-[#F4A726]/20">
              <span className="text-[9px] font-mono text-gray-500 block uppercase mb-1">
                {baseCurrency} / {currency}
              </span>
              <span className="font-mono text-base font-bold text-[#F4A726]">
                {rates[currency] ? rates[currency].toFixed(4) : '---'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* AI Analysis Block */}
      <div className="space-y-4 pt-4">
        <button
          onClick={generateForexAnalysis}
          disabled={analysisLoading}
          className="bg-[#F4A726] hover:bg-[#D48E19] disabled:bg-gray-700 text-[#0A1628] disabled:text-gray-400 font-mono font-bold px-6 py-3 rounded text-xs uppercase tracking-wide transition-all shadow cursor-pointer disabled:cursor-not-allowed"
        >
          {analysisLoading ? '⏳ Generating Analysis...' : '🤖 Generate AI Analysis'}
        </button>

        {analysisLoading ? (
          <div className="text-center py-12 bg-[#0A1628]/25 border border-white/5 rounded-lg">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#F4A726] mx-auto mb-3"></div>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest animate-pulse">Running currency strength simulation...</p>
          </div>
        ) : analysis && (
          <div className="bg-[#0A1628]/35 border border-[#F4A726]/15 rounded-lg p-6 font-serif leading-relaxed text-sm text-gray-200 prose max-w-none whitespace-pre-wrap">
            {analysis}
          </div>
        )}
      </div>

      <p className="text-[10px] font-mono text-gray-500">
        Live rates: ExchangeRate-API | Analysis: Economical Research AI. For reference only.
      </p>
    </div>
  );
}
