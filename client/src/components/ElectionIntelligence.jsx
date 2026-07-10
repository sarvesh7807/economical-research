import React, { useState } from 'react';
import { callGemini } from '../utils/geminiCaller';

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
    
    const result = await callGemini(`
  You are Economical Research AI.
  Generate COMPREHENSIVE election intelligence 
  report for: ${target}
  
  ## Political System Overview
  [Detailed description of political system]
  [3-4 paragraphs]
  
  ## Current Government
  [Current leadership, policies, performance]
  [3 paragraphs]
  
  ## Major Political Parties
  [Detailed analysis of top 4-5 parties]
  [4-5 paragraphs]
  
  ## Upcoming Elections
  Date: [when]
  Type: [what kind]
  Key issues: [list of main issues]
  [3 paragraphs]
  
  ## Economic Policy Comparison
  [How different parties approach economy]
  [3-4 paragraphs]
  
  ## Election Outlook & Polling
  [Current polling trends and analysis]
  [3 paragraphs]
  
  ## Market & Investment Impact
  [How different outcomes affect markets]
  [3-4 paragraphs]
  
  ## Political Risk Assessment
  Risk Level: [Low/Medium/High/Critical]
  Key risk factors: [detailed list]
  [2-3 paragraphs]
  
  ## Historical Context
  [Recent election history and patterns]
  [2-3 paragraphs]
  
  ## ER Political Intelligence Verdict
  Stability Score: [0-100]/100
  Investment Climate: [assessment]
  [3-4 paragraph comprehensive conclusion]
  
  Write 900-1100 words minimum.
  Never mention Gemini.
  `, 3500);
    
    if (result) setReport(result);
    else setReport('Report failed. Please try again.');
    setLoading(false);
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
