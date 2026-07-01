import React from 'react';

const AUDIENCES = [
  { id: 'researcher', label: 'Researcher', desc: 'Standard technical brief' },
  { id: 'executive',   label: 'Executive',  desc: 'High-level summaries' },
  { id: 'investor',    label: 'Investor',   desc: 'Focus on growth & risks' },
  { id: 'student',     label: 'Student',    desc: 'Simplified explanations' },
  { id: 'journalist',  label: 'Journalist', desc: 'Headline & narrative style' },
  { id: 'beginner',    label: 'Beginner',   desc: 'No technical jargon' },
];

export default function ReadingModeSelector({ activeMode, onChangeMode, disabled }) {
  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-4 font-sans shadow-lg">
      <div className="flex items-center justify-between border-b border-[#F4A726]/10 pb-2 mb-3">
        <div>
          <span className="text-[9px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
            audience layout compiler
          </span>
          <h4 className="font-serif text-xs font-black text-white uppercase tracking-tight">
            Reading Audience Persona
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {AUDIENCES.map((aud) => {
          const isActive = activeMode === aud.id;

          return (
            <button
              key={aud.id}
              onClick={() => onChangeMode(aud.id)}
              disabled={disabled}
              className={`p-2.5 rounded text-left border flex flex-col justify-between transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                isActive
                  ? 'bg-[#F4A726]/10 border-[#F4A726] text-white shadow-sm'
                  : 'bg-[#060D17] border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-[10.5px] font-bold uppercase tracking-wide">
                {aud.label}
              </span>
              <span className="text-[8px] font-mono text-gray-500 uppercase mt-1">
                {aud.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
