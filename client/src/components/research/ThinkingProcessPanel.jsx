import React from 'react';

const THINKING_STEPS = [
  { id: 'planner_start',    label: 'Understanding Research Topic',          icon: '🧠' },
  { id: 'planner_done',     label: 'Planning Multi-Agent Strategy',         icon: '🗺️' },
  { id: 'research_fetch',   label: 'Searching Trusted Institutional Sources',icon: '🔍' },
  { id: 'research_parse',   label: 'Reading Dispatches & Economic Papers',  icon: '📚' },
  { id: 'finance_start',    label: 'Collecting Global Financial Indicators', icon: '📊' },
  { id: 'finance_rates',    label: 'Checking Central Bank Rates & Forecasts',icon: '🏛️' },
  { id: 'factcheck_start',  label: 'Verifying Historical Claims & Data',    icon: '✅' },
  { id: 'citation_start',   label: 'Attributing Verified Domain Citations', icon: '🔗' },
  { id: 'charts_start',     label: 'Generating Interactive Data Charts',    icon: '📈' },
  { id: 'timeline_start',   label: 'Projecting Historical/Forecast Timeline',icon: '📅' },
  { id: 'writing_start',    label: 'Compiling Final 21-Section Briefing',   icon: '✍️' },
  { id: 'quality_check',    label: 'Checking Compilation Quality & Signoff', icon: '🛡️' },
];

export default function ThinkingProcessPanel({ progress }) {
  const getStepState = (stepId, index) => {
    // If the step is explicitly done, return 'done'
    if (progress[stepId] === 'done') return 'done';
    
    // Find currently active step
    const keys = Object.keys(progress);
    const activeKey = keys.find(k => progress[k] === 'running');
    
    if (activeKey === stepId) return 'running';
    
    // If a subsequent step is running or done, this step is implicit done
    const activeIdx = THINKING_STEPS.findIndex(s => s.id === activeKey);
    const completedIndices = THINKING_STEPS.filter(s => progress[s.id] === 'done').map(s => THINKING_STEPS.indexOf(s));
    const maxCompletedIdx = completedIndices.length ? Math.max(...completedIndices) : -1;

    if (index <= maxCompletedIdx) return 'done';
    if (activeIdx !== -1 && index < activeIdx) return 'done';
    
    return 'pending';
  };

  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/20 rounded-lg p-5 font-sans shadow-lg space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-[#F4A726]/10 pb-3">
        <div>
          <span className="text-[9.5px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
            economical research brain
          </span>
          <h3 className="font-serif text-base font-black text-white uppercase tracking-tight mt-0.5">
            AI Cognitive Thinking Process
          </h3>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#F4A726]/10 border border-[#F4A726]/20 rounded">
          <div className="w-2 h-2 rounded-full bg-[#F4A726] animate-ping"></div>
          <span className="text-[8.5px] font-mono font-bold text-[#F4A726] uppercase tracking-wider">
            Compiling Brief...
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[350px] overflow-y-auto pr-1">
        {THINKING_STEPS.map((step, idx) => {
          const state = getStepState(step.id, idx);
          const isDone = state === 'done';
          const isRunning = state === 'running';

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-3 rounded border transition-all duration-300 ${
                isRunning
                  ? 'bg-[#142B47]/60 border-[#F4A726]/40 shadow-sm shadow-[#F4A726]/5'
                  : isDone
                  ? 'bg-[#060D17]/40 border-green-950/20 opacity-80'
                  : 'bg-[#060D17]/10 border-gray-800/10 opacity-30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm select-none">{step.icon}</span>
                <span className="text-[10.5px] font-bold text-white uppercase tracking-wide">
                  {step.label}
                </span>
              </div>
              <div>
                {isRunning ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#F4A726] border-t-transparent rounded-full animate-spin"></div>
                ) : isDone ? (
                  <span className="text-[10px] text-green-500 font-black">✓</span>
                ) : (
                  <span className="text-[8px] font-mono text-gray-700 uppercase">wait</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
