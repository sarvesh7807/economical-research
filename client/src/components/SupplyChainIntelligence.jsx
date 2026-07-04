import React, { useState } from 'react';

export default function SupplyChainIntelligence({ theme }) {
  const [industry, setIndustry] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  const isLight = theme === 'light';

  // Custom CSS variables mapped to theme
  const bgPrimary = isLight ? '#FFFFFF' : '#0A1628';
  const bgSecondary = isLight ? '#F5F7FA' : 'rgba(26,58,92,0.4)';
  const borderCol = isLight ? 'rgba(10,22,40,0.1)' : 'rgba(244,167,38,0.2)';
  const textPrimary = isLight ? '#0A1628' : '#FFFFFF';
  const textMuted = isLight ? 'rgba(10,22,40,0.6)' : 'rgba(255,255,255,0.5)';
  const inputBg = isLight ? '#FFFFFF' : 'rgba(26,58,92,0.8)';
  const inputBorder = isLight ? 'rgba(10,22,40,0.2)' : 'rgba(244,167,38,0.2)';
  
  const tagBgDefault = isLight ? 'rgba(244,167,38,0.08)' : 'rgba(244,167,38,0.08)';
  const tagBgSelected = '#F4A726';
  const tagTextDefault = isLight ? '#D48E19' : '#FFFFFF';
  const tagTextSelected = '#0A1628';
  const tagBorder = isLight ? 'rgba(244,167,38,0.3)' : 'rgba(244,167,38,0.2)';

  const industries = [
    'Semiconductor', 'Automotive', 
    'Pharmaceutical', 'Electronics',
    'Textile', 'Food & Agriculture',
    'Energy', 'Steel & Metals'
  ];

  const generateSupplyChainReport = async (ind) => {
    const target = ind || industry;
    if (!target) return;
    setLoading(true);
    setReport('');
    
    // Rotate keys if needed
    const key = import.meta.env.VITE_GEMINI_API_KEY || 
                import.meta.env.VITE_GEMINI_API_KEY_2 || 
                import.meta.env.VITE_GEMINI_API_KEY_3 || 
                import.meta.env.VITE_GEMINI_API_KEY_4 || '';
                
    try {
      const prompt = `
      You are Economical Research AI.
      Generate supply chain intelligence report for: ${target} industry
      
      ## Supply Chain Overview
      [Key players, flow, dependencies]
      
      ## Critical Vulnerabilities
      [3-4 main supply chain risks]
      
      ## Geographic Concentration
      [Where production is concentrated, risks]
      
      ## Current Disruptions (2025-2026)
      [Active supply chain issues]
      
      ## Resilience Assessment
      Score: [0-100]/100
      [How resilient is this supply chain]
      
      ## AI Supply Chain Outlook
      6-month outlook: [assessment]
      Key risks to monitor: [2-3 factors]
      
      ## ER Recommendation
      [What companies/investors should know]
      
      Max 350 words. Professional tone.
      Never mention Gemini.
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
      setReport(data.candidates?.[0]?.content?.parts?.[0]?.text || '');
    } catch(e) {
      console.error('Supply chain error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '900px',
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
        🔗 Supply Chain Intelligence
      </h1>
      <p style={{
        color: textMuted,
        marginBottom: '24px'
      }}>
        Global manufacturing, logistics, and supply chain vulnerability ledger
      </p>
      
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '20px'
      }}>
        {industries.map(ind => (
          <button key={ind}
            onClick={() => {
              setIndustry(ind);
              generateSupplyChainReport(ind);
            }}
            style={{
              padding: '8px 16px',
              background: industry === ind ? tagBgSelected : tagBgDefault,
              color: industry === ind ? tagTextSelected : tagTextDefault,
              border: `1px solid ${tagBorder}`,
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.15s'
            }}>
            {ind}
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <input
          value={industry}
          onChange={e => setIndustry(e.target.value)}
          placeholder="Or type any industry..."
          style={{
            flex: 1,
            padding: '12px 16px',
            background: inputBg,
            border: `1px solid ${inputBorder}`,
            borderRadius: '8px',
            color: textPrimary,
            fontSize: '14px'
          }}
        />
        <button
          onClick={() => generateSupplyChainReport()}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: '#F4A726',
            color: '#0A1628',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>
          {loading ? '⏳...' : '🔗 Analyze'}
        </button>
      </div>

      {report && (
        <div style={{
          background: bgSecondary,
          border: `1px solid ${borderCol}`,
          borderRadius: '12px',
          padding: '24px',
          color: textPrimary,
          fontSize: '14px',
          lineHeight: '1.8',
          whiteSpace: 'pre-wrap'
        }}>
          {report}
        </div>
      )}
    </div>
  );
}
