import React, { useState } from 'react';
import { callGemini } from '../utils/geminiCaller';

export default function ERTerminal() {
  const [query, setQuery] = useState('');
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [loading, setLoading] = useState(false);

  const terminalCommands = {
    'HELP': 'Show available commands',
    'GDP {country}': 'Get GDP data',
    'INFLATION {country}': 'Get inflation data',
    'FOREX {currency}': 'Get forex rates',
    'CRYPTO {coin}': 'Get crypto prices',
    'RESEARCH {topic}': 'Start deep research',
    'COMPANY {name}': 'Company intelligence',
    'FORECAST {indicator} {country}': 'AI forecast',
    'COMPARE {A} vs {B}': 'Compare two items',
    'NEWS {topic}': 'Latest news',
    'CLEAR': 'Clear terminal'
  };

  const processCommand = async (cmd) => {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toUpperCase();
    const args = parts.slice(1).join(' ');

    if (command === 'CLEAR') {
      setTerminalOutput([]);
      return;
    }

    if (command === 'HELP') {
      const helpText = Object.entries(terminalCommands)
        .map(([cmd, desc]) => `  ${cmd.padEnd(30)} ${desc}`)
        .join('\n');
      addOutput('system', helpText);
      return;
    }

    setLoading(true);
    addOutput('user', `> ${cmd}`);

    try {
      let prompt = '';
      
      if (command === 'GDP') {
        prompt = `GDP analysis for ${args || 'India'}.
        Current GDP, growth rate 2024-2026, 
        trend analysis, 3 key drivers.
        Terminal format, concise, max 150 words.
        Never mention Gemini.`;
      } else if (command === 'INFLATION') {
        prompt = `Inflation analysis for ${args || 'India'}.
        Current CPI, trend, central bank response,
        impact on markets.
        Terminal format, max 150 words.
        Never mention Gemini.`;
      } else if (command === 'RESEARCH') {
        prompt = `Intelligence brief on: ${args}
        Overview, current status, key facts, 
        market implications, outlook.
        Terminal style, max 200 words.
        Never mention Gemini.`;
      } else if (command === 'COMPANY') {
        prompt = `Company brief for: ${args}
        Overview, revenue estimate, strengths,
        risks, ER rating.
        Terminal style, max 150 words.
        Never mention Gemini.`;
      } else if (command === 'FOREX') {
        prompt = `Forex analysis: ${args || 'USD/INR'}
        Current rate, trend, outlook.
        Terminal format, max 100 words.
        Never mention Gemini.`;
      } else if (command === 'CRYPTO') {
        prompt = `Crypto analysis: ${args || 'Bitcoin'}
        Price context, trend, key factors, 
        risk assessment.
        Terminal format, max 120 words.
        Never mention Gemini.`;
      } else if (command === 'NEWS') {
        prompt = `Latest intelligence on: ${args}
        Top 5 developments as bullet points.
        Terminal format, max 150 words.
        Never mention Gemini.`;
      } else if (command === 'FORECAST') {
        prompt = `Economic forecast: ${args || 'India GDP'}
        3M, 6M, 12M outlook.
        Bull, Base, Bear scenarios.
        Max 150 words.
        Never mention Gemini.`;
      } else if (command === 'COMPARE') {
        prompt = `Compare: ${args || 'India vs China'}
        Key metrics table format.
        Winner by category.
        Max 200 words.
        Never mention Gemini.`;
      } else {
        addOutput('error', `Unknown command: ${command}. Type HELP.`);
        setLoading(false);
        return;
      }

      const result = await callGemini(prompt, 400);
      if (result) addOutput('result', result);
      else addOutput('error', 'Command failed. Retry.');
    } catch (e) {
      addOutput('error', 'Command failed. Retry.');
    } finally {
      setLoading(false);
    }
  };

  const addOutput = (type, text) => {
    setTerminalOutput(prev => [...prev, {
      type,
      text, 
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  return (
    <div style={{
      background: '#000',
      minHeight: 'calc(100vh - 120px)',
      padding: '24px',
      fontFamily: 'IBM Plex Mono, Courier New, monospace',
      display: 'flex',
      flexDirection: 'column',
      color: '#fff'
    }}>
      <div style={{
        borderBottom: '1px solid #F4A726',
        paddingBottom: '12px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <span style={{
            color: '#F4A726',
            fontSize: '15px',
            fontWeight: '700',
            letterSpacing: '1px'
          }}>
            ECONOMICAL RESEARCH TERMINAL
          </span>
          <span style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '11px',
            marginLeft: '16px'
          }}>
            v1.0 | Global Economic Intelligence
          </span>
        </div>
        <span style={{
          color: '#00C896',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '0.5px'
        }}>
          ● CONNECTED
        </span>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: '20px',
        padding: '16px',
        background: '#050A14',
        border: '1px solid rgba(244,167,38,0.15)',
        borderRadius: '6px',
        minHeight: '300px'
      }}>
        {terminalOutput.length === 0 && (
          <div style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: '13px',
            lineHeight: '1.8'
          }}>
            Welcome to Economical Research Terminal.<br />
            Type <span style={{ color: '#F4A726' }}>HELP</span> to see available commands.<br /><br />
            Example commands:<br />
            &gt; <span style={{ color: '#00C896' }}>GDP India</span><br />
            &gt; <span style={{ color: '#00C896' }}>COMPANY Tesla</span><br />
            &gt; <span style={{ color: '#00C896' }}>RESEARCH Bitcoin</span><br />
            &gt; <span style={{ color: '#00C896' }}>FORECAST inflation USA</span>
          </div>
        )}
        
        {terminalOutput.map((item, i) => (
          <div key={i} style={{
            marginBottom: '16px',
            borderLeft: `2px solid ${
              item.type === 'user' ? '#F4A726' :
              item.type === 'error' ? '#FF5252' :
              item.type === 'system' ? '#4FC3F7' :
              '#00C896'
            }`,
            paddingLeft: '12px'
          }}>
            <span style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: '10px',
              display: 'block',
              marginBottom: '4px'
            }}>
              [{item.timestamp}]
            </span>
            <pre style={{
              color: item.type === 'user' 
                ? '#F4A726' :
                item.type === 'error' 
                  ? '#FF5252' : '#fff',
              fontSize: '13px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
              fontFamily: 'inherit'
            }}>
              {item.text}
            </pre>
          </div>
        ))}
        
        {loading && (
          <div style={{
            color: '#F4A726',
            fontSize: '13px',
            animation: 'pulse 1s infinite'
          }}>
            Processing command... ▋
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        borderTop: '1px solid rgba(244,167,38,0.2)',
        paddingTop: '16px'
      }}>
        <span style={{
          color: '#F4A726',
          fontSize: '15px',
          fontWeight: '700'
        }}>
          ER &gt;
        </span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) {
              processCommand(query);
              setQuery('');
            }
          }}
          placeholder="Type command... (HELP for list)"
          disabled={loading}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '14px',
            fontFamily: 'IBM Plex Mono, monospace',
            outline: 'none',
            caretColor: '#F4A726'
          }}
          autoFocus
        />
        <button
          onClick={() => {
            if (query.trim()) {
              processCommand(query);
              setQuery('');
            }
          }}
          disabled={loading}
          style={{
            padding: '8px 20px',
            background: '#F4A726',
            color: '#0A1628',
            border: 'none',
            borderRadius: '4px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'IBM Plex Mono, monospace',
            transition: 'background 0.2s'
          }}>
          ENTER
        </button>
      </div>
    </div>
  );
}
