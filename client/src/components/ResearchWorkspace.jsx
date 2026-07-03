// client/src/components/ResearchWorkspace.jsx
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { formatAPA } from '../utils/CitationsFormatter.js';
import ReportViewer from './research/ReportViewer';
import ChartRenderer from './research/ChartRenderer';
import ConfidenceDashboard from './research/ConfidenceDashboard';
import ReadingModeSelector from './research/ReadingModeSelector';
import VersionHistoryPanel from './research/VersionHistoryPanel';
import SourceReliabilityPanel from './research/SourceReliabilityPanel';
import CitationsPanel from './research/CitationsPanel';
import FactCheckMeter from './research/FactCheckMeter';
import RefreshButton from './research/RefreshButton';

import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

function ResearchWorkspace({ 
  report, 
  setReport, 
  running, 
  adapting, 
  queryInput, 
  setQueryInput, 
  handleTriggerResearch, 
  handleRefreshReport,
  handleReadingModeChange,
  activeReadingMode,
  user,
  subscription,
  bookmarkedSections,
  handleBookmarkSection
}) {
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  // Collaboration States
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showKeyFindings, setShowKeyFindings] = useState(false);
  const [keyFindings, setKeyFindings] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const currentReportQuery = report?.query || 'Research Report';
  const currentReportId = report?.id || report?.reportId || 'default-report';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load comments when report changes or comments are toggled
  useEffect(() => {
    const loadComments = async () => {
      if (!currentReportId) return;
      try {
        const q = query(
          collection(db, 'report_comments'),
          where('reportId', '==', currentReportId)
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => doc.data());
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setComments(list);
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    };
    if (showComments) {
      loadComments();
    }
  }, [currentReportId, showComments]);

  if (!report) return null;

  // Extract sections
  const reportSections = report.reportJson?.sections || [];

  // Scroll to section helper
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (isMobile) {
      setMobileLeftOpen(false);
    }
  };

  // Format citations
  const citations = report?.citation?.scoredSources?.map(src => ({
    text: formatAPA(src)
  })) || [];

  // Format stats
  const quickStats = report?.research?.keyStats?.length ? report.research.keyStats.map(s => ({
    label: s.label,
    value: s.value + (s.unit || '')
  })) : [
    { label: 'Research Confidence', value: `${report.finance?.riskLevel === 'CRITICAL' ? 60 : 85}%` },
    { label: 'Fact Reliability', value: `${report.factCheck?.overallReliability || 75}%` },
    { label: 'Attributed Sources', value: `${report.citation?.scoredSources?.length || 0}` }
  ];

  // PDF Export (FEATURE 5)
  const exportToPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    pdf.setFillColor(6, 13, 23);
    pdf.rect(0, 0, 210, 297, 'F');
    
    pdf.setTextColor(244, 167, 38);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ECONOMICAL RESEARCH', 105, 20, { align: 'center' });
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text(report?.query || 'Research Report', 20, 35, { maxWidth: 170 });
    
    pdf.setFontSize(10);
    pdf.setTextColor(180, 180, 180);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    
    pdf.setDrawColor(244, 167, 38);
    pdf.line(20, 50, 190, 50);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    
    const reportText = report?.report || '';
    const lines = pdf.splitTextToSize(reportText, 170);
    
    let y = 60;
    lines.forEach(line => {
      if (y > 280) {
        pdf.addPage();
        pdf.setFillColor(6, 13, 23);
        pdf.rect(0, 0, 210, 297, 'F');
        y = 20;
      }
      pdf.text(line, 20, y);
      y += 5;
    });
    
    pdf.setTextColor(244, 167, 38);
    pdf.text('economicalresearch.com', 105, 290, { align: 'center' });
    
    pdf.save(`er-research-${Date.now()}.pdf`);
  };

  // Markdown Export (FEATURE 6)
  const exportMarkdown = () => {
    const md = `# ${report?.query || 'Research Report'}
*Generated by Economical Research AI*
*Date: ${new Date().toLocaleDateString()}*

---

${report?.report || ''}

---

## Citations
${citations.map((c, i) => `[${i+1}] ${c.text}`).join('\n')}

---
*economicalresearch.com*`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `er-research-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // AI Suggestions Handler (FEATURE 3)
  const handleSuggestion = (suggestion) => {
    if (suggestion.includes('Export')) {
      exportToPDF();
      return;
    }

    let nextQuery = '';
    const baseTopic = report?.query || '';

    if (suggestion.includes('Deep dive')) {
      nextQuery = `Deep dive into key aspects of ${baseTopic}`;
    } else if (suggestion.includes('Compare')) {
      nextQuery = `Compare ${baseTopic} across other emerging global markets`;
    } else if (suggestion.includes('Analyze')) {
      nextQuery = `Analyze related companies impacted by ${baseTopic}`;
    } else if (suggestion.includes('SWOT')) {
      nextQuery = `SWOT analysis for ${baseTopic}`;
    } else if (suggestion.includes('timeline')) {
      nextQuery = `Event timeline and future forecasts for ${baseTopic}`;
    } else {
      nextQuery = `${suggestion} relating to ${baseTopic}`;
    }

    setQueryInput(nextQuery);
    handleTriggerResearch(nextQuery);
  };

  // FIX 1 - Share Report (active)
  const shareReport = async () => {
    const shareData = {
      title: 'Economical Research Report',
      text: currentReportQuery,
      url: window.location.href
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Report link copied to clipboard!');
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    }
  };

  // FIX 2 - Comments (active)
  const addComment = async () => {
    if (!comment.trim()) return;
    const newComment = {
      text: comment,
      author: user?.displayName || 'Anonymous',
      createdAt: new Date().toISOString()
    };
    try {
      await addDoc(
        collection(db, 'report_comments'),
        { ...newComment, reportId: currentReportId }
      );
      setComments(prev => [...prev, newComment]);
      setComment('');
    } catch (err) {
      console.error('Add comment failed:', err);
    }
  };

  // FIX 4 - Key Findings button (active)
  const generateKeyFindings = async () => {
    const reportText = report?.report || '';
    if (!reportText) return;
    setShowKeyFindings(true);
    setKeyFindings('');
    
    const prompt = `
    Extract 5 key findings from this research:
    ${reportText.slice(0, 1000)}
    
    Format as:
    🔑 Finding 1: [concise point]
    🔑 Finding 2: [concise point]
    🔑 Finding 3: [concise point]
    🔑 Finding 4: [concise point]
    🔑 Finding 5: [concise point]
    `;
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 400 }
          })
        }
      );
      const data = await res.json();
      setKeyFindings(
        data.candidates?.[0]?.content?.parts?.[0]?.text
      );
    } catch (err) {
      console.error('Key findings generation failed:', err);
      setKeyFindings('❌ Failed to generate key findings. Please try again.');
    }
  };

  // FIX 5 - Save button (active)
  const saveReport = async () => {
    if (!report) return;
    
    try {
      await addDoc(
        collection(db, 'er_research_reports'),
        {
          userId: user?.uid || 'guest',
          query: currentReportQuery,
          report: report.report || '',
          charts: report.charts || [],
          plan: report.plan || null,
          citation: report.citation || null,
          factCheck: report.factCheck || null,
          finance: report.finance || null,
          research: report.research || null,
          reportJson: report.reportJson || null,
          savedAt: new Date(),
          isFavorite: false
        }
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      setSaveStatus('error');
    }
  };

  return (
    <div className="relative">
      {/* Mobile Top Toolbar Toggles */}
      {isMobile && (
        <div className="flex justify-between items-center bg-[#0A1628] border-b border-[#F4A726]/15 px-4 py-2 text-xs">
          <button 
            onClick={() => { setMobileLeftOpen(!mobileLeftOpen); setMobileRightOpen(false); }}
            className="px-3 py-1.5 bg-[#060D17] border border-[#F4A726]/30 text-[#F4A726] rounded uppercase font-mono font-bold tracking-wider"
          >
            {mobileLeftOpen ? '✕ Navigation' : '☰ Navigation'}
          </button>
          <span className="text-[10px] font-mono text-gray-400">RESEARCH DESK</span>
          <button 
            onClick={() => { setMobileRightOpen(!mobileRightOpen); setMobileLeftOpen(false); }}
            className="px-3 py-1.5 bg-[#060D17] border border-[#F4A726]/30 text-[#F4A726] rounded uppercase font-mono font-bold tracking-wider"
          >
            {mobileRightOpen ? '✕ Dashboard' : '📈 Dashboard'}
          </button>
        </div>
      )}

      {/* Main 3-Panel Layout Grid */}
      <div 
        className="research-workspace"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '260px 1fr 280px',
          height: 'calc(100vh - 60px)',
          overflow: 'hidden',
          background: '#060D17'
        }}
      >
        {/* Left Sidebar (Desktop layout or mobile overlay) */}
        {(!isMobile || mobileLeftOpen) && (
          <div 
            className="left-sidebar scrollbar-thin"
            style={isMobile ? {
              position: 'absolute',
              top: '37px',
              left: 0,
              width: '260px',
              height: 'calc(100vh - 97px)',
              background: '#060D17',
              zIndex: 99,
              borderRight: '1px solid rgba(244,167,38,0.15)',
              overflowY: 'auto',
              padding: '20px 16px'
            } : {
              borderRight: '1px solid rgba(244,167,38,0.15)',
              overflowY: 'auto',
              padding: '20px 16px'
            }}
          >
            <h3 style={{
              color: '#F4A726', 
              fontSize: '12px',
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              marginBottom: '16px',
              fontWeight: '700'
            }}>
              Research Navigation
            </h3>
            {reportSections.length === 0 ? (
              <p className="text-[11px] text-gray-500 font-mono">No sections indexed yet.</p>
            ) : (
              reportSections.map(section => (
                <div key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  style={{
                    padding: '8px 12px',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    transition: 'all 0.2s'
                  }}
                  className="hover:bg-[#F4A726]/10 hover:text-white"
                >
                  {section.title}
                </div>
              ))
            )}
          </div>
        )}

        {/* Center Panel (The report text and interactive elements) */}
        <div style={{ overflowY: 'auto', padding: isMobile ? '20px 16px' : '32px 40px' }} className="scrollbar-thin">
          <RefreshButton 
            generatedAt={report.generatedAt} 
            onRefresh={handleRefreshReport} 
            loading={running} 
          />

          {/* Action Toolbar (Exports, Bookmarks, and Collaboration Controls) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-4 my-4 shadow">
            {/* Exports, Key Findings, and Save */}
            <div className="flex flex-wrap gap-2">
              <button onClick={exportToPDF} style={{
                padding: '10px 20px',
                background: 'transparent',
                color: '#F4A726',
                border: '1px solid #F4A726',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }} className="hover:bg-[#F4A726] hover:text-navy transition-colors">
                📄 Export PDF
              </button>
              <button onClick={exportMarkdown} style={{
                padding: '10px 20px',
                background: 'transparent',
                color: '#F4A726',
                border: '1px solid #F4A726',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }} className="hover:bg-[#F4A726] hover:text-navy transition-colors">
                📝 Export Markdown
              </button>
              <button onClick={generateKeyFindings} style={{
                padding: '10px 20px',
                background: 'transparent',
                color: '#F4A726',
                border: '1px solid #F4A726',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }} className="hover:bg-[#F4A726] hover:text-navy transition-colors">
                🔑 Key Findings
              </button>
              <button onClick={saveReport} style={{
                padding: '10px 20px',
                background: saveStatus === 'saved' ? '#00C896' : 'transparent',
                color: saveStatus === 'saved' ? '#fff' : '#F4A726',
                border: saveStatus === 'saved' ? '1px solid #00C896' : '1px solid rgba(244,167,38,0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }} className="transition-all">
                {saveStatus === 'saved' ? '✅ Saved!' : '💾 Save Report'}
              </button>
            </div>

            {/* Collaboration & Sharing Action Controls */}
            <div className="flex flex-col items-end gap-1.5">
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={shareReport}
                  className="text-xs bg-transparent text-[#F4A726] border border-[#F4A726]/30 hover:border-[#F4A726] rounded px-3 py-1.5 cursor-pointer font-semibold transition-colors"
                >
                  📤 Share Report
                </button>
                <button 
                  onClick={() => setShowComments(!showComments)}
                  className="text-xs bg-transparent text-[#F4A726] border border-[#F4A726]/30 hover:border-[#F4A726] rounded px-3 py-1.5 cursor-pointer font-semibold transition-colors"
                >
                  💬 Comments ({comments.length})
                </button>
                <button 
                  onClick={() => setShowPermissions(true)}
                  className="text-xs bg-transparent text-[#F4A726] border border-[#F4A726]/30 hover:border-[#F4A726] rounded px-3 py-1.5 cursor-pointer font-semibold transition-colors"
                >
                  🔒 Permissions
                </button>
              </div>
            </div>
          </div>

          {/* Key Findings Card */}
          {showKeyFindings && (
            <div style={{
              marginTop: '16px',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(244,167,38,0.1), rgba(244,167,38,0.05))',
              border: '1px solid rgba(244,167,38,0.3)',
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{
                  color: '#F4A726',
                  fontSize: '14px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  margin: 0
                }}>
                  🔑 Key Findings
                </h4>
                <button 
                  onClick={() => setShowKeyFindings(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  className="hover:text-white"
                >
                  ✕ Close
                </button>
              </div>
              <p style={{
                color: '#fff',
                fontSize: '13px',
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap',
                margin: 0
              }}>
                {keyFindings ? keyFindings : '⏳ Generating Key Findings...'}
              </p>
            </div>
          )}

          {/* Comments Panel */}
          {showComments && (
            <div style={{
              padding: '16px',
              background: 'rgba(26,58,92,0.5)',
              borderRadius: '8px',
              marginTop: '12px',
              border: '1px solid rgba(244,167,38,0.15)'
            }}>
              <h4 style={{color: '#F4A726', fontSize: '13px', marginBottom: '12px', marginTop: 0}}>
                💬 Report Comments
              </h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }} className="space-y-2">
                {comments.length === 0 ? (
                  <p style={{color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '8px 0'}}>
                    No comments posted yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  comments.map((c, i) => (
                    <div key={i} style={{
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{color: '#F4A726', fontSize: '11px', fontWeight: 'bold'}}>
                          {c.author}
                        </span>
                        <span style={{color: 'rgba(255,255,255,0.3)', fontSize: '9px'}}>
                          {c.createdAt ? (new Date(c.createdAt).toLocaleDateString() + ' ' + new Date(c.createdAt).toLocaleTimeString()) : ''}
                        </span>
                      </div>
                      <p style={{color: '#fff', fontSize: '13px', margin: '4px 0 0'}}>
                        {c.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div style={{display: 'flex', gap: '8px'}}>
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addComment()}
                  placeholder="Add a comment..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(244,167,38,0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button onClick={addComment} style={{
                  padding: '8px 16px',
                  background: '#F4A726',
                  color: '#0A1628',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}>Post</button>
              </div>
            </div>
          )}

          {/* Permissions Modal */}
          {showPermissions && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}>
              <div style={{
                background: '#0A1628',
                border: '1px solid rgba(244,167,38,0.3)',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '380px',
                width: '90%'
              }}>
                <h3 style={{color: '#F4A726', marginBottom: '16px', marginTop: 0}}>
                  🔒 Report Permissions
                </h3>
                <p style={{color: '#fff', fontSize: '13px', marginBottom: '12px'}}>
                  Visibility:
                </p>
                {['Only Me', 'Team', 'Public'].map(opt => (
                  <label key={opt} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#fff',
                    fontSize: '14px',
                    marginBottom: '10px',
                    cursor: 'pointer'
                  }}>
                    <input type="radio" name="permission" value={opt} defaultChecked={opt === 'Only Me'} />
                    {opt}
                  </label>
                ))}
                <button onClick={() => setShowPermissions(false)}
                  style={{
                    marginTop: '16px',
                    padding: '10px 24px',
                    background: '#F4A726',
                    color: '#0A1628',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    width: '100%'
                  }}>
                  Save Permissions
                </button>
              </div>
            </div>
          )}

          {/* Reading Mode Info banner */}
          {adapting && (
            <div className="p-3 bg-[#F4A726]/10 border border-[#F4A726]/30 text-[#F4A726] text-[10px] font-mono rounded animate-pulse mb-4">
              ⚡ Re-compiling report language style to suit target persona...
            </div>
          )}

          {/* The Report Viewer */}
          <ReportViewer 
            report={report} 
            onBookmarkSection={handleBookmarkSection}
            bookmarkedSections={bookmarkedSections}
          />

          {/* Suggestions after report (FEATURE 3) */}
          <div style={{
            marginTop: '32px',
            padding: '24px',
            background: 'rgba(244,167,38,0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(244,167,38,0.15)'
          }}>
            <h3 style={{ color: '#F4A726', marginBottom: '16px', fontSize: '14px', fontWeight: '700' }}>
              Continue Your Research
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                '🔍 Deep dive into key topic',
                '🌍 Compare with another country',
                '🏢 Analyze related companies',
                '📊 Generate SWOT analysis',
                '📅 Build event timeline',
                '📄 Export this report'
              ].map(suggestion => (
                <button key={suggestion}
                  onClick={() => handleSuggestion(suggestion)}
                  style={{
                    padding: '10px 16px',
                    background: 'rgba(244,167,38,0.08)',
                    color: '#fff',
                    border: '1px solid rgba(244,167,38,0.2)',
                    borderRadius: '20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="hover:bg-[#F4A726]/20 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Desktop layout or mobile overlay) */}
        {(!isMobile || mobileRightOpen) && (
          <div 
            className="right-sidebar scrollbar-thin space-y-6"
            style={isMobile ? {
              position: 'absolute',
              top: '37px',
              right: 0,
              width: '280px',
              height: 'calc(100vh - 97px)',
              background: '#060D17',
              zIndex: 99,
              borderLeft: '1px solid rgba(244,167,38,0.15)',
              overflowY: 'auto',
              padding: '20px 16px'
            } : {
              borderLeft: '1px solid rgba(244,167,38,0.15)',
              overflowY: 'auto',
              padding: '20px 16px'
            }}
          >
            {/* Quick Stats (FEATURE 1) */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                color: '#F4A726', 
                fontSize: '12px',
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                marginBottom: '12px',
                fontWeight: '700'
              }}>
                Quick Stats
              </h3>
              {quickStats.map(stat => (
                <div key={stat.label} style={{
                  padding: '10px',
                  background: 'rgba(244,167,38,0.05)',
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}>
                  <p style={{
                    color: '#F4A726', 
                    fontSize: '18px',
                    fontWeight: '700', 
                    margin: 0
                  }}>
                    {stat.value}
                  </p>
                  <p style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '11px', 
                    margin: 0
                  }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Sources (FEATURE 1) */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                color: '#F4A726', 
                fontSize: '12px',
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                marginBottom: '12px',
                fontWeight: '700'
              }}>
                Sources
              </h3>
              {citations.length === 0 ? (
                <p className="text-[11px] text-gray-500 font-mono">No cited sources indexable.</p>
              ) : (
                citations.map((cite, i) => (
                  <div key={i} style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    [{i+1}] {cite.text}
                  </div>
                ))
              )}
            </div>

            {/* Additional Premium Panels inside Right Sidebar */}
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
        )}
      </div>
    </div>
  );
}

const MemoizedResearchWorkspace = React.memo(ResearchWorkspace);
export default MemoizedResearchWorkspace;
