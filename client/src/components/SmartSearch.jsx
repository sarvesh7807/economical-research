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

  const handleSearch = (e) => {
    e.preventDefault();
    const q = queryText.trim();
    if (!q) return;

    const lowerQ = q.toLowerCase();

    // 1. Comparison Intent (e.g. "Tesla vs BYD", "US vs China")
    if (lowerQ.includes(' vs ') || lowerQ.includes(' compared to ')) {
      const parts = q.split(/\s+vs\s+|\s+compared\s+to\s+/i);
      if (parts.length >= 2) {
        if (onSelectComparison) onSelectComparison(parts[0].trim(), parts[1].trim());
        setView('comparison');
        setQueryText('');
        return;
      }
    }

    // 2. Dashboard Intent (e.g. "US Inflation", "Gold Forecast", "Bitcoin pricing")
    const dashboardKeywords = ['gdp', 'inflation', 'unemployment', 'interest rate', 'debt', 'gold', 'silver', 'oil', 'bitcoin', 'sensex', 'nifty', 'exchange rate'];
    const matchesDashboard = dashboardKeywords.some(kw => lowerQ.includes(kw));
    if (matchesDashboard) {
      setView('live-dashboard');
      setQueryText('');
      return;
    }

    // 3. Country Intelligence Intent
    const countries = [
      { name: 'india', actual: 'India' },
      { name: 'united states', actual: 'United States' },
      { name: 'us', actual: 'United States' },
      { name: 'united kingdom', actual: 'United Kingdom' },
      { name: 'uk', actual: 'United Kingdom' },
      { name: 'china', actual: 'China' },
      { name: 'brazil', actual: 'Brazil' },
      { name: 'germany', actual: 'Germany' }
    ];
    const countryMatch = countries.find(c => lowerQ.includes(c.name));
    if (countryMatch) {
      if (onSelectCountry) onSelectCountry(countryMatch.actual);
      setView('country-intel');
      setQueryText('');
      return;
    }

    // 4. Company Intelligence Intent
    const companies = [
      { name: 'tesla', symbol: 'TSLA' },
      { name: 'tsla', symbol: 'TSLA' },
      { name: 'apple', symbol: 'AAPL' },
      { name: 'aapl', symbol: 'AAPL' },
      { name: 'amazon', symbol: 'AMZN' },
      { name: 'amzn', symbol: 'AMZN' },
      { name: 'microsoft', symbol: 'MSFT' },
      { name: 'msft', symbol: 'MSFT' },
      { name: 'alphabet', symbol: 'GOOGL' },
      { name: 'google', symbol: 'GOOGL' },
      { name: 'googl', symbol: 'GOOGL' }
    ];
    const companyMatch = companies.find(c => lowerQ.includes(c.name));
    if (companyMatch) {
      if (onSelectCompany) onSelectCompany(companyMatch.symbol);
      setView('company-intel');
      setQueryText('');
      return;
    }

    // 5. Default Fallback: Deep Multi-Agent Research Desk
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
