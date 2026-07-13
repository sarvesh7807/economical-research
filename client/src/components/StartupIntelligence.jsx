import React, { useState } from 'react';
import { callGemini } from '../utils/geminiCaller';

export default function StartupIntelligence({ theme }) {
  const [startup, setStartup] = useState('');
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
  const tagBg = isLight ? 'rgba(244,167,38,0.08)' : 'rgba(244,167,38,0.08)';
  const tagBorder = isLight ? 'rgba(244,167,38,0.3)' : 'rgba(244,167,38,0.2)';
  const tagText = isLight ? '#D48E19' : 'rgba(255,255,255,0.7)';

  const trendingStartups = [
    'OpenAI', 'Anthropic', 'Zepto', 
    'Meesho', 'Razorpay', 'CRED',
    'Byju\'s', 'PhonePe', 'Groww'
  ];

  const generateStartupReport = async (name) => {
    const target = name || startup;
    if (!target?.trim()) return;
    setLoading(true);
    setReport('');
    
    try {
      const result = await Promise.race([
        callGemini(`
      You are Economical Research AI.
      Generate COMPREHENSIVE startup intelligence 
      report for: ${target}
      
      ## Company Overview
      Founded: [year] | HQ: [location]
      Founders: [names]
      CEO: [name]
      Sector: [industry]
      Stage: [funding stage]
      
      [3-4 paragraphs detailed overview]
      
      ## Business Model & Revenue
      [Detailed analysis of how they make money]
      [3 paragraphs]
      
      ## Funding History & Investors
      Total raised: [estimate]
      Key funding rounds: [list with amounts]
      Major investors: [list with details]
      Last valuation: [estimate]
      [2-3 paragraphs]
      
      ## Product & Technology
      [Detailed product analysis]
      [2-3 paragraphs]
      
      ## Market Opportunity
      Total addressable market: [estimate]
      Market position: [assessment]
      [2-3 paragraphs]
      
      ## Growth Metrics & Performance
      [Revenue, users, growth rate estimates]
      [2-3 paragraphs]
      
      ## Competitive Analysis
      [Detailed competitor comparison]
      Top 5 competitors with analysis
      [3 paragraphs]
      
      ## SWOT Analysis
      Strengths: [5 detailed points]
      Weaknesses: [5 detailed points]
      Opportunities: [5 detailed points]
      Threats: [5 detailed points]
      
      ## Management Team
      [Key executives and their backgrounds]
      [2 paragraphs]
      
      ## Risks & Challenges
      [Detailed risk assessment]
      [2-3 paragraphs]
      
      ## ER Startup Rating
      Viability Score: [0-100]/100
      Growth Potential: [High/Medium/Low]
      Investment Appeal: [Strong/Moderate/Weak]
      
      [3-4 paragraph final verdict]
      
      ## 12-Month Outlook
      [Detailed forecast]
      [2-3 paragraphs]
      
      Write 900-1200 words minimum.
      Never mention Gemini.
      `, 3500),
        new Promise(resolve => 
          setTimeout(() => resolve(null), 45000)
        )
      ]);
      setReport(result || 'Service busy. Please try again in 2 minutes.');
    } catch (e) {
      console.error(e);
      setReport('Error occurred. Please try again.');
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
        🚀 Startup Intelligence
      </h1>
      <p style={{
        color: textMuted,
        marginBottom: '24px'
      }}>
        Deep analysis of startups and unicorns
      </p>

      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        <input
          value={startup}
          onChange={e => setStartup(e.target.value)}
          placeholder="e.g. OpenAI, Zepto, CRED, Razorpay"
          style={{
            flex: 1,
            minWidth: '250px',
            padding: '12px 16px',
            background: inputBg,
            border: `1px solid ${inputBorder}`,
            borderRadius: '8px',
            color: textPrimary,
            fontSize: '14px'
          }}
        />
        <button
          onClick={() => generateStartupReport()}
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
          {loading ? '⏳ Analyzing...' : '🚀 Analyze Startup'}
        </button>
      </div>

      <div style={{marginBottom: '24px'}}>
        <p style={{
          color: textMuted,
          fontSize: '12px',
          marginBottom: '8px'
        }}>
          Trending startups:
        </p>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {trendingStartups.map(s => (
            <button key={s}
              onClick={() => {
                setStartup(s);
                generateStartupReport(s);
              }}
              style={{
                padding: '6px 14px',
                background: tagBg,
                border: `1px solid ${tagBorder}`,
                borderRadius: '20px',
                color: tagText,
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600'
              }}>
              {s}
            </button>
          ))}
        </div>
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
          <h3 style={{
            color: '#F4A726',
            fontFamily: 'Playfair Display, serif',
            marginBottom: '16px',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            🚀 {startup} — ER Startup Report
          </h3>
          {report}
        </div>
      )}
    </div>
  );
}
