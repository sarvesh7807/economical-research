import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ClipboardList, Search, Loader, CheckCircle, AlertCircle, PlayCircle, Eye } from 'lucide-react';

export default function OutcomeTracker({ setView }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Load all stories from Firestore
  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'tracked_stories'), orderBy('updatedAt', 'desc')));
        const list = [];
        snap.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setStories(list);
      } catch (err) {
        console.error('Error fetching tracked stories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  // Filtered stories
  const filteredStories = stories.filter(story => {
    const matchesSearch = (story.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (story.promise || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || story.category === selectedCategory;
    
    let matchesStatus = true;
    if (selectedStatus !== 'All') {
      if (selectedStatus === 'completed') {
        matchesStatus = story.currentStage === 'completed';
      } else if (selectedStatus === 'failed') {
        matchesStatus = story.currentStage === 'failed';
      } else { // 'in_progress'
        matchesStatus = story.currentStage !== 'completed' && story.currentStage !== 'failed';
      }
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate statistics
  const totalCount = stories.length;
  const completedCount = stories.filter(s => s.currentStage === 'completed').length;
  const failedCount = stories.filter(s => s.currentStage === 'failed').length;
  const inProgressCount = totalCount - completedCount - failedCount;

  const categories = [
    'All', 'Employment', 'Government', 'Policy', 'Infrastructure', 'Health', 'Education', 'Finance', 'Business', 'Technology', 'Science', 'Environment', 'Travel', 'Lifestyle', 'Law'
  ];

  const getStageIcon = (stageName, status) => {
    if (status === 'pending') return '⏳';
    if (stageName === 'completed') return '✅';
    if (stageName === 'failed') return '❌';
    return '✓';
  };

  const getTimelineStatusIndicator = (story) => {
    if (story.currentStage === 'completed') {
      return { text: 'COMPLETED', color: 'text-green-500 bg-green-500/10 border-green-500/20' };
    }
    if (story.currentStage === 'failed') {
      return { text: 'FAILED / SHELVED', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    }
    return { text: 'IN PROGRESS', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' };
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: 'linear-gradient(135deg, #070E1A 0%, #0A1628 50%, #0D1F3C 100%)' }}>
      
      {/* Top Banner Header */}
      <div className="w-full border-b border-white/10 py-6" style={{ background: 'rgba(10,22,40,0.4)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-2.5 mb-2">
            <ClipboardList size={24} className="text-yellow-400 animate-pulse" />
            <h1 className="font-serif text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
              News Outcome Tracker
            </h1>
          </div>
          <p className="text-xs text-white/50 max-w-xl font-serif">
            A premium policy audit dispatch. We map government promises, schemes, and announcements from initial breaking news to their real final result.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Tracked Announcements', val: totalCount, icon: <ClipboardList className="text-blue-400" size={16} /> },
            { label: 'Active In Progress', val: inProgressCount, icon: <PlayCircle className="text-yellow-400" size={16} /> },
            { label: 'Successfully Completed', val: completedCount, icon: <CheckCircle className="text-green-400" size={16} /> },
            { label: 'Failed / Shelved', val: failedCount, icon: <AlertCircle className="text-red-400" size={16} /> }
          ].map((stat, idx) => (
            <div key={idx} className="p-4 rounded-md border border-white/10 backdrop-blur-sm shadow-sm" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block">{stat.label}</span>
                {stat.icon}
              </div>
              <div className="font-mono text-2xl font-black text-white">{stat.val}</div>
            </div>
          ))}
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-md border border-white/10 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)' }}>
          
          {/* Keyword Search */}
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md text-xs bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400/40 focus:ring-1 focus:ring-yellow-400/20"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest font-mono">Category:</span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-[#0A1628] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400/40"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-[#0A1628]">{cat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest font-mono">Status:</span>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-[#0A1628] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400/40"
              >
                <option value="All" className="bg-[#0A1628]">All Outcomes</option>
                <option value="in_progress" className="bg-[#0A1628]">In Progress</option>
                <option value="completed" className="bg-[#0A1628]">Completed</option>
                <option value="failed" className="bg-[#0A1628]">Failed / Shelved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stories Listing Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-yellow-400 text-xs font-mono gap-3">
            <Loader size={20} className="animate-spin text-gold" />
            <span>RETRIEVING DISPATCH AUDITS...</span>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-md bg-white/5">
            <ClipboardList size={40} className="mx-auto text-white/20 mb-3" />
            <h3 className="font-serif text-lg font-black text-white/70 mb-1 uppercase tracking-wide">No tracked stories found</h3>
            <p className="text-xs text-white/45 max-w-sm mx-auto">No announcements match your current search and filter settings. Try altering your parameters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => {
              const statusInfo = getTimelineStatusIndicator(story);
              return (
                <div
                  key={story.id}
                  onClick={() => setView('outcome-detail', story.id)}
                  className="group rounded-md p-5 border border-white/5 transition-all duration-300 hover:scale-[1.01] hover:border-yellow-400/35 cursor-pointer flex flex-col justify-between"
                  style={{
                    background: 'linear-gradient(180deg, rgba(26,58,92,0.25) 0%, rgba(10,22,40,0.55) 100%)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  <div>
                    {/* Card Header Info */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 border border-yellow-400/20">
                        {story.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest border ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif text-sm font-black text-white leading-snug tracking-wide group-hover:text-yellow-300 transition-colors mb-2">
                      📋 {story.title}
                    </h3>
                    
                    {/* Promise Description */}
                    <p className="text-[11.5px] text-white/50 line-clamp-3 leading-normal mb-5">
                      {story.promise}
                    </p>

                    {/* Timeline Stages preview */}
                    <div className="space-y-2 border-t border-white/5 pt-4 mb-4">
                      <span className="text-[8px] font-mono font-bold text-white/30 uppercase tracking-widest block mb-2">Timeline Milestones</span>
                      <div className="space-y-1.5">
                        {story.stages?.slice(0, 4).map((stage, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[10px] font-sans">
                            <div className="flex items-center gap-1.5 text-white/70">
                              <span className="text-xs shrink-0">{getStageIcon(stage.stage, stage.status)}</span>
                              <span className={`font-semibold capitalize ${stage.status === 'pending' ? 'text-white/30 font-light' : 'text-white/70'}`}>
                                {stage.title}
                              </span>
                            </div>
                            {stage.date && (
                              <span className="text-[9px] font-mono text-white/30 shrink-0">
                                {new Date(stage.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[9px] font-mono text-white/30">
                    <span>👥 {story.followersCount || 0} Followers</span>
                    <span className="flex items-center gap-1 text-yellow-400/70 font-bold uppercase tracking-wider group-hover:text-yellow-300">
                      <Eye size={10} />
                      View Audit
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
