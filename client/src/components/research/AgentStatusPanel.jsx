import React from 'react';
import { AGENT_STEPS } from '../../ai/agents/Orchestrator.js';

export default function AgentStatusPanel({ agentProgress, activeStep, status }) {
  const getStepStatus = (stepId) => {
    return agentProgress[stepId] || 'idle'; // 'idle', 'running', 'done', 'error'
  };

  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/20 rounded-lg p-5 font-sans shadow-lg">
      <div className="flex items-center justify-between mb-4 border-b border-[#F4A726]/10 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
            economical research multi-agent system
          </span>
          <h3 className="font-serif text-base font-black text-white uppercase tracking-tight mt-1">
            {status === 'error' ? 'Analysis Halted' : 'Active Research Operations'}
          </h3>
        </div>
        {status === 'running' && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F4A726]/10 border border-[#F4A726]/25 rounded">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F4A726] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F4A726]"></span>
            </span>
            <span className="text-[8.5px] font-mono font-bold text-[#F4A726] uppercase tracking-wider">
              Compiling Ledger...
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {AGENT_STEPS.map((step) => {
          const stepStatus = getStepStatus(step.id);
          const isRunning = stepStatus === 'running';
          const isDone = stepStatus === 'done';
          const isError = stepStatus === 'error';

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-3 rounded border transition-all duration-300 ${
                isRunning
                  ? 'bg-[#142B47]/65 border-[#F4A726]/40 shadow-sm shadow-[#F4A726]/5'
                  : isDone
                  ? 'bg-[#060D17]/40 border-green-900/30 opacity-85'
                  : isError
                  ? 'bg-red-950/20 border-red-900/50'
                  : 'bg-[#060D17]/10 border-[#142B47]/30 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base select-none">{step.icon}</span>
                <div>
                  <span className="text-[11px] font-bold text-white uppercase tracking-wide">
                    {step.label}
                  </span>
                  <p className="text-[8px] font-mono text-gray-450 uppercase mt-0.5 tracking-wider">
                    {isRunning
                      ? 'Executing intelligent tasks...'
                      : isDone
                      ? 'Sub-task complete ✓'
                      : isError
                      ? 'Process interrupted'
                      : 'Awaiting scheduling'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                {isRunning ? (
                  <div className="w-4 h-4 border-2 border-[#F4A726] border-t-transparent rounded-full animate-spin"></div>
                ) : isDone ? (
                  <span className="text-[10px] text-green-500 font-black">✓</span>
                ) : isError ? (
                  <span className="text-[10px] text-red-500 font-bold">⚠️</span>
                ) : (
                  <span className="text-[9px] font-mono text-gray-600 uppercase">queued</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
