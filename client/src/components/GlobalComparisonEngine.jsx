import React, { useState, useEffect } from 'react';
import { callGemini } from '../utils/geminiCaller';

export default function GlobalComparisonEngine() {
  const [comparisonType, setComparisonType] = useState('Country vs Country');
  const [item1, setItem1] = useState('');
  const [item2, setItem2] = useState('');
  const [result, setResult] = useState('');
  const [arbitrage, setArbitrage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('compare');

  const comparisonTypes = [
    { label: 'Country vs Country', icon: '🌍' },
    { label: 'Company vs Company', icon: '🏢' },
    { label: 'Sector vs Sector', icon: '📊' },
    { label: 'Crypto vs Crypto', icon: '₿' },
    { label: 'Currency vs Currency', icon: '💱' },
    { label: 'Market vs Market', icon: '📈' }
  ];

  const getPlaceholders = () => {
    const map = {
      'Country vs Country': ['India', 'China'],
      'Company vs Company': ['Apple', 'Microsoft'],
      'Sector vs Sector': ['Technology', 'Finance'],
      'Crypto vs Crypto': ['Bitcoin', 'Ethereum'],
      'Currency vs Currency': ['USD', 'EUR'],
      'Market vs Market': ['NYSE', 'BSE']
    };
    return map[comparisonType] || ['Item 1', 'Item 2'];
  };

  const handleCompare = async () => {
    if (!item1.trim() || !item2.trim()) return;
    setLoading(true);
    setResult('');
    setArbitrage('');
    
    const resultText = await callGemini(`
    You are Economical Research AI.
    Create comprehensive comparison report:
    
    Type: ${comparisonType}
    ${item1} vs ${item2}
    
    ## Executive Summary
    [2-3 paragraph overview of both]
    
    ## Head-to-Head Comparison Table
    | Metric | ${item1} | ${item2} | Winner |
    |--------|---------|---------|--------|
    [Include 10+ relevant metrics]
    
    ## ${item1} Deep Analysis
    [3-4 paragraphs strengths and position]
    
    ## ${item2} Deep Analysis
    [3-4 paragraphs strengths and position]
    
    ## Category Winners
    [Who wins in each key category]
    
    ## Risk Comparison
    ${item1} risks: [3 points]
    ${item2} risks: [3 points]
    
    ## Historical Performance
    [How both have performed historically]
    
    ## ER Verdict
    Overall winner: [clear recommendation]
    [3-4 paragraph comprehensive conclusion]
    
    Write 600-800 words minimum.
    Never mention Gemini.
    `, 3000);
    
    if (resultText) {
      setResult(resultText);
      generateArbitrage(resultText);
    } else {
      setResult('Comparison failed. Please try again.');
    }
    setLoading(false);
  };

  const generateArbitrage = async (compResult) => {
    const arb = await callGemini(`
    Based on comparison of ${item1} vs ${item2}:
    ${compResult?.slice(0, 500)}
    
    Generate AI Arbitrage Commentary:
    
    ## Opportunity
    [What opportunity exists from this comparison]
    
    ## Risk-Reward
    [Risk/reward profile of each option]
    
    ## Timing
    [When to act based on this comparison]
    
    ## ER Recommendation
    Choose ${item1} if: [specific conditions]
    Choose ${item2} if: [specific conditions]
    
    Max 200 words. Never mention Gemini.
    `, 500);
    
    if (arb) setArbitrage(arb);
  };

  const quickCompares = [
    { type: 'Country vs Country', a: 'India', b: 'China', label: 'Country: India vs China' },
    { type: 'Company vs Company', a: 'Apple', b: 'Samsung', label: 'Company: Apple vs Samsung' },
    { type: 'Crypto vs Crypto', a: 'Bitcoin', b: 'Ethereum', label: 'Crypto: BTC vs ETH' },
    { type: 'Market vs Market', a: 'US Markets', b: 'India Markets', label: 'Market: US vs India' }
  ];

  const handleQuickCompare = (qc) => {
    setComparisonType(qc.type);
    setItem1(qc.a);
    setItem2(qc.b);
  };

  const placeholders = getPlaceholders();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      
      {/* Title */}
      <div className="border-b border-[#F4A726]/10 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
            sovereign & corporate arbitrage ledger
          </span>
          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
            Global Comparison Engine
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Side-by-side comparative ledger covering countries, enterprises, sectors, and currencies with multi-source discrepancy verification.
          </p>
        </div>
      </div>

      {/* Suggested Quick Compares */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Quick Compare Suggestions</span>
        <div className="flex flex-wrap gap-2">
          {quickCompares.map((qc, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickCompare(qc)}
              className="px-3.5 py-1.5 bg-[#0A1628] hover:bg-[#F4A726]/10 border border-white/5 hover:border-[#F4A726]/20 rounded text-[10px] uppercase font-mono font-bold tracking-wide transition-all cursor-pointer"
            >
              {qc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form container */}
      <div className="comparison-container bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-5 flex flex-col gap-6 shadow-lg">
        {/* Selector */}
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '12px' }}>
            Select Comparison Type:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', width: '100%' }}>
            {comparisonTypes.map(type => (
              <button key={type.label}
                onClick={() => setComparisonType(type.label)}
                type="button"
                style={{
                  padding: '12px 8px',
                  background: comparisonType === type.label
                    ? 'rgba(244,167,38,0.2)'
                    : 'rgba(26,58,92,0.5)',
                  border: `1px solid ${
                    comparisonType === type.label
                      ? '#F4A726'
                      : 'rgba(244,167,38,0.15)'
                  }`,
                  borderRadius: '8px',
                  color: comparisonType === type.label
                    ? '#F4A726' : '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}>
                <div>{type.icon}</div>
                <div style={{ marginTop: '4px', fontWeight: '600' }}>
                  {type.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="comparison-inputs flex flex-col sm:flex-row gap-4 items-center w-full">
          <div className="flex flex-col gap-1 w-full sm:flex-grow">
            <label className="text-[9px] font-mono text-gray-500 uppercase">Asset A</label>
            <input 
              type="text"
              placeholder={`e.g. ${placeholders[0]}`}
              value={item1}
              onChange={e => setItem1(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                boxSizing: 'border-box',
                background: 'rgba(26,58,92,0.5)',
                border: '1px solid rgba(244,167,38,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          
          <span className="text-[#F4A726] font-mono text-xs pt-4 font-bold select-none hidden sm:inline">VS</span>

          <div className="flex flex-col gap-1 w-full sm:flex-grow">
            <label className="text-[9px] font-mono text-gray-500 uppercase">Asset B</label>
            <input 
              type="text"
              placeholder={`e.g. ${placeholders[1]}`}
              value={item2}
              onChange={e => setItem2(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                boxSizing: 'border-box',
                background: 'rgba(26,58,92,0.5)',
                border: '1px solid rgba(244,167,38,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || !item1.trim() || !item2.trim()}
          style={{
            width: '100%',
            padding: '14px',
            background: '#F4A726',
            color: '#0A1628',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            boxSizing: 'border-box'
          }}
        >
          {loading ? '⏳ Comparing...' : 'Compare Now'}
        </button>
      </div>

      {/* Tabs / Results */}
      {loading ? (
        <div className="text-center py-20 text-[11px] font-mono text-[#F4A726] uppercase tracking-widest animate-pulse">
          ⏳ Arbitraging comparative profiles...
        </div>
      ) : (
        <div className="space-y-6">
          {result && (
            <div style={{
              marginTop: '24px',
              padding: '24px',
              background: 'rgba(26,58,92,0.5)',
              border: '1px solid rgba(244,167,38,0.2)',
              borderRadius: '12px'
            }}>
              {/* Tab selector */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                <button
                  onClick={() => setActiveTab('compare')}
                  style={{
                    padding: '8px 16px',
                    background: activeTab === 'compare' ? 'rgba(244,167,38,0.15)' : 'transparent',
                    border: 'none',
                    color: activeTab === 'compare' ? '#F4A726' : '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}
                >
                  ⚖️ Comparison Report
                </button>
                {arbitrage && (
                  <button
                    onClick={() => setActiveTab('arbitrage')}
                    style={{
                      padding: '8px 16px',
                      background: activeTab === 'arbitrage' ? 'rgba(244,167,38,0.15)' : 'transparent',
                      border: 'none',
                      color: activeTab === 'arbitrage' ? '#F4A726' : '#fff',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}
                  >
                    ⚡ AI Arbitrage
                  </button>
                )}
              </div>

              {activeTab === 'compare' ? (
                <div>
                  <h3 style={{
                    color: '#F4A726',
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '18px',
                    marginBottom: '16px'
                  }}>
                    {item1} vs {item2} — ER Analysis
                  </h3>
                  <div style={{
                    color: '#fff',
                    fontSize: '14px',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {result}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 style={{
                    color: '#F4A726',
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '18px',
                    marginBottom: '16px'
                  }}>
                    ⚡ AI Arbitrage Commentary
                  </h3>
                  <div style={{
                    color: '#fff',
                    fontSize: '14px',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {arbitrage}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
