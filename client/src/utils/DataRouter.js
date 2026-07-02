const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000

const getCached = (key) => {
  const item = cache.get(key)
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data
  }
  return null
}

const setCached = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() })
}

export const DataRouter = {

  async getGDP(countryCode) {
    const cacheKey = `gdp_${countryCode}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    try {
      const res = await fetch(
        `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GDP.MKTP.KD.ZG?format=json&date=2022:2024&per_page=3`
      )
      const data = await res.json()
      const result = {
        value: data[1]?.[0]?.value?.toFixed(1),
        year: data[1]?.[0]?.date,
        source: 'World Bank',
        fresh: true,
        history: data[1]?.map(d => ({
          year: d.date,
          value: d.value?.toFixed(1)
        }))
      }
      setCached(cacheKey, result)
      return result
    } catch(e) {
      return { 
        value: null, 
        error: 'Live data temporarily unavailable',
        source: null,
        fresh: false
      }
    }
  },

  async getInflation(countryCode) {
    const cacheKey = `inflation_${countryCode}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    try {
      const res = await fetch(
        `https://api.worldbank.org/v2/country/${countryCode}/indicator/FP.CPI.TOTL.ZG?format=json&date=2022:2024&per_page=3`
      )
      const data = await res.json()
      const result = {
        value: data[1]?.[0]?.value?.toFixed(1),
        year: data[1]?.[0]?.date,
        source: 'World Bank',
        fresh: true
      }
      setCached(cacheKey, result)
      return result
    } catch(e) {
      return { 
        value: null, 
        error: 'Live data temporarily unavailable'
      }
    }
  },

  async getUnemployment(countryCode) {
    const cacheKey = `unemployment_${countryCode}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    try {
      const res = await fetch(
        `https://api.worldbank.org/v2/country/${countryCode}/indicator/SL.UEM.TOTL.ZS?format=json&date=2022:2024&per_page=3`
      )
      const data = await res.json()
      const result = {
        value: data[1]?.[0]?.value?.toFixed(1),
        year: data[1]?.[0]?.date,
        source: 'World Bank',
        fresh: true
      }
      setCached(cacheKey, result)
      return result
    } catch(e) {
      return { value: null, error: 'Live data temporarily unavailable' }
    }
  },

  async getCurrencyRates(base = 'USD') {
    const cacheKey = `currency_${base}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    try {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/2428fcb9bd5523c4a06e1cc7/latest/${base}`
      )
      const data = await res.json()
      const result = {
        rates: data.conversion_rates,
        base: data.base_code,
        source: 'ExchangeRate-API',
        fresh: true,
        lastUpdated: new Date().toLocaleTimeString()
      }
      setCached(cacheKey, result)
      return result
    } catch(e) {
      return { rates: null, error: 'Live data temporarily unavailable' }
    }
  },

  async getCrypto() {
    const cacheKey = 'crypto_prices'
    const cached = getCached(cacheKey)
    if (cached) return cached

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd,inr&include_24hr_change=true`
      )
      const data = await res.json()
      const result = {
        bitcoin: {
          usd: data.bitcoin?.usd,
          inr: data.bitcoin?.inr,
          change24h: data.bitcoin?.usd_24h_change?.toFixed(2)
        },
        ethereum: {
          usd: data.ethereum?.usd,
          inr: data.ethereum?.inr,
          change24h: data.ethereum?.usd_24h_change?.toFixed(2)
        },
        source: 'CoinGecko',
        fresh: true
      }
      setCached(cacheKey, result)
      return result
    } catch(e) {
      return { error: 'Live data temporarily unavailable' }
    }
  },

  async getPopulation(countryCode) {
    try {
      const res = await fetch(
        `https://api.worldbank.org/v2/country/${countryCode}/indicator/SP.POP.TOTL?format=json&date=2023&per_page=1`
      )
      const data = await res.json()
      return {
        value: data[1]?.[0]?.value,
        year: data[1]?.[0]?.date,
        source: 'World Bank',
        fresh: true
      }
    } catch(e) {
      return { value: null, error: 'Live data temporarily unavailable' }
    }
  },

  async getTradeBalance(countryCode) {
    try {
      const res = await fetch(
        `https://api.worldbank.org/v2/country/${countryCode}/indicator/BN.CAB.XOKA.CD?format=json&date=2022:2023&per_page=2`
      )
      const data = await res.json()
      return {
        value: data[1]?.[0]?.value,
        year: data[1]?.[0]?.date,
        source: 'World Bank',
        fresh: true
      }
    } catch(e) {
      return { value: null, error: 'Live data temporarily unavailable' }
    }
  }
}

export default DataRouter
