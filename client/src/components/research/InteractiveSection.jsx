import React, { useState } from 'react';

export default function InteractiveSection({ section, onBookmark, isBookmarked }) {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(section.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=er-research&section=${section.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Link copied to clipboard: ${shareUrl}`);
  };

  const getTypeLabel = (type) => {
    if (type === 'factual') return { label: 'Verified Facts', style: 'bg-blue-500/10 border-blue-500/30 text-blue-400' };
    if (type === 'prediction') return { label: '🔮 AI Forecast Projection', style: 'bg-purple-500/10 border-purple-500/30 border-dashed text-purple-400' };
    return { label: 'AI Synthesis Analysis', style: 'bg-[#F4A726]/10 border-[#F4A726]/30 text-[#F4A726]' };
  };

  const badge = getTypeLabel(section.type);

  return (
    <div className="w-full bg-[#0A1628]/45 border border-white/5 hover:border-[#F4A726]/15 rounded-lg overflow-hidden transition-all duration-200 shadow-md">
      
      {/* Section Header */}
      <div className="px-4 py-3 bg-[#0A1628] flex items-center justify-between gap-3 border-b border-white/5 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#F4A726] hover:text-white font-black text-xs bg-transparent border-none cursor-pointer focus:outline-none"
          >
            {collapsed ? '▶' : '▼'}
          </button>
          <h4 className="font-serif text-xs font-black text-white uppercase tracking-tight">
            {section.title}
          </h4>
          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border ${badge.style}`}>
            {badge.label}
          </span>
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-2">
          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1 bg-transparent border border-white/5 rounded text-gray-500 hover:text-white transition-colors cursor-pointer text-[8px] font-mono font-bold uppercase"
            title="Copy section"
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-1 bg-transparent border border-white/5 rounded text-gray-500 hover:text-white transition-colors cursor-pointer text-[8px] font-mono font-bold uppercase"
            title="Share link"
          >
            Share
          </button>

          {/* Bookmark */}
          <button
            onClick={() => onBookmark(section)}
            className={`p-1 border rounded transition-colors cursor-pointer text-[8px] font-mono font-bold uppercase ${
              isBookmarked 
                ? 'bg-[#F4A726] border-[#F4A726] text-navy' 
                : 'bg-transparent border-white/5 text-gray-500 hover:text-white'
            }`}
            title="Save to Library"
          >
            {isBookmarked ? 'Bookmarked' : 'Save'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {!collapsed && (
        <div className="p-4 text-xs font-sans text-gray-300 leading-relaxed text-justify whitespace-pre-wrap">
          {section.content}
        </div>
      )}
    </div>
  );
}
