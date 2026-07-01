import React, { useState } from 'react';
import { formatAPA, formatMLA, formatChicago, formatHarvard, compileBibliographyText } from '../../utils/CitationsFormatter.js';

const STYLE_FORMATS = [
  { id: 'apa',     label: 'APA 7th Edition',    formatter: formatAPA },
  { id: 'mla',     label: 'MLA 9th Edition',    formatter: formatMLA },
  { id: 'chicago', label: 'Chicago Manual',    formatter: formatChicago },
  { id: 'harvard', label: 'Harvard Reference',  formatter: formatHarvard },
];

export default function CitationsPanel({ sources }) {
  const [activeStyle, setActiveStyle] = useState('apa');
  const [copiedId, setCopiedId] = useState(null);

  if (!sources || !sources.length) return null;

  const currentFormatter = STYLE_FORMATS.find(s => s.id === activeStyle)?.formatter || formatAPA;

  const handleCopySingle = (src, idx) => {
    const formatted = currentFormatter(src);
    navigator.clipboard.writeText(formatted);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDownloadBibliography = () => {
    const text = compileBibliographyText(sources);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ER-Bibliography-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 font-sans shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4A726]/10 pb-3">
        <div>
          <span className="text-[9.5px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
            academic attribution console
          </span>
          <h3 className="font-serif text-base font-black text-white uppercase tracking-tight mt-0.5">
            Export Academic Citations
          </h3>
        </div>

        <button
          onClick={handleDownloadBibliography}
          className="bg-transparent border border-[#F4A726]/30 text-[#F4A726] hover:bg-[#F4A726] hover:text-navy px-3 py-1 rounded text-[9.5px] font-mono font-bold uppercase transition-colors cursor-pointer"
        >
          📥 Download Bibliography
        </button>
      </div>

      {/* Style selectors */}
      <div className="flex bg-[#060D17] border border-white/5 rounded p-0.5 max-w-sm">
        {STYLE_FORMATS.map(style => (
          <button
            key={style.id}
            onClick={() => setActiveStyle(style.id)}
            className={`flex-grow py-1 text-[8.5px] font-mono rounded font-bold uppercase tracking-wider ${
              activeStyle === style.id ? 'bg-[#142B47] text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {style.id}
          </button>
        ))}
      </div>

      {/* Citations List */}
      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
        {sources.map((src, idx) => {
          const formattedText = currentFormatter(src);
          const isCopied = copiedId === idx;

          return (
            <div key={idx} className="p-3 bg-[#060D17]/40 border border-white/5 rounded-md flex justify-between gap-3 group hover:border-[#F4A726]/10 transition-colors">
              <div className="space-y-1">
                <span className="text-[7.5px] font-mono font-bold text-gray-500 uppercase tracking-widest block">
                  Reference [{idx + 1}] — {src.domain}
                </span>
                <p className="text-[10.5px] font-serif text-gray-300 leading-normal">
                  {formattedText}
                </p>
              </div>

              <button
                onClick={() => handleCopySingle(src, idx)}
                className={`px-2.5 py-1 border rounded text-[8.5px] font-mono font-bold uppercase shrink-0 transition-colors cursor-pointer self-start ${
                  isCopied 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-transparent border-white/5 text-gray-500 hover:text-white'
                }`}
              >
                {isCopied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
