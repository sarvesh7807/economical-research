import React from 'react';

export default function RefreshButton({ generatedAt, onRefresh, loading }) {
  if (!generatedAt) return null;

  // Stale age: older than 6 hours
  const timestamp = new Date(generatedAt).getTime();
  const ageHours = (Date.now() - timestamp) / (60 * 60 * 1000);
  const isStale = ageHours > 6;

  return (
    <div className="w-full">
      {isStale ? (
        <div className="bg-[#F4A726]/10 border border-[#F4A726]/20 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md animate-pulse">
          <div className="space-y-0.5">
            <span className="text-[8px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
              stale ledger alert
            </span>
            <h4 className="font-serif text-xs font-black text-white uppercase tracking-tight">
              New market data is available for this research
            </h4>
            <p className="text-[9.5px] text-gray-400">
              Briefing compiled {Math.round(ageHours)} hours ago. Tap refresh to perform a smart delta update.
            </p>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="bg-[#F4A726] hover:bg-[#D48E19] text-navy font-bold px-4 py-2 rounded text-[10px] uppercase tracking-wide transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Report'}
          </button>
        </div>
      ) : (
        <div className="bg-[#0A1628] border border-white/5 p-3 rounded-lg flex items-center justify-between text-[9.5px] text-gray-500 font-mono">
          <span>Data Freshness: Optimal Freshness (&lt; 6 hours old)</span>
          <span>Last checked: {new Date(generatedAt).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}
