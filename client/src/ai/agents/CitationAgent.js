import AIRouter from '../AIRouter.js';
import { parseJsonSafely, truncate } from './agentUtils.js';
import { scoreSources } from '../../utils/sourceCollector.js';

export async function CitationAgent(researchData) {
  const rawSources = researchData.sources || [];
  const background = truncate(researchData.background || '', 400);

  // Apply credibility/freshness scoring to raw sources
  const scoredSources = scoreSources(rawSources);

  const prompt = `You are the Citation and Attribution Agent for Economical Research AI.

Raw sources referenced in research:
${JSON.stringify(rawSources.slice(0, 8), null, 2)}

Research excerpt: "${background}"

Generate properly formatted citations and identify content types.
Return ONLY valid JSON:
{
  "citations": [
    {
      "id": "cite-1",
      "text": "Formatted citation text",
      "url": "https://domain.com/path",
      "domain": "imf.org",
      "title": "Source title",
      "date": "2026-04",
      "type": "OFFICIAL|ACADEMIC|MEDIA|MARKET"
    }
  ],
  "aiGeneratedSections": ["executive summary", "recommendations", "forecast sections"],
  "verifiedSections": ["historical data", "key statistics", "policy descriptions"],
  "methodologyNote": "Brief note on research methodology used"
}`;

  const text = await AIRouter.route(prompt, 'citation', { maxTokens: 900 });
  const parsed = parseJsonSafely(text);

  return {
    citations: parsed?.citations || [],
    scoredSources,
    aiGeneratedSections: parsed?.aiGeneratedSections || ['forecast', 'recommendations'],
    verifiedSections: parsed?.verifiedSections || ['historical data'],
    methodologyNote: parsed?.methodologyNote || 'Multi-source synthesis by Economical Research AI.',
  };
}
