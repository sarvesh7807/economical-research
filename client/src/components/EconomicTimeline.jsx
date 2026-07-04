// client/src/components/EconomicTimeline.jsx
import React, { useState } from 'react';
import { callGeminiWithRotation } from '../utils/GeminiRotator';

export default function EconomicTimeline() {
  const [topic, setTopic] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateTimeline = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const prompt = `
      You are Economical Research AI.
      Create a detailed historical economic timeline for the following topic: ${topic}
      
      Return ONLY a valid JSON array of objects. No markdown wraps, no extra text explanation.
      Example structure:
      [
        {
          "year": "1991",
          "title": "Event title",
          "description": "Brief description of the historical significance",
          "type": "reform",
          "impact": "positive"
        }
      ]
      
      Include 10-15 key events spanning historical context to recent years.
      Event "type" must be one of: milestone, crisis, reform, breakthrough.
      Event "impact" must be one of: positive, negative, neutral.
      No explanation or text outside of the JSON array.
      `;

      const response = await callGeminiWithRotation(prompt);
      
      const cleaned = response
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        setTimeline(JSON.parse(match[0]));
      } else {
        console.error('Could not find JSON array in timeline response:', response);
      }
    } catch (e) {
      console.error('Timeline error:', e);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (impact) => {
    if (impact === 'positive') return '#00C896'; // Emerald
    if (impact === 'negative') return '#FF5252'; // Red/Coral
    return '#F4A726'; // Gold/Amber
  };

  const getIcon = (type) => {
    if (type === 'crisis') return '⚠️';
    if (type === 'reform') return '📋';
    if (type === 'breakthrough') return '🚀';
    return '📍';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      {/* Title Header */}
      <div className="border-b border-[#F4A726]/10 pb-5">
        <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
          historical event archives
        </span>
        <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
          📅 Economic Timeline
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
          Map out historical reform milestones, structural breakthroughs, and policy crises across global history.
        </p>
      </div>

      {/* Control Console */}
      <div className="bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-5 shadow-lg space-y-3">
        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Query Subject</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && generateTimeline()}
            placeholder="e.g. India 1991 economic reforms, Great Depression, Bitcoin evolution..."
            className="flex-grow bg-[#060D17] border border-white/10 rounded px-4 py-3 text-xs text-white focus:outline-none focus:border-[#F4A726]/40 transition-colors placeholder:text-gray-500"
          />
          <button
            onClick={generateTimeline}
            disabled={loading}
            className="bg-[#F4A726] hover:bg-[#D48E19] disabled:bg-gray-700 text-[#0A1628] disabled:text-gray-400 font-mono font-bold px-6 py-3 rounded text-xs uppercase tracking-wide transition-all shadow shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Searching Ledger...' : '📅 Generate Timeline'}
          </button>
        </div>
      </div>

      {/* Timeline Display */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4A726] mx-auto mb-4"></div>
          <p className="text-xs font-mono text-[#F4A726] uppercase tracking-widest animate-pulse">
            Sifting historical ledger indices via AI...
          </p>
        </div>
      ) : timeline.length > 0 ? (
        <div className="relative pl-6 sm:pl-10 space-y-8 border-l border-white/5 ml-4 sm:ml-6 pt-4 pb-4">
          {timeline.map((event, i) => {
            const themeColor = getColor(event.impact);
            return (
              <div key={i} className="relative group">
                {/* Visual Circle Indicator */}
                <div
                  style={{
                    background: themeColor,
                    boxShadow: `0 0 0 4px #060D17, 0 0 0 6px ${themeColor}40`
                  }}
                  className="absolute -left-[35px] sm:-left-[51px] top-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm z-10 transition-transform group-hover:scale-110"
                >
                  {getIcon(event.type)}
                </div>

                {/* Event Card Content */}
                <div
                  style={{ borderColor: `${themeColor}20` }}
                  className="bg-[#0A1628]/40 border rounded-lg p-5 hover:border-white/20 transition-all hover:translate-x-1"
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-center gap-4 flex-wrap mb-2.5">
                    <span className="font-mono text-sm font-bold text-[#F4A726]">
                      {event.year}
                    </span>
                    <span
                      style={{ background: `${themeColor}15`, color: themeColor }}
                      className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border border-current"
                    >
                      {event.type}
                    </span>
                  </div>

                  {/* Body title & desc */}
                  <h3 className="font-serif text-base font-bold text-white mb-2 leading-snug">
                    {event.title}
                  </h3>
                  <p className="text-xs text-gray-450 leading-relaxed font-serif">
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#0A1628]/20 border border-white/5 rounded-lg p-6">
          <span className="text-3xl block mb-3">📅</span>
          <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">
            Timeline Index Vacant
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Input an economic subject query to populate the historical events ledger.
          </p>
        </div>
      )}
    </div>
  );
}
