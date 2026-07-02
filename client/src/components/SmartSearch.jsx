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
    e.preventDefault();
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

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <input
          type="text"
          placeholder="Ask Global Intelligence... (e.g. 'Tesla vs BYD', 'India GDP', 'Gold Forecast')"
          value={queryText}
          onChange={e => setQueryText(e.target.value)}
          className="w-full bg-[#060D17]/80 backdrop-blur border border-[#F4A726]/30 text-white rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#F4A726] focus:ring-1 focus:ring-[#F4A726]/30 shadow-2xl transition-all font-sans"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F4A726] w-5 h-5 pointer-events-none" />
      </div>
    </form>
  );
}
