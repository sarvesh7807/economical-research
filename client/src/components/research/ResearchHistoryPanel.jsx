import React from 'react';

export default function ResearchHistoryPanel({ history, onSelectReport }) {
  if (!history || !history.length) {
    return (
      <div className="w-full bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 font-sans shadow-lg text-center py-8 text-gray-500 text-[10px] uppercase font-mono tracking-wider">
        <span>No historical research briefs registered to this credential</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 font-sans shadow-lg">
      <div className="flex items-center justify-between mb-4 border-b border-[#F4A726]/10 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
            historical intelligence log
          </span>
          <h3 className="font-serif text-base font-black text-white uppercase tracking-tight mt-1">
            Past Research Briefings Ledger
          </h3>
        </div>
      </div>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {history.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => onSelectReport(item)}
            className="flex items-center justify-between p-3 rounded border border-white/5 bg-[#060D17]/40 hover:bg-[#142B47]/20 hover:border-[#F4A726]/30 cursor-pointer transition-all duration-150"
          >
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-white uppercase tracking-wide line-clamp-1">
                {item.query}
              </h4>
              <p className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">
                Generated: {item.generatedAt?.toMillis ? new Date(item.generatedAt.toMillis()).toLocaleDateString() : new Date(item.generatedAt).toLocaleDateString()} • Version {item.reportVersion || 1}
              </p>
            </div>

            <span className="text-[9px] font-mono text-[#F4A726] border border-[#F4A726]/20 bg-[#F4A726]/5 px-2 py-0.5 rounded uppercase">
              Retrieve
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
