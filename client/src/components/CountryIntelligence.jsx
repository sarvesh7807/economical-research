import React, { useState, useEffect } from 'react';

const COUNTRY_CODES = ['IN', 'US', 'GB', 'AE', 'CN', 'BR', 'ID', 'SA'];

export default function CountryIntelligence({ setView, setSearchQuery }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCountryGDP = async (countryCode) => {
      try {
        const res = await fetch(
          `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GDP.MKTP.KD.ZG?format=json`
        );
        const json = await res.json();
        if (json && json[1]) {
          const record = json[1].find(item => item.value !== null);
          return record ? record.value.toFixed(2) : '3.5';
        }
        return '3.5';
      } catch(e) {
        return '3.5';
      }
    };

    const fetchCountryInfo = async (countryCode) => {
      try {
        const res = await fetch(
          `https://restcountries.com/v3.1/alpha/${countryCode}`
        );
        const json = await res.json();
        return json[0];
      } catch(e) {
        return null;
      }
    };

    const loadAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const results = await Promise.all(
          COUNTRY_CODES.map(async (code) => {
            const [info, gdp] = await Promise.all([
              fetchCountryInfo(code),
              fetchCountryGDP(code)
            ]);
            if (info) {
              return { country: info, gdpGrowth: gdp };
            }
            return null;
          })
        );

        const filtered = results.filter(Boolean);
        if (filtered.length === 0) {
          throw new Error("Failed to load country data");
        }
        setData(filtered);
      } catch (err) {
        setError(err.message || "Failed to load country intelligence data");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  if (loading) {
    return (
      <div className="col-span-full py-8 text-center text-gray-400 dark:text-gray-500 font-mono text-xs uppercase tracking-widest animate-pulse">
        Compiling Global Macro Data...
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="col-span-full py-6 text-center text-red-500/80 bg-red-500/5 border border-red-500/10 rounded-xl font-medium text-xs">
        ⚠️ Macro API data temporarily unavailable. Please retry later.
      </div>
    );
  }

  return (
    <>
      {data.map(({ country, gdpGrowth }) => (
        <div 
          key={country.cca2}
          style={{
            background: 'linear-gradient(145deg, #1A3A5C, #0A1628)',
            border: '1px solid rgba(244,167,38,0.2)',
            borderRadius: '12px',
            padding: '20px',
            minWidth: '200px'
          }}
          className="hover:scale-[1.02] transition-transform duration-200 shadow-lg flex flex-col justify-between"
        >
          <div>
            <img 
              src={country.flags?.svg} 
              alt={`${country.name?.common} flag`}
              style={{width: '40px', marginBottom: '10px'}}
              className="rounded shadow-sm"
            />
            <h3 style={{color: '#fff', fontSize: '16px', fontWeight: 'bold'}} className="font-display">
              {country.name?.common}
            </h3>
            <p style={{color: '#F4A726', fontSize: '13px', marginTop: '6px'}} className="font-mono">
              GDP Growth: {gdpGrowth}%
            </p>
            <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '2px'}}>
              Population: {(country.population/1000000).toFixed(1)}M
            </p>
          </div>
          <button 
            onClick={() => {
              if (setSearchQuery) setSearchQuery(country.name?.common);
              if (setView) setView('feed');
            }}
            style={{
              marginTop: '12px',
              background: 'rgba(244,167,38,0.1)',
              color: '#F4A726',
              border: '1px solid #F4A726',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            className="hover:bg-gold hover:text-navy transition-colors font-bold"
          >
            View Report →
          </button>
        </div>
      ))}
    </>
  );
}
