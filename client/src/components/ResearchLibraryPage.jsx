import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function ResearchLibraryPage({ setView }) {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'week' | 'month'
  const [selectedTag, setSelectedTag] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Load reports from Firestore
  const loadReports = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'er_research_reports'),
        where('userId', '==', user?.uid || 'guest')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      // In-memory sort by createdAt descending to avoid missing index errors
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      setReports(list);
    } catch (err) {
      console.error('Failed to load saved research reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [user]);

  // Favorite toggle handler
  const handleToggleFavorite = async (e, report) => {
    e.stopPropagation();
    try {
      const reportRef = doc(db, 'er_research_reports', report.id);
      const nextFavorite = !report.isFavorite;
      await updateDoc(reportRef, {
        isFavorite: nextFavorite
      });
      // update state
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, isFavorite: nextFavorite } : r));
    } catch (err) {
      console.error('Failed to update favorite status:', err);
    }
  };

  // Delete handler
  const handleDeleteReport = async (e, reportId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this report brief from library?')) return;
    try {
      await deleteDoc(doc(db, 'er_research_reports', reportId));
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  // Open report handler
  const handleOpenReport = (report) => {
    // Open in ER research page
    window.dispatchEvent(new CustomEvent('er-research-load-report', { detail: report }));
    setView('er-research');
  };

  // Extract unique tags for the filter dropdown
  const allTags = Array.from(
    new Set(
      reports.reduce((acc, r) => {
        if (Array.isArray(r.tags)) {
          r.tags.forEach(tag => acc.push(tag));
        }
        return acc;
      }, [])
    )
  );

  // Filter reports
  const filteredReports = reports.filter(r => {
    // 1. Search filter
    const matchesSearch = 
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.query?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.report?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Favorites only
    if (favoritesOnly && !r.isFavorite) return false;

    // 3. Tag filter
    if (selectedTag !== 'all' && (!Array.isArray(r.tags) || !r.tags.includes(selectedTag))) {
      return false;
    }

    // 4. Date filter
    if (dateFilter !== 'all') {
      const reportDate = r.createdAt ? new Date(r.createdAt) : new Date(0);
      const diffMs = new Date() - reportDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (dateFilter === 'week' && diffDays > 7) return false;
      if (dateFilter === 'month' && diffDays > 30) return false;
    }

    return true;
  });

  // Recent reports (last 10 of all reports)
  const recentReports = reports.slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      
      {/* Title Header */}
      <div className="border-b border-[#F4A726]/10 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
            saved credentials library
          </span>
          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
            Research Library
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Manage your saved intelligence briefings, search previous query results, and bookmark key indicators.
          </p>
        </div>
        
        {/* Navigation shortcut */}
        <button 
          onClick={() => setView('er-research')}
          className="bg-transparent border border-[#F4A726] hover:bg-[#F4A726] hover:text-[#0A1628] text-[#F4A726] font-bold px-5 py-2.5 rounded text-xs uppercase tracking-wide transition-colors shrink-0 self-start"
        >
          🔬 Research Desk
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Search & Filter Console */}
        <div className="space-y-6">
          <div className="bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#F4A726] uppercase tracking-wider border-b border-[#F4A726]/10 pb-2">
              Filter briefings
            </h3>

            {/* Search Bar */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Search text</label>
              <input 
                type="text" 
                placeholder="Search queries or text..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#060D17] border border-white/5 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4A726]/40 transition-colors"
              />
            </div>

            {/* Date filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Date filter</label>
              <select 
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full bg-[#060D17] border border-white/5 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4A726]/40 transition-colors"
              >
                <option value="all">All Time</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
              </select>
            </div>

            {/* Topic/Tag filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Topic Tag</label>
              <select 
                value={selectedTag}
                onChange={e => setSelectedTag(e.target.value)}
                className="w-full bg-[#060D17] border border-white/5 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4A726]/40 transition-colors"
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            {/* Favorites Toggle */}
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="favoritesCheck" 
                checked={favoritesOnly}
                onChange={e => setFavoritesOnly(e.target.checked)}
                className="rounded border-gray-700 bg-black text-[#F4A726] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="favoritesCheck" className="text-xs text-gray-300 select-none cursor-pointer">
                ⭐ Show Favorites Only
              </label>
            </div>

            <button 
              onClick={() => { setSearchQuery(''); setDateFilter('all'); setSelectedTag('all'); setFavoritesOnly(false); }}
              className="w-full bg-[#060D17] hover:bg-white/5 border border-white/5 text-gray-400 hover:text-white py-2 rounded text-[10px] font-mono font-bold uppercase transition-colors"
            >
              Reset Filters
            </button>
          </div>

          {/* Recent list (last 10) */}
          <div className="bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 shadow space-y-3">
            <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
              Recent Briefings
            </h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {recentReports.length === 0 ? (
                <p className="text-[10px] text-gray-500 font-mono">No recent briefs.</p>
              ) : (
                recentReports.map(r => (
                  <div 
                    key={r.id} 
                    onClick={() => handleOpenReport(r)}
                    className="p-2 bg-[#060D17]/50 hover:bg-[#F4A726]/5 rounded border border-white/5 hover:border-[#F4A726]/20 transition-all cursor-pointer text-left"
                  >
                    <p className="text-[11px] font-bold text-white uppercase tracking-wide truncate mb-0.5">
                      {r.title}
                    </p>
                    <p className="text-[9px] text-gray-500 font-mono">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'n.d.'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Grid of Saved Report Cards */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="text-center py-20 text-[11px] font-mono text-[#F4A726] uppercase tracking-widest animate-pulse">
              ⏳ Compiling library records...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-20 bg-[#0A1628]/30 border border-[#F4A726]/10 rounded-lg p-6">
              <span className="text-3xl block mb-3">📁</span>
              <h3 className="text-sm font-bold text-white uppercase mb-1">No Saved Reports Found</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                {reports.length === 0 
                  ? "You have not run any research reports yet. Head over to the Deep Research Desk to trigger a run."
                  : "No saved reports match your selected search criteria or filter presets."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map(report => (
                <div 
                  key={report.id}
                  onClick={() => handleOpenReport(report)}
                  style={{
                    background: 'rgba(26,58,92,0.5)',
                    border: '1px solid rgba(244,167,38,0.15)',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer'
                  }}
                  className="hover:border-[#F4A726]/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 style={{ color: '#fff', fontSize: '15px' }} className="font-bold uppercase tracking-wide line-clamp-2 leading-snug">
                        {report.title}
                      </h3>
                      {report.isFavorite && (
                        <span className="text-sm text-[#F4A726]" title="Favorite brief">⭐</span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-gray-400">
                      <span>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'n.d.'}</span>
                      {Array.isArray(report.tags) && report.tags.slice(0, 2).map(t => (
                        <span key={t} className="px-1.5 py-0.2 bg-[#060D17] border border-white/5 rounded text-[8px] uppercase tracking-wider text-gray-400">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Summary text */}
                    <p className="text-xs text-gray-300 font-serif leading-relaxed line-clamp-3 mb-4">
                      {report.report ? report.report.replace(/#+\s+/g, '').slice(0, 180) + '...' : 'No content summary available.'}
                    </p>
                  </div>

                  {/* Actions (FEATURE 4 Layout) */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button 
                      onClick={(e) => handleToggleFavorite(e, report)}
                      className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors cursor-pointer border flex items-center gap-1 ${
                        report.isFavorite 
                          ? 'bg-[#F4A726]/10 border-[#F4A726] text-[#F4A726]' 
                          : 'bg-transparent border-gray-650 text-gray-400 hover:text-white'
                      }`}
                    >
                      {report.isFavorite ? '⭐ Favorited' : '⭐ Favorite'}
                    </button>
                    <button 
                      onClick={() => handleOpenReport(report)}
                      className="px-3 py-1.5 bg-[#F4A726] border border-[#F4A726] text-[#0A1628] hover:bg-[#D48E19] hover:border-[#D48E19] rounded text-xs font-bold uppercase transition-colors cursor-pointer"
                    >
                      📄 Open
                    </button>
                    <button 
                      onClick={(e) => handleDeleteReport(e, report.id)}
                      className="px-3 py-1.5 bg-transparent border border-red-900/40 text-red-400 hover:bg-red-500/10 hover:text-white rounded text-xs font-bold uppercase transition-colors cursor-pointer"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
