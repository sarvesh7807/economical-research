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
import RefreshButton from './research/RefreshButton';
import CitationsPanel from './research/CitationsPanel';
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

  // Listen for shareable URL load event
  useEffect(() => {
    const handleLoadPublic = async (e) => {
      if (e.detail && e.detail.slug) {
        setRunning(true);
        setError(null);
        setReport(null);
        try {
          const publicReport = await researchMemory.getPublicReport(e.detail.slug);
          if (publicReport) {
            setReport(publicReport);
            setQueryInput(publicReport.query);
          } else {
            setError(`The shared research brief "${e.detail.slug}" could not be found or retrieved from public ledger.`);
          }
        } catch (err) {
          setError('Failed to retrieve public research brief.');
        } finally {
          setRunning(false);
        }
      }
    };
    window.addEventListener('er-research-load-public', handleLoadPublic);
    return () => window.removeEventListener('er-research-load-public', handleLoadPublic);
  }, []);

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

  const handleShareReport = async () => {
    if (!report) return;
    const slug = report.query
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .trim();

    try {
      await researchMemory.savePublicReport(slug, report);
      const shareUrl = `${window.location.origin}/research/${slug}`;
      window.history.pushState({}, '', `/research/${slug}`);
      navigator.clipboard.writeText(shareUrl);
      alert(`Permanent shareable URL created and copied to clipboard:\n${shareUrl}`);
    } catch (err) {
      console.error('Failed to share report:', err);
      alert('Failed to generate shareable URL.');
    }
  };

  const handleRefreshReport = async () => {
    if (!report) return;
    setRunning(true);
    setProgress({});
    setError(null);

    try {
      const result = await runOrchestrator(
        report.query,
        user ? user.uid : null,
        (agentId, status, data) => {
          setProgress(prev => ({ ...prev, [agentId]: status }));
          if (data) {
            setReport(data);
          }
        },
        { reportId: report.id || report.reportId, existingReport: report }
      );

      setReport(result);

      if (user) {
        const pastReports = await researchMemory.getHistory(user.uid, 15);
        setHistory(pastReports);
      }
    } catch (err) {
      setError(err.message || 'Smart refresh failed.');
    } finally {
      setRunning(false);
    }
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
      <div className="deep-research-desk bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-5 shadow-lg space-y-4">
        <div className="research-query-section" style={{
          width: '100%',
          maxWidth: '100%',
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <label style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'block',
            marginBottom: '8px'
          }}>
            Research Target / Query
          </label>
          
          <textarea
            value={queryInput}
            onChange={e => setQueryInput(e.target.value)}
            disabled={running}
            placeholder="Enter economic query (e.g. 'Impact of global semiconductor shortages on automobile pricing...')"
            style={{
              width: '100%',
              maxWidth: '100%',
              padding: '12px 16px',
              background: 'rgba(26,58,92,0.5)',
              border: '1px solid rgba(244,167,38,0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              resize: 'vertical',
              minHeight: '100px',
              boxSizing: 'border-box',
              fontFamily: 'Inter, sans-serif',
              display: 'block'
            }}
          />
          
          <button
            onClick={() => handleTriggerResearch()}
            disabled={running || !queryInput.trim()}
            style={{
              width: '100%',
              maxWidth: '100%',
              marginTop: '12px',
              padding: '14px 24px',
              background: running 
                ? 'rgba(244,167,38,0.5)' 
                : '#F4A726',
              color: '#0A1628',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '15px',
              cursor: running ? 'not-allowed' : 'pointer',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
            {running ? (
              <>⏳ Researching...</>
            ) : (
              <>🔬 Start Deep Research</>
            )}
          </button>
        </div>
        {prefillContext && (
            <div className="text-[9.5px] font-mono text-[#F4A726] bg-[#F4A726]/5 border border-[#F4A726]/15 px-2.5 py-1 rounded inline-flex items-center gap-1.5 self-start animate-pulse">
              <span>Context: Prefilled from Knowledge Graph Entity "{prefillContext.query.split(' ')[0]}"</span>
            </div>
          )}

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
          
          {/* Refresh Banner */}
          <RefreshButton 
            generatedAt={report.generatedAt} 
            onRefresh={handleRefreshReport} 
            loading={running} 
          />

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
              
              <button
                onClick={handleShareReport}
                className="w-full bg-gradient-to-r from-[#F4A726]/10 to-[#F4A726]/20 border border-[#F4A726] text-[#F4A726] hover:bg-[#F4A726] hover:text-navy font-bold py-2.5 rounded text-xs uppercase tracking-wide transition-all duration-200 cursor-pointer text-center"
              >
                🔗 Share Research Brief
              </button>

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
                <div className="space-y-6">
                  <SourceReliabilityPanel sources={report.citation.scoredSources} />
                  <CitationsPanel sources={report.citation.scoredSources} />
                </div>
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
