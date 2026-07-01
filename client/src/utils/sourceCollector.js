/**
 * Source credibility scoring registry.
 * Scores sources based on domain reputation and publication freshness.
 */

const TRUSTED_DOMAINS = {
  // Tier 1 — Official / Institutional (credibility 90-100)
  'imf.org': 98, 'worldbank.org': 97, 'federalreserve.gov': 97,
  'oecd.org': 96, 'sec.gov': 96, 'bis.org': 95, 'ecb.europa.eu': 95,
  'rbi.org.in': 93, 'treasury.gov': 93, 'cbo.gov': 92, 'bls.gov': 92,
  'bea.gov': 92, 'census.gov': 91, 'eia.gov': 91, 'un.org': 90,
  'europa.eu': 90, 'bank-of-england.co.uk': 93, 'boj.or.jp': 93,

  // Tier 2 — Major Financial Media (credibility 75-89)
  'reuters.com': 87, 'bloomberg.com': 87, 'ft.com': 86, 'wsj.com': 85,
  'economist.com': 85, 'apnews.com': 84, 'bbc.com': 83, 'cnbc.com': 80,
  'marketwatch.com': 79, 'barrons.com': 82, 'morningstar.com': 80,
  'sp-global.com': 84, 'moodys.com': 84, 'fitchratings.com': 83,

  // Tier 3 — Secondary Sources (credibility 55-74)
  'finance.yahoo.com': 72, 'seekingalpha.com': 65, 'investopedia.com': 68,
  'businessinsider.com': 65, 'forbes.com': 68, 'fortune.com': 70,
  'thestreet.com': 62,
};

/**
 * Compute freshness score from a date string "YYYY-MM" or "YYYY".
 */
function freshnessScore(dateStr) {
  if (!dateStr) return 50;
  try {
    const d = new Date(dateStr + (dateStr.length === 4 ? '-01' : '-01'));
    const ageMs = Date.now() - d.getTime();
    const ageDays = ageMs / 86400000;
    if (ageDays < 1)   return 100;
    if (ageDays < 7)   return 95;
    if (ageDays < 30)  return 85;
    if (ageDays < 90)  return 75;
    if (ageDays < 180) return 65;
    if (ageDays < 365) return 55;
    return 40;
  } catch { return 50; }
}

/**
 * Score an array of source objects.
 * @param {Array<{domain: string, date?: string, title?: string}>} sources
 * @returns {Array<{domain, title, date, credibilityScore, freshnessScore, confidenceScore, tier}>}
 */
export function scoreSources(sources = []) {
  return sources.map(s => {
    const domain = (s.domain || '').replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
    const cred   = TRUSTED_DOMAINS[domain] || 45;
    const fresh  = freshnessScore(s.date);
    const conf   = Math.round(cred * 0.6 + fresh * 0.4);
    const tier   = cred >= 90 ? 1 : cred >= 75 ? 2 : cred >= 55 ? 3 : 4;

    return {
      domain,
      title:            s.title || domain,
      date:             s.date || 'Unknown',
      credibilityScore: cred,
      freshnessScore:   fresh,
      confidenceScore:  conf,
      tier,
      tierLabel:        ['', 'Official', 'Major Media', 'Secondary', 'Unverified'][tier],
    };
  });
}
