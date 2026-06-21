import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

export default function FakeNewsChecker() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const prompt = `Analyze this news article or headline:
"${inputText.trim()}"

Is this fake, real, or unverified news?
You must analyze the factual details carefully.
Provide the response strictly as a JSON object matching this schema:
{
  "verdict": "REAL" | "FAKE" | "UNVERIFIED",
  "confidence": number, // an integer percentage (0 to 100) e.g., 85
  "reasons": [string, string, string] // exactly 3 short, clear, and distinct reasons for your verdict
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
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
        setError("⏳ I'm getting a lot of requests right now! Please wait 30 seconds and try again.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError("Something went wrong. Please try again in a moment.");
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from AI model');

      const parsed = JSON.parse(rawText);
      setResult(parsed);
    } catch (err) {
      console.error(err);
      setError("Connection issue. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getVerdictStyles = (verdict) => {
    switch (verdict) {
      case 'REAL':
        return {
          icon: <CheckCircle className="text-green-500 w-8 h-8" />,
          title: 'REAL NEWS',
          badge: 'bg-green-500/10 text-green-500 border-green-500/25',
          prefix: '✅',
          textColor: 'text-green-500'
        };
      case 'FAKE':
        return {
          icon: <ShieldAlert className="text-red-500 w-8 h-8" />,
          title: 'FAKE NEWS',
          badge: 'bg-red-500/10 text-red-500 border-red-500/25',
          prefix: '❌',
          textColor: 'text-red-500'
        };
      default:
        return {
          icon: <AlertTriangle className="text-yellow-500 w-8 h-8" />,
          title: 'UNVERIFIED',
          badge: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/25',
          prefix: '⚠️',
          textColor: 'text-yellow-500'
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 font-sans">
      <div className="border-b border-gray-200 dark:border-white/10 pb-4 mb-8">
        <h2 className="font-display text-3xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-navy to-primary dark:from-white dark:to-gray-400 uppercase drop-shadow-md">
          🔍 Fake News Detector
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Input Form Column */}
        <div className="md:col-span-2 glass-card p-6 rounded-3xl">
          <form onSubmit={handleCheck} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy dark:text-gold uppercase tracking-wider mb-2">
                Paste News Headline or Article Content
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste news text or article headlines here..."
                rows={8}
                className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold text-navy dark:text-white leading-relaxed placeholder-gray-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-full bg-navy hover:bg-navy-light text-gold font-bold text-xs uppercase py-3 rounded-2xl tracking-widest transition-all shadow-md hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 text-gold" />
                  <span>Analyzing Veracity...</span>
                </>
              ) : (
                <span>Check News</span>
              )}
            </button>
          </form>
        </div>

        {/* Info Sidebar Column */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-serif text-sm font-black text-navy dark:text-gold uppercase tracking-wider border-b border-gray-200 dark:border-white/10 pb-2 flex items-center gap-2">
            <HelpCircle size={14} className="text-gold" /> How it works
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
            Our Fake News Detector parses user content against a localized intelligence check powered by the state-of-the-art **Gemini AI model**.
          </p>
          <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400 font-sans list-disc pl-4 leading-normal">
            <li>Checks cross-referencing source claims</li>
            <li>Analyzes logical fallacies and emotional manipulation</li>
            <li>Evaluates source authority indicators</li>
          </ul>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-6 bg-red-500/10 border border-red-500/35 text-red-700 dark:text-red-300 text-xs font-semibold px-4 py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
          {error.includes("⏳") && (
            <button 
              onClick={(e) => handleCheck(e)}
              disabled={loading}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-300 px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wider transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? 'Retrying...' : 'Retry Now'}
            </button>
          )}
        </div>
      )}

      {/* Results Column */}
      {result && (
        <div className="mt-8 glass-card p-6 rounded-3xl relative overflow-hidden transition-all duration-300 shadow-xl border border-gold/15">
          {/* Vertical Accent line */}
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
            result.verdict === 'REAL' ? 'bg-green-500' : result.verdict === 'FAKE' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>

          {(() => {
            const styles = getVerdictStyles(result.verdict);
            return (
              <div className="space-y-6">
                {/* Result Summary */}
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-navy-light/10 dark:bg-white/5 rounded-2xl">
                    {styles.icon}
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-black text-gray-400 uppercase tracking-widest">Analysis Verdict</h3>
                    <p className={`font-serif text-2xl font-black ${styles.textColor} uppercase tracking-wider mt-1`}>
                      {styles.prefix} {styles.title} — {result.confidence}% Confidence
                    </p>
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
            );
          })()}
        </div>
      )}
    </div>
  );
}
