import AIRouter from '../AIRouter.js';
import { parseJsonSafely } from './agentUtils.js';

export async function PlannerAgent(userQuery) {
  const prompt = `You are the Planner for Economical Research AI, an institutional-grade financial intelligence platform.

User Query: "${userQuery}"

Break this into structured research tasks. Return ONLY valid JSON, no markdown:
{
  "intent": "user's main research goal in one sentence",
  "tasks": ["specific task 1", "specific task 2", "specific task 3", "specific task 4"],
  "dataSources": ["IMF", "World Bank", "OECD", "Federal Reserve", "relevant government bodies"],
  "metricsNeeded": ["GDP growth rate", "inflation rate", "specific metrics for this query"],
  "chartsNeeded": ["line chart for time series", "bar chart for comparison"],
  "claimsToVerify": ["specific factual claim 1 from the query context", "claim 2"],
  "entityTypes": ["country", "company", "policy", "indicator"],
  "timeHorizon": "historical period and forecast period relevant to this query",
  "riskFactors": ["key risk factor 1", "risk factor 2"]
}`;

  const text = await AIRouter.route(prompt, 'planning', { maxTokens: 800 });
  const parsed = parseJsonSafely(text);
  if (!parsed) {
    return {
      intent: userQuery,
      tasks: ['Gather background context', 'Analyze current situation', 'Assess financial implications', 'Identify key trends'],
      dataSources: ['IMF', 'World Bank', 'Reuters', 'Bloomberg'],
      metricsNeeded: ['GDP', 'Inflation', 'Interest rates'],
      chartsNeeded: ['line'],
      claimsToVerify: [],
      entityTypes: [],
      timeHorizon: 'last 5 years + 12-month outlook',
      riskFactors: [],
    };
  }
  return parsed;
}
