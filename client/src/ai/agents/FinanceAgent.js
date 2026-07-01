import AIRouter from '../AIRouter.js';
import { parseJsonSafely, truncate } from './agentUtils.js';

export async function FinanceAgent(query, researchData) {
  const stats = JSON.stringify(researchData.keyStats || []).slice(0, 600);

  const prompt = `You are the Financial Analysis Agent for Economical Research AI.

Query: "${query}"
Research Context Key Stats: ${stats}

Provide institutional-grade financial analysis. Write as "Economical Research AI."
Return ONLY valid JSON:
{
  "marketImpact": "Detailed paragraph on market impact with specific figures",
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "riskJustification": "Why this risk level",
  "indicators": [
    {"name": "10-Year Treasury Yield", "value": "4.28%", "signal": "NEUTRAL", "implication": "..."},
    {"name": "VIX Volatility Index", "value": "18.4", "signal": "BULLISH", "implication": "..."}
  ],
  "sectorImpacts": [
    {"sector": "Technology", "impact": "POSITIVE", "detail": "..."},
    {"sector": "Consumer Staples", "impact": "NEUTRAL", "detail": "..."}
  ],
  "shortTermOutlook": "3-month outlook with specific projections",
  "longTermOutlook": "12-24 month outlook with scenarios",
  "recommendation": "Institutional recommendation with caveats",
  "keyWatchPoints": ["Watch point 1", "Watch point 2", "Watch point 3"]
}`;

  const text = await AIRouter.route(prompt, 'finance', { maxTokens: 1500 });
  const parsed = parseJsonSafely(text);
  if (!parsed) return {
    marketImpact: truncate(text, 400),
    riskLevel: 'MEDIUM',
    riskJustification: 'Standard market conditions',
    indicators: [],
    sectorImpacts: [],
    shortTermOutlook: 'Outlook under analysis.',
    longTermOutlook: 'Long-term outlook under analysis.',
    recommendation: 'Review complete financial analysis when available.',
    keyWatchPoints: [],
  };
  return parsed;
}
