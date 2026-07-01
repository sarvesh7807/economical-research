import React, { useState, useEffect } from 'react';
import libraryManager from '../../research/LibraryManager.js';

export default function LibraryManagerComponent({ userId, onSelectReport }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadBookmarks = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const list = await libraryManager.getBookmarks(userId);
      setBookmarks(list);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, [userId]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this bookmark?')) return;
    await libraryManager.deleteBookmark(userId, id);
    loadBookmarks();
  };

  if (!userId) return null;

  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 font-sans shadow-lg space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F4A726]/10 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
            saved credentials registry
          </span>
          <h3 className="font-serif text-base font-black text-white uppercase tracking-tight mt-0.5">
            Personal Research Library
          </h3>
        </div>
        <button
          onClick={loadBookmarks}
          className="text-[8px] font-mono font-bold uppercase tracking-wider text-[#F4A726] hover:text-white bg-transparent border-none cursor-pointer"
        >
          refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6 text-[10px] font-mono text-gray-500 uppercase tracking-widest animate-pulse">
          Retrieving credentials...
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-[10px] uppercase font-mono tracking-wider">
          <span>Your personal research library is clean</span>
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              onClick={() => onSelectReport({ id: bm.reportId, query: bm.query })}
              className="p-3 bg-[#060D17]/40 border border-white/5 rounded-md hover:border-[#F4A726]/20 transition-all cursor-pointer flex justify-between gap-3"
            >
              <div className="space-y-1.5 flex-grow">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-1.5 py-0.2 rounded text-[7px] font-mono font-bold uppercase border ${
                    bm.isSection 
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                      : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                  }`}>
                    {bm.isSection ? 'Section' : 'Report'}
                  </span>
                  <span className="text-[8px] font-mono text-gray-500 uppercase">
                    {new Date(bm.bookmarkedAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-[11px] font-bold text-white uppercase tracking-wide line-clamp-1">
                  {bm.isSection ? `${bm.sectionTitle} (${bm.query})` : bm.query}
                </h4>
                <p className="text-[10px] text-gray-400 font-serif line-clamp-2 leading-relaxed">
                  {bm.isSection ? bm.sectionContent : bm.reportSummary}
                </p>
              </div>

              <button
                onClick={(e) => handleDelete(e, bm.id)}
                className="text-[9px] font-mono font-bold text-red-400 hover:text-red-300 uppercase bg-transparent border-none cursor-pointer self-start p-1"
                title="Remove from library"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
