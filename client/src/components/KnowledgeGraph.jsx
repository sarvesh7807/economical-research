import { useState } from 'react'
import { callGemini, parseGeminiJSON } from '../utils/geminiCaller'

export default function KnowledgeGraph() {
  const [topic, setTopic] = useState('')
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const [error, setError] = useState('')

  const getNodeColor = (type) => {
    const colors = {
      country: '#F4A726',
      company: '#00C896',
      person: '#4FC3F7',
      event: '#FF5252',
      policy: '#CE93D8',
      market: '#80CBC4',
      indicator: '#FFD54F'
    }
    return colors[type] || '#F4A726'
  }

  const generateGraph = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setGraphData(null)
    setError('')
    
    const text = await callGemini(
      'Create knowledge graph for: "' + topic + '"\n\nReturn ONLY this JSON:\n{"center":"' + topic + '","nodes":[{"id":"1","label":"Example","type":"country","description":"Brief description","connection":"How it relates to ' + topic + '"}]}\n\nCreate 10 nodes. Types: country/company/person/event/policy/market/indicator\nReturn ONLY valid JSON.',
      800
    )
    
    const parsed = parseGeminiJSON(text)
    if (parsed?.nodes?.length) {
      setGraphData(parsed)
    } else {
      setError('Try again with a different topic')
    }
    setLoading(false)
  }

  const suggestions = [
    'India Economy', 'Tesla', 'Bitcoin',
    'US Federal Reserve', 'Silicon Valley',
    'Climate Change', 'AI Industry'
  ]

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      <h1 style={{
        fontFamily: 'Playfair Display, serif',
        color: '#fff',
        fontSize: '28px',
        marginBottom: '8px'
      }}>
        🕸️ Knowledge Graph
      </h1>
      <p style={{
        color: 'rgba(255,255,255,0.5)',
        marginBottom: '20px',
        fontSize: '14px'
      }}>
        Visualize connections between economic 
        concepts, companies and countries
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '16px'
      }}>
        {suggestions.map(s => (
          <button key={s}
            onClick={() => setTopic(s)}
            style={{
              padding: '6px 14px',
              background: topic === s
                ? 'rgba(244,167,38,0.3)'
                : 'rgba(244,167,38,0.08)',
              border: '1px solid rgba(244,167,38,0.2)',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer'
            }}>
            {s}
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
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyPress={e => 
            e.key === 'Enter' && generateGraph()}
          placeholder="Enter any topic..."
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '12px 16px',
            background: 'rgba(26,58,92,0.8)',
            border: '1px solid rgba(244,167,38,0.2)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px'
          }}
        />
        <button
          onClick={generateGraph}
          disabled={loading || !topic.trim()}
          style={{
            padding: '12px 28px',
            background: loading 
              ? 'rgba(244,167,38,0.4)' : '#F4A726',
            color: '#0A1628',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>
          {loading ? '⏳ Mapping...' : 
            '🕸️ Generate Graph'}
        </button>
      </div>

      {error && (
        <p style={{
          color: '#FF5252',
          textAlign: 'center',
          marginBottom: '16px'
        }}>{error}</p>
      )}

      {graphData && (
        <div>
          <div style={{
            background: 'rgba(26,58,92,0.3)',
            border: '1px solid rgba(244,167,38,0.15)',
            borderRadius: '16px',
            padding: '32px 24px',
            marginBottom: '24px'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              <div style={{
                display: 'inline-block',
                padding: '14px 28px',
                background: '#F4A726',
                color: '#0A1628',
                borderRadius: '30px',
                fontFamily: 'Playfair Display',
                fontSize: '18px',
                fontWeight: '700',
                boxShadow: '0 0 40px rgba(244,167,38,0.3)'
              }}>
                ⭐ {graphData.center}
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center'
            }}>
              {graphData.nodes?.map(node => (
                <div key={node.id}
                  onClick={() => setSelectedNode(
                    selectedNode?.id === node.id 
                      ? null : node
                  )}
                  style={{
                    padding: '10px 18px',
                    background: selectedNode?.id === node.id
                      ? getNodeColor(node.type)
                      : `${getNodeColor(node.type)}20`,
                    border: `2px solid ${
                      getNodeColor(node.type)}`,
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: selectedNode?.id === node.id
                      ? '#0A1628' : '#fff',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                  {node.label}
                </div>
              ))}
            </div>
          </div>

          {selectedNode && (
            <div style={{
              background: 'rgba(26,58,92,0.5)',
              border: `2px solid ${
                getNodeColor(selectedNode.type)}40`,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <h3 style={{
                  color: getNodeColor(selectedNode.type),
                  margin: 0,
                  fontSize: '18px'
                }}>
                  {selectedNode.label}
                </h3>
                <span style={{
                  background: `${getNodeColor(selectedNode.type)}20`,
                  color: getNodeColor(selectedNode.type),
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  {selectedNode.type}
                </span>
              </div>
              <p style={{
                color: '#fff',
                fontSize: '14px',
                lineHeight: '1.6',
                marginBottom: '10px'
              }}>
                {selectedNode.description}
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '13px',
                marginBottom: '14px'
              }}>
                🔗 {selectedNode.connection}
              </p>
              <button
                onClick={() => {
                  setTopic(selectedNode.label)
                  setGraphData(null)
                  setSelectedNode(null)
                }}
                style={{
                  padding: '8px 18px',
                  background: 'rgba(244,167,38,0.15)',
                  color: '#F4A726',
                  border: '1px solid rgba(244,167,38,0.4)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                🔍 Research this →
              </button>
            </div>
          )}

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center'
          }}>
            {['country', 'company', 'person',
              'event', 'policy', 'market', 
              'indicator'].map(type => (
              <span key={type} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)'
              }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: getNodeColor(type),
                  display: 'inline-block'
                }}/>
                {type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
