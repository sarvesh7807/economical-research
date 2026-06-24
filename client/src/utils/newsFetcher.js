// client/src/utils/newsFetcher.js

// Fetch news from our unified server API to protect credentials and handle normalization/deduplication
export const fetchNews = async (category = 'world', country = '') => {
  try {
    const countryParam = country ? `&country=${country}` : '';
    const url = `/api/news?category=${encodeURIComponent(category)}${countryParam}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(data.message || 'API failed');
    return data.articles || [];
  } catch (e) {
    console.error('Fetch news failed:', e);
    return [];
  }
};

// Remove duplicate articles (retained for backward compatibility with React components)
export const removeDuplicates = (articles) => {
  const seen = new Set();
  return articles.filter(article => {
    const key = article.title?.slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
