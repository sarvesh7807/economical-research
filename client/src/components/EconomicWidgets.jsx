import React, { useState, useEffect } from 'react';
import DataRouter from '../utils/DataRouter';
import AIRouter from '../ai/AIRouter';

const DataWidget = ({ title, value, unit, source, year, error, isUp }) => {
  const [explanationModal, setExplanationModal] = useState({ open: false, text: '' });
  const [modalLoading, setModalLoading] = useState(false);

  const explainStat = async (title, value, source) => {
    setModalLoading(true);
    setExplanationModal({ open: true, text: 'Analyzing statistic...' });
    const prompt = `
    You are Economical Research AI.
    Explain this economic indicator:
    
    Indicator: ${title}
    Value: ${value}${unit || ''}
    Source: ${source}
    
    Provide:
    1. What this means (2 sentences)
    2. Why it changed (historical context)
    3. Impact on economy/markets
    4. What to watch next
    
    Keep response under 150 words.
    Professional tone. Never mention AI provider.
    `;
    try {
      const explanation = await AIRouter.route(prompt, 'research');
      setExplanationModal({ open: true, text: explanation });
    } catch(e) {
      setExplanationModal({ open: true, text: 'Explanation temporarily unavailable.' });
    } finally {
      setModalLoading(false);
    }
  };

  if (error) return (
    <div style={{
      background: 'rgba(26,58,92,0.5)',
      border: '1px solid rgba(244,167,38,0.1)',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <p style={{color: 'rgba(255,255,255,0.4)',
        fontSize: '11px', textTransform: 'uppercase',
        letterSpacing: '1px', marginBottom: '8px'}}>
        {title}
      </p>
      <p style={{color: 'rgba(255,255,255,0.25)',
        fontSize: '12px', margin: 0}}>
        Live data temporarily unavailable
      </p>
    </div>
  )

  return (
    <div style={{
      background: 'rgba(26,58,92,0.5)',
      border: '1px solid rgba(244,167,38,0.15)',
      borderRadius: '8px',
      padding: '16px',
      transition: 'border-color 0.2s'
    }}>
      <p style={{color: 'rgba(255,255,255,0.4)',
        fontSize: '11px', textTransform: 'uppercase',
        letterSpacing: '1px', marginBottom: '8px',
        margin: '0 0 8px'}}>
        {title}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <p style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '22px',
          color: '#F4A726',
          fontWeight: '700',
          margin: 0
        }}>
          {value}{unit}
        </p>
        <button onClick={() => explainStat(title, value, source)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(244,167,38,0.6)',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '2px 6px'
          }}>
          Why? 💡
        </button>
      </div>
      <div style={{display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'}}>
        <span style={{
          color: isUp ? '#00C896' : '#FF5252',
          fontSize: '11px'
        }}>
          {isUp ? '▲' : '▼'} {year}
        </span>
        <span style={{
          color: 'rgba(255,255,255,0.25)',
          fontSize: '10px'
        }}>
          {source}
        </span>
      </div>

      {explanationModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#0A1628',
            border: '1px solid rgba(244,167,38,0.3)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'left'
          }}>
            <h3 style={{color: '#F4A726', marginBottom: '12px', marginTop: 0}}>
              💡 ER Analysis
            </h3>
            {modalLoading ? (
              <p style={{color: '#fff', fontSize: '13px'}}>Analyzing statistic...</p>
            ) : (
              <p style={{color: '#fff', fontSize: '13px', lineHeight: '1.6', margin: 0}}>
                {explanationModal.text}
              </p>
            )}
            <button onClick={() => setExplanationModal({open: false, text: ''})}
              style={{
                marginTop: '16px',
                padding: '8px 20px',
                background: '#F4A726',
                color: '#0A1628',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: 'pointer'
              }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export const GDPWidget = React.memo(({ countryCode }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    DataRouter.getGDP(countryCode)
      .then(d => { setData(d); setLoading(false) })
  }, [countryCode])

  if (loading) return <ShimmerWidget />

  return <DataWidget 
    title="GDP Growth Rate"
    value={data.value}
    unit="%"
    source={data.source}
    year={data.year}
    error={data.error}
    isUp={parseFloat(data.value) > 0}
  />
});

export const InflationWidget = React.memo(({ countryCode }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    DataRouter.getInflation(countryCode)
      .then(d => { setData(d); setLoading(false) })
  }, [countryCode])

  if (loading) return <ShimmerWidget />

  return <DataWidget
    title="Inflation Rate"
    value={data.value}
    unit="%"
    source={data.source}
    year={data.year}
    error={data.error}
    isUp={parseFloat(data.value) < 4}
  />
});

export const CryptoWidget = React.memo(() => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [explanationModal, setExplanationModal] = useState({ open: false, text: '' });
  const [modalLoading, setModalLoading] = useState(false);

  const explainStat = async (coinName, valStr) => {
    setModalLoading(true);
    setExplanationModal({ open: true, text: 'Analyzing statistic...' });
    const prompt = `
    You are Economical Research AI.
    Explain the current market state and price direction of:
    
    Asset: ${coinName}
    Price: ${valStr}
    Source: CoinGecko
    
    Provide:
    1. Market sentiment and price trend
    2. What's driving this movement (liquidity, regulation, macro factors)
    3. What to watch next
    
    Keep response under 150 words.
    Professional tone. Never mention AI provider.
    `;
    try {
      const explanation = await AIRouter.route(prompt, 'research');
      setExplanationModal({ open: true, text: explanation });
    } catch(e) {
      setExplanationModal({ open: true, text: 'Explanation temporarily unavailable.' });
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    DataRouter.getCrypto()
      .then(d => { setData(d); setLoading(false) })
    const interval = setInterval(() => {
      DataRouter.getCrypto()
        .then(d => setData(d))
    }, 300000) // refresh every 5 minutes
    return () => clearInterval(interval)
  }, [])

  if (loading) return <ShimmerWidget />
  if (data?.error) return (
    <DataWidget title="Crypto" error={data.error} />
  )

  return (
    <div style={{
      background: 'rgba(26,58,92,0.5)',
      border: '1px solid rgba(244,167,38,0.15)',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <p style={{color: 'rgba(255,255,255,0.4)',
        fontSize: '11px', textTransform: 'uppercase',
        marginBottom: '12px', margin: '0 0 12px'}}>
        Crypto Markets
      </p>
      {['bitcoin', 'ethereum'].map(coin => (
        <div key={coin} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{color: '#fff', 
            fontSize: '13px', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '4px'}}>
            {coin}
            <button onClick={() => explainStat(coin, `$${data[coin]?.usd?.toLocaleString()}`)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(244,167,38,0.6)',
                fontSize: '10px',
                cursor: 'pointer',
                padding: '2px 4px'
              }}>
              💡
            </button>
          </span>
          <div style={{textAlign: 'right'}}>
            <span style={{
              fontFamily: 'IBM Plex Mono, monospace',
              color: '#F4A726',
              fontSize: '13px',
              fontWeight: '700'
            }}>
              ${data[coin]?.usd?.toLocaleString()}
            </span>
            <span style={{
              color: parseFloat(data[coin]?.change24h) > 0 
                ? '#00C896' : '#FF5252',
              fontSize: '11px',
              marginLeft: '8px'
            }}>
              {parseFloat(data[coin]?.change24h) > 0 ? '▲' : '▼'}
              {Math.abs(data[coin]?.change24h)}%
            </span>
          </div>
        </div>
      ))}
      <p style={{color: 'rgba(255,255,255,0.2)',
        fontSize: '10px', margin: '8px 0 0',
        textAlign: 'right'}}>
        CoinGecko
      </p>

      {explanationModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#0A1628',
            border: '1px solid rgba(244,167,38,0.3)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'left'
          }}>
            <h3 style={{color: '#F4A726', marginBottom: '12px', marginTop: 0}}>
              💡 ER Analysis
            </h3>
            {modalLoading ? (
              <p style={{color: '#fff', fontSize: '13px'}}>Analyzing asset...</p>
            ) : (
              <p style={{color: '#fff', fontSize: '13px', lineHeight: '1.6', margin: 0}}>
                {explanationModal.text}
              </p>
            )}
            <button onClick={() => setExplanationModal({open: false, text: ''})}
              style={{
                marginTop: '16px',
                padding: '8px 20px',
                background: '#F4A726',
                color: '#0A1628',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: 'pointer'
              }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
});

export const CurrencyWidget = React.memo(() => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    DataRouter.getCurrencyRates('USD')
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <ShimmerWidget />
  if (data?.error) return (
    <DataWidget title="Currency Rates" error={data.error} />
  )

  const pairs = ['INR', 'GBP', 'EUR', 'AED', 'JPY']

  return (
    <div style={{
      background: 'rgba(26,58,92,0.5)',
      border: '1px solid rgba(244,167,38,0.15)',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <p style={{color: 'rgba(255,255,255,0.4)',
        fontSize: '11px', textTransform: 'uppercase',
        marginBottom: '12px', margin: '0 0 12px'}}>
        USD Rates (Live)
      </p>
      {pairs.map(currency => (
        <div key={currency} style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <span style={{color: 'rgba(255,255,255,0.6)',
            fontSize: '13px'}}>
            USD/{currency}
          </span>
          <span style={{
            fontFamily: 'IBM Plex Mono, monospace',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '700'
          }}>
            {data.rates?.[currency]?.toFixed(2)}
          </span>
        </div>
      ))}
      <p style={{color: 'rgba(255,255,255,0.2)',
        fontSize: '10px', margin: '8px 0 0',
        textAlign: 'right'}}>
        Live · ExchangeRate-API
      </p>
    </div>
  )
});

const ShimmerWidget = () => (
  <div style={{
    background: 'rgba(26,58,92,0.5)',
    borderRadius: '8px',
    padding: '16px',
    animation: 'pulse 1.5s infinite'
  }}>
    <div style={{height: '10px', width: '60%',
      background: 'rgba(244,167,38,0.1)',
      borderRadius: '4px', marginBottom: '12px'}}/>
    <div style={{height: '24px', width: '40%',
      background: 'rgba(244,167,38,0.15)',
      borderRadius: '4px'}}/>
  </div>
)

export default GDPWidget;
