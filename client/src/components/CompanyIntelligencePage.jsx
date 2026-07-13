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
    
    try {
      const result = await Promise.race([
        callGemini(
          'Write comprehensive company intelligence report for: ' + target + '\n\nInclude: Overview, Financials, Business Model, Competition, SWOT, Risks, ER Rating, Outlook.\nWrite minimum 500 words. Never mention Gemini.',
          2500
        ),
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
  }

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1000px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#060D17'
    }}>
      <h1 style={{color: '#fff', fontFamily: 'Playfair Display, serif'}}>
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
