import React from 'react';

export default function SourceReliabilityPanel({ sources }) {
  if (!sources || !sources.length) return null;

  const getTierBadgeClass = (tier) => {
    if (tier === 1) return 'bg-red-500/10 border-red-500/30 text-red-400';
    if (tier === 2) return 'bg-[#F4A726]/10 border-[#F4A726]/30 text-[#F4A726]';
    return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-[#F4A726]';
    return 'text-red-400';
  };

  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 font-sans shadow-lg">
      <div className="flex items-center justify-between mb-4 border-b border-[#F4A726]/10 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
            provenance verification registry
          </span>
          <h3 className="font-serif text-base font-black text-white uppercase tracking-tight mt-1">
            Source Reliability Ledger & Attributions
          </h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px] font-mono border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-gray-500 uppercase text-[9px] tracking-wider select-none">
              <th className="py-2.5 px-2">Attribution Domain</th>
              <th className="py-2.5 px-2">Provenance Tier</th>
              <th className="py-2.5 px-2 text-center">Credibility</th>
              <th className="py-2.5 px-2 text-center">Freshness</th>
              <th className="py-2.5 px-2 text-center">Composite Trust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sources.map((src, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors duration-150">
                <td className="py-2 px-2 font-bold text-white">
                  <a
                    href={`https://${src.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-[#F4A726]"
                  >
                    {src.domain}
                  </a>
                </td>
                <td className="py-2 px-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${getTierBadgeClass(src.tier)}`}>
                    {src.tierLabel}
                  </span>
                </td>
                <td className={`py-2 px-2 text-center font-bold ${getScoreColor(src.credibilityScore)}`}>
                  {src.credibilityScore}%
                </td>
                <td className={`py-2 px-2 text-center font-bold ${getScoreColor(src.freshnessScore)}`}>
                  {src.freshnessScore}%
                </td>
                <td className="py-2 px-2 text-center font-bold">
                  <span className={`px-2 py-1 rounded text-white bg-navy border border-white/5 ${getScoreColor(src.confidenceScore)}`}>
                    {src.confidenceScore}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
