// client/src/components/InteractiveCharts.jsx
import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { callGemini } from '../utils/geminiCaller';

const CHART_COLORS = [
  '#F4A726', // Gold
  '#00C896', // Emerald Green
  '#4FC3F7', // Sky Blue
  '#FF5252', // Red
  '#CE93D8', // Purple
  '#80CBC4', // Teal
  '#FF7043', // Orange
  '#D4E157'  // Lime
];

const AVAILABLE_COUNTRIES = [
  'India', 'China', 'USA', 'Japan', 'Germany', 'United Kingdom', 'France', 'Brazil'
];

export default function InteractiveCharts() {
  const [chartType, setChartType] = useState('line');
  const [selectedIndicator, setSelectedIndicator] = useState('gdp');
  const [selectedCountries, setSelectedCountries] = useState(['India', 'China', 'USA']);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const indicators = [
    { id: 'gdp', label: 'GDP Growth (%)' },
    { id: 'inflation', label: 'Inflation (%)' },
    { id: 'unemployment', label: 'Unemployment (%)' },
    { id: 'debt', label: 'Debt to GDP (%)' },
    { id: 'trade', label: 'Trade Balance (USD Bn)' }
  ];

  const handleCountryToggle = (country) => {
    if (selectedCountries.includes(country)) {
      if (selectedCountries.length > 1) {
        setSelectedCountries(selectedCountries.filter(c => c !== country));
      }
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  const generateChartData = async () => {
    setLoading(true);
    try {
      const prompt = `
      You are Economical Research AI.
      Generate realistic historical economic data for chart visualization.
      
      Countries: ${selectedCountries.join(', ')}
      Indicator: ${selectedIndicator} (Label: ${indicators.find(i => i.id === selectedIndicator)?.label})
      Years: 2015 to 2026
      
      Return ONLY a valid JSON array of objects representing each year. No explanation, no markdown wraps.
      Example structure:
      [
        {
          "year": "2015",
          "India": 7.4,
          "China": 6.9,
          "USA": 2.9
        }
      ]
      
      Use realistic, accurate historical and estimated data.
      No explanation or text outside of the JSON array.
      `;

      const response = await Promise.race([
        callGemini(prompt, 2000),
        new Promise(resolve => 
          setTimeout(() => resolve(null), 45000)
        )
      ]);
      
      if (!response) {
        throw new Error('Service busy or timed out');
      }
      
      // Extract array from markdown codeblock if present
      const cleaned = response
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        setChartData(JSON.parse(match[0]));
      } else {
        console.error('Could not find JSON array in response:', response);
      }
    } catch (e) {
      console.error('Chart data error:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!chartData || !chartData.length) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '80px 24px',
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '13px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Select countries and indicators, then trigger ledger generation
        </div>
      );
    }

    const dataKeys = selectedCountries;
    const chartHeight = window.innerWidth < 768 ? 250 : 400;
    let chartElement = null;

    switch (chartType) {
      case 'line':
        chartElement = (
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={11} fontFamily="IBM Plex Mono, monospace" dy={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} fontFamily="IBM Plex Mono, monospace" dx={-5} />
            <Tooltip
              contentStyle={{
                background: '#0A1628',
                border: '1px solid rgba(244,167,38,0.3)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontFamily: 'Inter, sans-serif' }} />
            {dataKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
        break;

      case 'bar':
        chartElement = (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={11} fontFamily="IBM Plex Mono, monospace" dy={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} fontFamily="IBM Plex Mono, monospace" dx={-5} />
            <Tooltip
              contentStyle={{
                background: '#0A1628',
                border: '1px solid rgba(244,167,38,0.3)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontFamily: 'Inter, sans-serif' }} />
            {dataKeys.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );
        break;

      case 'area':
        chartElement = (
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              {dataKeys.map((key, i) => (
                <linearGradient key={key} id={`gradient${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={11} fontFamily="IBM Plex Mono, monospace" dy={10} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} fontFamily="IBM Plex Mono, monospace" dx={-5} />
            <Tooltip
              contentStyle={{
                background: '#0A1628',
                border: '1px solid rgba(244,167,38,0.3)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontFamily: 'Inter, sans-serif' }} />
            {dataKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                fill={`url(#gradient${i})`}
                strokeWidth={2.5}
              />
            ))}
          </AreaChart>
        );
        break;

      default:
        return null;
    }

    return (
      <div style={{
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden'
      }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          {chartElement}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)] charts-page">
      {/* Title Header */}
      <div className="border-b border-[#F4A726]/10 pb-5">
        <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
          macroeconomic comparative tool
        </span>
        <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
          📊 Interactive Economic Charts
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
          Compare core financial indicators across multiple global regions with AI-curated historical datastreams.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Setup Control Panel */}
        <div className="space-y-6">
          <div className="bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-5 shadow-lg space-y-5">
            <h3 className="text-xs font-mono font-bold text-[#F4A726] uppercase tracking-wider border-b border-[#F4A726]/10 pb-2">
              Parameters
            </h3>

            {/* Select Indicator */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wide block">Indicator</label>
              <select
                value={selectedIndicator}
                onChange={e => setSelectedIndicator(e.target.value)}
                className="w-full bg-[#060D17] border border-white/10 rounded px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#F4A726]/40 transition-colors cursor-pointer"
              >
                {indicators.map(ind => (
                  <option key={ind.id} value={ind.id}>
                    {ind.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Chart Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wide block">Chart Type</label>
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '16px'
              }}>
                {['line', 'bar', 'area'].map(type => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      background: chartType === type
                        ? '#F4A726'
                        : 'rgba(26,58,92,0.5)',
                      border: `1px solid ${chartType === type ? '#F4A726' : 'rgba(244,167,38,0.2)'}`,
                      color: chartType === type ? '#0A1628' : '#fff',
                      fontWeight: '700'
                    }}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Countries check group */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wide block">Regions (Select 1+)</label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '16px'
              }}>
                {AVAILABLE_COUNTRIES.map(country => {
                  const isChecked = selectedCountries.includes(country);
                  return (
                    <button
                      key={country}
                      onClick={() => handleCountryToggle(country)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        background: isChecked
                          ? 'rgba(244,167,38,0.2)'
                          : 'rgba(26,58,92,0.5)',
                        border: `1px solid ${isChecked ? '#F4A726' : 'rgba(244,167,38,0.15)'}`,
                        color: isChecked ? '#F4A726' : '#fff',
                        fontWeight: '600'
                      }}
                    >
                      {country}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trigger Button */}
            <button
              onClick={generateChartData}
              disabled={loading}
              className="w-full bg-[#F4A726] hover:bg-[#D48E19] disabled:bg-gray-700 text-[#0A1628] disabled:text-gray-400 py-3 rounded font-mono font-bold text-xs uppercase tracking-wide transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Rendering...' : '📈 Generate Chart'}
            </button>
          </div>
        </div>

        {/* Right Side: Recharts Plot Display */}
        <div className="lg:col-span-3">
          <div className="bg-[#0A1628]/40 border border-white/5 rounded-lg p-6 min-h-[460px] flex flex-col justify-center items-center relative overflow-hidden chart-container">
            {/* Background elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F4A726]/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {loading ? (
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4A726] mx-auto"></div>
                <p className="text-xs font-mono text-[#F4A726] uppercase tracking-widest animate-pulse">
                  Assembling Datastreams via AI Broker...
                </p>
              </div>
            ) : (
              <div className="w-full">
                {chartData && chartData.length > 0 && (
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                      Ledger: {indicators.find(i => i.id === selectedIndicator)?.label} (2015-2026)
                    </span>
                    <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 font-mono">
                      Scale: Annual
                    </span>
                  </div>
                )}
                {renderChart()}
              </div>
            )}
          </div>

          <p className="text-[10px] font-mono text-gray-500 text-center mt-4">
            * All data is retrieved from historical and forecast simulations of Economical Research AI model outputs.
          </p>
        </div>
      </div>
    </div>
  );
}
