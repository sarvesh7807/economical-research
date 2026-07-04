// client/src/components/SmartSearch.jsx
import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function SmartSearch({ 
  setView, 
  onSelectCountry, 
  onSelectCompany, 
  onSelectAsset, 
  onSelectComparison 
}) {
  const [queryText, setQueryText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const detectIntent = (query) => {
    const q = query.toLowerCase().trim()
    
    // Country detection
    const countryMap = {
      'india': 'IN', 'usa': 'US', 'america': 'US',
      'uk': 'GB', 'britain': 'GB', 'uae': 'AE',
      'china': 'CN', 'brazil': 'BR', 'japan': 'JP',
      'germany': 'DE', 'france': 'FR', 'russia': 'RU'
    }
    
    for (const [name, code] of Object.entries(countryMap)) {
      if (q.includes(name)) {
        return { type: 'country', code, name }
      }
    }
    
    // Crypto detection
    if (['bitcoin', 'btc', 'ethereum', 'eth', 
         'crypto'].some(c => q.includes(c))) {
      return { type: 'crypto' }
    }
    
    // Comparison detection
    if (q.includes(' vs ') || q.includes(' versus ')) {
      return { type: 'comparison' }
    }
    
    // Default: deep research
    return { type: 'research', query }
  }

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const q = queryText.trim();
    if (!q) return;

    const intent = detectIntent(q);

    if (intent.type === 'country') {
      window.dispatchEvent(new CustomEvent('navigate-country', { detail: intent.code }));
      setQueryText('');
      return;
    }

    if (intent.type === 'crypto') {
      setView('live-dashboard');
      setQueryText('');
      return;
    }

    if (intent.type === 'comparison') {
      const parts = q.split(/\s+vs\s+|\s+versus\s+/i);
      if (parts.length >= 2) {
        if (onSelectComparison) onSelectComparison(parts[0].trim(), parts[1].trim());
      }
      setView('comparison');
      setQueryText('');
      return;
    }

    // Default: deep research
    window.dispatchEvent(new CustomEvent('er-research-prefill', { detail: { query: q } }));
    setView('er-research');
    setQueryText('');
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search not supported in this browser.');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQueryText(transcript);
      
      const intent = detectIntent(transcript);
      if (intent.type === 'country') {
        window.dispatchEvent(new CustomEvent('navigate-country', { detail: intent.code }));
        setQueryText('');
        return;
      }
      if (intent.type === 'crypto') {
        setView('live-dashboard');
        setQueryText('');
        return;
      }
      if (intent.type === 'comparison') {
        const parts = transcript.split(/\s+vs\s+|\s+versus\s+/i);
        if (parts.length >= 2) {
          if (onSelectComparison) onSelectComparison(parts[0].trim(), parts[1].trim());
        }
        setView('comparison');
        setQueryText('');
        return;
      }
      window.dispatchEvent(new CustomEvent('er-research-prefill', { detail: { query: transcript } }));
      setView('er-research');
      setQueryText('');
    };
    
    recognition.onerror = (event) => {
      console.error('Voice error:', event.error);
      setIsListening(false);
    };
    
    recognition.start();
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-xl mx-auto animate-fade-in">
      <div className="relative">
        <input
          type="text"
          placeholder="Ask Global Intelligence... (e.g. 'Tesla vs BYD', 'India GDP')"
          value={queryText}
          onChange={e => setQueryText(e.target.value)}
          className="w-full bg-[#060D17]/85 backdrop-blur-md border border-[#F4A726]/30 text-white rounded-full pl-11 pr-12 py-2.5 text-xs focus:outline-none focus:border-[#F4A726] focus:ring-1 focus:ring-[#F4A726]/30 shadow-2xl transition-all font-sans"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F4A726]/70 w-4 h-4 pointer-events-none" />
        <button
          type="button"
          onClick={startVoiceSearch}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: isListening ? '#FF5252' : '#F4A726',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}
          title="Voice Search"
        >
          {isListening ? '🔴' : '🎤'}
        </button>
      </div>
    </form>
  );
}
