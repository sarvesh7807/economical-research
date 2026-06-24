// Category mapping for each API
const categoryMaps = {
  newsapi: {
    world: 'general',
    india: 'general',
    business: 'business',
    technology: 'technology',
    sports: 'sports',
    health: 'health',
    science: 'science',
    entertainment: 'entertainment',
    politics: 'general',
    finance: 'business',
    cricket: 'sports',
    football: 'sports',
    mma: 'sports'
  },
  gnews: {
    world: 'world',
    india: 'nation',
    business: 'business',
    technology: 'technology',
    sports: 'sports',
    health: 'health',
    science: 'science',
    entertainment: 'entertainment',
    politics: 'politics',
    finance: 'business',
    cricket: 'sports',
    football: 'sports',
    mma: 'sports'
  },
  newsdata: {
    world: 'world',
    india: 'top',
    business: 'business',
    technology: 'technology',
    sports: 'sports',
    health: 'health',
    science: 'science',
    entertainment: 'entertainment',
    politics: 'politics',
    finance: 'business',
    cricket: 'sports',
    football: 'sports',
    mma: 'sports'
  }
}

// Normalize articles to same format
const normalizeNewsAPI = (articles) => 
  articles.map(a => ({
    title: a.title,
    description: a.description,
    content: a.content,
    url: a.url,
    urlToImage: a.urlToImage,
    publishedAt: a.publishedAt,
    source: { name: a.source?.name || 'News' }
  })).filter(a => 
    a.urlToImage && 
    a.urlToImage.startsWith('http') &&
    a.title && 
    !a.title.includes('[Removed]')
  )

const normalizeGNews = (articles) =>
  articles.map(a => ({
    title: a.title,
    description: a.description,
    content: a.content,
    url: a.url,
    urlToImage: a.image,
    publishedAt: a.publishedAt,
    source: { name: a.source?.name || 'GNews' }
  })).filter(a => 
    a.urlToImage && 
    a.urlToImage.startsWith('http') &&
    a.title
  )

const normalizeNewsData = (articles) =>
  articles.map(a => ({
    title: a.title,
    description: a.description,
    content: a.content,
    url: a.link,
    urlToImage: a.image_url,
    publishedAt: a.pubDate,
    source: { name: a.source_id || 'NewsData' }
  })).filter(a => 
    a.urlToImage && 
    a.urlToImage.startsWith('http') &&
    a.title
  )

// Fetch from NewsAPI
const fetchFromNewsAPI = async (category, country = '') => {
  const cat = categoryMaps.newsapi[category] || 'general'
  const countryParam = country ? `&country=${country}` : '&language=en'
  const url = `https://newsapi.org/v2/top-headlines?category=${cat}${countryParam}&pageSize=20&apiKey=${import.meta.env.VITE_NEWSAPI_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'ok') throw new Error('NewsAPI failed')
  return normalizeNewsAPI(data.articles || [])
}

// Fetch from GNews
const fetchFromGNews = async (category, country = '') => {
  const cat = categoryMaps.gnews[category] || 'general'
  const langParam = country === 'in' ? '&lang=en&country=in' : '&lang=en'
  const url = `https://gnews.io/api/v4/top-headlines?category=${cat}${langParam}&max=20&apikey=${import.meta.env.VITE_GNEWS_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.articles) throw new Error('GNews failed')
  return normalizeGNews(data.articles || [])
}

// Fetch from NewsData
const fetchFromNewsData = async (category, country = '') => {
  const cat = categoryMaps.newsdata[category] || 'top'
  const countryParam = country ? `&country=${country}` : ''
  const url = `https://newsdata.io/api/1/news?apikey=${import.meta.env.VITE_NEWSDATA_KEY}&category=${cat}${countryParam}&language=en&image=1`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'success') throw new Error('NewsData failed')
  return normalizeNewsData(data.results || [])
}

// MAIN FUNCTION - Smart fallback system
export const fetchNews = async (category = 'world', country = '') => {
  const errors = []
  
  // Try NewsData FIRST (best photos, 200 requests)
  try {
    const articles = await fetchFromNewsData(category, country)
    if (articles.length >= 5) {
      console.log('NewsData success:', articles.length)
      return articles
    }
  } catch (e) {
    errors.push('NewsData: ' + e.message)
  }

  // Try GNews SECOND (good photos)
  try {
    const articles = await fetchFromGNews(category, country)
    if (articles.length >= 5) {
      console.log('GNews success:', articles.length)
      return articles
    }
  } catch (e) {
    errors.push('GNews: ' + e.message)
  }

  // Try NewsAPI LAST (fallback)
  try {
    const articles = await fetchFromNewsAPI(category, country)
    if (articles.length > 0) {
      console.log('NewsAPI success:', articles.length)
      return articles
    }
  } catch (e) {
    errors.push('NewsAPI: ' + e.message)
  }

  console.error('All APIs failed:', errors)
  return []
}

// Remove duplicate articles
export const removeDuplicates = (articles) => {
  const seen = new Set()
  return articles.filter(article => {
    const key = article.title?.slice(0, 50)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
