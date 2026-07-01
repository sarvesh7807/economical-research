// client/src/components/LiveNewsIntelligence.jsx
import React, { useState, useEffect } from 'react';
import AIRouter from '../ai/AIRouter';
import { RefreshCw } from 'lucide-react';

export default function LiveNewsIntelligence() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch & Analyze News
  const fetchAndAnalyzeNews = async () => {
    setLoading(true);
    setError(null);
    setNews([]);
    try {
      const res = await fetch('/api/news?category=world');
      if (!res.ok) throw new Error('News server offline');
      const json = await res.json();
      
      const articles = (json.articles || []).filter(a => a.title && a.title !== '[Removed]');
      
      // Client-Side De-duplication (FEATURE 7)
      const seen = new Set();
      const unique = articles.filter(a => {
        const key = a.title.slice(0, 40).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const topStories = unique.slice(0, 6);
      if (topStories.length === 0) {
        setNews([]);
        return;
      }

      // Grouping, Bias Detection & AI Summaries (FEATURE 7)
      const storiesText = topStories.map((s, i) => `[${i}] Title: ${s.title}\nDescription: ${s.description || ''}`).join('\n\n');
      const prompt = `You are a Media Analyst. Group these top news stories, classify importance (CRITICAL, HIGH, MEDIUM, LOW), detect bias (Left, Right, Neutral), generate a 1-sentence AI summary, and determine a confidence score.
      Stories:
      ${storiesText}
      Return ONLY a valid JSON array matching this structure (no markdown fences, no comments):
      [
        {
          "index": 0,
          "summary": "AI generated summary",
          "bias": "Left | Right | Neutral",
          "importance": "CRITICAL | HIGH | MEDIUM | LOW",
          "confidenceScore": 92,
          "groupCount": 1
        }
      ]`;

      const analysisRaw = await AIRouter.route(prompt, 'factcheck');
      let analysis = [];
      try {
        analysis = JSON.parse(analysisRaw);
      } catch (err) {
        console.error('Failed to parse news intelligence JSON:', err);
      }

      const analyzedNews = topStories.map((story, idx) => {
        const intel = analysis.find(a => a.index === idx) || {
          summary: story.description || 'Global affairs update.',
          bias: 'Neutral',
          importance: 'MEDIUM',
          confidenceScore: 85,
          groupCount: 1
        };
        return {
          ...story,
          ...intel
        };
      });

      setNews(analyzedNews);
    } catch (err) {
      console.error(err);
      setError('Live data temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndAnalyzeNews();
  }, []);

  const getBiasBadgeColor = (bias) => {
    if (bias === 'Left') return 'bg-blue-500/10 border-blue-500/25 text-blue-400';
    if (bias === 'Right') return 'bg-red-500/10 border-red-500/25 text-red-400';
    return 'bg-green-500/10 border-green-500/25 text-green-400';
  };

  const getImportanceColor = (imp) => {
    if (imp === 'CRITICAL') return 'bg-red-600/20 text-red-300 border-red-600/40 animate-pulse';
    if (imp === 'HIGH') return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    return 'bg-gray-800 text-gray-400 border-white/5';
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
          onClick={fetchAndAnalyzeNews}
          disabled={loading}
          className="bg-transparent border border-white/10 hover:bg-white/5 text-white font-bold px-4 py-2.5 rounded text-xs uppercase tracking-wide transition-colors shrink-0 flex items-center gap-2 cursor-pointer self-start"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Re-analyzing...' : 'Refresh News Wire'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[11px] font-mono text-[#F4A726] uppercase tracking-widest animate-pulse">
          ⏳ Arbitraging media headlines...
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-[#0A1628]/30 border border-[#F4A726]/10 rounded-lg p-6 max-w-xl mx-auto">
          <span className="text-3xl block mb-2">⚠️</span>
          <h3 className="text-sm font-bold uppercase text-red-400 mb-1">Live data temporarily unavailable</h3>
          <p className="text-xs text-gray-400">Failed to aggregate news feeds right now. Check back shortly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {news.map((item, idx) => (
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
                  <span className={`px-2 py-0.5 rounded border ${getBiasBadgeColor(item.bias)}`}>
                    ⚖️ Bias: {item.bias}
                  </span>
                  <span className={`px-2 py-0.5 rounded border ${getImportanceColor(item.importance)}`}>
                    🔥 {item.importance}
                  </span>
                  <span className="px-2 py-0.5 rounded border bg-blue-500/10 border-blue-500/20 text-blue-400">
                    Confidence: {item.confidenceScore}%
                  </span>
                  {item.groupCount > 1 && (
                    <span className="px-2 py-0.5 rounded border bg-purple-500/10 border-purple-500/20 text-purple-400">
                      ⚡ grouped ({item.groupCount})
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-white uppercase tracking-wide leading-snug hover:text-[#F4A726] transition-colors font-serif">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
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
                <span>Source: {item.source?.name}</span>
                <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'n.d.'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
