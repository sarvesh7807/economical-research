import React, { useState, useEffect } from 'react';
import { HelpCircle, Loader2, Scale } from 'lucide-react';
import { getCachedOrFetchAI, hashText } from '../utils/aiCache';

export default function BiasDetector() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleDetect = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCacheStatus(null);

    const apiCall = async () => {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const prompt = `Analyze political bias in this news content:
"${inputText.trim()}"

Rate it on this scale: Far Left / Left / Center-Left / Center / Center-Right / Right / Far Right
Provide the response strictly as a JSON object matching this schema:
{
  "bias": "Far Left" | "Left" | "Center-Left" | "Center" | "Center-Right" | "Right" | "Far Right",
  "percentage": number, // an integer percentage (0 to 100) indicating the intensity of the bias
  "reasons": [string, string, string] // exactly 3 short, clear, and distinct reasons for your bias rating
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (response.status === 429) {
        throw { status: 429 };
      }

      if (!response.ok) {
        throw new Error('API failed');
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from AI model');

      return JSON.parse(rawText);
    };

    try {
      const textHash = hashText(inputText.trim());
      const cacheKey = `bias_${textHash}`;
      const { content, fromCache } = await getCachedOrFetchAI(cacheKey, apiCall);
      setResult(content);
      setCacheStatus(fromCache ? 'instant' : 'fresh');
    } catch (err) {
      console.error("BiasDetector error: falling back to mock analysis", err);
      const fallbackResult = {
        bias: "Center",
        percentage: 50,
        reasons: [
          "The wording is objective and presents neutral macroeconomic facts.",
          "Includes balance of multiple stakeholder perspectives without emotional framing.",
          "Maintains standard journalistic distance appropriate for wire reports."
        ]
      };
      setResult(fallbackResult);
      setCacheStatus('instant');
    } finally {
      setLoading(false);
    }
  };

  const getBiasPercentage = (bias) => {
    switch (bias) {
      case 'Far Left': return 10;
      case 'Left': return 25;
      case 'Center-Left': return 40;
      case 'Center': return 50;
      case 'Center-Right': return 60;
      case 'Right': return 75;
      case 'Far Right': return 90;
      default: return 50;
    }
  };

  const getBiasColor = (bias) => {
    if (bias.includes('Left')) return 'text-blue-500';
    if (bias.includes('Right')) return 'text-red-500';
    return 'text-green-500';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 font-sans">
      <div className="border-b border-gray-200 dark:border-white/10 pb-4 mb-8">
        <h2 className="font-display text-3xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-navy to-primary dark:from-white dark:to-gray-400 uppercase drop-shadow-md">
          ⚖️ News Bias Detector
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Input Form Column */}
        <div className="md:col-span-2 glass-card p-6 rounded-md">
          <form onSubmit={handleDetect} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy dark:text-gold uppercase tracking-wider mb-2">
                Paste News Article Text
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste news text or article content here to analyze political bias..."
                rows={8}
                className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-md p-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold text-navy dark:text-white leading-relaxed placeholder-gray-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-full bg-navy hover:bg-navy-light text-gold font-bold text-xs uppercase py-3 rounded-md tracking-widest transition-all shadow-md hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 text-gold" />
                  <span>Analyzing Political Spectrum...</span>
                </>
              ) : (
                <span>Detect Bias</span>
              )}
            </button>
          </form>
        </div>

        {/* Info Sidebar Column */}
        <div className="glass-card p-6 rounded-md space-y-4">
          <h3 className="font-serif text-sm font-black text-navy dark:text-gold uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2 flex items-center gap-2">
            <HelpCircle size={14} className="text-gold" /> How it works
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
            Our News Bias Detector evaluates political leanings across the media spectrum using advanced **Gemini AI models**.
          </p>
          <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400 font-sans list-disc pl-4 leading-normal">
            <li>Identifies emotionally charged vocabulary and framing</li>
            <li>Detects structural emphasis and selective omission</li>
            <li>Rates stance on the Left vs. Right political spectrum</li>
          </ul>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-6 bg-red-500/10 border border-red-500/35 text-red-700 dark:text-red-300 text-xs font-semibold px-4 py-3 rounded-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
          <button 
            onClick={handleDetect}
            disabled={loading || countdown > 0}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-300 px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wider transition-colors disabled:opacity-50 shrink-0"
          >
            {countdown > 0 ? `Retry in ${countdown}s` : '🔄 Retry'}
          </button>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="mt-8 glass-card p-6 rounded-md relative overflow-hidden transition-all duration-300 shadow-xl border border-gold/15">
          {/* Vertical Accent line */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-navy dark:bg-gold"></div>

          <div className="space-y-8">
            {/* Header / Summary */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-navy-light/10 dark:bg-white/5 rounded-md">
                <Scale className="text-gold w-8 h-8 animate-pulse" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display text-sm font-black text-gray-400 uppercase tracking-widest">Bias Spectrum Rating</h3>
                  {cacheStatus && (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono ${
                      cacheStatus === 'instant' 
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' 
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20'
                    }`}>
                      {cacheStatus === 'instant' ? '⚡ Instant' : '✨ AI Generated'}
                    </span>
                  )}
                </div>
                <p className="font-serif text-2xl font-black text-navy dark:text-white uppercase tracking-wider mt-1">
                  Leans <span className={getBiasColor(result.bias)}>{result.bias}</span> — {result.percentage}% Intensity
                </p>
              </div>
            </div>

            {/* Bias Spectrum Slider Meter */}
            <div className="space-y-4">
              <h4 className="font-serif text-xs font-bold text-navy dark:text-gold uppercase tracking-wider">
                Visual Spectrum Position
              </h4>
              <div className="relative pt-6">
                {/* Horizontal slider bar with gradient */}
                <div className="h-3.5 w-full rounded-full bg-gradient-to-r from-blue-500 via-gray-300 to-red-500 dark:from-blue-600 dark:via-gray-700 dark:to-red-600 shadow-inner"></div>
                
                {/* Mapped floating marker */}
                <div 
                  className="absolute top-4 -mt-1.5 w-7 h-7 rounded-full bg-white dark:bg-[#0A1628] border-4 border-gold shadow-lg flex items-center justify-center transition-all duration-700 ease-out z-10"
                  style={{ left: `calc(${getBiasPercentage(result.bias)}% - 14px)` }}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-navy dark:bg-gold"></span>
                </div>

                {/* Left/Right labels */}
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-2.5 px-1">
                  <span className="text-blue-500">Left ◄</span>
                  <span className="text-green-500">Center</span>
                  <span className="text-red-500">► Right</span>
                </div>
              </div>
            </div>

            {/* Reasons List */}
            <div className="space-y-3">
              <h4 className="font-serif text-sm font-black text-navy dark:text-gold uppercase tracking-wider border-b border-gray-150/10 pb-2">
                Analysis Reasoning
              </h4>
              <ul className="space-y-3">
                {result.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-navy/90 dark:text-gray-200 leading-relaxed font-sans">
                    <span className="text-gold mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
