import jobQueue      from '../adapters/JobQueueAdapter.js';
import monitoring    from '../adapters/MonitoringAdapter.js';
import Logger        from '../../utils/Logger.js';
import ResearchMemory from '../../research/ResearchMemory.js';
import KnowledgeGraph from '../../research/KnowledgeGraph.js';
import TimelineEngine from '../../research/TimelineEngine.js';
import { PlannerAgent }    from './PlannerAgent.js';
import { ResearchAgent }   from './ResearchAgent.js';
import { FinanceAgent }    from './FinanceAgent.js';
import { ChartAgent }      from './ChartAgent.js';
import { FactCheckAgent }  from './FactCheckAgent.js';
import { CitationAgent }   from './CitationAgent.js';
import { WritingAgent }    from './WritingAgent.js';

export const AGENT_STEPS = [
  { id: 'planner',   label: 'Planning Research Strategy',    icon: '🗺️' },
  { id: 'research',  label: 'Gathering Intelligence',        icon: '🔍' },
  { id: 'finance',   label: 'Financial Analysis',            icon: '📊' },
  { id: 'chart',     label: 'Building Visualizations',       icon: '📈' },
  { id: 'factcheck', label: 'Fact-Checking Claims',          icon: '✅' },
  { id: 'citation',  label: 'Compiling Citations',           icon: '📚' },
  { id: 'writing',   label: 'Writing Final Report',          icon: '✍️' },
];

/**
 * Run the full 7-agent research pipeline.
 * @param {string} query
 * @param {string|null} userId
 * @param {function} onProgress   callback(agentId, status, data?)
 * @returns {Promise<object>} full report object
 */
export async function runOrchestrator(query, userId = null, onProgress = () => {}) {
  let jobId = null;
  
  // Accumulated result that is updated and passed in the callback for streaming rendering
  let streamingResult = {
    query,
    generatedAt: new Date().toISOString(),
    reportVersion: 1,
    fromCache: false,
  };

  const progress = async (agentId, status) => {
    onProgress(agentId, status, { ...streamingResult });
    if (userId && jobId) {
      await jobQueue.update(userId, jobId, {
        [`agentProgress.${agentId}`]: status,
        status: status === 'error' ? 'error' : 'running',
      });
    }
  };

  try {
    if (userId) {
      const { jobId: jid } = await jobQueue.enqueue(userId, 'deep-research', { query });
      jobId = jid;
    }

    // Check research memory for cached result
    const cached = await ResearchMemory.findSimilar(query, userId);
    if (cached && cached.isExact) {
      onProgress('_cache', 'hit', cached);
      return { ...cached, fromCache: true };
    }

    // Pull knowledge graph context for query enrichment
    const graphContext = await KnowledgeGraph.enrichQuery(query);

    // ─── Agent 1: Planner ───────────────────────────────────────────────
    await progress('planner', 'running');
    const plan = await PlannerAgent(query);
    streamingResult.plan = plan;
    await progress('planner', 'done');

    // ─── Agent 2: Research ──────────────────────────────────────────────
    await progress('research', 'running');
    const research = await ResearchAgent(plan, query, graphContext);
    streamingResult.research = research;
    await progress('research', 'done');

    // ─── Agents 3, 4, 5 in parallel ─────────────────────────────────────
    await progress('finance',   'running');
    await progress('chart',     'running');
    await progress('factcheck', 'running');

    const [finance, charts, factCheck] = await Promise.all([
      FinanceAgent(query, research),
      ChartAgent(  {},     research, plan),
      FactCheckAgent(plan, research),
    ]);
    
    streamingResult.finance = finance;
    await progress('finance', 'done');
    
    streamingResult.charts = charts;
    await progress('chart', 'done');
    
    streamingResult.factCheck = factCheck;
    await progress('factcheck', 'done');

    // ─── Agent 6: Citation ───────────────────────────────────────────────
    await progress('citation', 'running');
    const citation = await CitationAgent(research);
    streamingResult.citation = citation;
    await progress('citation', 'done');

    // ─── Agent 7: Writing ────────────────────────────────────────────────
    await progress('writing', 'running');
    const reportJson = await WritingAgent({ query, plan, research, finance, factCheck, citation });
    streamingResult.reportJson = reportJson; // Keep structured JSON
    streamingResult.report = (reportJson.sections || []).map(s => `# ${s.title}\n${s.content}`).join('\n\n'); // Markdown compatibility
    await progress('writing', 'done');

    // ─── Timeline ────────────────────────────────────────────────────────
    const timeline = TimelineEngine.generate(research, finance, plan);
    streamingResult.timeline = timeline;

    // ─── Persist to memory + knowledge graph ─────────────────────────────
    const reportId = await ResearchMemory.save(streamingResult, userId);
    streamingResult.reportId = reportId;
    
    await KnowledgeGraph.ingestEntities(research.entities || [], reportId);

    if (userId && jobId) {
      await jobQueue.update(userId, jobId, {
        status: 'complete',
        completedAt: new Date().toISOString(),
        reportId,
      });
    }

    Logger.info('Orchestrator', `Research complete. Report ID: ${reportId}`);
    return streamingResult;

  } catch (err) {
    monitoring.captureError(err, { query, userId, jobId });
    Logger.error('Orchestrator', err.message, { query });

    if (userId && jobId) {
      await jobQueue.update(userId, jobId, {
        status: 'error',
        errorMessage: err.message,
        completedAt: new Date().toISOString(),
      });
    }
    throw err;
  }
}
