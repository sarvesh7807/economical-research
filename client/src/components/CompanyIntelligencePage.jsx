import { useState } from 'react'
import { callGemini } from '../utils/geminiCaller'

export default function CompanyIntelligence() {
  const [company, setCompany] = useState('')
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const topCompanies = [
    'Apple', 'Microsoft', 'Google', 'Amazon',
    'Tesla', 'Meta', 'NVIDIA', 'Reliance',
    'TCS', 'Infosys', 'HDFC Bank', 'Samsung'
  ]

  const generateReport = async (name) => {
    const target = name || company
    if (!target?.trim()) return
    setLoading(true)
    setReport('')
    setError('')
    
    try {
      const result = await callGemini(`
      You are Economical Research AI.
      Write comprehensive company intelligence 
      report for: ${target}
      
      ## Company Overview
      Full name, founded year, headquarters, 
      CEO, number of employees.
      [3 detailed paragraphs]
      
      ## Financial Performance
      Revenue estimate, profit margin, 
      market cap, recent growth trends.
      [3 paragraphs with specific numbers]
      
      ## Business Model & Revenue Streams
      How company makes money, key products/services.
      [3 paragraphs]
      
      ## Competitive Position
      Market share, competitive advantages, 
      top 5 competitors with comparison.
      [3 paragraphs]
      
      ## SWOT Analysis
      Strengths: [5 specific points]
      Weaknesses: [5 specific points]
      Opportunities: [5 specific points]
      Threats: [5 specific points]
      
      ## Recent Developments (2024-2026)
      [5 major recent news/developments]
      
      ## Risk Assessment
      Key risks for investors and stakeholders.
      Risk Level: [Low/Medium/High]
      [2-3 paragraphs]
      
      ## ER Investment Intelligence
      Rating: [Strong Buy/Buy/Hold/Avoid]
      Target sentiment: [Bullish/Neutral/Bearish]
      [3 paragraph comprehensive verdict]
      
      ## 12-Month Outlook
      [Detailed forward-looking analysis]
      [2-3 paragraphs]
      
      Write minimum 800 words.
      Be specific with data and estimates.
      Never mention Gemini or AI provider.
      `, 3000)
      
      if (result) {
        setReport(result)
      } else {
        setError('Report generation failed. Please try again.')
      }
    } catch(e) {
      setError('Error generating report.')
      console.error('Company report error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1000px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#060D17'
    }}>
      <h1 style={{
        fontFamily: 'Playfair Display, serif',
        color: '#fff',
        fontSize: '28px',
        marginBottom: '8px'
      }}>
        🏢 Company Intelligence
      </h1>
      <p style={{
        color: 'rgba(255,255,255,0.5)',
        marginBottom: '24px',
        fontSize: '14px'
      }}>
        Deep intelligence reports on any company
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '20px'
      }}>
        {topCompanies.map(c => (
          <button key={c}
            onClick={() => {
              setCompany(c)
              generateReport(c)
            }}
            style={{
              padding: '7px 14px',
              background: 'rgba(244,167,38,0.08)',
              border: '1px solid rgba(244,167,38,0.2)',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer'
            }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        <input
          value={company}
          onChange={e => setCompany(e.target.value)}
          onKeyPress={e => 
            e.key === 'Enter' && generateReport()}
          placeholder="Enter any company name..."
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '12px 16px',
            background: 'rgba(26,58,92,0.8)',
            border: '1px solid rgba(244,167,38,0.2)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
        <button
          onClick={() => generateReport()}
          disabled={loading || !company.trim()}
          style={{
            padding: '12px 28px',
            background: loading 
              ? 'rgba(244,167,38,0.4)' : '#F4A726',
            color: '#0A1628',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap'
          }}>
          {loading ? '⏳ Analyzing...' : 
            '🔍 Generate Report'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          background: 'rgba(255,82,82,0.1)',
          border: '1px solid rgba(255,82,82,0.3)',
          borderRadius: '8px',
          color: '#FF5252',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          color: '#F4A726'
        }}>
          <div style={{fontSize: '40px', marginBottom: '16px'}}>
            🏢
          </div>
          <p style={{fontSize: '16px', fontWeight: '600'}}>
            Generating {company} Intelligence Report...
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: '13px'
          }}>
            This may take 20-30 seconds
          </p>
        </div>
      )}

      {report && !loading && (
        <div style={{
          background: 'rgba(26,58,92,0.4)',
          border: '1px solid rgba(244,167,38,0.2)',
          borderRadius: '12px',
          padding: '28px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '2px solid #F4A726',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <h2 style={{
              color: '#F4A726',
              fontFamily: 'Playfair Display',
              margin: 0,
              fontSize: '22px'
            }}>
              🏢 {company} — ER Intelligence
            </h2>
            <div style={{display: 'flex', gap: '8px'}}>
              <button
                onClick={() => {
                  const blob = new Blob([report], 
                    {type: 'text/plain'})
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = `${company}-er-report.txt`
                  a.click()
                }}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(244,167,38,0.1)',
                  color: '#F4A726',
                  border: '1px solid rgba(244,167,38,0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}>
                📄 Export
              </button>
            </div>
          </div>
          <div style={{
            color: '#fff',
            fontSize: '14px',
            lineHeight: '1.9',
            whiteSpace: 'pre-wrap'
          }}>
            {report}
          </div>
        </div>
      )}
    </div>
  )
}
