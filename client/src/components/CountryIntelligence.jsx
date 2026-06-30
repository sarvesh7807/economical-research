import React, { useState, useEffect } from 'react';

const COUNTRY_CODES = ['IN', 'US', 'GB', 'AE', 'CN', 'BR', 'ID', 'SA'];

const STATIC_COUNTRIES_DATA = [
  {
    country: {
      cca2: 'IN',
      name: { common: 'India' },
      flags: { svg: 'https://flagcdn.com/in.svg' },
      population: 1408000000
    },
    gdpGrowth: '7.20'
  },
  {
    country: {
      cca2: 'US',
      name: { common: 'United States' },
      flags: { svg: 'https://flagcdn.com/us.svg' },
      population: 331900000
    },
    gdpGrowth: '2.50'
  },
  {
    country: {
      cca2: 'GB',
      name: { common: 'United Kingdom' },
      flags: { svg: 'https://flagcdn.com/gb.svg' },
      population: 67330000
    },
    gdpGrowth: '0.50'
  },
  {
    country: {
      cca2: 'AE',
      name: { common: 'United Arab Emirates' },
      flags: { svg: 'https://flagcdn.com/ae.svg' },
      population: 9440000
    },
    gdpGrowth: '3.40'
  },
  {
    country: {
      cca2: 'CN',
      name: { common: 'China' },
      flags: { svg: 'https://flagcdn.com/cn.svg' },
      population: 1412000000
    },
    gdpGrowth: '5.20'
  },
  {
    country: {
      cca2: 'BR',
      name: { common: 'Brazil' },
      flags: { svg: 'https://flagcdn.com/br.svg' },
      population: 215300000
    },
    gdpGrowth: '2.90'
  },
  {
    country: {
      cca2: 'ID',
      name: { common: 'Indonesia' },
      flags: { svg: 'https://flagcdn.com/id.svg' },
      population: 275500000
    },
    gdpGrowth: '5.05'
  },
  {
    country: {
      cca2: 'SA',
      name: { common: 'Saudi Arabia' },
      flags: { svg: 'https://flagcdn.com/sa.svg' },
      population: 36400000
    },
    gdpGrowth: '-0.80'
  }
];

export default function CountryIntelligence({ setView, setSearchQuery }) {
  const [data, setData] = useState(STATIC_COUNTRIES_DATA);

  useEffect(() => {
    // restcountries.com is CORS-blocked from the browser - use static data instead
    // Only fetch live GDP growth from World Bank API (supports CORS)
    const fetchCountryGDP = async (countryCode) => {
      try {
        const res = await fetch(
          `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GDP.MKTP.KD.ZG?format=json`
        );
        const json = await res.json();
        if (json && json[1]) {
          const record = json[1].find(item => item.value !== null);
          return record ? record.value.toFixed(2) : null;
        }
        return null;
      } catch(e) {
        return null;
      }
    };

    const loadAllData = async () => {
      try {
        const results = await Promise.all(
          COUNTRY_CODES.map(async (code) => {
            const staticEntry = STATIC_COUNTRIES_DATA.find(d => d.country.cca2 === code);
            if (!staticEntry) return null;
            // Try to get live GDP growth from World Bank; fall back to static
            const gdp = await fetchCountryGDP(code);
            return {
              country: staticEntry.country,
              gdpGrowth: gdp || staticEntry.gdpGrowth
            };
          })
        );

        const filtered = results.filter(Boolean);
        if (filtered.length > 0) {
          setData(filtered);
        }
      } catch (err) {
        console.error("Background fetch for country GDP failed, keeping static fallback:", err);
      }
    };

    loadAllData();
  }, []);

  return (
    <>
      {data.map(({ country, gdpGrowth }) => (
        <div 
          key={country.cca2}
          style={{
            background: 'linear-gradient(145deg, #1A3A5C, #0A1628)',
            border: '1px solid rgba(244,167,38,0.2)',
            borderRadius: '6px',
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
