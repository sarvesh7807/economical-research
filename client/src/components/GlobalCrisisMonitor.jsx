import React, { useState, useEffect } from 'react';

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
    
    // Rotate keys if needed
    const key = import.meta.env.VITE_GEMINI_API_KEY || 
                import.meta.env.VITE_GEMINI_API_KEY_2 || 
                import.meta.env.VITE_GEMINI_API_KEY_3 || 
                import.meta.env.VITE_GEMINI_API_KEY_4 || '';
                
    try {
      const prompt = `
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
      `;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 600 }
          })
        }
      );
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\[[\s\S]*\]/);
      if (match) setCrises(JSON.parse(match[0]));
    } catch(e) {
      console.error('Crisis list error:', e);
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
    
    // Rotate keys if needed
    const key = import.meta.env.VITE_GEMINI_API_KEY || 
                import.meta.env.VITE_GEMINI_API_KEY_2 || 
                import.meta.env.VITE_GEMINI_API_KEY_3 || 
                import.meta.env.VITE_GEMINI_API_KEY_4 || '';
                
    try {
      const prompt = `
      You are Economical Research AI.
      Deep analysis of global crisis: ${crisis.name}
      
      ## Crisis Overview
      [Current situation, background]
      
      ## Economic Impact
      [Effect on global/regional economy]
      
      ## Market Implications
      [Impact on stocks, bonds, currency, commodities]
      
      ## Affected Countries
      [Which countries most impacted]
      
      ## Resolution Outlook
      [How and when crisis might resolve]
      Timeline: [Short/Medium/Long term]
      
      ## ER Crisis Rating
      Severity: ${crisis.severity}
      [Investment implications]
      
      Max 300 words. Professional tone.
      Never mention Gemini.
      `;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 500 }
          })
        }
      );
      const data = await res.json();
      setAnalysis(data.candidates?.[0]?.content?.parts?.[0]?.text || '');
    } catch(e) {
      console.error('Crisis analysis error:', e);
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
