import React from 'react';

export default function FactCheckMeter({ factCheck }) {
  if (!factCheck) return null;

  const getVerdictBadgeClass = (verdict) => {
    if (verdict === 'VERIFIED') return 'bg-green-500/10 border-green-500/35 text-green-400';
    if (verdict === 'PARTIALLY_TRUE') return 'bg-yellow-500/10 border-yellow-500/35 text-yellow-400';
    return 'bg-red-500/10 border-red-500/35 text-red-400';
  };

  const getReliabilityColor = (score) => {
    if (score >= 85) return 'stroke-green-500 text-green-400';
    if (score >= 70) return 'stroke-[#F4A726] text-[#F4A726]';
    return 'stroke-red-500 text-red-400';
  };

  const score = factCheck.overallReliability || 75;

  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 font-sans shadow-lg flex flex-col md:flex-row gap-6">
      
      {/* Circle reliability meter */}
      <div className="w-full md:w-44 shrink-0 flex flex-col items-center justify-center text-center">
        <span className="text-[9px] font-mono font-bold text-[#F4A726] uppercase tracking-widest mb-3 block">
          ledger trust index
        </span>
        
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#142B47"
              strokeWidth="6"
            />
            {/* Indicator ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
              strokeWidth="6"
              className={`transition-all duration-1000 ease-out ${getReliabilityColor(score).split(' ')[0]}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-serif font-black text-white">{score}%</span>
            <span className="text-[7.5px] font-mono font-bold text-gray-500 uppercase tracking-widest">
              reliability
            </span>
          </div>
        </div>

        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-gray-300 mt-3.5 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded">
          Rating: {factCheck.reliabilityLabel || 'MEDIUM'}
        </span>
      </div>

      {/* Claims list */}
      <div className="flex-grow space-y-4">
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-wider select-none">
            Audit Ledger Fact-Check Verification
          </h4>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5 leading-relaxed">
            {factCheck.summaryNote || 'Autonomous fact-checking applied against referenced sources.'}
          </p>
        </div>

        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {/* Verified Claims */}
          {(factCheck.verifiedClaims || []).map((c, i) => (
            <div key={`v-${i}`} className="p-3 bg-[#060D17]/40 border border-white/5 rounded-md space-y-1.5">
              <div className="flex justify-between items-center">
                <span className={`px-2 py-0.5 border rounded text-[7.5px] font-mono font-bold ${getVerdictBadgeClass(c.verdict)}`}>
                  {c.verdict}
                </span>
                <span className="text-[8px] font-mono text-gray-500">
                  Confidence: {c.confidence}%
                </span>
              </div>
              <p className="text-[10.5px] font-bold text-white leading-normal">
                "{c.claim}"
              </p>
              <p className="text-[10px] text-gray-400 font-serif leading-relaxed">
                {c.explanation}
              </p>
            </div>
          ))}

          {/* Flagged Claims */}
          {(factCheck.flaggedClaims || []).map((c, i) => (
            <div key={`f-${i}`} className="p-3 bg-red-950/5 border border-red-900/20 rounded-md space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="px-2 py-0.5 border border-red-500/35 bg-red-500/10 rounded text-[7.5px] font-mono font-bold text-red-400">
                  FLAGGED DISCREPANCY
                </span>
                <span className="text-[8px] font-mono text-red-400/80">
                  Confidence: {c.confidence}%
                </span>
              </div>
              <p className="text-[10.5px] font-bold text-white leading-normal">
                "{c.claim}"
              </p>
              <p className="text-[10px] text-gray-300 font-serif leading-relaxed">
                <strong className="text-red-400">Issue:</strong> {c.issue}
              </p>
              <p className="text-[10px] text-green-400 font-serif leading-relaxed">
                <strong className="text-green-400">Correction:</strong> {c.correction}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
