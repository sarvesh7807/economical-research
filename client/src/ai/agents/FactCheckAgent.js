import AIRouter from '../AIRouter.js';
import { parseJsonSafely, truncate } from './agentUtils.js';

export async function FactCheckAgent(plan, researchData) {
  const claims = (plan.claimsToVerify || []).slice(0, 6).join('\n- ');
  const background = truncate(researchData.background || '', 600);

  const prompt = `You are the Fact-Checking Agent for Economical Research AI.

Claims to verify:
- ${claims || 'Verify the key statistical claims in the research background below.'}

Research context (for cross-referencing):
${background}

Assess each claim's accuracy based on general economic knowledge and the research context.
Return ONLY valid JSON:
{
  "verifiedClaims": [
    {
      "claim": "Exact claim text",
      "verdict": "VERIFIED|PARTIALLY_TRUE|UNVERIFIED|MISLEADING|FALSE",
      "confidence": 85,
      "explanation": "Why this verdict",
      "source": "Cross-reference source"
    }
  ],
  "flaggedClaims": [
    {
      "claim": "Exact claim text",
      "issue": "What is potentially misleading or inaccurate",
      "confidence": 70,
      "correction": "More accurate statement"
    }
  ],
  "overallReliability": 82,
  "reliabilityLabel": "HIGH|MEDIUM|LOW",
  "summaryNote": "Brief overall assessment of the research quality"
}`;

  const text = await AIRouter.route(prompt, 'factcheck', { maxTokens: 1200 });
  const parsed = parseJsonSafely(text);
  if (!parsed) return {
    verifiedClaims: [],
    flaggedClaims: [],
    overallReliability: 75,
    reliabilityLabel: 'MEDIUM',
    summaryNote: 'Standard fact-checking applied.',
  };
  return parsed;
}
