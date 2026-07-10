// client/src/components/GlobalComparisonEngine.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { callGemini } from '../utils/geminiCaller';

const COMPARISON_PRESETS = [
  { label: 'India vs China (Sovereign)', type: 'country', a: 'India', b: 'China' },
  { label: 'Tesla vs BYD (Corporate)', type: 'company', a: 'Tesla', b: 'BYD' },
  { label: 'Tech vs Finance (Sectors)', type: 'sector', a: 'Tech Sector', b: 'Financial Sector' }
];

export default function GlobalComparisonEngine({ setView, defaultA, defaultB }) {
  const { user } = useAuth();
  
  const [comparisonType, setComparisonType] = useState('country');
  const [item1, setItem1] = useState(defaultA || 'India');
  const [item2, setItem2] = useState(defaultB || 'China');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState(null);
  const [arbitrageCommentary, setArbitrageCommentary] = useState(null);

  const handlePresetSelect = (preset) => {
    setComparisonType(preset.type);
    setItem1(preset.a);
    setItem2(preset.b);
    handleCompare(preset.type, preset.a, preset.b);
  };

  const handleCompare = async (overrideType, overrideItem1, overrideItem2) => {
    const type = overrideType || comparisonType;
    const i1 = overrideItem1 || item1;
    const i2 = overrideItem2 || item2;

    if (!i1.trim() || !i2.trim()) {
      setError('Please enter both items to compare');
      return;
    }
    
    setIsComparing(true);
    setComparisonResult(null);
    setError(null);
    setArbitrageCommentary(null);
    
    try {
      const prompt = `
      You are Economical Research AI.
      Create a professional comparison report.
      
      Comparison Type: ${type}
      Item 1: ${i1}
      Item 2: ${i2}
      
      Provide detailed comparison:
      
      OVERVIEW:
      Brief description of both items.
      
      KEY METRICS COMPARISON:
      | Metric | ${i1} | ${i2} |
      List 8-10 key metrics in table format.
      
      STRENGTHS:
      ${i1}: List 3 strengths
      ${i2}: List 3 strengths
      
      WEAKNESSES:
      ${i1}: List 3 weaknesses
      ${i2}: List 3 weaknesses
      
      WINNER BY CATEGORY:
      List which item wins in each category.
      
      ER VERDICT:
      Which is better overall and why?
      
      Write professionally. Never mention 
      Gemini or any AI provider.
      Use "Economical Research AI" only.
      `;
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const result = await callGemini(prompt, 1500);
      
      setComparisonResult(result);
      
      // Save to Firebase
      if (db && user) {
        await addDoc(
          collection(db, 'comparison_history'),
          {
            userId: user.uid,
            type: type,
            item1: i1,
            item2: i2,
            result,
            createdAt: new Date()
          }
        );
      }
      
    } catch (err) {
      setError('Comparison failed. Please try again.');
      console.error('Comparison error:', err);
    } finally {
      setIsComparing(false);
    }
  };

  const generateArbitrageCommentary = async () => {
    if (!comparisonResult) return;
    
    const prompt = `
    You are Economical Research AI.
    Based on this comparison between 
    ${item1} and ${item2}:
    
    ${comparisonResult}
    
    Generate "AI Arbitrage Commentary":
    
    1. OPPORTUNITY: What arbitrage or 
       investment opportunity exists?
    2. RISK DIFFERENTIAL: Key risk differences
    3. TIMING: When to act on this comparison
    4. ER RECOMMENDATION: 
       Buy/Hold/Avoid for each item
    
    Keep under 200 words. Professional tone.
    `;
    
    try {
      const commentary = await callGemini(prompt, 500);
      setArbitrageCommentary(commentary);
    } catch (err) {
      console.error('Arbitrage commentary error:', err);
    }
  };

  useEffect(() => {
    const initialItem1 = defaultA || 'India';
    const initialItem2 = defaultB || 'China';
    setItem1(initialItem1);
    setItem2(initialItem2);
    handleCompare(comparisonType, initialItem1, initialItem2);
  }, [defaultA, defaultB]);

  useEffect(() => {
    if (comparisonResult) {
      generateArbitrageCommentary();
    }
  }, [comparisonResult]);

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

      {/* Presets Bar */}
      <div className="flex flex-wrap gap-2 items-center border-b border-white/5 pb-4">
        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mr-2">Presets:</span>
        {COMPARISON_PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handlePresetSelect(p)}
            className="px-3.5 py-1.5 bg-[#0A1628] hover:bg-[#F4A726]/10 border border-white/5 hover:border-[#F4A726]/20 rounded text-[10px] uppercase font-mono font-bold tracking-wide transition-all cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Inputs bar */}
      <div className="comparison-container bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-5 flex flex-col gap-6 shadow-lg">
        {/* Comparison Type */}
        <div style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }} className="comparison-types">
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '13px',
            marginBottom: '12px'
          }}>
            Select Comparison Type:
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            width: '100%'
          }}>
            {[
              { label: 'Country vs Country', icon: '🌍', value: 'country' },
              { label: 'Company vs Company', icon: '🏢', value: 'company' },
              { label: 'Sector vs Sector', icon: '📊', value: 'sector' },
              { label: 'Market vs Market', icon: '📈', value: 'market' }
            ].map(type => (
              <button key={type.label}
                onClick={() => setComparisonType(type.value)}
                type="button"
                style={{
                  padding: '12px 8px',
                  background: comparisonType === type.value
                    ? 'rgba(244,167,38,0.2)'
                    : 'rgba(26,58,92,0.5)',
                  border: `1px solid ${
                    comparisonType === type.value
                      ? '#F4A726'
                      : 'rgba(244,167,38,0.15)'
                  }`,
                  borderRadius: '8px',
                  color: comparisonType === type.value
                    ? '#F4A726' : '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                <div>{type.icon}</div>
                <div style={{marginTop: '4px'}}>
                  {type.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="comparison-inputs flex flex-col sm:flex-row gap-4 items-center w-full">
          {/* Input A */}
          <div className="flex flex-col gap-1 w-full sm:flex-grow">
            <label className="text-[9px] font-mono text-gray-500 uppercase">Asset A</label>
            <input 
              type="text"
              placeholder="India..."
              value={item1}
              onChange={e => setItem1(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '100%',
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

          {/* Input B */}
          <div className="flex flex-col gap-1 w-full sm:flex-grow">
            <label className="text-[9px] font-mono text-gray-500 uppercase">Asset B</label>
            <input 
              type="text"
              placeholder="China..."
              value={item2}
              onChange={e => setItem2(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '100%',
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
          onClick={() => handleCompare()}
          disabled={isComparing || !item1.trim() || !item2.trim()}
          className="comparison-button"
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
          {isComparing ? '⚖️ Comparing...' : 'Compare Now'}
        </button>
      </div>

      {/* Results view */}
      {isComparing ? (
        <div className="text-center py-20 text-[11px] font-mono text-[#F4A726] uppercase tracking-widest animate-pulse">
          ⏳ Arbitraging sovereign records...
        </div>
      ) : (
        <div className="space-y-6">
          {comparisonResult && (
            <div style={{
              marginTop: '24px',
              padding: '24px',
              background: 'rgba(26,58,92,0.5)',
              border: '1px solid rgba(244,167,38,0.2)',
              borderRadius: '12px'
            }}>
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
                {comparisonResult}
              </div>

              {/* Show Arbitrage Commentary */}
              {arbitrageCommentary && (
                <div style={{
                  marginTop: '16px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(244,167,38,0.1), rgba(244,167,38,0.05))',
                  border: '1px solid rgba(244,167,38,0.3)',
                  borderRadius: '12px'
                }}>
                  <h4 style={{
                    color: '#F4A726',
                    fontSize: '14px',
                    fontWeight: '700',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    ⚡ AI Arbitrage Commentary
                  </h4>
                  <p style={{
                    color: '#fff',
                    fontSize: '13px',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {arbitrageCommentary}
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <p style={{
              color: '#FF5252',
              marginTop: '12px',
              fontSize: '13px'
            }}>{error}</p>
          )}
        </div>
      )}

    </div>
  );
}
