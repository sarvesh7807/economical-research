// client/src/components/ForecastingPage.jsx
import React, { useState, useEffect } from 'react';
import { callGeminiWithRotation } from '../utils/GeminiRotator';
import { useAuth } from '../contexts/AuthContext';
import { trackUserResearch } from '../utils/LearningTracker';

const COUNTRIES = ['India', 'United States', 'China', 'Japan', 'Germany', 'United Kingdom', 'France', 'Brazil'];
const INDICATORS = [
  { id: 'gdp', name: 'GDP Growth' },
  { id: 'inflation', name: 'Inflation Rate' },
  { id: 'interest_rate', name: 'Interest Rate' },
  { id: 'currency', name: 'Currency Forecast' }
];

export default function ForecastingPage({ setView }) {
  const { user } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedIndicator, setSelectedIndicator] = useState(INDICATORS[0]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastText, setForecastText] = useState('');
  const [parsedForecast, setParsedForecast] = useState(null);
  
  // Recession States
  const [recessionLoading, setRecessionLoading] = useState(false);
  const [recessionData, setRecessionData] = useState(null);
  const [recessionRaw, setRecessionRaw] = useState('');

  // Tab state for forecast periods
  const [activePeriodTab, setActivePeriodTab] = useState('3m');

  const runForecast = async () => {
    setForecastLoading(true);
    setForecastText('');
    setParsedForecast(null);

    const prompt = `
    You are Economical Research AI.
    Generate a professional economic forecast for:
    Country: ${selectedCountry}
    Indicator: ${selectedIndicator.name}
    
    Provide:
    
    ## Current State (2025-2026)
    [Current value and trend]
    
    ## 3-Month Forecast
    Base Case: [value] [brief reason]
    Bull Case: [value] [reason]
    Bear Case: [value] [reason]
    
    ## 6-Month Forecast
    Base Case: [value] [brief reason]
    Bull Case: [value] [reason]
    Bear Case: [value] [reason]
    
    ## 12-Month Forecast
    Base Case: [value] [brief reason]
    Bull Case: [value] [reason]
    Bear Case: [value] [reason]
    
    ## Key Risks to Watch
    [3 main risks]
    
    ## Confidence Score
    [0-100%] - [reason for confidence level]
    
    DISCLAIMER: "This is AI-generated forecast for educational purposes only. Not financial advice. Consult a professional advisor."
    
    Write as Economical Research AI. Never mention Gemini or Google.

    IMPORTANT: At the very end of your response, output a raw JSON block enclosed between \`\`\`json and \`\`\` containing the parsed values so we can draw cards. Example:
    \`\`\`json
    {
      "threeMonth": {
        "base": { "val": "6.8%", "reason": "Reason details" },
        "bull": { "val": "7.2%", "reason": "Reason details" },
        "bear": { "val": "6.0%", "reason": "Reason details" }
      },
      "sixMonth": {
        "base": { "val": "6.7%", "reason": "Reason details" },
        "bull": { "val": "7.0%", "reason": "Reason details" },
        "bear": { "val": "5.8%", "reason": "Reason details" }
      },
      "twelveMonth": {
        "base": { "val": "6.5%", "reason": "Reason details" },
        "bull": { "val": "6.9%", "reason": "Reason details" },
        "bear": { "val": "5.5%", "reason": "Reason details" }
      }
    }
    \`\`\`
    `;

    try {
      const response = await callGeminiWithRotation(prompt);
      setForecastText(response);
      
      // Attempt to parse JSON block
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          setParsedForecast(parsed);
        } catch (e) {
          console.error("Failed to parse forecast JSON block:", e);
        }
      }

      if (user) {
        try {
          await trackUserResearch(user.uid, `${selectedCountry} ${selectedIndicator.name}`);
        } catch (err) {
          console.error('Failed to track forecast research:', err);
        }
      }
    } catch (err) {
      console.error(err);
      setForecastText('Failed to generate forecast. Please try again.');
    } finally {
      setForecastLoading(false);
    }
  };

  const calculateRecession = async () => {
    setRecessionLoading(true);
    setRecessionData(null);
    setRecessionRaw('');

    const prompt = `
    You are Economical Research AI.
    Analyze recession probability for: ${selectedCountry}
    
    Based on economic indicators:
    - GDP growth trends
    - Yield curve status
    - Unemployment trends
    - Inflation trajectory
    - Consumer confidence
    - Manufacturing PMI
    
    Provide:
    Recession Probability: [0-100%]
    Time Horizon: [next 12 months]
    Key Indicators: [3 main factors]
    Historical Context: [similar past periods]
    ER Assessment: [brief verdict]

    IMPORTANT: At the very end of your response, output a raw JSON block enclosed between \`\`\`json and \`\`\` containing the parsed values. Example:
    \`\`\`json
    {
      "probability": 45,
      "horizon": "Next 12 months",
      "indicators": ["Inverted yield curve", "Slowing PMI", "Rising inflation"],
      "assessment": "Moderate risk of downturn in H2."
    }
    \`\`\`
    `;

    try {
      const response = await callGeminiWithRotation(prompt);
      setRecessionRaw(response);

      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          setRecessionData(parsed);
        } catch (e) {
          console.error("Failed to parse recession JSON block:", e);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecessionLoading(false);
    }
  };

  useEffect(() => {
    runForecast();
  }, [selectedCountry, selectedIndicator]);

  useEffect(() => {
    calculateRecession();
  }, [selectedCountry]);

  // Color helper for probability
  const getRiskColor = (prob) => {
    if (prob <= 25) return { color: '#00C896', text: 'Low Risk' };
    if (prob <= 50) return { color: '#F4A726', text: 'Moderate Risk' };
    if (prob <= 75) return { color: '#FF7A00', text: 'High Risk' };
    return { color: '#FF3B30', text: 'Very High Risk' };
  };

  const activePeriodData = parsedForecast ? (
    activePeriodTab === '3m' ? parsedForecast.threeMonth :
    activePeriodTab === '6m' ? parsedForecast.sixMonth :
    parsedForecast.twelveMonth
  ) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      
      {/* Header */}
      <div className="border-b border-[#F4A726]/10 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
            macroeconomic modeling platform
          </span>
          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
            AI Economic Forecasting
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            AI-modeled three-case trajectories (Bull, Base, Bear) and real-time Recession Risk Probability metrics.
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-4 items-center justify-between border-b border-white/5 pb-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-[10px] uppercase font-mono text-gray-500 block mb-1">Select Country</label>
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              className="bg-[#0A1628] border border-white/10 rounded px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
            >
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-gray-500 block mb-1">Select Indicator</label>
            <div className="flex gap-2">
              {INDICATORS.map(ind => (
                <button
                  key={ind.id}
                  onClick={() => setSelectedIndicator(ind)}
                  className={`px-3 py-1.5 border rounded text-xs transition-colors cursor-pointer ${
                    selectedIndicator.id === ind.id
                      ? 'bg-[#F4A726] border-[#F4A726] text-navy font-bold'
                      : 'bg-[#0A1628] border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {ind.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={runForecast}
          className="px-4 py-2 bg-navy text-gold hover:bg-navy-light border border-gold/30 rounded text-xs uppercase font-mono font-bold tracking-wider cursor-pointer"
        >
          ⚡ Refresh Forecast
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3 width) - Forecasting */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0A1628] border border-white/5 rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-serif font-black uppercase text-white border-b border-white/5 pb-2">
              AI Forecast Dashboard: {selectedIndicator.name} ({selectedCountry})
            </h2>

            {forecastLoading ? (
              <div className="space-y-6 animate-pulse py-8 text-center text-gray-500">
                <div className="h-6 bg-gray-800 rounded w-1/4 mx-auto"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2 mx-auto"></div>
                <div className="h-20 bg-gray-850 rounded"></div>
                <span>⚡ Generating macro-indicators forecast models...</span>
              </div>
            ) : (
              <>
                {/* Period Tab Selectors */}
                {parsedForecast && (
                  <div className="flex gap-2 border-b border-white/5 pb-3">
                    {[
                      { id: '3m', label: '3-Month Horizon' },
                      { id: '6m', label: '6-Month Horizon' },
                      { id: '12m', label: '12-Month Horizon' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActivePeriodTab(tab.id)}
                        className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded cursor-pointer transition-colors ${
                          activePeriodTab === tab.id
                            ? 'bg-[#F4A726]/10 border border-[#F4A726] text-[#F4A726]'
                            : 'bg-transparent text-gray-400 hover:text-white border border-transparent'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Period Cards */}
                {activePeriodData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Bull Case */}
                    <div style={{
                      background: 'rgba(0,200,150,0.05)',
                      border: '1px solid rgba(0,200,150,0.3)',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <span className="text-[9px] font-mono font-bold text-[#00C896] uppercase tracking-widest block mb-1">🐂 Bull Case</span>
                      <p className="text-xl font-bold text-[#00C896]">{activePeriodData.bull?.val || 'N/A'}</p>
                      <p className="text-xs text-gray-300 mt-2 font-serif leading-relaxed">{activePeriodData.bull?.reason || ''}</p>
                    </div>

                    {/* Base Case */}
                    <div style={{
                      background: 'rgba(244,167,38,0.05)',
                      border: '1px solid rgba(244,167,38,0.3)',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <span className="text-[9px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">⚖️ Base Case</span>
                      <p className="text-xl font-bold text-[#F4A726]">{activePeriodData.base?.val || 'N/A'}</p>
                      <p className="text-xs text-gray-300 mt-2 font-serif leading-relaxed">{activePeriodData.base?.reason || ''}</p>
                    </div>

                    {/* Bear Case */}
                    <div style={{
                      background: 'rgba(255,59,48,0.05)',
                      border: '1px solid rgba(255,59,48,0.3)',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <span className="text-[9px] font-mono font-bold text-[#FF3B30] uppercase tracking-widest block mb-1">🐻 Bear Case</span>
                      <p className="text-xl font-bold text-[#FF3B30]">{activePeriodData.bear?.val || 'N/A'}</p>
                      <p className="text-xs text-gray-300 mt-2 font-serif leading-relaxed">{activePeriodData.bear?.reason || ''}</p>
                    </div>
                  </div>
                )}

                {/* Raw Forecast Text */}
                <div className="prose prose-invert text-xs text-gray-300 font-serif leading-relaxed max-w-none space-y-4 pt-4 border-t border-white/5">
                  {forecastText.replace(/```json[\s\S]*?```/, '').split('\n').map((line, i) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={i} className="text-xl font-bold font-serif text-white uppercase pt-4 border-b border-white/5 pb-1">{line.slice(2)}</h1>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={i} className="text-base font-bold font-serif text-[#F4A726] uppercase pt-3">{line.slice(3)}</h2>;
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={i} className="text-sm font-bold text-white uppercase pt-2">{line.slice(4)}</h3>;
                    }
                    return <p key={i} className="leading-relaxed">{line}</p>;
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column (1/3 width) - Recession Probability Engine */}
        <div className="space-y-6">
          <div className="bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-6 space-y-6 shadow">
            <div>
              <span className="text-[9px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
                forecasting desk engine
              </span>
              <h2 className="font-serif text-xl font-black uppercase text-white border-b border-white/5 pb-2">
                Recession Risk Indicator
              </h2>
            </div>

            {recessionLoading ? (
              <div className="py-12 text-center text-gray-500 animate-pulse text-xs font-mono">
                ⚡ Calculating recession probability via indicators...
              </div>
            ) : recessionData ? (
              <div className="space-y-6">
                {/* Visual Gauge */}
                <div className="flex flex-col items-center justify-center py-4 bg-[#060D17] border border-white/5 rounded-lg">
                  {/* Arc Gauge */}
                  <div className="relative w-36 h-20 flex items-center justify-center overflow-hidden">
                    <svg className="w-full h-full transform translate-y-3" viewBox="0 0 100 50">
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#222"
                        strokeWidth="10"
                      />
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke={getRiskColor(recessionData.probability).color}
                        strokeWidth="10"
                        strokeDasharray="125"
                        strokeDashoffset={125 - (125 * recessionData.probability) / 100}
                      />
                    </svg>
                    <div className="absolute bottom-0 text-center">
                      <span className="text-3xl font-black tracking-tight" style={{ color: getRiskColor(recessionData.probability).color }}>
                        {recessionData.probability}%
                      </span>
                      <span className="text-[10px] font-mono block uppercase text-gray-400 mt-0.5">
                        {getRiskColor(recessionData.probability).text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase block">Time Horizon</span>
                    <span className="text-gray-300 font-bold font-mono">{recessionData.horizon || 'Next 12 months'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase block">Key Indicators Analyzed</span>
                    <ul className="list-disc list-inside text-gray-300 mt-1 space-y-1">
                      {recessionData.indicators?.map((ind, i) => (
                        <li key={i}>{ind}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase block">ER Risk Assessment</span>
                    <p className="text-gray-300 font-serif leading-relaxed mt-1">
                      {recessionData.assessment}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <button
                  onClick={calculateRecession}
                  className="px-4 py-2 bg-[#F4A726] text-navy border-none rounded font-bold text-xs uppercase cursor-pointer"
                >
                  Calculate Recession Risk
                </button>
              </div>
            )}

            {recessionRaw && (
              <details className="text-xs border-t border-white/5 pt-4">
                <summary className="cursor-pointer text-gray-400 font-mono text-[10px] uppercase select-none">View full analysis report</summary>
                <div className="text-gray-300 mt-3 font-serif leading-relaxed space-y-2 whitespace-pre-wrap">
                  {recessionRaw.replace(/```json[\s\S]*?```/, '')}
                </div>
              </details>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
