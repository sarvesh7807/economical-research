// client/src/components/EconomicCalendar.jsx
import React, { useState } from 'react';

// Generates dynamic dates relative to today
const getOffsetDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const CALENDAR_EVENTS = [
  { id: 1, title: 'Federal Reserve FOMC Interest Rate Decision', country: 'United States', date: getOffsetDate(1), time: '23:30 IST', impact: 'CRITICAL', type: 'Central Bank' },
  { id: 2, title: 'CPI Inflation YoY (Jan)', country: 'India', date: getOffsetDate(2), time: '17:30 IST', impact: 'HIGH', type: 'CPI Release' },
  { id: 3, title: 'GDP Growth Rate QoQ (Q4)', country: 'Eurozone', date: getOffsetDate(3), time: '15:30 IST', impact: 'HIGH', type: 'GDP Release' },
  { id: 4, title: 'Non Farm Payrolls & Unemployment Rate', country: 'United States', date: getOffsetDate(4), time: '19:00 IST', impact: 'CRITICAL', type: 'Employment' },
  { id: 5, title: 'Union Budget Announcement 2026', country: 'India', date: getOffsetDate(5), time: '11:00 IST', impact: 'CRITICAL', type: 'Budget' },
  { id: 6, title: 'Bank of Japan Monetary Policy Decision', country: 'Japan', date: getOffsetDate(6), time: '08:30 IST', impact: 'HIGH', type: 'Central Bank' },
  { id: 7, title: 'Tesla Inc. Q1 Earnings Call (TSLA)', country: 'United States', date: getOffsetDate(7), time: '02:30 IST', impact: 'HIGH', type: 'Earnings' },
  { id: 8, title: 'BoE MPC Minutes & Rate Vote', country: 'United Kingdom', date: getOffsetDate(8), time: '16:30 IST', impact: 'HIGH', type: 'Central Bank' },
  { id: 9, title: 'Inflation YoY Prelim (Jan)', country: 'Germany', date: getOffsetDate(10), time: '18:30 IST', impact: 'MEDIUM', type: 'CPI Release' }
];

export default function EconomicCalendar() {
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedImpact, setSelectedImpact] = useState('All');

  const countries = ['All', 'India', 'United States', 'United Kingdom', 'Eurozone', 'Japan', 'Germany'];

  // Filter events
  const filteredEvents = CALENDAR_EVENTS.filter(e => {
    if (selectedCountry !== 'All' && e.country !== selectedCountry) return false;
    if (selectedImpact !== 'All' && e.impact !== selectedImpact) return false;
    return true;
  });

  const getImpactBadgeColor = (impact) => {
    if (impact === 'CRITICAL') return 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse';
    if (impact === 'HIGH') return 'bg-orange-500/10 border-orange-500/25 text-orange-400';
    return 'bg-gray-800 border-white/5 text-gray-400';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      
      {/* Title */}
      <div className="border-b border-[#F4A726]/10 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
            global macroeconomic events schedule
          </span>
          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
            Economic Calendar
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Monitor impending central bank interest rate announcements, CPI releases, sovereign budget assemblies, and major corporate earnings calls.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-5 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-lg">
        <div className="flex gap-4 items-center flex-wrap">
          {/* Country filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono text-gray-500 uppercase">Country desk</label>
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              className="bg-[#060D17] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4A726]/40"
            >
              {countries.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Countries' : c}</option>
              ))}
            </select>
          </div>

          {/* Impact filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono text-gray-500 uppercase">Event Impact</label>
            <select
              value={selectedImpact}
              onChange={e => setSelectedImpact(e.target.value)}
              className="bg-[#060D17] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4A726]/40"
            >
              <option value="All">All Impacts</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Impact</option>
              <option value="MEDIUM">Medium Impact</option>
            </select>
          </div>
        </div>

        <span className="text-[10px] font-mono text-gray-500 uppercase">
          {filteredEvents.length} upcoming events scheduled
        </span>
      </div>

      {/* Calendar List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-[#0A1628]/20 border border-white/5 rounded-lg">
            <span className="text-2xl block mb-2">📅</span>
            <p className="text-xs text-gray-400">No upcoming economic events match your filter presets.</p>
          </div>
        ) : (
          filteredEvents.map(e => (
            <div
              key={e.id}
              style={{
                background: 'linear-gradient(135deg, #0A1628 0%, #060D17 100%)',
                border: '1px solid rgba(244,167,38,0.15)',
                borderRadius: '8px',
                padding: '16px 20px'
              }}
              className="hover:border-[#F4A726]/45 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.2 bg-[#060D17] border border-white/5 rounded text-[8px] uppercase tracking-wider text-[#F4A726] font-mono font-bold">
                    {e.type}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">{e.country}</span>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide font-serif">
                  {e.title}
                </h3>
              </div>

              {/* Date, Time & Impact */}
              <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-300">{e.date}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">{e.time}</p>
                </div>
                <span className={`px-3 py-1 border rounded text-[9px] font-mono font-bold uppercase tracking-wider ${getImpactBadgeColor(e.impact)}`}>
                  {e.impact}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
