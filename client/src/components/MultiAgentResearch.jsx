import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { runOrchestrator } from '../ai/agents/Orchestrator';
import researchMemory from '../research/ResearchMemory';
import knowledgeGraph from '../research/KnowledgeGraph';
import ThinkingProcessPanel from './research/ThinkingProcessPanel';
import ReportViewer from './research/ReportViewer';
import TimelineViewer from './research/TimelineViewer';
import KnowledgeGraphViewer from './research/KnowledgeGraphViewer';
import SourceReliabilityPanel from './research/SourceReliabilityPanel';
import FactCheckMeter from './research/FactCheckMeter';
import ChartRenderer from './research/ChartRenderer';
import ExportPanel from './research/ExportPanel';
import ResearchHistoryPanel from './research/ResearchHistoryPanel';
import ReadingModeSelector from './research/ReadingModeSelector';
import ConfidenceDashboard from './research/ConfidenceDashboard';
import VersionHistoryPanel from './research/VersionHistoryPanel';
import LibraryManagerComponent from './research/LibraryManager';
import libraryManager from '../research/LibraryManager';
import AIRouter from '../ai/AIRouter';
import { parseJsonSafely } from '../ai/agents/agentUtils';
import { checkMessageLimit, incrementMessageCount } from '../utils/chatbotUsage';

const EXAMPLE_PROMPTS = [
  'U.S. monetary policy forecast & interest rate outcomes 2026',
  'Global supply chain chip disruption and semiconductor stock impacts',
  'European energy market sustainability & clean tech transition outlook',
  'Emerging markets GDP growth comparison: India vs China 2026-2030',
];

export default function MultiAgentResearch() {
  const { user, subscription } = useAuth();
  const [queryInput, setQueryInput] = useState('');
  const [running, setRunning] = useState(false);
  const [adapting, setAdapting] = useState(false);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  
  // History and graph states
  const [history, setHistory] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [prefillContext, setPrefillContext] = useState(null);
  
  // Reading mode and bookmarks
  const [activeReadingMode, setActiveReadingMode] = useState('researcher');
  const [bookmarkedSections, setBookmarkedSections] = useState([]);

  // Daily limit check
  const [dailyRemaining, setDailyRemaining] = useState('unlimited');

  const loadBookmarks = async () => {
    if (!user) return;
    try {
      const bms = await libraryManager.getBookmarks(user.uid);
      setBookmarkedSections(bms);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  };

  // Load history & graph on mount/user change
  useEffect(() => {
    const loadLogsAndGraph = async () => {
      try {
        if (user) {
          const pastReports = await researchMemory.getHistory(user.uid, 15);
          setHistory(pastReports);
          await loadBookmarks();
        }
        const currentGraph = await knowledgeGraph.getGraph(60);
        setGraphData(currentGraph);
      } catch (err) {
        console.error('Failed to load history or graph:', err);
      }
    };
    loadLogsAndGraph();

    // Check message limits
    const checkLimit = async () => {
      const limitInfo = await checkMessageLimit(user, subscription);
      setDailyRemaining(limitInfo.remaining);
    };
    checkLimit();
  }, [user, subscription]);

  // Listen for clickable Knowledge Graph pre-fill event
  useEffect(() => {
    const handlePrefill = (e) => {
      if (e.detail && e.detail.query) {
        setQueryInput(e.detail.query);
        setPrefillContext(e.detail);
        
        // Auto-run research with a short delay
        setTimeout(() => {
          handleTriggerResearch(e.detail.query);
        }, 1200);
      }
    };
    window.addEventListener('er-research-prefill', handlePrefill);
    return () => window.removeEventListener('er-research-prefill', handlePrefill);
  }, [user, subscription]);

  const handleTriggerResearch = async (targetQuery) => {
    const q = targetQuery || queryInput;
    if (!q.trim()) return;

    // Check limit
    const limitInfo = await checkMessageLimit(user, subscription);
    if (!limitInfo.allowed) {
      alert('Daily Limit Reached: You have exhausted your allowed free reports for today. Please upgrade to a PRO desk to continue.');
      return;
    }

    setRunning(true);
    setProgress({});
    setError(null);
    setReport(null);
    setActiveReadingMode('researcher');

    try {
      const result = await runOrchestrator(q, user ? user.uid : null, (agentId, status, data) => {
        setProgress(prev => ({ ...prev, [agentId]: status }));
        if (data) {
          // Stream results live to report state
          setReport(data);
        }
      });
      
      setReport(result);
      
      // Update limits and increment stats
      await incrementMessageCount(user);
      const updatedLimit = await checkMessageLimit(user, subscription);
      setDailyRemaining(updatedLimit.remaining);

      // Refresh history & graph
      if (user) {
        const pastReports = await researchMemory.getHistory(user.uid, 15);
        setHistory(pastReports);
      }
      const currentGraph = await knowledgeGraph.getGraph(60);
      setGraphData(currentGraph);
      setPrefillContext(null);

    } catch (err) {
      setError(err.message || 'An error occurred during multi-agent research.');
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const handleSelectPastReport = (pastReport) => {
    setReport(pastReport);
    setQueryInput(pastReport.query);
    setPrefillContext(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookmarkSection = async (section) => {
    if (!user) {
      alert('Authentication Required: Please log in to bookmark sections to your Research Library.');
      return;
    }
    await libraryManager.saveBookmark(user.uid, report, section);
    await loadBookmarks();
  };

  const handleReadingModeChange = async (newMode) => {
    if (!report || newMode === activeReadingMode) {
      setActiveReadingMode(newMode);
      return;
    }

    setAdapting(true);
    setActiveReadingMode(newMode);

    try {
      const originalSections = report.reportJson?.sections || [];
      const sectionsString = JSON.stringify(originalSections.map(s => ({ id: s.id, content: s.content })));
      
      const prompt = `You are a professional financial editor. Re-write the following sections of an economic report to suit a ${newMode} audience.
      
      Rules:
      - DO NOT alter any factual data, numbers, dates, rates, or core findings.
      - Translate the tone to match the target audience persona:
        * beginner: Explain any financial jargon simply, keep sentences clean.
        * student: Highly educational, explanatory, and structured.
        * investor: Focus on asset classes, yield changes, ROI, and actionable risks.
        * executive: Direct, summary bullet-points, actions first.
        * journalist: Narrative-driven, strong lead hooks, headline summaries.
        * researcher: Highly technical, standard academic phrasing.
      - Maintain the exact same section IDs.
      
      Return ONLY a valid JSON array matching this structure (no markdown fences, no comments):
      [
        { "id": "exec_summary", "content": "..." },
        ...
      ]
      
      Original Sections Data:
      ${sectionsString}`;

      const response = await AIRouter.route(prompt, 'writing', { maxTokens: 3500 });
      const parsed = parseJsonSafely(response);
      
      if (parsed && Array.isArray(parsed)) {
        const updatedSections = originalSections.map(original => {
          const adapted = parsed.find(p => p.id === original.id);
          return {
            ...original,
            content: adapted ? adapted.content : original.content
          };
        });
        
        setReport(prev => ({
          ...prev,
          reportJson: {
            ...prev.reportJson,
            sections: updatedSections
          }
        }));
      }
    } catch (err) {
      console.error('Reading mode adaptation failed:', err);
    } finally {
      setAdapting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-white font-sans">
      
      {/* Masthead Header Banner */}
      <div className="border-b border-[#F4A726]/10 pb-5">
        <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
          economical research intelligence engine
        </span>
        <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
          Deep Research Desk
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-3xl leading-relaxed">
          Unlock our multi-agent economic model. This system coordinates 7 specialized AI agents (Planning, Gathering, Financial Analysis, Visualization, Fact-checking, Citation, and Synthesis) to compile comprehensive briefings from verified sources.
        </p>
      </div>

      {/* Query input console */}
      <div className="bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-5 shadow-lg space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-wider">
            Research Target brief / query
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter economic query (e.g. 'Impact of global semiconductor shortages on automobile pricing...')"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              disabled={running}
              className="flex-grow bg-[#060D17] border border-white/5 rounded px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#F4A726]/40 transition-colors"
            />
            <button
              onClick={() => handleTriggerResearch()}
              disabled={running || !queryInput.trim()}
              className="bg-[#F4A726] hover:bg-[#D48E19] text-navy font-bold px-6 py-3 rounded text-xs uppercase tracking-wide transition-colors duration-200 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {running ? 'Processing...' : '🔬 Research'}
            </button>
          </div>
          {prefillContext && (
            <div className="text-[9.5px] font-mono text-[#F4A726] bg-[#F4A726]/5 border border-[#F4A726]/15 px-2.5 py-1 rounded inline-flex items-center gap-1.5 self-start animate-pulse">
              <span>Context: Prefilled from Knowledge Graph Entity "{prefillContext.query.split(' ')[0]}"</span>
            </div>
          )}
        </div>

        {/* Daily limit badge */}
        <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 border-t border-white/5 pt-3">
          <span>Usage Quota: {dailyRemaining === 'unlimited' ? '✨ Unlimited (PRO member)' : `💬 ${dailyRemaining} reports remaining today`}</span>
          <span className="hidden sm:inline">All research runs on Economical Research AI Engine</span>
        </div>

        {/* Quick prompts */}
        {!running && (
          <div className="space-y-2 border-t border-white/5 pt-3">
            <span className="text-[8.5px] font-mono font-bold text-gray-500 uppercase tracking-wider block">
              Suggested research targets
            </span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQueryInput(prompt);
                    handleTriggerResearch(prompt);
                  }}
                  className="bg-[#060D17] border border-white/5 hover:border-[#F4A726]/20 text-[10px] text-gray-400 hover:text-white px-3 py-1.5 rounded transition-all duration-150 text-left cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress Dashboard */}
      {running && (
        <div className="animate-fadeIn">
          <ThinkingProcessPanel progress={progress} />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 text-xs flex gap-3 items-center">
          <span className="text-lg">⚠️</span>
          <div>
            <h4 className="font-bold text-white">Research Brief Pipeline Aborted</h4>
            <p className="text-gray-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Streaming / Final Report Dashboard */}
      {report && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Main 2-column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Report Content */}
            <div className="lg:col-span-2 space-y-6">
              {adapting && (
                <div className="p-3 bg-[#F4A726]/10 border border-[#F4A726]/30 text-[#F4A726] text-[10px] font-mono rounded animate-pulse">
                  ⚡ Re-compiling report language style to suit target persona...
                </div>
              )}
              <ReportViewer 
                report={report} 
                onBookmarkSection={handleBookmarkSection}
                bookmarkedSections={bookmarkedSections}
              />
              {report.timeline && <TimelineViewer timeline={report.timeline} />}
            </div>

            {/* Right: Charts, Citations, Reliability, Export */}
            <div className="space-y-6">
              <ReadingModeSelector 
                activeMode={activeReadingMode} 
                onChangeMode={handleReadingModeChange}
                disabled={running || adapting}
              />

              <ConfidenceDashboard report={report} />

              {!running && user && (
                <VersionHistoryPanel 
                  userId={user.uid}
                  reportId={report.id || report.reportId}
                  currentVersion={report.reportVersion || 1}
                  onRestoreReport={(restored) => setReport(restored)}
                  onContinueResearch={(v) => { setQueryInput(v.query); setReport(v); }}
                />
              )}

              <ExportPanel reportData={report} subscription={subscription} />
              
              {report.charts && report.charts.length > 0 && (
                <ChartRenderer charts={report.charts} />
              )}
              
              {report.factCheck && (
                <FactCheckMeter factCheck={report.factCheck} />
              )}
              
              {report.citation?.scoredSources && (
                <SourceReliabilityPanel sources={report.citation.scoredSources} />
              )}
            </div>

          </div>

        </div>
      )}

      {/* Knowledge Graph Board, History & Library */}
      {!running && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 border-t border-[#F4A726]/10">
          <div className="lg:col-span-2">
            <KnowledgeGraphViewer graphData={graphData} />
          </div>
          <div className="space-y-6">
            {user && (
              <LibraryManagerComponent 
                userId={user.uid}
                onSelectReport={handleSelectPastReport}
              />
            )}
            <ResearchHistoryPanel history={history} onSelectReport={handleSelectPastReport} />
          </div>
        </div>
      )}

    </div>
  );
}
