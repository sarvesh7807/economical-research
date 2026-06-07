import React, { useState, useEffect } from 'react';
import { ShieldAlert, FileText, CheckCircle, RefreshCw, X, Printer, Copy, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ResearchMode({ topic, onClose }) {
  const { subscription } = useAuth();
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const steps = [
    'Initializing editorial research query...',
    'Scanning global NewsAPI index feeds...',
    'Extracting semantic core indices...',
    'Resolving macro-economic parameters...',
    'Synthesizing fact ledger validations...',
    'Compiling premium intelligence briefing...'
  ];

  useEffect(() => {
    let stepInterval;
    if (loading) {
      stepInterval = setInterval(() => {
        setStep(prev => {
          if (prev < steps.length - 1) return prev + 1;
          return prev;
        });
      }, 2000);
    }
    return () => clearInterval(stepInterval);
  }, [loading]);

  useEffect(() => {
    if (!topic) return;

    setLoading(true);
    setStep(0);
    setError(null);

    fetch('/api/ai/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    })
      .then(res => {
        if (!res.ok) throw new Error('Research compilation failed');
        return res.json();
      })
      .then(data => {
        setReport(data.report);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('The research compiler encountered an error. Please verify server connectivity.');
        setLoading(false);
      });
  }, [topic]);

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>ER DEEP RESEARCH: ${topic.toUpperCase()}</title>
          <style>
            body { font-family: Georgia, serif; line-height: 1.6; padding: 40px; color: #0A1628; }
            h1, h2, h3 { font-family: Arial, sans-serif; color: #0A1628; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            pre { background: #f4f4f4; padding: 15px; border-left: 3px solid #F4A726; }
          </style>
        </head>
        <body>
          <div style="text-align: center; border-bottom: 3px double #0A1628; padding-bottom: 10px; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">ECONOMICAL RESEARCH</h1>
            <p style="margin: 5px 0 0 0; font-size: 10px; font-style: italic; letter-spacing: 3px; text-transform: uppercase;">Your World. Your News. Researched.</p>
          </div>
          <div>
            ${report.replace(/\n/g, '<br/>').replace(/# (.*)/g, '<h1>$1</h1>').replace(/## (.*)/g, '<h2>$1</h2>').replace(/### (.*)/g, '<h3>$1</h3>')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div class="fixed inset-0 bg-navy/80 dark:bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div class="bg-white dark:bg-paper-cardDark border border-gold/30 w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div class="bg-navy text-white px-5 py-3.5 flex items-center justify-between border-b border-gold/20 shrink-0">
          <div class="flex items-center gap-2">
            <FileText size={16} class="text-gold" />
            <h3 class="font-serif text-sm font-black uppercase tracking-wider text-gold">ER Research Terminal</h3>
          </div>
          <button onClick={onClose} class="text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div class="flex-grow overflow-y-auto p-6 bg-paper dark:bg-paper-dark">
          {loading ? (
            /* Loading / Compiling Screen */
            <div class="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <RefreshCw size={40} class="text-gold animate-spin" />
              <div class="space-y-2 max-w-sm">
                <h4 class="font-serif text-base font-bold text-navy dark:text-gold uppercase tracking-wide">Compiling Intelligence Report</h4>
                <p class="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest animate-pulse h-8">
                  Step {step + 1}/{steps.length}: {steps[step]}
                </p>
              </div>

              {/* Progress Bar */}
              <div class="w-64 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gold transition-all duration-1000" 
                  style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : error ? (
            /* Error Screen */
            <div class="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <AlertTriangle size={48} class="text-red-500 animate-bounce" />
              <h4 class="font-serif text-lg font-bold text-navy dark:text-white">Compilation Disrupted</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
              <button 
                onClick={onClose}
                class="px-4 py-2 bg-navy text-gold font-bold text-xs uppercase rounded hover:bg-navy-light"
              >
                Close Terminal
              </button>
            </div>
          ) : (
            /* Report Rendered Screen */
            <div class="space-y-6 font-serif">
              {/* Top Controls bar */}
              <div class="flex justify-end gap-3 border-b border-gray-200 dark:border-gray-800 pb-3 shrink-0">
                <button
                  onClick={handleCopy}
                  class="inline-flex items-center gap-1 px-3 py-1.5 border border-paper-border dark:border-paper-borderDark text-[10px] font-bold text-navy dark:text-gray-300 hover:border-gold hover:text-gold uppercase rounded bg-white dark:bg-paper-cardDark transition-colors"
                >
                  <Copy size={11} />
                  <span>{copySuccess ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  class="inline-flex items-center gap-1 px-3 py-1.5 border border-paper-border dark:border-paper-borderDark text-[10px] font-bold text-navy dark:text-gray-300 hover:border-gold hover:text-gold uppercase rounded bg-white dark:bg-paper-cardDark transition-colors"
                >
                  <Printer size={11} />
                  <span>Print Dispatch</span>
                </button>
              </div>

              {/* Markdown Render Container */}
              <div class="prose dark:prose-invert max-w-none text-navy dark:text-gray-250 leading-relaxed text-sm p-6 bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded shadow-sm">
                <div class="border-double-bottom-navy pb-3 mb-6 text-center">
                  <span class="text-[9px] font-mono font-bold text-gold uppercase tracking-widest">
                    ✦ ECONOMICAL RESEARCH PLATFORM DISPATCH ✦
                  </span>
                </div>
                
                {/* Simplified markdown display */}
                <div class="markdown-preview whitespace-pre-line font-serif space-y-4">
                  {report}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div class="bg-gray-50 dark:bg-paper-dark border-t border-paper-border dark:border-paper-borderDark px-5 py-3 flex justify-between items-center text-[10px] font-semibold text-gray-400 font-sans">
          <span>CLASSIFICATION: CONFIDENTIAL BRIEF</span>
          <span>© ECONOMICAL RESEARCH CORP.</span>
        </div>
      </div>
    </div>
  );
}
