import React, { useState } from 'react';

export default function ESGIntelligence({ theme }) {
  const [company, setCompany] = useState('');
  const [esgReport, setEsgReport] = useState('');
  const [scores, setScores] = useState(null);
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
  const scorecardBg = isLight ? '#F0F4F8' : 'rgba(26,58,92,0.4)';

  const generateESGReport = async () => {
    if (!company.trim()) return;
    setLoading(true);
    
    // Rotate keys if needed
    const key = import.meta.env.VITE_GEMINI_API_KEY || 
                import.meta.env.VITE_GEMINI_API_KEY_2 || 
                import.meta.env.VITE_GEMINI_API_KEY_3 || 
                import.meta.env.VITE_GEMINI_API_KEY_4 || '';
                
    try {
      const prompt = `
      You are Economical Research AI.
      Generate ESG Intelligence Report for: ${company}
      
      ## ESG Overview
      [Brief company ESG standing]
      
      ## Environmental Score
      Score: [0-100]/100
      Key factors: [3 points]
      Carbon footprint: [assessment]
      Renewable energy: [% or assessment]
      
      ## Social Score  
      Score: [0-100]/100
      Employee practices: [assessment]
      Community impact: [assessment]
      Diversity: [assessment]
      
      ## Governance Score
      Score: [0-100]/100
      Board structure: [assessment]
      Transparency: [assessment]
      Ethics: [assessment]
      
      ## Overall ESG Rating
      Total Score: [0-100]/100
      Rating: [AAA/AA/A/BBB/BB/B/CCC]
      ER ESG Grade: [Excellent/Good/Average/Poor]
      
      ## Key ESG Risks
      [3 main ESG risks]
      
      ## ESG Improvement Areas
      [3 areas for improvement]
      
      Max 400 words. Professional tone.
      Never mention Gemini.
      `;
      const scorePrompt = `
      Generate ESG scores for ${company} as JSON only:
      {
        "environmental": [0-100],
        "social": [0-100],
        "governance": [0-100],
        "overall": [0-100],
        "rating": "AAA/AA/A/BBB/BB/B/CCC"
      }
      Only JSON, no text.
      `;
      
      const [reportRes, scoreRes] = await Promise.all([
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 600 }
            })
          }
        ),
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ 
                parts: [{ text: scorePrompt }] 
              }],
              generationConfig: { maxOutputTokens: 200 }
            })
          }
        )
      ]);
      
      const reportData = await reportRes.json();
      const scoreData = await scoreRes.json();
      
      setEsgReport(reportData.candidates?.[0]?.content?.parts?.[0]?.text || '');
      
      const scoreText = scoreData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      try {
        const match = scoreText.match(/\{[\s\S]*\}/);
        if (match) setScores(JSON.parse(match[0]));
      } catch(e) {
        console.error('Score parsing error:', e);
      }
      
    } catch(e) {
      console.error('ESG error:', e);
    } finally {
      setLoading(false);
    }
  };

  const ScoreBar = ({ label, score, color }) => (
    <div style={{marginBottom: '16px'}}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '6px'
      }}>
        <span style={{
          color: textSecondary,
          fontSize: '13px'
        }}>{label}</span>
        <span style={{
          color: color,
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '14px',
          fontWeight: '700'
        }}>{score}/100</span>
      </div>
      <div style={{
        height: '8px',
        background: isLight ? 'rgba(10,22,40,0.1)' : 'rgba(255,255,255,0.1)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${score}%`,
          background: color,
          borderRadius: '4px',
          transition: 'width 1s ease'
        }}/>
      </div>
    </div>
  );

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
        🌱 ESG Intelligence
      </h1>
      <p style={{
        color: textMuted,
        marginBottom: '24px'
      }}>
        Environmental, Social & Governance Analysis
      </p>

      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <input
          value={company}
          onChange={e => setCompany(e.target.value)}
          placeholder="e.g. Apple, Reliance, Tesla, Infosys"
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
          onClick={generateESGReport}
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
          {loading ? '⏳ Analyzing...' : '🌱 Generate ESG Report'}
        </button>
      </div>

      {scores && (
        <div style={{
          background: scorecardBg,
          border: `1px solid ${borderCol}`,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            color: '#F4A726',
            marginBottom: '20px',
            fontSize: '16px',
            fontWeight: '700'
          }}>
            ESG Scorecard — {company}
          </h3>
          <ScoreBar label="🌍 Environmental"
            score={scores.environmental}
            color="#00C896"/>
          <ScoreBar label="👥 Social"
            score={scores.social}
            color="#4FC3F7"/>
          <ScoreBar label="🏛️ Governance"
            score={scores.governance}
            color="#CE93D8"/>
          <ScoreBar label="⭐ Overall ESG"
            score={scores.overall}
            color="#F4A726"/>
          
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(244,167,38,0.1)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <span style={{
              color: '#F4A726',
              fontSize: '24px',
              fontWeight: '900',
              fontFamily: 'IBM Plex Mono, monospace'
            }}>
              {scores.rating}
            </span>
            <span style={{
              color: textMuted,
              fontSize: '12px',
              display: 'block'
            }}>
              ER ESG Rating
            </span>
          </div>
        </div>
      )}

      {esgReport && (
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
          {esgReport}
        </div>
      )}
    </div>
  );
}
