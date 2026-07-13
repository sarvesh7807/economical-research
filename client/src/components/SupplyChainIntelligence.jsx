import React, { useState } from 'react';
import { callGemini } from '../utils/geminiCaller';

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
    
    try {
      const result = await Promise.race([
        callGemini(`
      You are Economical Research AI.
      Generate COMPREHENSIVE supply chain 
      intelligence for: ${target} industry
      
      ## Supply Chain Overview
      [Detailed global supply chain structure]
      [3-4 paragraphs]
      
      ## Key Players & Stakeholders
      [Major companies in this supply chain]
      [3 paragraphs]
      
      ## Geographic Analysis
      Production hubs: [detailed]
      Concentration risks: [detailed]
      [3 paragraphs]
      
      ## Current Disruptions (2025-2026)
      [Active supply chain issues and causes]
      [3-4 paragraphs]
      
      ## Vulnerability Assessment
      Critical vulnerabilities: [detailed list]
      Single points of failure: [detailed]
      [3 paragraphs]
      
      ## Technology & Innovation Impact
      [How tech is changing this supply chain]
      [2-3 paragraphs]
      
      ## Sustainability & ESG Factors
      [Environmental and social supply chain issues]
      [2 paragraphs]
      
      ## Risk Mitigation Strategies
      [Detailed recommendations for companies]
      [3 paragraphs]
      
      ## ER Supply Chain Resilience Score
      Resilience Score: [0-100]/100
      Risk Level: [Low/Medium/High/Critical]
      [3-4 paragraph comprehensive verdict]
      
      ## 12-Month Outlook
      [Detailed supply chain forecast]
      [3 paragraphs]
      
      Write 900-1100 words minimum.
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
