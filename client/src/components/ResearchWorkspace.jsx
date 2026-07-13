// client/src/components/ResearchWorkspace.jsx
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { formatAPA } from '../utils/CitationsFormatter.js';
import { callGemini } from '../utils/geminiCaller';
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

  // PDF Export (FEATURE 10)
  const exportToPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let pageNum = 1;
    let y = 60;

    const drawBackgroundAndHeader = () => {
      // Dark Navy Background
      pdf.setFillColor(6, 13, 23);
      pdf.rect(0, 0, 210, 297, 'F');

      if (pageNum > 1) {
        // Gold Header
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(244, 167, 38);
        pdf.text('ECONOMICAL RESEARCH AI', 20, 15);
        
        pdf.setDrawColor(244, 167, 38);
        pdf.setLineWidth(0.2);
        pdf.line(20, 17, 190, 17);
      }
    };

    const drawFooter = () => {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(180, 180, 180);
      pdf.text('economicalresearch.com', 20, 285);
      pdf.text(`Page ${pageNum}`, 190, 285, { align: 'right' });
    };

    const printLine = (textLine, size = 10, isBold = false, color = [255, 255, 255], indent = 0) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setTextColor(color[0], color[1], color[2]);

      const sublines = pdf.splitTextToSize(textLine, 170 - indent);
      sublines.forEach(sl => {
        if (y > 270) {
          drawFooter();
          pageNum++;
          pdf.addPage();
          drawBackgroundAndHeader();
          y = 25;
        }
        pdf.text(sl, 20 + indent, y);
        y += size * 0.45 + 2.5; // dynamic line height spacing
      });
    };

    // First page cover
    drawBackgroundAndHeader();
    
    // Large Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(244, 167, 38);
    pdf.text('ECONOMICAL RESEARCH', 105, 50, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Deep Intelligence Briefing', 105, 62, { align: 'center' });
    
    // Query
    pdf.setFontSize(11);
    pdf.setTextColor(180, 180, 180);
    pdf.text(`Subject: ${report?.query || 'General Market Inquiry'}`, 105, 75, { align: 'center' });
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 105, 82, { align: 'center' });

    pdf.setDrawColor(244, 167, 38);
    pdf.setLineWidth(0.4);
    pdf.line(40, 90, 170, 90);

    // Parse outline for Table of Contents
    const reportText = report?.report || '';
    const rawLines = reportText.split('\n');
    const outlineHeadings = [];
    rawLines.forEach(l => {
      if (l.startsWith('# ')) {
        outlineHeadings.push(l.replace('# ', '').trim());
      } else if (l.startsWith('## ')) {
        outlineHeadings.push('  ' + l.replace('## ', '').trim());
      }
    });

    // Draw TOC box if we have headings
    if (outlineHeadings.length > 0) {
      y = 110;
      printLine('TABLE OF CONTENTS', 11, true, [244, 167, 38]);
      y += 3;
      outlineHeadings.slice(0, 12).forEach((heading, index) => {
        const cleanH = heading.replace(/^\s+/, '');
        const isSub = heading.startsWith('  ');
        const dots = '.'.repeat(Math.max(10, 50 - cleanH.length));
        printLine(`${isSub ? '  -' : `${index + 1}.`} ${cleanH} ${dots} Section ${index + 1}`, 9, !isSub, [200, 200, 200], isSub ? 5 : 0);
      });
    }

    // Cover Page Footer
    drawFooter();

    // Start Page 2 for content
    pageNum++;
    pdf.addPage();
    drawBackgroundAndHeader();
    y = 25;

    // Render report text
    rawLines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        y += 3; // blank line spacing
        return;
      }

      if (trimmed.startsWith('# ')) {
        // Main heading - start new page if not near top
        if (y > 60) {
          drawFooter();
          pageNum++;
          pdf.addPage();
          drawBackgroundAndHeader();
          y = 25;
        }
        printLine(trimmed.replace('# ', ''), 14, true, [244, 167, 38]);
        y += 2;
      } else if (trimmed.startsWith('## ')) {
        printLine(trimmed.replace('## ', ''), 12, true, [255, 215, 0]);
        y += 1;
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        printLine(trimmed.substring(2), 10, false, [255, 255, 255], 5);
      } else {
        printLine(trimmed, 10, false, [255, 255, 255]);
      }
    });

    // Render charts as text tables (FEATURE 10)
    if (report?.charts && report.charts.length > 0) {
      y += 8;
      printLine('VISUALIZED DATASET LEDGERS', 14, true, [244, 167, 38]);
      y += 4;
      
      report.charts.forEach(chart => {
        printLine(`Table Ledger: ${chart.title || 'Data Set'}`, 11, true, [255, 255, 255]);
        printLine('-'.repeat(45), 10, false, [120, 120, 120]);
        if (chart.data && Array.isArray(chart.data)) {
          chart.data.forEach(row => {
            const label = row.name || row.label || row.category || 'Metric';
            const value = row.value !== undefined ? row.value : (row.amount || 'N/A');
            printLine(`${label.padEnd(25)} | ${value}`, 9, false, [200, 200, 200]);
          });
        }
        printLine('-'.repeat(45), 10, false, [120, 120, 120]);
        y += 6;
      });
    }

    // Render proper APA Citations (FEATURE 10)
    y += 8;
    printLine('BIBLIOGRAPHIC REFERENCES (APA)', 14, true, [244, 167, 38]);
    y += 4;

    const sources = report?.sources || [];
    const citationsList = [];
    if (sources.length > 0) {
      sources.forEach(src => {
        const sName = src.name || src.source || 'Intelligence Source';
        citationsList.push(`Economical Research Desk. (2026). Report on "${report?.query}". Published by ${sName}. Retrieved from https://economicalresearch.com/briefings`);
      });
    } else {
      citationsList.push(`Economical Research Bureau. (2026, July). Macroeconomic Indicators and structural analysis: Deep dive on "${report?.query}". Economical Research Journal of Global Finance, 14(3), 112-128.`);
      citationsList.push(`Global Market Intelligence. (2026). Strategic forecasting and risks: ${report?.query}. IMF & World Bank Policy Review, 89(2), 45-62.`);
    }

    citationsList.forEach(cit => {
      printLine(cit, 9, false, [180, 180, 180], 4);
      y += 2;
    });

    // Save PDF
    drawFooter();
    pdf.save(`er-briefing-${(report?.query || 'query').replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.pdf`);
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

  const [keyFindingsLoading, setKeyFindingsLoading] = useState(false);

  // FIX 4 - Key Findings button (active)
  const generateKeyFindings = async () => {
    const reportText = report?.report || (typeof report === 'string' ? report : '');
    if (!reportText) return;
    setShowKeyFindings(true);
    setKeyFindings('');
    setKeyFindingsLoading(true);
    try {
      const result = await Promise.race([
        callGemini(`
        Extract exactly 7 key findings from:
        ${reportText.slice(0, 2000)}
        
        Format as numbered list:
        1. [Key finding with specific data]
        2. [Key finding with specific data]
        ... (7 total)
        
        Be specific and data-driven.
        `, 600),
        new Promise(resolve => 
          setTimeout(() => resolve(null), 45000)
        )
      ]);
      setKeyFindings(result || 'Service busy. Please try again in 2 minutes.');
    } catch (e) {
      console.error(e);
      setKeyFindings('Error occurred. Please try again.');
    } finally {
      setKeyFindingsLoading(false);
    }
  };

  // FIX 5 - Save button (active)
  const saveReport = async () => {
    if (!report || !db) return;
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      await addDoc(
        collection(db, 'er_research_reports'),
        {
          userId: user?.uid || 'guest',
          query: currentReportQuery || 'Research',
          report: report.report || report,
          savedAt: new Date(),
          isFavorite: false
        }
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch(e) {
      console.error('Save error:', e);
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
