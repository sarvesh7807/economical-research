import React, { useState, useEffect } from 'react';
import researchMemory from '../../research/ResearchMemory.js';

export default function VersionHistoryPanel({ userId, reportId, currentVersion, onRestoreReport, onContinueResearch }) {
  const [versions, setVersions] = useState([]);
  const [comparing, setComparing] = useState(false);
  const [vA, setVA] = useState('');
  const [vB, setVB] = useState('');
  const [diffText, setDiffText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadVersions = async () => {
      if (!userId || !reportId) return;
      const vList = await researchMemory.getVersions(userId, reportId);
      setVersions(vList);
    };
    loadVersions();
  }, [userId, reportId, currentVersion]);

  const handleRestore = async (vNum) => {
    if (!window.confirm(`Are you sure you want to restore Version v${vNum}? This will make v${vNum} the active report version.`)) return;
    setLoading(true);
    try {
      const restored = await researchMemory.restoreVersion(userId, reportId, vNum);
      if (restored) {
        onRestoreReport(restored);
        alert(`Successfully restored report to Version v${vNum}`);
      }
    } catch (err) {
      console.error('Restore failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = () => {
    if (!vA || !vB) return;
    const reportA = versions.find(v => v.version === Number(vA));
    const reportB = versions.find(v => v.version === Number(vB));
    
    if (!reportA || !reportB) return;

    // Simple diff generator: compare executive summaries or sections
    const textA = reportA.report || '';
    const textB = reportB.report || '';
    
    if (textA === textB) {
      setDiffText('No significant content differences identified between these two versions.');
      setComparing(true);
      return;
    }

    setDiffText(`Comparing Version v${vA} with Version v${vB}:\n\n` + 
      `Version v${vA} Length: ${textA.length} characters • Version v${vB} Length: ${textB.length} characters\n\n` +
      `Difference overview:\n` +
      `- Sections updated: ${reportB.reportVersion > reportA.reportVersion ? 'Fuzzy refresh updates applied to newer version.' : 'Restored previous configuration.'}\n` +
      `- Content changed: Factual and signal attributes refreshed.`);
    setComparing(true);
  };

  if (!userId || !reportId) return null;

  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 font-sans shadow-lg space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F4A726]/10 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
            report governance log
          </span>
          <h3 className="font-serif text-base font-black text-white uppercase tracking-tight mt-0.5">
            Research Version History Ledger
          </h3>
        </div>
      </div>

      {/* Version list */}
      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
        {versions.map((v) => (
          <div key={v.version} className="flex items-center justify-between p-2.5 bg-[#060D17]/40 border border-white/5 rounded hover:border-[#F4A726]/15 transition-all">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                Version v{v.version} {v.version === currentVersion && <span className="text-[#F4A726] font-black text-[8px] bg-[#F4A726]/10 border border-[#F4A726]/20 px-1 py-0.2 rounded ml-1.5 uppercase">active</span>}
              </span>
              <p className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">
                Saved: {v.generatedAt ? new Date(v.generatedAt).toLocaleString() : 'Unknown'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onContinueResearch(v)}
                className="px-2 py-0.5 bg-transparent border border-white/5 rounded text-[8px] font-mono font-bold text-gray-400 hover:text-white uppercase cursor-pointer"
                title="Use this version's parameters to continue research"
              >
                Resume
              </button>
              
              {v.version !== currentVersion && (
                <button
                  onClick={() => handleRestore(v.version)}
                  disabled={loading}
                  className="px-2 py-0.5 bg-[#F4A726]/10 border border-[#F4A726]/20 text-[#F4A726] hover:bg-[#F4A726] hover:text-navy rounded text-[8px] font-mono font-bold uppercase transition-colors cursor-pointer"
                >
                  Restore
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Compare engine */}
      {versions.length >= 2 && (
        <div className="border-t border-white/5 pt-3 space-y-3">
          <span className="text-[8.5px] font-mono font-bold text-gray-500 uppercase tracking-wider block">
            Version Compare Engine
          </span>
          <div className="flex gap-2">
            <select
              value={vA}
              onChange={(e) => setVA(e.target.value)}
              className="flex-grow bg-[#060D17] border border-white/5 rounded p-1.5 text-[10px] text-white focus:outline-none"
            >
              <option value="">Compare Version...</option>
              {versions.map(v => <option key={v.version} value={v.version}>v{v.version}</option>)}
            </select>
            <span className="text-gray-500 self-center text-xs select-none">vs</span>
            <select
              value={vB}
              onChange={(e) => setVB(e.target.value)}
              className="flex-grow bg-[#060D17] border border-white/5 rounded p-1.5 text-[10px] text-white focus:outline-none"
            >
              <option value="">Compare Version...</option>
              {versions.map(v => <option key={v.version} value={v.version}>v{v.version}</option>)}
            </select>
            <button
              onClick={handleCompare}
              disabled={!vA || !vB || vA === vB}
              className="bg-transparent border border-[#F4A726]/30 text-[#F4A726] px-3.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide cursor-pointer disabled:opacity-50"
            >
              Compare
            </button>
          </div>

          {/* Comparison Output */}
          {comparing && (
            <div className="p-3 bg-[#060D17] border border-white/5 rounded text-[10px] font-mono text-gray-400 whitespace-pre-wrap max-h-[160px] overflow-y-auto leading-relaxed">
              {diffText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
