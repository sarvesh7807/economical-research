import AIRouter from '../AIRouter.js';
import { parseJsonSafely } from './agentUtils.js';

export async function ChartAgent(financeData, researchData, plan) {
  const chartsNeeded = (plan.chartsNeeded || ['line', 'bar']).join(', ');
  const metrics = (plan.metricsNeeded || []).slice(0, 5).join(', ');

  const prompt = `You are the Data Visualization Agent for Economical Research AI.

Charts needed: ${chartsNeeded}
Key metrics: ${metrics}
Risk level: ${financeData.riskLevel || 'MEDIUM'}

Generate realistic, plausible chart data based on the research context.
All values must be realistic and internally consistent.
Return ONLY valid JSON with this exact structure:
{
  "charts": [
    {
      "type": "line",
      "title": "GDP Growth Rate Trend (2020-2026)",
      "xKey": "year",
      "yKey": "value",
      "unit": "%",
      "color": "#F4A726",
      "data": [
        {"year": "2020", "value": -3.1},
        {"year": "2021", "value": 6.0},
        {"year": "2022", "value": 2.9},
        {"year": "2023", "value": 2.5},
        {"year": "2024", "value": 2.8},
        {"year": "2026 F", "value": 2.3}
      ],
      "description": "Brief description of what this chart shows"
    },
    {
      "type": "bar",
      "title": "Inflation Rate by Region (2026)",
      "xKey": "region",
      "yKey": "rate",
      "unit": "%",
      "color": "#3B82F6",
      "data": [
        {"region": "USA", "rate": 2.8},
        {"region": "EU", "rate": 2.4},
        {"region": "UK", "rate": 3.1},
        {"region": "India", "rate": 4.2},
        {"region": "China", "rate": 0.4}
      ],
      "description": "Comparative inflation rates"
    }
  ]
}`;

  const text = await AIRouter.route(prompt, 'chart', { maxTokens: 1200 });
  const parsed = parseJsonSafely(text);
  return parsed?.charts || [];
}
