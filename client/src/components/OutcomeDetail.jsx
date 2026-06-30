import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, addDoc, deleteDoc, increment } from 'firebase/firestore';
import { ChevronLeft, Loader, Bell, BellOff, Calendar, Clock, ExternalLink, ShieldAlert, Check } from 'lucide-react';

export default function OutcomeDetail({ setView, trackerId }) {
  const { user } = useAuth();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState(null);
  const [togglingFollow, setTogglingFollow] = useState(false);

  // Fetch story details
  const fetchStory = async () => {
    if (!trackerId) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'tracked_stories', trackerId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setStory(data);
        
        // Check if user is following this story
        if (user) {
          const q = query(
            collection(db, 'story_followers'), 
            where('userId', '==', user.uid), 
            where('storyId', '==', trackerId)
          );
          const followSnap = await getDocs(q);
          if (!followSnap.empty) {
            setIsFollowing(true);
            setFollowDocId(followSnap.docs[0].id);
          } else {
            setIsFollowing(false);
            setFollowDocId(null);
          }
        }
      } else {
        console.error('Tracked story not found');
      }
    } catch (err) {
      console.error('Error fetching story detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStory();
  }, [trackerId, user]);

  const handleFollowToggle = async () => {
    if (!user) {
      // Trigger login modal
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      return;
    }

    setTogglingFollow(true);
    try {
      const storyRef = doc(db, 'tracked_stories', trackerId);

      if (isFollowing) {
        // Unfollow
        if (followDocId) {
          await deleteDoc(doc(db, 'story_followers', followDocId));
          await updateDoc(storyRef, {
            followersCount: increment(-1)
          });
          setIsFollowing(false);
          setFollowDocId(null);
          setStory(prev => ({ ...prev, followersCount: Math.max(0, (prev.followersCount || 0) - 1) }));
        }
      } else {
        // Follow
        const newFollowDoc = await addDoc(collection(db, 'story_followers'), {
          userId: user.uid,
          storyId: trackerId,
          userEmail: user.email || '',
          followedAt: new Date().toISOString()
        });
        await updateDoc(storyRef, {
          followersCount: increment(1)
        });
        setIsFollowing(true);
        setFollowDocId(newFollowDoc.id);
        setStory(prev => ({ ...prev, followersCount: (prev.followersCount || 0) + 1 }));
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
    } finally {
      setTogglingFollow(false);
    }
  };

  // Helper: calculate days since announcement
  const getDaysSinceAnnouncement = (annDate) => {
    if (!annDate) return 0;
    const diff = Date.now() - new Date(annDate).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-yellow-400 text-xs font-mono gap-3" style={{ background: 'linear-gradient(135deg, #070E1A 0%, #0A1628 50%, #0D1F3C 100%)' }}>
        <Loader size={24} className="animate-spin text-gold" />
        <span>COMPILING TIMELINE LEDGER...</span>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white/50 text-center px-4" style={{ background: 'linear-gradient(135deg, #070E1A 0%, #0A1628 50%, #0D1F3C 100%)' }}>
        <ShieldAlert size={48} className="text-red-500 mb-4 animate-bounce" />
        <h3 className="font-serif text-xl font-bold mb-2 uppercase">Announcement Tracker Not Found</h3>
        <p className="text-xs max-w-sm mb-6">The tracked story ledger you are attempting to retrieve does not exist in our indexes.</p>
        <button onClick={() => setView('outcome-tracker')} className="px-4 py-2 bg-navy text-gold font-bold text-xs uppercase rounded">
          Return to Tracker
        </button>
      </div>
    );
  }

  const daysElapsed = getDaysSinceAnnouncement(story.originalNewsDate);

  // Status mapping
  const getTimelineStatusIndicator = () => {
    if (story.currentStage === 'completed') {
      return { text: 'COMPLETED', color: 'text-green-500 bg-green-500/10 border-green-500/20' };
    }
    if (story.currentStage === 'failed') {
      return { text: 'FAILED / SHELVED', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    }
    return { text: 'IN PROGRESS', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' };
  };

  const statusInfo = getTimelineStatusIndicator();

  const getStageIcon = (stageName, status) => {
    if (status === 'pending') return '⏳';
    if (stageName === 'completed') return '✅';
    if (stageName === 'failed') return '❌';
    return '✓';
  };

  return (
    <div className="min-h-screen font-sans pb-16" style={{ background: 'linear-gradient(135deg, #070E1A 0%, #0A1628 50%, #0D1F3C 100%)' }}>
      
      {/* Header Navigation Bar */}
      <div className="w-full border-b border-white/10 sticky top-0 z-30" style={{ background: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => setView('outcome-tracker')}
            className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-yellow-400 uppercase tracking-wider transition-colors"
          >
            <ChevronLeft size={14} />
            <span>Back to Tracker</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/40 uppercase">Story Audit Log</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
        
        {/* Story Summary Card */}
        <div className="p-6 rounded-md border border-white/10 shadow-2xl relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          
          {/* Top category/status labels */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 border border-yellow-400/20">
              {story.category}
            </span>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-widest border ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>
          </div>

          {/* Title */}
          <h2 className="font-serif text-xl md:text-2xl font-black text-white tracking-wide leading-snug mb-3">
            📋 {story.title}
          </h2>

          {/* Original promise quote section */}
          <div className="border-l-2 border-yellow-400/50 pl-4 py-1.5 my-5 bg-white/5 rounded-r-xl">
            <span className="text-[8px] font-mono font-bold text-yellow-400 uppercase tracking-widest block mb-1">Original Promise Quote</span>
            <p className="font-serif italic text-xs md:text-sm text-white/85 leading-relaxed">
              &ldquo;{story.promise}&rdquo;
            </p>
          </div>

          {/* Statistics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-b border-white/5 py-4 my-5 font-mono text-[10.5px]">
            <div className="flex items-center gap-2 text-white/60">
              <Clock size={14} className="text-yellow-400 shrink-0" />
              <span>Days Elapsed: <strong className="text-white">{daysElapsed}</strong></span>
            </div>
            {story.nextUpdateExpected && (
              <div className="flex items-center gap-2 text-white/60">
                <Calendar size={14} className="text-yellow-400 shrink-0" />
                <span>Next Audit: <strong className="text-white">{new Date(story.nextUpdateExpected).toLocaleDateString()}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2 text-white/60 col-span-2 sm:col-span-1">
              <span className="text-yellow-400 shrink-0 text-base leading-none">👥</span>
              <span>Audience List: <strong className="text-white">{story.followersCount || 0} Followers</strong></span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
            {story.originalNewsUrl ? (
              <a
                href={story.originalNewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 font-bold uppercase tracking-wider transition-colors"
              >
                <span>Read Original News Announcement</span>
                <ExternalLink size={12} />
              </a>
            ) : <div />}

            <button
              onClick={handleFollowToggle}
              disabled={togglingFollow}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                isFollowing
                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/35'
                  : 'bg-gold hover:bg-gold-light text-navy'
              }`}
            >
              {togglingFollow ? (
                <Loader size={13} className="animate-spin text-navy" />
              ) : isFollowing ? (
                <>
                  <BellOff size={13} />
                  <span>Unfollow Story</span>
                </>
              ) : (
                <>
                  <Bell size={13} />
                  <span>Follow Outcome updates</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="p-6 rounded-md border border-white/10 shadow-2xl space-y-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h3 className="font-serif text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-3">
            Milestone Timeline Log
          </h3>

          <div className="relative border-l-2 border-white/10 pl-6 ml-3 space-y-8">
            {story.stages?.map((stage, idx) => {
              const isPending = stage.status === 'pending';
              const isCurrent = story.currentStage === stage.stage;
              
              return (
                <div key={idx} className="relative">
                  {/* Bullet Indicator */}
                  <span
                    className={`absolute -left-[31px] top-0 w-4.5 h-4.5 rounded-full flex items-center justify-center border font-mono text-[9px] font-bold ${
                      isPending
                        ? 'bg-[#0A1628] border-white/20 text-white/30'
                        : isCurrent
                        ? 'bg-yellow-400 border-yellow-400 text-[#0A1628] ring-4 ring-yellow-400/20 animate-pulse'
                        : 'bg-green-500 border-green-500 text-white'
                    }`}
                    style={{ left: '-33px' }}
                  >
                    {isPending ? '⏳' : <Check size={10} />}
                  </span>

                  {/* Stage Content */}
                  <div className={`space-y-1.5 ${isPending ? 'opacity-40' : ''}`}>
                    <div className="flex flex-wrap items-baseline gap-2.5">
                      <h4 className="font-serif text-sm font-black text-white uppercase tracking-wide">
                        {stage.title}
                      </h4>
                      <span className="text-[8px] font-mono font-bold text-yellow-400 uppercase tracking-widest">
                        [{stage.stage}]
                      </span>
                      {stage.date && (
                        <span className="text-[10px] font-mono text-white/40 ml-auto">
                          {new Date(stage.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                      )}
                    </div>

                    {!isPending && stage.description && (
                      <p className="text-[11.5px] text-white/60 leading-relaxed font-sans pr-4">
                        {stage.description}
                      </p>
                    )}

                    {!isPending && stage.sourceUrl && (
                      <a
                        href={stage.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-yellow-400/80 hover:text-yellow-300 pt-1"
                      >
                        <span>Official source / Document</span>
                        <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
