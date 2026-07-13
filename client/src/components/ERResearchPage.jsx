import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { runOrchestrator } from '../ai/agents/Orchestrator';
import { callGemini } from '../utils/geminiCaller';
import researchMemory from '../research/ResearchMemory';
import libraryManager from '../research/LibraryManager';
import ThinkingProcessPanel from './research/ThinkingProcessPanel';
import AIRouter from '../ai/AIRouter';
import { checkMessageLimit, incrementMessageCount } from '../utils/chatbotUsage';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { trackUserResearch } from '../utils/LearningTracker';

// Lazy load the heavy ResearchWorkspace (FEATURE 8)
const ResearchWorkspace = lazy(() => import('./ResearchWorkspace'));

const EXAMPLE_PROMPTS = [
  'U.S. monetary policy forecast & interest rate outcomes 2026',
  'Global supply chain chip disruption and semiconductor stock impacts',
  'European energy market sustainability & clean tech transition outlook',
  'Emerging markets GDP growth comparison: India vs China 2026-2030',
];

// Shimmer Loader Component (FEATURE 8)
function ShimmerLoader() {
  return (
    <div className="space-y-6 my-8">
      <div className="h-6 bg-gray-800 rounded w-1/4 animate-shimmer-dark"></div>
      <div className="h-4 bg-gray-800 rounded w-1/2 animate-shimmer-dark"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-32 bg-[#060D17] border border-white/5 rounded p-4 space-y-3">
            <div className="h-4 bg-gray-800 rounded w-1/3 animate-shimmer-dark"></div>
            <div className="h-3 bg-gray-800 rounded w-full animate-shimmer-dark"></div>
            <div className="h-3 bg-gray-800 rounded w-5/6 animate-shimmer-dark"></div>
          </div>
          <div className="h-48 bg-[#060D17] border border-white/5 rounded p-4 space-y-3">
            <div className="h-4 bg-gray-800 rounded w-1/4 animate-shimmer-dark"></div>
            <div className="h-3 bg-gray-800 rounded w-full animate-shimmer-dark"></div>
            <div className="h-3 bg-gray-800 rounded w-full animate-shimmer-dark"></div>
            <div className="h-3 bg-gray-800 rounded w-4/5 animate-shimmer-dark"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-[#0A1628] border border-white/5 rounded-lg p-5 space-y-3">
            <div className="h-4 bg-gray-800 rounded w-1/2 animate-shimmer-dark"></div>
            <div className="h-8 bg-gray-800 rounded w-full animate-shimmer-dark"></div>
            <div className="h-8 bg-gray-800 rounded w-full animate-shimmer-dark"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ERResearchPage() {
  const { user, subscription } = useAuth();
  const [queryInput, setQueryInput] = useState('');
  const [running, setRunning] = useState(false);
  const [adapting, setAdapting] = useState(false);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  
  const [activeReadingMode, setActiveReadingMode] = useState('researcher');
  const [bookmarkedSections, setBookmarkedSections] = useState([]);
  const [dailyRemaining, setDailyRemaining] = useState('unlimited');

  // Floating AI Assistant States (FEATURE 2)
  const [floatingOpen, setFloatingOpen] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // Load bookmarks & limit info
  const loadBookmarks = async () => {
    if (!user) return;
    try {
      const bms = await libraryManager.getBookmarks(user.uid);
      setBookmarkedSections(bms);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
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
            setError(`The shared research brief "${e.detail.slug}" could not be found or retrieved.`);
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

  // Listen for library opening event
  useEffect(() => {
    const handleLoadReport = (e) => {
      if (e.detail) {
        setReport(e.detail);
        setQueryInput(e.detail.query || '');
      }
    };
    window.addEventListener('er-research-load-report', handleLoadReport);
    return () => window.removeEventListener('er-research-load-report', handleLoadReport);
  }, []);

  // Main Research Trigger Pipeline
  const handleTriggerResearch = async (targetQuery) => {
    const q = targetQuery || queryInput;
    if (!q.trim()) return;

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
    setFollowUpAnswer('');

    try {
      const result = await runOrchestrator(q, user ? user.uid : null, (agentId, status, data) => {
        setProgress(prev => ({ ...prev, [agentId]: status }));
        if (data) {
          setReport(data);
        }
      });
      
      setReport(result);
      
      // Save research to Firestore when complete (FEATURE 4)
      try {
        await addDoc(collection(db, 'er_research_reports'), {
          userId: user?.uid || 'guest',
          query: q,
          title: result.plan?.intent || q,
          report: result.report || '',
          charts: result.charts || [],
          createdAt: new Date().toISOString(),
          isFavorite: false,
          tags: result.plan?.tasks?.slice(0, 3) || []
        });
      } catch (fsErr) {
        console.error('Failed to save report to Firestore collection:', fsErr);
      }

      if (user) {
        try {
          await trackUserResearch(user.uid, q);
        } catch (trackErr) {
          console.error('Failed to track user research:', trackErr);
        }
      }

      await incrementMessageCount(user);
      const updatedLimit = await checkMessageLimit(user, subscription);
      setDailyRemaining(updatedLimit.remaining);

      if (user) {
        loadBookmarks();
      }
    } catch (err) {
      setError(err.message || 'An error occurred during multi-agent research.');
      console.error(err);
    } finally {
      setRunning(false);
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
    } catch (err) {
      setError(err.message || 'Smart refresh failed.');
    } finally {
      setRunning(false);
    }
  };

  const handleBookmarkSection = async (section) => {
    if (!user) {
      alert('Authentication Required: Please log in to bookmark sections.');
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
      let parsed = [];
      try {
        parsed = JSON.parse(response);
      } catch (e) {
        console.error('Failed to parse tone json', e);
      }
      
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

  // Follow-up handler with report context (FEATURE 2)
  const handleFollowUp = async (question) => {
    if (!question.trim()) return;
    setFollowUpLoading(true);
    setFollowUpAnswer('');

    const currentReportQuery = report?.query || queryInput;
    const contextPrompt = `
    You are Economical Research AI.
    Current report topic: ${currentReportQuery}
    Report summary: ${report?.report?.slice(0, 500)}
    
    User follow-up question: ${question}
    
    Answer concisely and professionally.
    Never mention Gemini or any AI provider.
    `;

    try {
      const answer = await Promise.race([
        callGemini(contextPrompt, 1000),
        new Promise(resolve => 
          setTimeout(() => resolve(null), 45000)
        )
      ]);
      setFollowUpAnswer(answer || 'Service busy. Please try again in 2 minutes.');
    } catch (e) {
      console.error(e);
      setFollowUpAnswer('Error occurred. Please try again.');
    } finally {
      setFollowUpLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-white font-sans relative min-h-[calc(100vh-140px)]">
      {/* Page Title & Intro */}
      <div className="border-b border-[#F4A726]/10 pb-4">
        <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
          economical research intelligence engine
        </span>
        <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
          Deep Research Desk
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-3xl leading-relaxed">
          Unlock our multi-agent economic model. This system coordinates specialized AI agents (Planning, Gathering, Financial Analysis, Visualization, Fact-checking, Citation, and Synthesis) to compile comprehensive briefings from verified sources.
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
        <div className="space-y-4">
          <ThinkingProcessPanel progress={progress} />
          {/* Shimmer Loader block (FEATURE 8) */}
          <ShimmerLoader />
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

      {/* Report Workspace Layout (FEATURE 1) */}
      {!running && report && (
        <Suspense fallback={<ShimmerLoader />}>
          <ResearchWorkspace 
            report={report}
            setReport={setReport}
            running={running}
            adapting={adapting}
            queryInput={queryInput}
            setQueryInput={setQueryInput}
            handleTriggerResearch={handleTriggerResearch}
            handleRefreshReport={handleRefreshReport}
            handleReadingModeChange={handleReadingModeChange}
            activeReadingMode={activeReadingMode}
            user={user}
            subscription={subscription}
            bookmarkedSections={bookmarkedSections}
            handleBookmarkSection={handleBookmarkSection}
          />
        </Suspense>
      )}

      {/* Floating AI Assistant (FEATURE 2) */}
      {report && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999
        }}>
          {floatingOpen && (
            <div style={{
              width: '320px',
              background: '#0A1628',
              border: '1px solid rgba(244,167,38,0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}>
              <div className="flex justify-between items-center mb-3">
                <p style={{
                  color: '#F4A726', 
                  fontSize: '13px',
                  fontWeight: '700', 
                  margin: 0
                }}>
                  Ask about this report
                </p>
                <button 
                  onClick={() => setFloatingOpen(false)}
                  className="text-gray-400 hover:text-white font-bold bg-transparent border-none text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Suggestions */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '12px'
              }}>
                {[
                  'Explain this in simple terms',
                  'Compare with another country',
                  'What are the risks?',
                  'Translate this report'
                ].map(suggestion => (
                  <button key={suggestion}
                    onClick={() => {
                      setFollowUpQuery(suggestion);
                      handleFollowUp(suggestion);
                    }}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(244,167,38,0.1)',
                      color: '#F4A726',
                      border: '1px solid rgba(244,167,38,0.2)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    className="hover:bg-[#F4A726]/25 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Answer display */}
              {followUpAnswer && (
                <div className="bg-[#060D17] border border-white/5 rounded-lg p-3 text-xs mb-3 text-gray-300 leading-normal max-h-[140px] overflow-y-auto scrollbar-thin">
                  {followUpAnswer}
                </div>
              )}

              {followUpLoading && (
                <div className="text-[10px] text-[#F4A726] font-mono animate-pulse mb-3">
                  Thinking...
                </div>
              )}

              {/* Chat Input */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={followUpQuery}
                  onChange={e => setFollowUpQuery(e.target.value)}
                  placeholder="Ask a follow-up question..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(244,167,38,0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleFollowUp(followUpQuery);
                  }}
                />
                <button
                  onClick={() => handleFollowUp(followUpQuery)}
                  style={{
                    padding: '8px 12px',
                    background: '#F4A726',
                    color: '#0A1628',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  className="hover:bg-[#D48E19] transition-colors"
                >
                  Ask
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => setFloatingOpen(!floatingOpen)}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#F4A726',
              color: '#0A1628',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(244,167,38,0.4)'
            }}
            className="hover:scale-105 transition-transform flex items-center justify-center"
            title="Ask Assistant"
          >
            🤖
          </button>
        </div>
      )}
    </div>
  );
}
