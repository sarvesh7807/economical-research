import React, { useState } from 'react';
import { exportPDF, exportCSV, exportDOCX, exportExcel, exportPPTX } from '../../utils/exportEngine.js';

export default function ExportPanel({ reportData, subscription }) {
  const [exporting, setExporting] = useState(null);

  const isPro = subscription?.tier === 'PRO' || 
                subscription?.tier === 'SCHOLAR' || 
                subscription?.tier === 'ENTERPRISE';

  const handleExport = async (format) => {
    if (format !== 'PDF' && !isPro) {
      alert('Subscription Required: Upgrading to a PRO desk is required to unlock DOCX, PPTX, Excel, and CSV export modules.');
      return;
    }

    setExporting(format);
    try {
      if (format === 'PDF') await exportPDF(reportData);
      else if (format === 'CSV') exportCSV(reportData);
      else if (format === 'DOCX') await exportDOCX(reportData);
      else if (format === 'EXCEL') await exportExcel(reportData);
      else if (format === 'PPTX') await exportPPTX(reportData);
    } catch (err) {
      console.error(`Export failed for ${format}:`, err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 font-sans shadow-lg">
      <div className="flex items-center justify-between mb-4 border-b border-[#F4A726]/10 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
            document compiler console
          </span>
          <h3 className="font-serif text-base font-black text-white uppercase tracking-tight mt-1">
            Export Intelligence Report
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* PDF (Free) */}
        <button
          onClick={() => handleExport('PDF')}
          disabled={exporting !== null}
          className="flex flex-col items-center justify-center p-4 bg-[#060D17] border border-red-500/30 hover:border-red-500/60 rounded transition-colors text-center text-xs group cursor-pointer"
        >
          <span className="text-xl select-none group-hover:scale-110 transition-transform mb-1">📄</span>
          <span className="font-bold text-white uppercase tracking-wide">Export PDF</span>
          <span className="text-[7.5px] font-mono text-gray-500 uppercase mt-1">free access</span>
        </button>

        {/* DOCX (PRO) */}
        <button
          onClick={() => handleExport('DOCX')}
          disabled={exporting !== null}
          className={`flex flex-col items-center justify-center p-4 bg-[#060D17] border hover:border-blue-500/60 rounded transition-colors text-center text-xs group cursor-pointer ${
            isPro ? 'border-blue-500/30' : 'border-gray-800 opacity-60'
          }`}
        >
          <span className="text-xl select-none group-hover:scale-110 transition-transform mb-1">📝</span>
          <span className="font-bold text-white uppercase tracking-wide">Export DOCX</span>
          <span className={`text-[7.5px] font-mono uppercase mt-1 ${isPro ? 'text-blue-400' : 'text-gold font-bold'}`}>
            {isPro ? 'unlocked' : 'PRO only'}
          </span>
        </button>

        {/* PPTX (PRO) */}
        <button
          onClick={() => handleExport('PPTX')}
          disabled={exporting !== null}
          className={`flex flex-col items-center justify-center p-4 bg-[#060D17] border hover:border-orange-500/60 rounded transition-colors text-center text-xs group cursor-pointer ${
            isPro ? 'border-orange-500/30' : 'border-gray-800 opacity-60'
          }`}
        >
          <span className="text-xl select-none group-hover:scale-110 transition-transform mb-1">📊</span>
          <span className="font-bold text-white uppercase tracking-wide">Export PPTX</span>
          <span className={`text-[7.5px] font-mono uppercase mt-1 ${isPro ? 'text-orange-400' : 'text-gold font-bold'}`}>
            {isPro ? 'unlocked' : 'PRO only'}
          </span>
        </button>

        {/* Excel (PRO) */}
        <button
          onClick={() => handleExport('EXCEL')}
          disabled={exporting !== null}
          className={`flex flex-col items-center justify-center p-4 bg-[#060D17] border hover:border-green-500/60 rounded transition-colors text-center text-xs group cursor-pointer ${
            isPro ? 'border-green-500/30' : 'border-gray-800 opacity-60'
          }`}
        >
          <span className="text-xl select-none group-hover:scale-110 transition-transform mb-1">📈</span>
          <span className="font-bold text-white uppercase tracking-wide">Export Excel</span>
          <span className={`text-[7.5px] font-mono uppercase mt-1 ${isPro ? 'text-green-400' : 'text-gold font-bold'}`}>
            {isPro ? 'unlocked' : 'PRO only'}
          </span>
        </button>

        {/* CSV (PRO) */}
        <button
          onClick={() => handleExport('CSV')}
          disabled={exporting !== null}
          className={`flex flex-col items-center justify-center p-4 bg-[#060D17] border hover:border-gray-400/60 rounded transition-colors text-center text-xs group cursor-pointer ${
            isPro ? 'border-gray-500/30' : 'border-gray-800 opacity-60'
          }`}
        >
          <span className="text-xl select-none group-hover:scale-110 transition-transform mb-1">🔗</span>
          <span className="font-bold text-white uppercase tracking-wide">Export CSV</span>
          <span className={`text-[7.5px] font-mono uppercase mt-1 ${isPro ? 'text-gray-400' : 'text-gold font-bold'}`}>
            {isPro ? 'unlocked' : 'PRO only'}
          </span>
        </button>
      </div>

      {exporting && (
        <div className="mt-3 text-center text-[10px] font-mono text-[#F4A726] animate-pulse">
          ⏳ Compiling and downloading {exporting} document packet...
        </div>
      )}
    </div>
  );
}
