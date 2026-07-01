import React, { useState } from 'react';

export default function TimelineViewer({ timeline }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (!timeline) return null;

  const historical = timeline.historical || [];
  const current = timeline.current || [];
  const forecast = timeline.forecast || [];
  const allEvents = [...historical, ...current, ...forecast];

  const getImpactColor = (impact) => {
    if (impact === 'positive') return 'bg-green-500 border-green-400';
    if (impact === 'negative') return 'bg-red-500 border-red-400';
    return 'bg-yellow-500 border-yellow-400';
  };

  const getTimelineSegmentClass = (type) => {
    if (type === 'ai_prediction') return 'border-dashed';
    return 'border-solid';
  };

  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 font-sans shadow-lg">
      <div className="flex items-center justify-between mb-4 border-b border-[#F4A726]/10 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
            analysis projection index
          </span>
          <h3 className="font-serif text-base font-black text-white uppercase tracking-tight mt-1">
            Historical Timeline & Future Forecast Outlook
          </h3>
        </div>
        <div className="flex gap-3 text-[8.5px] font-mono font-bold uppercase tracking-wider text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500"></span> Positive</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-500"></span> Neutral</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500"></span> Negative</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 border border-dashed border-[#F4A726]/80 rounded"></span> Forecast (🔮)</span>
        </div>
      </div>

      {/* Horizontal timeline track */}
      <div className="overflow-x-auto pb-4 pt-6 scrollbar-thin scrollbar-thumb-[#F4A726]/20 scrollbar-track-transparent">
        <div className="flex items-start gap-1 min-w-[700px] relative px-4">
          
          {/* Central Line */}
          <div className="absolute top-[37px] left-0 right-0 h-0.5 bg-gradient-to-r from-gray-700 via-gray-600 to-[#F4A726]/30 -z-10"></div>

          {allEvents.map((evt, idx) => {
            const isForecast = evt.type === 'ai_prediction';
            const isSelected = selectedEvent === evt;

            return (
              <div 
                key={idx} 
                className="flex-1 flex flex-col items-center text-center cursor-pointer transition-transform duration-200 hover:scale-105"
                onClick={() => setSelectedEvent(evt === selectedEvent ? null : evt)}
              >
                {/* Date Header */}
                <span className="text-[9px] font-mono font-black text-white bg-[#142B47] px-2 py-0.5 rounded border border-white/5 mb-3">
                  {evt.date}
                </span>

                {/* Node point */}
                <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 bg-navy ${getTimelineSegmentClass(evt.type)} ${isForecast ? 'border-[#F4A726]' : 'border-white/20'} z-10 shadow-md`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${getImpactColor(evt.impact)}`}></div>
                  {isForecast && (
                    <span className="absolute -top-1 -right-1 text-[7px] bg-[#F4A726] text-navy rounded-full w-3.5 h-3.5 flex items-center justify-center font-black leading-none">
                      🔮
                    </span>
                  )}
                </div>

                {/* Title */}
                <div className="mt-2.5 max-w-[120px]">
                  <p className={`text-[10px] font-bold leading-tight ${isSelected ? 'text-[#F4A726]' : 'text-gray-200'}`}>
                    {evt.label}
                  </p>
                  {isForecast && (
                    <span className="text-[7.5px] font-mono font-bold text-[#F4A726] bg-[#F4A726]/10 px-1 py-0.2 rounded border border-[#F4A726]/20 mt-1 inline-block">
                      Conf: {evt.confidence}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Event Details Panel */}
      {selectedEvent ? (
        <div className="mt-4 p-4 bg-[#060D17] border border-[#F4A726]/15 rounded-md text-xs transition-opacity duration-300">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[8px] font-mono font-bold text-[#F4A726] uppercase tracking-widest">
                {selectedEvent.type === 'ai_prediction' ? '🔮 AI Prediction Analysis' : '📝 Historical Fact Analysis'}
              </span>
              <h4 className="font-serif text-sm font-black text-white uppercase tracking-tight mt-0.5">
                {selectedEvent.label}
              </h4>
            </div>
            <span className="text-[9px] font-mono text-gray-500 bg-[#142B47]/40 px-2 py-0.5 rounded">
              Ref Date: {selectedEvent.date}
            </span>
          </div>
          <p className="text-gray-400 font-serif leading-relaxed text-[11px]">
            {selectedEvent.description}
          </p>
          {selectedEvent.confidenceBand && (
            <div className="mt-3 flex items-center gap-3 bg-[#142B47]/20 p-2 rounded border border-white/5">
              <span className="text-[8.5px] font-mono text-gray-400">Forecast confidence band:</span>
              <div className="flex-grow bg-gray-800 h-1.5 rounded-full overflow-hidden relative max-w-[200px]">
                <div 
                  className="bg-[#F4A726]/30 h-full absolute" 
                  style={{ left: `${selectedEvent.confidenceBand.low}%`, right: `${100 - selectedEvent.confidenceBand.high}%` }}
                ></div>
                <div 
                  className="bg-[#F4A726] h-full absolute w-1.5 rounded-full" 
                  style={{ left: `${selectedEvent.confidenceBand.base}%` }}
                ></div>
              </div>
              <span className="text-[9px] font-mono font-bold text-[#F4A726]">
                {selectedEvent.confidenceBand.low}% - {selectedEvent.confidenceBand.high}%
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 text-center py-2 text-gray-500 text-[10px] uppercase font-mono tracking-wider">
          💡 Click any node to drill down into timeline details
        </div>
      )}
    </div>
  );
}
