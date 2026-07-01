import AIRouter from '../AIRouter.js';
import { parseJsonSafely, truncate } from './agentUtils.js';

export async function ResearchAgent(plan, query, knowledgeContext = '') {
  const tasksStr = (plan.tasks || []).join('\n- ');
  const sourcesStr = (plan.dataSources || []).join(', ');
  const contextBlock = knowledgeContext
    ? `\nKnowledge Graph Context:\n${truncate(knowledgeContext, 800)}\n` : '';

  const prompt = `You are the Research Intelligence Agent for Economical Research AI.

Query: "${query}"
Research Tasks:
- ${tasksStr}
Preferred Sources: ${sourcesStr}
Time Horizon: ${plan.timeHorizon || 'last 5 years + 12-month outlook'}
${contextBlock}

Conduct comprehensive research. Cite sources inline as [SOURCE: domain.com (YYYY-MM)].
Write as "Economical Research AI analysis." Never mention AI provider names.

Return ONLY valid JSON:
{
  "background": "2-3 paragraph historical context with inline source citations",
  "currentSituation": "2-3 paragraphs on current state with data points and citations",
  "keyStats": [
    {"label": "GDP Growth", "value": "2.4%", "unit": "%", "date": "2025-Q4", "trend": "up"},
    {"label": "Inflation", "value": "2.8%", "unit": "%", "date": "2026-Q1", "trend": "down"}
  ],
  "expertViews": ["View 1 with source", "View 2 with source"],
  "recentDevelopments": ["Development 1 [SOURCE: domain.com (2026-06)]", "Development 2"],
  "sources": [
    {"domain": "imf.org", "title": "IMF World Economic Outlook", "date": "2026-04"},
    {"domain": "worldbank.org", "title": "World Bank Report", "date": "2026-03"}
  ],
  "entities": ["Federal Reserve", "European Central Bank"],
  "keyRisks": ["Risk factor 1", "Risk factor 2"]
}`;

  const text = await AIRouter.route(prompt, 'research', { maxTokens: 2500 });
  const parsed = parseJsonSafely(text);
  if (!parsed) return {
    background: text.slice(0, 800),
    currentSituation: 'Analysis in progress.',
    keyStats: [],
    expertViews: [],
    recentDevelopments: [],
    sources: [],
    entities: [],
    keyRisks: [],
  };
  return parsed;
}
