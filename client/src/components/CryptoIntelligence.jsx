// client/src/components/CryptoIntelligence.jsx
import React, { useState, useEffect } from 'react';
import { callGemini } from '../utils/geminiCaller';

export default function CryptoIntelligence() {
  const [cryptoData, setCryptoData] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState('Bitcoin');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [cryptoLoading, setCryptoLoading] = useState(false);

  const coins = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' }
  ];

  useEffect(() => {
    fetchCrypto();
  }, []);

  const fetchCrypto = async () => {
    setCryptoLoading(true);
    try {
      const ids = coins.map(c => c.id).join(',');
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,inr&include_24hr_change=true&include_market_cap=true`
      );
      const data = await res.json();
      setCryptoData(data);
    } catch(e) {
      console.error('Crypto fetch error:', e);
    } finally {
      setCryptoLoading(false);
    }
  };

  const generateCryptoAnalysis = async (coin) => {
    setLoading(true);
    
    const result = await callGemini(`
  You are Economical Research AI.
  Generate COMPREHENSIVE crypto intelligence 
  report for: ${coin}
  
  ## Overview & History
  [Detailed background, creation, purpose]
  [3-4 paragraphs]
  
  ## Technology & Innovation
  [Blockchain technology, consensus mechanism,
   scalability, unique features]
  [3-4 paragraphs]
  
  ## Market Analysis
  [Market cap, trading volume, price history]
  [3 paragraphs]
  
  ## Adoption & Use Cases
  [Real world usage, institutional adoption]
  [3 paragraphs]
  
  ## Competitive Landscape
  [Comparison with top 5 competitors]
  [3 paragraphs]
  
  ## Regulatory Environment
  [How regulations affect this crypto globally]
  [2-3 paragraphs]
  
  ## Risk Assessment
  Volatility Risk: [High/Very High/Extreme]
  Regulatory Risk: [assessment]
  Technical Risk: [assessment]
  [3 paragraphs]
  
  ## ER Crypto Intelligence Verdict
  Technology Score: [0-100]/100
  Adoption Score: [0-100]/100
  Risk Score: [0-100]/100 (lower=safer)
  
  Investment Note: [Detailed disclaimer + 
  balanced assessment]
  
  [3-4 paragraph comprehensive verdict]
  
  DISCLAIMER at end: This is for educational 
  purposes only. Crypto is extremely volatile.
  Not financial advice.
  
  Write 700-900 words minimum.
  Never mention Gemini.
  `, 3000);
    
    if (result) setAnalysis(result);
    else setAnalysis('Analysis temporarily unavailable. Try again.');
    setLoading(false);
  };


  // Trigger analysis for the default selected coin on load or double click
  const handleCoinClick = (coinName) => {
    setSelectedCoin(coinName);
    generateCryptoAnalysis(coinName);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      {/* Title Header */}
      <div className="border-b border-[#F4A726]/10 pb-5">
        <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
          digital assets ledger
        </span>
        <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
          ₿ Crypto Intelligence
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
          Monitor spot market valuations and access institutional-grade risk ratings for leading decentralized cryptos.
        </p>
      </div>

      {/* Spot Price Grid */}
      {cryptoLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F4A726] mx-auto mb-2"></div>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest animate-pulse">Syncing spot valuations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {coins.map(coin => {
            const data = cryptoData?.[coin.id];
            const isUp = (data?.usd_24h_change || 0) > 0;
            const isSelected = selectedCoin === coin.name;
            return (
              <div
                key={coin.id}
                onClick={() => handleCoinClick(coin.name)}
                className={`border rounded-xl p-5 cursor-pointer transition-all hover:translate-y-[-2px] ${
                  isSelected
                    ? 'bg-[#F4A726]/10 border-[#F4A726] shadow-md shadow-[#F4A726]/5'
                    : 'bg-[#0A1628]/40 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs font-bold text-[#F4A726]">{coin.symbol}</span>
                  <span
                    style={{ color: isUp ? '#00C896' : '#FF5252' }}
                    className="text-[10px] font-mono font-semibold"
                  >
                    {isUp ? '▲' : '▼'}{Math.abs(data?.usd_24h_change || 0).toFixed(2)}%
                  </span>
                </div>
                <h4 className="text-[10px] text-gray-400 font-semibold mb-3">{coin.name}</h4>
                <div className="space-y-1">
                  <p className="font-mono text-lg font-black text-white">
                    ${data?.usd ? data.usd.toLocaleString() : '---'}
                  </p>
                  <p className="font-mono text-[10px] text-gray-500">
                    ₹{data?.inr ? data.inr.toLocaleString() : '---'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Intelligence Block */}
      <div className="space-y-4 pt-4">
        {loading ? (
          <div className="text-center py-12 bg-[#0A1628]/25 border border-white/5 rounded-lg">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#F4A726] mx-auto mb-3"></div>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest animate-pulse">Running smart contract audit & market cap simulation...</p>
          </div>
        ) : analysis && (
          <div className="bg-[#0A1628]/35 border border-[#F4A726]/15 rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-lg font-black text-[#F4A726] uppercase border-b border-[#F4A726]/10 pb-2 flex items-center gap-2">
              <span>₿</span> {selectedCoin} — ER Research Intelligence
            </h3>
            <div className="font-serif leading-relaxed text-sm text-gray-200 prose max-w-none whitespace-pre-wrap">
              {analysis}
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] font-mono text-gray-500">
        Prices sourced via CoinGecko API | Analysis: Economical Research AI. For reference only.
      </p>
    </div>
  );
}
