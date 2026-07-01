import React from 'react';
import InteractiveSection from './InteractiveSection.jsx';
import SmartTable from './SmartTable.jsx';

export default function ReportViewer({ report, onBookmarkSection, bookmarkedSections = [] }) {
  if (!report) return null;

  // Renders from structured JSON if available (Phase 2), otherwise falls back to parsing raw markdown
  let sections = [];
  if (report.reportJson && report.reportJson.sections) {
    sections = report.reportJson.sections;
  } else if (report.report) {
    // Basic markdown parsing fallback for backward compatibility
    const lines = report.report.split('\n');
    let current = null;
    lines.forEach(line => {
      if (line.startsWith('# ')) {
        if (current) sections.push(current);
        current = {
          id: `sec-${sections.length}`,
          title: line.slice(2).trim(),
          type: line.toLowerCase().includes('verdict') ? 'analysis' : 'factual',
          content: ''
        };
      } else if (current) {
        current.content += line + '\n';
      }
    });
    if (current) sections.push(current);
  }

  if (!sections.length) return null;

  const isSectionBookmarked = (sec) => {
    return bookmarkedSections.some(b => b.sectionId === sec.id || b.id?.includes(sec.id));
  };

  return (
    <div id="er-report-root" className="w-full space-y-4">
      {sections.map((sec, idx) => (
        <div key={sec.id || idx} className="space-y-2">
          <InteractiveSection
            section={sec}
            onBookmark={(s) => onBookmarkSection(s)}
            isBookmarked={isSectionBookmarked(sec)}
          />
          {/* Automatically check if this section's content has a table to render */}
          <SmartTable content={sec.content} />
        </div>
      ))}
    </div>
  );
}
