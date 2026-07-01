import React from 'react';

export default function ConfidenceDashboard({ report }) {
  if (!report) return null;

  // Calculate scores derived from report structure
  const reliability = report.factCheck?.overallReliability || 75;
  const confidence = report.finance?.riskLevel === 'CRITICAL' ? 60 : 85;
  const prediction = report.timeline?.forecast?.length ? Math.round(
    report.timeline.forecast.reduce((acc, f) => acc + (f.confidence || 50), 0) / report.timeline.forecast.length
  ) : 65;

  const freshness = report.citation?.scoredSources?.length ? Math.round(
    report.citation.scoredSources.reduce((acc, s) => acc + (s.freshnessScore || 50), 0) / report.citation.scoredSources.length
  ) : 80;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 65) return 'text-[#F4A726] bg-[#F4A726]/10 border-[#F4A726]/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const getStrokeColor = (score) => {
    if (score >= 80) return 'stroke-green-500';
    if (score >= 65) return 'stroke-[#F4A726]';
    return 'stroke-red-500';
  };

  const metrics = [
    { label: 'Research Confidence', score: confidence, desc: 'Information depth' },
    { label: 'Fact Confidence',     score: reliability, desc: 'Factual corroboration' },
    { label: 'Prediction Confidence', score: prediction, desc: 'Forecasting model accuracy' },
    { label: 'Freshness Score',       score: freshness, desc: 'Source age analysis' },
  ];

  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 font-sans shadow-lg space-y-4">
      <div>
        <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
          ledger verification console
        </span>
        <h3 className="font-serif text-base font-black text-white uppercase tracking-tight mt-0.5">
          Research Trust & Confidence Signals
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className="p-3 bg-[#060D17]/40 border border-white/5 rounded-md flex flex-col items-center text-center">
            
            {/* Radial gauge */}
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#142B47"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - metric.score / 100)}`}
                  strokeWidth="8"
                  className={`transition-all duration-1000 ease-out ${getStrokeColor(metric.score)}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">
                {metric.score}%
              </div>
            </div>

            <span className="text-[9.5px] font-bold text-white uppercase tracking-wide mt-2 block">
              {metric.label}
            </span>
            <span className="text-[8px] font-mono text-gray-500 uppercase mt-0.5 block">
              {metric.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
