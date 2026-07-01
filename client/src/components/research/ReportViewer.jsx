import React from 'react';

export default function ReportViewer({ reportText }) {
  if (!reportText) return null;

  const parseReport = (text) => {
    const lines = text.split('\n');
    const sections = [];
    let currentSection = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Primary Heading (#)
      if (line.startsWith('# ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          type: 'section',
          title: line.slice(2).trim(),
          content: [],
        };
      }
      // Secondary Heading (##)
      else if (line.startsWith('## ')) {
        if (currentSection) {
          currentSection.content.push({
            type: 'subsection',
            title: line.slice(3).trim(),
          });
        }
      }
      // Bullet point
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        if (currentSection) {
          // Format bold text inside bullets
          const rawText = line.slice(2).trim();
          currentSection.content.push({
            type: 'bullet',
            text: rawText,
          });
        }
      }
      // Standard Paragraph
      else {
        if (currentSection) {
          currentSection.content.push({
            type: 'paragraph',
            text: trimmed,
          });
        } else {
          // Introduction paragraph before any # headings
          currentSection = {
            type: 'section',
            title: '',
            content: [{ type: 'paragraph', text: trimmed }],
          };
        }
      }
    });

    if (currentSection) sections.push(currentSection);
    return sections;
  };

  const sections = parseReport(reportText);

  const formatText = (text) => {
    // Basic bold parsing: **text** -> <strong>text</strong>
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-[#F4A726] font-bold">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div id="er-report-root" className="w-full bg-[#060D17] text-gray-200 font-sans leading-relaxed text-xs space-y-6">
      {sections.map((section, idx) => {
        const isVerdict = section.title.toLowerCase().includes('verdict');

        if (isVerdict) {
          return (
            <div
              key={idx}
              className="bg-[#0A1628]/45 border-2 border-[#F4A726] rounded-lg p-5 shadow-lg relative overflow-hidden my-6"
            >
              <div className="absolute top-0 right-0 bg-[#F4A726] text-navy font-mono font-black text-[8px] uppercase tracking-widest px-2.5 py-0.5 rounded-bl">
                Economical Research Verdict
              </div>
              <h3 className="font-serif text-sm font-black text-[#F4A726] uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              {section.content.map((item, i) => (
                <p key={i} className="text-gray-300 font-serif leading-relaxed text-xs">
                  {formatText(item.text || '')}
                </p>
              ))}
            </div>
          );
        }

        return (
          <div key={idx} className="space-y-3">
            {section.title && (
              <h3 className="font-serif text-sm font-black text-[#F4A726] uppercase tracking-wider border-b border-[#F4A726]/10 pb-1.5 mt-4 select-none">
                {section.title}
              </h3>
            )}
            <div className="space-y-2">
              {section.content.map((item, i) => {
                if (item.type === 'subsection') {
                  return (
                    <h4 key={i} className="text-[11px] font-bold text-white uppercase tracking-wide mt-3 mb-1">
                      {item.title}
                    </h4>
                  );
                }
                if (item.type === 'bullet') {
                  return (
                    <div key={i} className="flex items-start gap-2 pl-2">
                      <span className="text-[#F4A726] mt-1 select-none">•</span>
                      <p className="flex-grow text-gray-300">
                        {formatText(item.text)}
                      </p>
                    </div>
                  );
                }
                return (
                  <p key={i} className="text-gray-400 font-sans leading-relaxed text-justify text-xs">
                    {formatText(item.text)}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
