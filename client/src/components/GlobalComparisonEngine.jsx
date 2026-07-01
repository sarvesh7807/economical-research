// client/src/components/GlobalComparisonEngine.jsx
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import AIRouter from '../ai/AIRouter';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import VerificationPanel from './research/VerificationPanel';

const COMPARISON_PRESETS = [
  { label: 'India vs China (Sovereign)', type: 'country', a: 'India', b: 'China' },
  { label: 'Tesla vs BYD (Corporate)', type: 'company', a: 'Tesla', b: 'BYD' },
  { label: 'Tech vs Finance (Sectors)', type: 'sector', a: 'Tech Sector', b: 'Financial Sector' }
];

export default function GlobalComparisonEngine({ setView }) {
  const [selectedType, setSelectedType] = useState('country'); // 'country' | 'company' | 'sector'
  const [itemA, setItemA] = useState('India');
  const [itemB, setItemB] = useState('China');
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  const handlePresetSelect = (preset) => {
    setSelectedType(preset.type);
    setItemA(preset.a);
    setItemB(preset.b);
    runComparison(preset.a, preset.b, preset.type);
  };

  // Compile Live Comparison
  const runComparison = async (nameA = itemA, nameB = itemB, type = selectedType) => {
    if (!nameA.trim() || !nameB.trim()) return;
    setLoading(true);
    setComparisonResult(null);

    try {
      const prompt = `You are a Lead Financial Economist. Generate a side-by-side comparative analysis of ${nameA} and ${nameB} (Type: ${type}).
      Return ONLY a valid JSON object matching this structure (no markdown fences, no comments):
      {
        "comparisonTable": [
          { "metric": "GDP Growth / Revenue Growth", "valueA": "7.20%", "valueB": "5.20%" },
          { "metric": "Inflation / Net Margin", "valueA": "4.80%", "valueB": "1.20%" },
          { "metric": "Debt Level / Total Debt", "valueA": "58% of GDP", "valueB": "82% of GDP" },
          { "metric": "Population / Market Share", "valueA": "1.42B", "valueB": "1.41B" }
        ],
        "aiSummary": "A highly detailed summary of the main divergences, competitive advantages, or sovereign risks.",
        "chartData": [
          { "label": "Q1", "valueA": 7.2, "valueB": 5.2 },
          { "label": "Q2", "valueA": 6.8, "valueB": 5.0 },
          { "label": "Q3", "valueA": 7.5, "valueB": 5.3 },
          { "label": "Q4", "valueA": 7.3, "valueB": 5.1 }
        ],
        "verification": {
          "primarySource": "World Bank / SEC Edgar",
          "conflictingSources": [
            { "source": "IMF Database", "valueA": "6.80%", "valueB": "4.90%", "confidence": 93 }
          ],
          "explanation": "Why calculations differ between calendar periods."
        }
      }`;

      const response = await AIRouter.route(prompt, 'research');
      let parsed = {};
      try {
        parsed = JSON.parse(response);
      } catch (err) {
        console.error('Failed to parse comparison JSON:', err);
      }

      setComparisonResult(parsed);

      // Auto-save to Research Memory (FEATURE 4)
      try {
        await addDoc(collection(db, 'er_research_reports'), {
          userId: 'guest',
          query: `Comparison: ${nameA} vs ${nameB}`,
          title: `Comparative: ${nameA} vs ${nameB}`,
          report: `Comparative Analysis for ${nameA} vs ${nameB}. Summary: ${parsed.aiSummary || ''}`,
          createdAt: new Date().toISOString(),
          isFavorite: false,
          tags: ['comparison', nameA.toLowerCase(), nameB.toLowerCase()]
        });
      } catch (fsErr) {
        console.error('Failed to auto-save comparison:', fsErr);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runComparison();
  }, []);

  // ECharts comparative chart options
  const getChartOptions = () => {
    if (!comparisonResult || !comparisonResult.chartData) return {};
    const labels = comparisonResult.chartData.map(c => c.label);
    const dataA = comparisonResult.chartData.map(c => c.valueA);
    const dataB = comparisonResult.chartData.map(c => c.valueB);

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { textStyle: { color: '#9CA3AF' }, bottom: '0' },
      xAxis: { type: 'category', data: labels, axisLabel: { color: '#9CA3AF' } },
      yAxis: { type: 'value', axisLabel: { color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#142B47' } } },
      series: [
        {
          name: itemA,
          type: 'bar',
          data: dataA,
          itemStyle: { color: '#F4A726' }
        },
        {
          name: itemB,
          type: 'bar',
          data: dataB,
          itemStyle: { color: '#3B82F6' }
        }
      ]
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      
      {/* Title */}
      <div className="border-b border-[#F4A726]/10 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
            sovereign & corporate arbitrage engine
          </span>
          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
            Global Comparison Engine
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Side-by-side comparative ledger covering countries, enterprises, sectors, and currencies with multi-source discrepancy verification.
          </p>
        </div>
      </div>

      {/* Presets Bar */}
      <div className="flex flex-wrap gap-2 items-center border-b border-white/5 pb-4">
        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mr-2">Presets:</span>
        {COMPARISON_PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handlePresetSelect(p)}
            className="px-3.5 py-1.5 bg-[#0A1628] hover:bg-[#F4A726]/10 border border-white/5 hover:border-[#F4A726]/20 rounded text-[10px] uppercase font-mono font-bold tracking-wide transition-all cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Inputs bar */}
      <div className="bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-5 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-lg">
        <div className="flex gap-4 items-center flex-wrap flex-grow">
          {/* Comparison Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono text-gray-500 uppercase">Comparison type</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-[#060D17] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4A726]/40"
            >
              <option value="country">Country vs Country</option>
              <option value="company">Company vs Company</option>
              <option value="sector">Sector vs Sector</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Input A */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono text-gray-500 uppercase">Asset A</label>
              <input 
                type="text"
                placeholder="India..."
                value={itemA}
                onChange={e => setItemA(e.target.value)}
                className="bg-[#060D17] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4A726]/40"
              />
            </div>
            
            <span className="text-[#F4A726] font-mono text-xs pt-4 font-bold select-none">VS</span>

            {/* Input B */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono text-gray-500 uppercase">Asset B</label>
              <input 
                type="text"
                placeholder="China..."
                value={itemB}
                onChange={e => setItemB(e.target.value)}
                className="bg-[#060D17] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4A726]/40"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => runComparison()}
          disabled={loading || !itemA.trim() || !itemB.trim()}
          className="bg-[#F4A726] hover:bg-[#D48E19] text-navy font-bold px-6 py-3 rounded text-xs uppercase tracking-wide transition-colors shrink-0 cursor-pointer w-full sm:w-auto"
        >
          {loading ? '⚖️ Comparing...' : '⚖️ Compare Assets'}
        </button>
      </div>

      {/* Results view */}
      {loading ? (
        <div className="text-center py-20 text-[11px] font-mono text-[#F4A726] uppercase tracking-widest animate-pulse">
          ⏳ Arbitraging sovereign records...
        </div>
      ) : comparisonResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          
          {/* Left/Middle: Table and Charts */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Side-by-Side Table */}
            <div className="bg-[#0A1628] border border-white/5 rounded-lg p-5">
              <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wide border-b border-white/5 pb-2 mb-3">
                Metrics Arbitrage Ledger
              </h3>
              
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] font-mono text-gray-400 uppercase">
                    <th className="p-2">Comparative Metric</th>
                    <th className="p-2 text-[#F4A726]">{itemA}</th>
                    <th className="p-2 text-blue-400">{itemB}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonResult.comparisonTable?.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="p-3 font-medium text-gray-300">{row.metric}</td>
                      <td className="p-3 font-mono font-bold text-white">{row.valueA}</td>
                      <td className="p-3 font-mono font-bold text-white">{row.valueB}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI Summary */}
            <div className="bg-[#0A1628]/40 border border-white/5 rounded-lg p-5 space-y-2">
              <h3 className="text-xs font-mono font-bold text-[#F4A726] uppercase tracking-wide">
                AI Arbitrage Commentary
              </h3>
              <p className="text-xs text-gray-300 font-serif leading-relaxed">
                {comparisonResult.aiSummary}
              </p>
            </div>

          </div>

          {/* Right: EChart & Verification Layer */}
          <div className="space-y-6">
            {/* Chart */}
            <div className="bg-[#0A1628] border border-white/5 rounded-lg p-5 min-h-[260px] flex flex-col justify-center">
              <ReactECharts 
                option={getChartOptions()} 
                style={{ height: '220px', width: '100%' }} 
                theme="dark"
                lazyUpdate={true}
              />
            </div>

            {/* Verification Panel (FEATURE 8 & 9) */}
            {comparisonResult.verification && (
              <VerificationPanel 
                statistic="Comparative Spread Discrepancies"
                primaryValue={comparisonResult.comparisonTable?.[0]?.valueA || '7.20%'}
                primarySource={comparisonResult.verification.primarySource}
                publishedDate="2026-02-15"
                conflictingSources={
                  comparisonResult.verification.conflictingSources?.map(c => ({
                    source: c.source,
                    value: `A: ${c.valueA} / B: ${c.valueB}`,
                    confidence: c.confidence
                  })) || []
                }
              />
            )}
          </div>

        </div>
      ) : null}

    </div>
  );
}
