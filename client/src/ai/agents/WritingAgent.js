import AIRouter from '../AIRouter.js';
import { parseJsonSafely } from './agentUtils.js';

export async function WritingAgent({ query, plan, research, finance, factCheck, citation }) {
  const keyStats = (research.keyStats || []).map(s => `${s.label}: ${s.value}`).join(', ');

  const prompt = `You are the Senior Report Writer for Economical Research AI, an institutional-grade financial intelligence platform.

Query: "${query}"
Research intent: "${plan.intent || ''}"
Key Stats: ${keyStats}
Risk Level: ${finance.riskLevel || 'MEDIUM'}
Reliability Score: ${factCheck.overallReliability || 75}%

Write a comprehensive, authoritative research report containing exactly 21 sections.
Write as "Economical Research AI" — never mention Gemini, OpenAI, Claude, or any AI provider.
Use formal financial journalism style. Be specific with numbers, rates, and projections.

You MUST return ONLY valid JSON with this exact structure (no other text, no markdown code fences around the JSON):
{
  "sections": [
    {
      "id": "exec_summary",
      "title": "1. Executive Summary",
      "type": "analysis",
      "content": "Write 3-4 sentences summarizing the core finding and key statistics."
    },
    {
      "id": "key_findings",
      "title": "2. Key Findings",
      "type": "factual",
      "content": "List 4-5 major findings, separated by newlines."
    },
    {
      "id": "historical_bg",
      "title": "3. Historical Background",
      "type": "factual",
      "content": "Detail the historical economic context."
    },
    {
      "id": "current_sit",
      "title": "4. Current Situation",
      "type": "factual",
      "content": "Analyze the current economic or market situation."
    },
    {
      "id": "global_perspective",
      "title": "5. Global Perspective",
      "type": "analysis",
      "content": "Explain the global context or international dynamics."
    },
    {
      "id": "country_comp",
      "title": "6. Country Comparison",
      "type": "factual",
      "content": "Compare key countries affected (include comparative numbers)."
    },
    {
      "id": "company_comp",
      "title": "7. Company Comparison",
      "type": "factual",
      "content": "Compare leading companies in this space (e.g. market share, revenues)."
    },
    {
      "id": "industry_analysis",
      "title": "8. Industry Analysis",
      "type": "analysis",
      "content": "Detail the industry value chain and dynamics."
    },
    {
      "id": "economic_impact",
      "type": "analysis",
      "title": "9. Economic Impact",
      "content": "Detail macro-economic impacts (GDP, employment, inflation)."
    },
    {
      "id": "financial_analysis",
      "title": "10. Financial Analysis",
      "type": "analysis",
      "content": "Analyze equity, debt, yields, or asset class implications."
    },
    {
      "id": "market_trends",
      "title": "11. Market Trends",
      "type": "analysis",
      "content": "Outline short-term and long-term market trends."
    },
    {
      "id": "statistical_analysis",
      "title": "12. Statistical Analysis",
      "type": "factual",
      "content": "Provide specific statistical distributions, metrics, or growth rates."
    },
    {
      "id": "ai_insights",
      "title": "13. AI Insights",
      "type": "analysis",
      "content": "Provide specialized analytical insights derived from the data."
    },
    {
      "id": "opportunities",
      "title": "14. Opportunities",
      "type": "analysis",
      "content": "Detail positive growth vectors or arbitrage opportunities."
    },
    {
      "id": "risks",
      "title": "15. Risks",
      "type": "analysis",
      "content": "Outline critical downside risks and watchpoints."
    },
    {
      "id": "best_case",
      "title": "16. Best Case Scenario",
      "type": "prediction",
      "content": "Provide a detailed positive projection model."
    },
    {
      "id": "worst_case",
      "title": "17. Worst Case Scenario",
      "type": "prediction",
      "content": "Provide a detailed downside risk stress-test model."
    },
    {
      "id": "future_outlook",
      "title": "18. Future Outlook",
      "type": "prediction",
      "content": "Provide a 12-24 month macro projection summary."
    },
    {
      "id": "faq",
      "title": "19. Frequently Asked Questions",
      "type": "factual",
      "content": "Write 2 FAQ questions and answers relevant to the topic."
    },
    {
      "id": "verified_sources",
      "title": "20. Verified Sources",
      "type": "factual",
      "content": "List domains and official references used in this research."
    },
    {
      "id": "final_verdict",
      "title": "21. Economical Research AI Final Verdict",
      "type": "analysis",
      "content": "Write our definitive platform final verdict rating and recommendation."
    }
  ]
}`;

  const text = await AIRouter.route(prompt, 'writing', { maxTokens: 3500 });
  const parsed = parseJsonSafely(text);
  
  if (!parsed || !parsed.sections) {
    // Fallback if parsing fails
    return {
      sections: [
        { id: 'exec_summary', title: '1. Executive Summary', type: 'analysis', content: text.slice(0, 500) },
        { id: 'key_findings', title: '2. Key Findings', type: 'factual', content: 'Key findings under review.' }
      ]
    };
  }

  return parsed;
}
