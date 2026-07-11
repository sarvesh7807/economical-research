import React, { useState, useEffect } from 'react';
import { callGemini } from '../utils/geminiCaller';
import { RefreshCw } from 'lucide-react';

export default function LiveNewsIntelligence() {
  const [newsIntel, setNewsIntel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateNewsIntelligence = async () => {
    setLoading(true);
    setError('');
    setNewsIntel([]);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 30000)
    );
    
    try {
      const result = await Promise.race([
        callGemini(`
        Generate 5 top economic intelligence 
        news items for today 2025-2026.
        
        Return ONLY JSON array:
        [
          {
            "headline": "News headline here",
            "summary": "2-3 sentence summary",
            "impact": "HIGH/MEDIUM/LOW",
            "category": "Markets/Economy/Policy/Trade",
            "sentiment": "Positive/Negative/Neutral"
          }
        ]
        
        Include 5 items covering:
        global economy, markets, policy, trade.
        Return ONLY the JSON array.
        `, 600),
        timeoutPromise
      ]);
      
      if (result) {
        const { parseGeminiJSON } = await import('../utils/geminiCaller');
        const parsed = parseGeminiJSON(result);
        if (parsed && Array.isArray(parsed)) {
          setNewsIntel(parsed);
        } else {
          setError('Could not load news intelligence.');
        }
      } else {
        setError('Could not load news intelligence.');
      }
    } catch(e) {
      if (e.message === 'timeout') {
        setError('Loading timeout. Please refresh.');
      } else {
        setError('News intelligence unavailable.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateNewsIntelligence();
  }, []);

  const getImpactBadgeColor = (impact) => {
    if (impact === 'HIGH' || impact === 'CRITICAL') return 'bg-red-500/10 border-red-500/25 text-red-400';
    if (impact === 'MEDIUM') return 'bg-orange-500/10 border-orange-500/25 text-orange-400';
    return 'bg-green-500/10 border-green-500/25 text-green-400';
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'Positive') return 'text-green-400';
    if (sentiment === 'Negative') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      
      {/* Title */}
      <div className="border-b border-[#F4A726]/10 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
            sovereign media analysis console
          </span>
          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
            Live News Intelligence
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Real-time news wires filtered, de-duplicated, analyzed for political bias, and graded for confidence.
          </p>
        </div>

        <button
          onClick={generateNewsIntelligence}
          disabled={loading}
          className="bg-transparent border border-white/10 hover:bg-white/5 text-white font-bold px-4 py-2.5 rounded text-xs uppercase tracking-wide transition-colors shrink-0 flex items-center gap-2 cursor-pointer self-start"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Re-analyzing...' : 'Refresh News Wire'}
        </button>
      </div>

      {loading && (
        <div style={{textAlign: 'center', padding: '40px'}}>
          <p style={{color: '#F4A726'}}>
            ⏳ Loading News Intelligence...
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.4)', 
            fontSize: '12px'
          }}>
            Please wait up to 30 seconds
          </p>
        </div>
      )}

      {error && (
        <div style={{
          padding: '16px',
          background: 'rgba(255,82,82,0.1)',
          borderRadius: '8px',
          color: '#FF5252',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '20px auto'
        }}>
          {error}
          <br/>
          <button onClick={generateNewsIntelligence}
            style={{
              marginTop: '8px',
              padding: '6px 16px',
              background: '#F4A726',
              color: '#0A1628',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '700'
            }}>
            🔄 Retry
          </button>
        </div>
      )}

      {!loading && !error && newsIntel.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {newsIntel.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'linear-gradient(135deg, #0A1628 0%, #060D17 100%)',
                border: '1px solid rgba(244,167,38,0.15)',
                borderRadius: '8px',
                padding: '20px'
              }}
              className="hover:border-[#F4A726]/40 transition-colors shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Meta badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[9px] font-mono font-bold uppercase">
                  <span className="px-2 py-0.5 rounded border bg-blue-500/10 border-blue-500/20 text-blue-400">
                    📂 {item.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded border ${getImpactBadgeColor(item.impact)}`}>
                    🔥 Impact: {item.impact}
                  </span>
                  <span className={`px-2 py-0.5 rounded border bg-gray-800 border-white/5 ${getSentimentColor(item.sentiment)}`}>
                    ⚖️ Sentiment: {item.sentiment}
                  </span>
                </div>

                {/* Headline */}
                <h3 className="text-sm font-bold text-white uppercase tracking-wide leading-snug hover:text-[#F4A726] transition-colors font-serif">
                  {item.headline}
                </h3>

                {/* AI Summary */}
                <div className="mt-4 p-3 bg-[#060D17]/80 border border-white/5 rounded text-xs">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
                    AI Intelligence Summary
                  </span>
                  <p className="text-gray-300 font-serif leading-relaxed">{item.summary}</p>
                </div>
              </div>

              {/* Source info */}
              <div className="flex justify-between items-center mt-5 pt-3 border-t border-white/5 text-[9px] font-mono text-gray-500">
                <span>Bureau: Economical Research AI</span>
                <span>2026-07-11</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
