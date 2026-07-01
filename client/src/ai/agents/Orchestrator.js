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

  const progress = async (agentId, status, data = null) => {
    onProgress(agentId, status, data);
    if (userId && jobId) {
      await jobQueue.update(userId, jobId, {
        [`agentProgress.${agentId}`]: status,
        status: status === 'error' ? 'error' : 'running',
      });
    }
  };

  try {
    // Create job record
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
    await progress('planner', 'done', plan);

    // ─── Agent 2: Research ──────────────────────────────────────────────
    await progress('research', 'running');
    const research = await ResearchAgent(plan, query, graphContext);
    await progress('research', 'done', research);

    // ─── Agents 3, 4, 5 in parallel ─────────────────────────────────────
    await progress('finance',   'running');
    await progress('chart',     'running');
    await progress('factcheck', 'running');

    const [finance, charts, factCheck] = await Promise.all([
      FinanceAgent(query, research),
      ChartAgent(  {},     research, plan),
      FactCheckAgent(plan, research),
    ]);
    await progress('finance',   'done', finance);
    await progress('chart',     'done', charts);
    await progress('factcheck', 'done', factCheck);

    // ─── Agent 6: Citation ───────────────────────────────────────────────
    await progress('citation', 'running');
    const citation = await CitationAgent(research);
    await progress('citation', 'done', citation);

    // ─── Agent 7: Writing ────────────────────────────────────────────────
    await progress('writing', 'running');
    const report = await WritingAgent({ query, plan, research, finance, factCheck, citation });
    await progress('writing', 'done');

    // ─── Timeline ────────────────────────────────────────────────────────
    const timeline = TimelineEngine.generate(research, finance, plan);

    // ─── Assemble result ─────────────────────────────────────────────────
    const result = {
      query,
      plan,
      research,
      finance,
      charts,
      factCheck,
      citation,
      report,
      timeline,
      generatedAt: new Date().toISOString(),
      reportVersion: 1,
      fromCache: false,
    };

    // ─── Persist to memory + knowledge graph ─────────────────────────────
    const reportId = await ResearchMemory.save(result, userId);
    await KnowledgeGraph.ingestEntities(research.entities || [], reportId);

    if (userId && jobId) {
      await jobQueue.update(userId, jobId, {
        status: 'complete',
        completedAt: new Date().toISOString(),
        reportId,
      });
    }

    Logger.info('Orchestrator', `Research complete. Report ID: ${reportId}`);
    return { ...result, reportId };

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
