import React, { useState } from 'react';

export default function ElectionIntelligence({ theme }) {
  const [country, setCountry] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  const isLight = theme === 'light';

  // Custom CSS variables mapped to theme
  const bgPrimary = isLight ? '#FFFFFF' : '#0A1628';
  const bgSecondary = isLight ? '#F5F7FA' : 'rgba(26,58,92,0.4)';
  const borderCol = isLight ? 'rgba(10,22,40,0.1)' : 'rgba(244,167,38,0.2)';
  const textPrimary = isLight ? '#0A1628' : '#FFFFFF';
  const textSecondary = isLight ? '#1A3A5C' : 'rgba(255,255,255,0.7)';
  const textMuted = isLight ? 'rgba(10,22,40,0.6)' : 'rgba(255,255,255,0.5)';
  const inputBg = isLight ? '#FFFFFF' : 'rgba(26,58,92,0.8)';
  const inputBorder = isLight ? 'rgba(10,22,40,0.2)' : 'rgba(244,167,38,0.2)';
  const cardBg = isLight ? '#F0F4F8' : 'rgba(26,58,92,0.5)';
  const cardBorder = isLight ? 'rgba(10,22,40,0.1)' : 'rgba(244,167,38,0.15)';

  const upcomingElections = [
    { country: 'USA', year: '2028', type: 'Presidential' },
    { country: 'UK', year: '2029', type: 'General' },
    { country: 'India', year: '2029', type: 'General' },
    { country: 'Germany', year: '2025', type: 'Federal' },
    { country: 'France', year: '2027', type: 'Presidential' }
  ];

  const generateElectionReport = async (c) => {
    const target = c || country;
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
      Generate election intelligence report for: ${target}
      
      ## Political Overview
      [Current government, political landscape]
      
      ## Upcoming Elections
      [Next major election, date, type]
      
      ## Key Political Parties
      [Major parties and their economic policies]
      
      ## Economic Policy Comparison
      [How different parties approach economy]
      
      ## Market Impact Analysis
      [How election outcomes could affect markets]
      
      ## Political Risk Assessment
      Risk Level: [Low/Medium/High/Very High]
      [Key political risks for investors]
      
      ## ER Political Outlook
      [6-12 month political stability forecast]
      
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
      console.error('Election error:', e);
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
        🗳️ Election Intelligence
      </h1>
      <p style={{
        color: textMuted,
        marginBottom: '24px'
      }}>
        Political analysis and election impact on markets
      </p>

      <div style={{
        marginBottom: '20px'
      }}>
        <p style={{
          color: textMuted,
          fontSize: '12px',
          marginBottom: '10px'
        }}>
          Major upcoming elections:
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {upcomingElections.map(e => (
            <div key={e.country}
              onClick={() => {
                setCountry(e.country);
                generateElectionReport(e.country);
              }}
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: '10px',
                padding: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
              <p style={{
                color: textPrimary,
                fontWeight: '700',
                margin: '0 0 4px',
                fontSize: '14px'
              }}>{e.country}</p>
              <p style={{
                color: '#F4A726',
                fontSize: '11px',
                margin: '0 0 2px',
                fontWeight: '700'
              }}>{e.year}</p>
              <p style={{
                color: textMuted,
                fontSize: '11px',
                margin: 0
              }}>{e.type}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <input
          value={country}
          onChange={e => setCountry(e.target.value)}
          placeholder="e.g. India, USA, Brazil..."
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
          onClick={() => generateElectionReport()}
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
          {loading ? '⏳...' : '🗳️ Analyze'}
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
