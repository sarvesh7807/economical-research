import React, { useState, useEffect } from 'react';
import { callGemini, parseGeminiJSON } from '../utils/geminiCaller';

export default function GlobalCrisisMonitor({ theme }) {
  const [crises, setCrises] = useState([]);
  const [selectedCrisis, setSelectedCrisis] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const isLight = theme === 'light';

  // Custom CSS variables mapped to theme
  const bgPrimary = isLight ? '#FFFFFF' : '#0A1628';
  const bgSecondary = isLight ? '#F5F7FA' : 'rgba(26,58,92,0.4)';
  const borderCol = isLight ? 'rgba(10,22,40,0.1)' : 'rgba(244,167,38,0.2)';
  const textPrimary = isLight ? '#0A1628' : '#FFFFFF';
  const textMuted = isLight ? 'rgba(10,22,40,0.6)' : 'rgba(255,255,255,0.5)';
  const cardBgDefault = isLight ? '#F0F4F8' : 'rgba(26,58,92,0.4)';
  const cardBgSelected = isLight ? 'rgba(244,167,38,0.15)' : 'rgba(244,167,38,0.1)';

  const loadCurrentCrises = async () => {
    setLoadingList(true);
    
    try {
      const result = await Promise.race([
        callGemini(`
      List current global economic and geopolitical crises as of 2025-2026.
      
      Return ONLY JSON:
      [
        {
          "id": "1",
          "name": "Crisis name",
          "region": "Region/Country",
          "severity": "Critical/High/Medium/Low",
          "type": "Economic/Geopolitical/Financial/Climate",
          "brief": "One sentence description"
        }
      ]
      
      Include 8-10 current crises.
      Only JSON, no text outside.
      `, 800),
        new Promise(resolve => 
          setTimeout(() => resolve(null), 45000)
        )
      ]);
      
      const parsed = parseGeminiJSON(result);
      if (parsed && Array.isArray(parsed)) {
        setCrises(parsed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadCurrentCrises();
  }, []);

  const analyzeCrisis = async (crisis) => {
    setSelectedCrisis(crisis);
    setAnalysis('');
    setLoading(true);
    
    try {
      const result = await Promise.race([
        callGemini(`
      You are Economical Research AI.
      Generate COMPREHENSIVE crisis analysis for:
      Crisis: ${crisis.name}
      Region: ${crisis.region}
      Type: ${crisis.type}
      Severity: ${crisis.severity}
      
      ## Crisis Background & Timeline
      [Detailed history and how crisis developed]
      [3-4 paragraphs]
      
      ## Current Situation (2025-2026)
      [Current state of the crisis]
      [3 paragraphs]
      
      ## Economic Impact Analysis
      [Detailed economic consequences]
      [3-4 paragraphs]
      
      ## Market & Investment Implications
      [Stock markets, bonds, currencies, commodities]
      [3 paragraphs]
      
      ## Affected Countries & Regions
      [Detailed analysis of who is most impacted]
      [2-3 paragraphs]
      
      ## International Response
      [What world leaders, UN, IMF are doing]
      [2 paragraphs]
      
      ## Humanitarian Impact
      [Human cost and social consequences]
      [2 paragraphs]
      
      ## Resolution Scenarios
      Best case: [detailed]
      Most likely: [detailed]
      Worst case: [detailed]
      Timeline: [assessment]
      [3-4 paragraphs]
      
      ## ER Crisis Assessment
      Severity: ${crisis.severity}
      Economic Impact Score: [0-100]
      Resolution Probability (12mo): [0-100]%
      [3-4 paragraph comprehensive verdict]
      
      Write 900-1100 words minimum.
      Never mention Gemini.
      `, 3500),
        new Promise(resolve => 
          setTimeout(() => resolve(null), 45000)
        )
      ]);
      
      setAnalysis(result || 'Service busy. Please try again in 2 minutes.');
    } catch (e) {
      console.error(e);
      setAnalysis('Error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const getSeverityColor = (severity) => {
    if (severity === 'Critical') return '#FF5252';
    if (severity === 'High') return '#FF9800';
    if (severity === 'Medium') return '#FFC107';
    return '#00C896';
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      background: bgPrimary,
      minHeight: 'calc(100vh - 140px)',
      color: textPrimary,
      fontFamily: 'Inter, sans-serif'
    }}>
      <h1 style={{
        fontFamily: 'Playfair Display, serif',
        color: textPrimary,
        fontSize: '28px',
        marginBottom: '8px'
      }}>
        🚨 Global Crisis Monitor
      </h1>
      <p style={{
        color: textMuted,
        marginBottom: '24px'
      }}>
        Real-time monitoring of global economic and geopolitical crises
      </p>

      {loadingList ? (
        <p style={{color: '#F4A726', fontWeight: 'bold'}}>
          ⏳ Loading current crises...
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
          marginBottom: '32px'
        }}>
          {crises.map(crisis => (
            <div key={crisis.id}
              onClick={() => analyzeCrisis(crisis)}
              style={{
                background: selectedCrisis?.id === crisis.id
                  ? cardBgSelected
                  : cardBgDefault,
                border: `1px solid ${
                  selectedCrisis?.id === crisis.id
                    ? '#F4A726'
                    : getSeverityColor(crisis.severity)
                }30`,
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{
                  background: `${getSeverityColor(crisis.severity)}20`,
                  color: getSeverityColor(crisis.severity),
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  {crisis.severity}
                </span>
                <span style={{
                  color: textMuted,
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  {crisis.type}
                </span>
              </div>
              <h3 style={{
                color: textPrimary,
                fontSize: '15px',
                fontWeight: '700',
                marginBottom: '4px'
              }}>
                {crisis.name}
              </h3>
              <p style={{
                color: '#F4A726',
                fontSize: '12px',
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                📍 {crisis.region}
              </p>
              <p style={{
                color: textMuted,
                fontSize: '12px',
                lineHeight: '1.5',
                margin: 0
              }}>
                {crisis.brief}
              </p>
            </div>
          ))}
        </div>
      )}

      {selectedCrisis && (
        <div>
          {loading ? (
            <p style={{color: '#F4A726', fontWeight: 'bold'}}>
              ⏳ Analyzing crisis...
            </p>
          ) : analysis && (
            <div style={{
              background: bgSecondary,
              border: `1px solid ${getSeverityColor(selectedCrisis.severity)}40`,
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: getSeverityColor(selectedCrisis.severity),
                  boxShadow: `0 0 8px ${getSeverityColor(selectedCrisis.severity)}`
                }}/>
                <h3 style={{
                  color: textPrimary,
                  fontFamily: 'Playfair Display, serif',
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  {selectedCrisis.name}
                </h3>
              </div>
              <div style={{
                color: textPrimary,
                fontSize: '14px',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap'
              }}>
                {analysis}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
