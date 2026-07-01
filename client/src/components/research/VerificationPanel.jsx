// client/src/components/research/VerificationPanel.jsx
import React, { useState, useEffect } from 'react';
import AIRouter from '../../ai/AIRouter';

export default function VerificationPanel({ 
  statistic = 'GDP Growth Rate', 
  primaryValue = '7.20%', 
  primarySource = 'World Bank Live API',
  publishedDate = '2026-01-15',
  lastUpdated = new Date().toLocaleDateString(),
  reliabilityScore = 95,
  freshnessScore = 92,
  confidenceScore = 90,
  conflictingSources = [] // e.g. [{ source: 'IMF', value: '6.80%', confidence: 93 }]
}) {
  const [aiExplanation, setAiExplanation] = useState('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const fetchConflictExplanation = async () => {
    if (!conflictingSources || conflictingSources.length === 0) return;
    setLoadingExplanation(true);
    try {
      const conflictDetails = conflictingSources
        .map(c => `${c.source}: ${c.value} (Confidence: ${c.confidence}%)`)
        .join(', ');
      const prompt = `You are a Senior Economic Advisor. Explain concisely why there is a discrepancy in the statistic "${statistic}" between the primary value of ${primaryValue} (Source: ${primarySource}) and other sources: ${conflictDetails}. Focus on methodologies, reporting periods (fiscal vs calendar), or data revisions. Limit to 3 sentences. Never mention Gemini or AI.`;
      const answer = await AIRouter.route(prompt, 'factcheck');
      setAiExplanation(answer);
    } catch (e) {
      console.error('Failed to get conflict explanation:', e);
      setAiExplanation('Discrepancy is typically due to variations in reporting cycles (fiscal year vs. calendar year) and differences in national accounting definitions.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  useEffect(() => {
    if (conflictingSources && conflictingSources.length > 0) {
      fetchConflictExplanation();
    }
  }, [statistic, primaryValue, primarySource, conflictingSources]);

  const hasConflict = conflictingSources && conflictingSources.length > 0;

  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-5 font-sans shadow-lg space-y-4">
      {/* Header */}
      <div className="border-b border-[#F4A726]/10 pb-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
            Verification Protocol Ledger
          </span>
          <h3 className="font-serif text-base font-black text-white uppercase mt-0.5">
            Attribution & Verification Layer
          </h3>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
          hasConflict 
            ? 'bg-red-500/10 border-red-500/35 text-red-400 animate-pulse' 
            : 'bg-green-500/10 border-green-500/30 text-green-400'
        }`}>
          {hasConflict ? '⚠️ SOURCE DISCREPANCY DETECTED' : '✓ VERIFIED SINGLE SOURCE'}
        </span>
      </div>

      {/* Main attribution grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-gray-400 block font-mono text-[9px] uppercase">Primary Source</span>
          <span className="font-bold text-white uppercase">{primarySource}</span>
        </div>
        <div>
          <span className="text-gray-400 block font-mono text-[9px] uppercase">Published Date</span>
          <span className="text-gray-300 font-mono">{publishedDate}</span>
        </div>
        <div>
          <span className="text-gray-400 block font-mono text-[9px] uppercase">Last Updated</span>
          <span className="text-gray-300 font-mono">{lastUpdated}</span>
        </div>
      </div>

      {/* Trust scores */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="p-2.5 bg-[#060D17] border border-white/5 rounded text-center">
          <span className="text-gray-400 block font-mono text-[8px] uppercase mb-1">Reliability</span>
          <span className="text-sm font-bold font-mono text-green-400">{reliabilityScore}%</span>
        </div>
        <div className="p-2.5 bg-[#060D17] border border-white/5 rounded text-center">
          <span className="text-gray-400 block font-mono text-[8px] uppercase mb-1">Freshness</span>
          <span className="text-sm font-bold font-mono text-[#F4A726]">{freshnessScore}%</span>
        </div>
        <div className="p-2.5 bg-[#060D17] border border-white/5 rounded text-center">
          <span className="text-gray-400 block font-mono text-[8px] uppercase mb-1">Confidence</span>
          <span className="text-sm font-bold font-mono text-blue-400">{confidenceScore}%</span>
        </div>
      </div>

      {/* Conflict / Comparison details (FEATURE 8 & 9) */}
      {hasConflict && (
        <div className="border-t border-[#F4A726]/10 pt-4 space-y-3">
          <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wide">
            Provider Discrepancy Ledger
          </h4>
          
          {/* Comparison Table */}
          <div className="bg-[#060D17] border border-white/5 rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[9px] font-mono text-gray-400 uppercase">
                  <th className="p-2">Provider</th>
                  <th className="p-2">Value</th>
                  <th className="p-2">Reliability</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="p-2 text-white font-bold">{primarySource}</td>
                  <td className="p-2 text-[#F4A726] font-mono font-bold">{primaryValue}</td>
                  <td className="p-2 text-green-400 font-mono">{reliabilityScore}%</td>
                </tr>
                {conflictingSources.map((c, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-2 text-gray-300">{c.source}</td>
                    <td className="p-2 text-[#F4A726] font-mono">{c.value}</td>
                    <td className="p-2 text-green-400 font-mono">{c.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Explanation */}
          <div className="p-3 bg-red-500/5 border border-red-500/15 rounded text-xs leading-relaxed">
            <span className="text-[9px] font-mono text-red-400 font-bold uppercase tracking-wider block mb-1">
              AI Reconciliation Commentary
            </span>
            {loadingExplanation ? (
              <span className="text-[10px] text-gray-500 font-mono animate-pulse">Running explanation model...</span>
            ) : (
              <p className="text-gray-300">{aiExplanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
