import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Users, FileText, Bell, ShieldAlert, ArrowLeft, RefreshCw, Plus, Ban, CheckCircle, TrendingUp, AlertTriangle, ClipboardList, Trash2, Sparkles, X as XIcon, Loader } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, orderBy, where, setDoc } from 'firebase/firestore';

export default function AdminPanel({ setView }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'publish', 'alerts'
  
  // Dashboard stats state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users state
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Publish form states
  const [publishForm, setPublishForm] = useState({
    title: '',
    description: '',
    content: '',
    category: 'world',
    urlToImage: '',
    author: ''
  });
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(null);
  const [publishError, setPublishError] = useState(null);

  // Alerts states
  const [alertForm, setAlertForm] = useState({ title: '', text: '' });
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(null);

  // Verify Admin email permission
  const isAdmin = user && (user.email === 'admin@economicalresearch.com' || user.email?.endsWith('@economicalresearch.com'));

  // Outcome Tracker states
  const [storiesList, setStoriesList] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [showNewStoryForm, setShowNewStoryForm] = useState(false);
  const [selectedStoryForUpdate, setSelectedStoryForUpdate] = useState(null);
  const [aiInputText, setAiInputText] = useState('');
  const [extractingPromise, setExtractingPromise] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  
  const [newStoryForm, setNewStoryForm] = useState({
    title: '',
    category: 'Policy',
    promise: '',
    originalNewsUrl: '',
    originalNewsDate: new Date().toISOString().split('T')[0],
    initialStageDescription: '',
    initialStageSourceUrl: '',
    nextUpdateExpected: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  });

  const [newUpdateForm, setNewUpdateForm] = useState({
    stage: 'notification',
    title: '',
    description: '',
    sourceUrl: ''
  });

  const loadStories = async () => {
    setLoadingStories(true);
    try {
      const snap = await getDocs(query(collection(db, 'tracked_stories'), orderBy('updatedAt', 'desc')));
      const list = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setStoriesList(list);
    } catch (err) {
      console.error('Error loading tracked stories:', err);
    } finally {
      setLoadingStories(false);
    }
  };

  useEffect(() => {
    if (!isAdmin || activeTab !== 'outcomes') return;
    loadStories();
  }, [isAdmin, activeTab]);

  const handleCreateStorySubmit = async (e) => {
    e.preventDefault();
    if (!newStoryForm.title.trim() || !newStoryForm.promise.trim()) return;

    try {
      const dateStr = newStoryForm.originalNewsDate || new Date().toISOString();
      const nextDateStr = newStoryForm.nextUpdateExpected || new Date().toISOString();
      
      const firstStage = {
        stage: 'announcement',
        title: 'Announcement Made',
        date: new Date(dateStr).toISOString(),
        description: newStoryForm.initialStageDescription || 'Government officially made the announcement.',
        sourceUrl: newStoryForm.originalNewsUrl || '',
        status: 'completed'
      };

      const pendingNotificationStage = {
        stage: 'notification',
        title: 'Official Notification',
        date: null,
        description: 'Waiting for official gazette notification or guidelines.',
        sourceUrl: '',
        status: 'pending'
      };

      const storyData = {
        title: newStoryForm.title,
        category: newStoryForm.category,
        originalNewsUrl: newStoryForm.originalNewsUrl,
        originalNewsDate: new Date(dateStr).toISOString(),
        promise: newStoryForm.promise,
        currentStage: 'announcement',
        stages: [firstStage, pendingNotificationStage],
        finalResult: null,
        nextUpdateExpected: new Date(nextDateStr).toISOString(),
        followersCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'tracked_stories'), storyData);
      setShowNewStoryForm(false);
      setNewStoryForm({
        title: '',
        category: 'Policy',
        promise: '',
        originalNewsUrl: '',
        originalNewsDate: new Date().toISOString().split('T')[0],
        initialStageDescription: '',
        initialStageSourceUrl: '',
        nextUpdateExpected: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
      });
      setAiInputText('');
      setAiStatus(null);
      loadStories();
    } catch (err) {
      console.error('Error creating tracked story:', err);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this tracked story? This will remove all updates and follower mappings.')) return;
    try {
      await deleteDoc(doc(db, 'tracked_stories', storyId));
      loadStories();
    } catch (err) {
      console.error('Error deleting tracked story:', err);
    }
  };

  const handleAddUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStoryForUpdate || !newUpdateForm.title.trim()) return;

    try {
      const storyId = selectedStoryForUpdate.id;
      const storyRef = doc(db, 'tracked_stories', storyId);

      const newStage = {
        stage: newUpdateForm.stage,
        title: newUpdateForm.title,
        date: new Date().toISOString(),
        description: newUpdateForm.description,
        sourceUrl: newUpdateForm.sourceUrl,
        status: 'completed'
      };

      let updatedStages = [...selectedStoryForUpdate.stages];
      
      const existingPendingIdx = updatedStages.findIndex(s => s.stage === newUpdateForm.stage && s.status === 'pending');
      
      if (existingPendingIdx !== -1) {
        updatedStages[existingPendingIdx] = newStage;
      } else {
        updatedStages.push(newStage);
      }

      let finalResult = null;
      let currentStage = newUpdateForm.stage;
      if (newUpdateForm.stage === 'completed' || newUpdateForm.stage === 'failed') {
        finalResult = newUpdateForm.stage === 'completed' ? 'Successfully Completed' : 'Failed / Shelved';
        updatedStages = updatedStages.map(s => s.status === 'pending' ? { ...s, status: newUpdateForm.stage } : s);
      } else {
        const nextPendingStages = {
          'notification': 'process',
          'process': 'result',
          'result': 'completed'
        };
        const nextStageType = nextPendingStages[newUpdateForm.stage];
        if (nextStageType && !updatedStages.some(s => s.stage === nextStageType)) {
          updatedStages.push({
            stage: nextStageType,
            title: nextStageType === 'process' ? 'Implementation Process' : nextStageType === 'result' ? 'Final Outcome / Result' : 'Project Completion',
            date: null,
            description: '',
            sourceUrl: '',
            status: 'pending'
          });
        }
      }

      const stageOrder = {
        'announcement': 1,
        'notification': 2,
        'process': 3,
        'result': 4,
        'completed': 5,
        'failed': 5
      };
      
      updatedStages.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return 1;
        if (a.status !== 'pending' && b.status === 'pending') return -1;
        return stageOrder[a.stage] - stageOrder[b.stage];
      });

      const updateData = {
        currentStage: currentStage,
        stages: updatedStages,
        updatedAt: new Date().toISOString(),
        nextUpdateExpected: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
      };

      if (finalResult) {
        updateData.finalResult = finalResult;
      }

      await updateDoc(storyRef, updateData);
      
      notifyFollowers(selectedStoryForUpdate, newUpdateForm.title, newUpdateForm.description);

      setSelectedStoryForUpdate(null);
      setNewUpdateForm({
        stage: 'process',
        title: '',
        description: '',
        sourceUrl: ''
      });
      loadStories();
    } catch (err) {
      console.error('Error adding stage update:', err);
    }
  };

  const notifyFollowers = async (story, updateTitle, updateDesc) => {
    try {
      const qFollowers = query(collection(db, 'story_followers'), where('storyId', '==', story.id));
      const snap = await getDocs(qFollowers);
      const followers = [];
      snap.forEach(d => {
        followers.push(d.data());
      });

      for (const follower of followers) {
        const { userId, userEmail } = follower;

        fetch('/api/notifications/send-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            title: `Promise Tracker Update: ${story.title}`,
            text: `${updateTitle}: ${updateDesc || 'A new stage update has been published.'}`,
            url: `/outcome-tracker/${story.id}`
          })
        }).catch(err => console.error('Error sending direct push:', err));

        if (userEmail) {
          fetch('/api/notifications/dispatch-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userEmail,
              type: 'breaking',
              data: { headline: `Tracker Update: ${story.title} - ${updateTitle}` }
            })
          }).catch(err => console.error('Error sending follower email:', err));
        }

        try {
          const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await setDoc(doc(db, 'users', userId, 'notifications', notifId), {
            id: notifId,
            type: 'breaking',
            title: `Promise Tracker Update: ${story.title}`,
            text: `Milestone reached: "${updateTitle}". Stage status is now updated.`,
            timestamp: new Date().toISOString(),
            read: false,
            url: `/outcome-tracker/${story.id}`
          });
        } catch (dbErr) {
          // ignore rules restriction
        }
      }
    } catch (e) {
      console.error('Error in notifyFollowers logic:', e);
    }
  };

  const handleAiExtractPromise = async () => {
    if (!aiInputText.trim()) return;
    setExtractingPromise(true);
    setAiStatus(null);

    try {
      const res = await fetch('/api/ai/extract-promise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiInputText })
      });
      
      if (!res.ok) throw new Error('AI extraction request failed');
      const data = await res.json();

      if (data.isTrackable) {
        setNewStoryForm(prev => ({
          ...prev,
          title: data.title || '',
          category: data.category || 'Policy',
          promise: data.promise || '',
          initialStageDescription: `Announcement made: ${data.promise || ''}`,
          nextUpdateExpected: data.expectedTimeline ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0] : prev.nextUpdateExpected
        }));
        setAiStatus({ success: true, message: 'AI extracted details successfully! Form fields are updated below.' });
      } else {
        setAiStatus({ success: false, message: 'AI did not detect any trackable government promise or scheme in this article.' });
      }
    } catch (err) {
      console.error('AI extraction error:', err);
      setAiStatus({ success: false, message: 'Failed to connect to AI engine. Please enter details manually.' });
    } finally {
      setExtractingPromise(false);
    }
  };

  // Load stats
  useEffect(() => {
    if (!isAdmin) return;
    setLoadingStats(true);
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoadingStats(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingStats(false);
      });
  }, [isAdmin]);

  // Load users
  useEffect(() => {
    if (!isAdmin || activeTab !== 'users') return;
    setLoadingUsers(true);
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        setUsersList(data);
        setLoadingUsers(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingUsers(false);
      });
  }, [isAdmin, activeTab]);

  const handleUserStatusUpdate = async (userId, currentStatus, currentPlan) => {
    const nextStatus = currentStatus === 'Banned' ? 'Active' : 'Banned';
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, plan: currentPlan })
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    if (!publishForm.title.trim() || !publishForm.content.trim()) return;

    setPublishing(true);
    setPublishSuccess(null);
    setPublishError(null);

    try {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishForm)
      });
      const data = await res.json();
      if (data.success) {
        setPublishSuccess('Article successfully published and broadcasted to main wire category!');
        setPublishForm({ title: '', description: '', content: '', category: 'world', urlToImage: '', author: '' });
      } else {
        setPublishError(data.error || 'Failed to publish article.');
      }
    } catch (err) {
      console.error(err);
      setPublishError('Server error. Failed to publish.');
    } finally {
      setPublishing(false);
    }
  };

  const handleAlertSubmit = async (e) => {
    e.preventDefault();
    if (!alertForm.title.trim() || !alertForm.text.trim()) return;

    setSendingAlert(true);
    setAlertSuccess(null);

    try {
      const res = await fetch('/api/admin/push-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertForm)
      });
      const data = await res.json();
      if (data.success) {
        setAlertSuccess('Breaking push news alert broadcasted successfully!');
        setAlertForm({ title: '', text: '' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingAlert(false);
    }
  };

  const categories = [
    { id: 'world', name: 'World' },
    { id: 'india', name: 'India' },
    { id: 'politics', name: 'Politics' },
    { id: 'tech', name: 'Tech & AI' },
    { id: 'business', name: 'Business' },
    { id: 'finance', name: 'Finance' },
    { id: 'sports', name: 'Sports' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'science', name: 'Science' },
    { id: 'environment', name: 'Environment' },
    { id: 'health', name: 'Health' },
    { id: 'education', name: 'Education' },
    { id: 'travel', name: 'Travel' },
    { id: 'lifestyle', name: 'Lifestyle' },
    { id: 'law', name: 'Law & Crime' },
    { id: 'research', name: 'Research' }
  ];

  if (!isAdmin) {
    return (
      <div class="max-w-md mx-auto px-4 py-16 text-center">
        <ShieldAlert size={48} class="mx-auto text-red-500 mb-4 animate-bounce" />
        <h3 class="font-serif text-2xl font-bold text-navy dark:text-white mb-2">Access Denied</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">This administration module is restricted to verified ER correspondents.</p>
        <button 
          onClick={() => setView('feed')}
          class="px-4 py-2 bg-navy text-gold hover:bg-navy-light rounded font-bold text-xs uppercase"
        >
          Return to Wire Feed
        </button>
      </div>
    );
  }

  return (
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-8">
      {/* Back Button */}
      <button 
        onClick={() => setView('feed')}
        class="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold dark:text-gray-300 dark:hover:text-gold uppercase tracking-wider mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Return to Wire Feed</span>
      </button>

      {/* Admin Panel Container */}
      <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar Nav */}
        <div class="w-full md:w-56 bg-navy text-white p-4 flex flex-col gap-1 border-r border-gold/20">
          <div class="pb-4 mb-4 border-b border-white/10 text-center md:text-left">
            <h2 class="font-serif text-sm font-black text-gold uppercase tracking-widest">ER Control Center</h2>
            <span class="text-[9px] font-mono text-gray-400">CREDENTIALS APPROVED</span>
          </div>

          {[
            { id: 'overview', name: 'Overview Stats', icon: <BarChart size={14} /> },
            { id: 'users', name: 'User Controls', icon: <Users size={14} /> },
            { id: 'publish', name: 'Manual Publishing', icon: <FileText size={14} /> },
            { id: 'alerts', name: 'Push Dispatches', icon: <Bell size={14} /> },
            { id: 'outcomes', name: 'Outcome Tracker', icon: <ClipboardList size={14} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              class={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded uppercase tracking-wider transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-gold text-navy font-black shadow'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div class="flex-grow p-6 bg-paper dark:bg-paper-dark">
          
          {/* TAB 1: OVERVIEW STATS */}
          {activeTab === 'overview' && (
            <div class="space-y-6">
              <div class="border-b border-paper-border dark:border-paper-borderDark pb-2">
                <h3 class="font-serif text-sm font-black text-navy dark:text-gold uppercase tracking-wider">Metrics Ledger Dashboard</h3>
              </div>

              {loadingStats ? (
                <div class="flex items-center justify-center py-20 text-xs font-bold text-gray-400 gap-2">
                  <RefreshCw size={14} class="animate-spin text-gold" />
                  <span>AGGREGATING METRICS...</span>
                </div>
              ) : (
                <div class="space-y-6">
                  {/* Stats Cards */}
                  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { title: 'Subscribed Users', val: stats.totalUsers, desc: `${stats.proUsers} PRO / ${stats.basicUsers} Basic` },
                      { title: 'Monthly Revenue', val: `$${stats.monthlyRevenue}`, desc: `+12.4% MoM growth` },
                      { title: 'AdSense Yield', val: `$${stats.adSenseRevenue}`, desc: `Basic user ad spaces` },
                      { title: 'Active Sessions', val: stats.activeToday, desc: `Reporting logs today` }
                    ].map((card, idx) => (
                      <div key={idx} class="p-4 bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded shadow-sm">
                        <span class="text-[9px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-widest block mb-1">{card.title}</span>
                        <div class="font-mono text-xl font-black text-navy dark:text-white mb-0.5">{card.val}</div>
                        <span class="text-[9px] font-semibold text-gold font-sans">{card.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Most Read Articles */}
                  <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded p-4">
                    <span class="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-widest block mb-3">Top Dispatch Reports</span>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-[11px] font-sans text-navy dark:text-gray-300">
                        <thead>
                          <tr class="border-b border-paper-border dark:border-paper-borderDark text-[9px] uppercase tracking-widest text-gray-450 font-bold">
                            <th class="pb-2">Desk</th>
                            <th class="pb-2">Headline Brief</th>
                            <th class="pb-2 text-right">Read Ledger Count</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-805">
                          {stats.mostReadArticles.map((art, idx) => (
                            <tr key={idx}>
                              <td class="py-2.5 font-bold uppercase text-[9px] text-gold">{art.category}</td>
                              <td class="py-2.5 font-serif font-bold text-navy dark:text-white max-w-xs truncate">{art.title}</td>
                              <td class="py-2.5 text-right font-mono font-bold">{art.reads}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER CONTROL */}
          {activeTab === 'users' && (
            <div class="space-y-6">
              <div class="border-b border-paper-border dark:border-paper-borderDark pb-2">
                <h3 class="font-serif text-sm font-black text-navy dark:text-gold uppercase tracking-wider">User Ledger Control</h3>
              </div>

              {loadingUsers ? (
                <div class="flex items-center justify-center py-20 text-xs font-bold text-gray-400 gap-2">
                  <RefreshCw size={14} class="animate-spin text-gold" />
                  <span>PULLING SUBSCRIBER REGISTERS...</span>
                </div>
              ) : (
                <div class="overflow-x-auto bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded">
                  <table class="w-full text-left text-[11px] font-sans text-navy dark:text-gray-300">
                    <thead>
                      <tr class="border-b border-paper-border dark:border-paper-borderDark text-[9px] uppercase tracking-widest text-gray-450 font-bold px-4 py-2">
                        <th class="p-3">User</th>
                        <th class="p-3">Email Address</th>
                        <th class="p-3">Briefing Tier</th>
                        <th class="p-3">Register Date</th>
                        <th class="p-3">Status</th>
                        <th class="p-3 text-right">Erase Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                      {usersList.map((u) => (
                        <tr key={u.id}>
                          <td class="p-3 font-bold">{u.name}</td>
                          <td class="p-3 font-mono">{u.email}</td>
                          <td class="p-3">
                            <span class={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              u.plan === 'PRO' ? 'bg-gold/20 text-gold-light' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                              {u.plan}
                            </span>
                          </td>
                          <td class="p-3 font-mono">{u.joined}</td>
                          <td class="p-3">
                            <span class={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              u.status === 'Banned' ? 'bg-red-500/10 text-red-650' : 'bg-green-500/10 text-green-600'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td class="p-3 text-right">
                            <button
                              onClick={() => handleUserStatusUpdate(u.id, u.status, u.plan)}
                              class={`p-1.5 rounded transition-colors ${
                                u.status === 'Banned' 
                                  ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' 
                                  : 'bg-red-500/10 text-red-650 hover:bg-red-500/20'
                              }`}
                              title={u.status === 'Banned' ? 'Revoke Ban' : 'Execute Ban'}
                            >
                              <Ban size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANUAL PUBLISHING DESK */}
          {activeTab === 'publish' && (
            <div class="space-y-6">
              <div class="border-b border-paper-border dark:border-paper-borderDark pb-2">
                <h3 class="font-serif text-sm font-black text-navy dark:text-gold uppercase tracking-wider">Manual wire Publishing</h3>
              </div>

              {publishSuccess && (
                <div class="bg-green-500/10 border border-green-500/40 text-green-700 dark:text-green-400 text-xs font-semibold px-4 py-3 rounded flex items-center gap-2">
                  <CheckCircle size={15} />
                  <span>{publishSuccess}</span>
                </div>
              )}

              {publishError && (
                <div class="bg-red-500/10 border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-semibold px-4 py-3 rounded flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>{publishError}</span>
                </div>
              )}

              <form onSubmit={handlePublishSubmit} class="space-y-4 text-xs font-semibold font-sans">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Headline Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fed Adjusts Interest Yield Caps"
                      value={publishForm.title}
                      onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                      class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Author Byline</label>
                    <input
                      type="text"
                      placeholder="e.g. Chief Editor Vance"
                      value={publishForm.author}
                      onChange={(e) => setPublishForm({ ...publishForm, author: e.target.value })}
                      class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Wire Category Desk</label>
                    <select
                      value={publishForm.category}
                      onChange={(e) => setPublishForm({ ...publishForm, category: e.target.value })}
                      class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Featured Image URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={publishForm.urlToImage}
                      onChange={(e) => setPublishForm({ ...publishForm, urlToImage: e.target.value })}
                      class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Brief Summary Description</label>
                  <input
                    type="text"
                    placeholder="Provide a concise 1-sentence analytical overview..."
                    value={publishForm.description}
                    onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
                    class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Full Dispatch Content</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Enter the full text of the article bulletin here..."
                    value={publishForm.content}
                    onChange={(e) => setPublishForm({ ...publishForm, content: e.target.value })}
                    class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white font-serif"
                  ></textarea>
                </div>

                <div class="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={publishing}
                    class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-navy hover:bg-navy-light text-gold font-bold uppercase tracking-wider rounded transition-all shadow"
                  >
                    <Plus size={14} />
                    <span>{publishing ? 'Broadcasting Wire...' : 'Publish Bulletin'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: PUSH DISPATCHERS */}
          {activeTab === 'alerts' && (
            <div class="space-y-6">
              <div class="border-b border-paper-border dark:border-paper-borderDark pb-2">
                <h3 class="font-serif text-sm font-black text-navy dark:text-gold uppercase tracking-wider">Breaking Push Broadcasts</h3>
              </div>

              {alertSuccess && (
                <div class="bg-green-500/10 border border-green-500/40 text-green-700 dark:text-green-400 text-xs font-semibold px-4 py-3 rounded flex items-center gap-2">
                  <CheckCircle size={15} />
                  <span>{alertSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAlertSubmit} class="space-y-4 text-xs font-semibold font-sans">
                <p class="text-gray-450 dark:text-gray-400 text-[11px] leading-relaxed max-w-md">
                  Broadcast high-priority system alerts directly to active reader terminals.
                </p>

                <div>
                  <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Alert Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BREAKING: SENSEX Tumbles 800pts"
                    value={alertForm.title}
                    onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                    class="w-full max-w-md bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Dispatch Message Text</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Major monetary policy shifts in central banks trigger market outflows."
                    value={alertForm.text}
                    onChange={(e) => setAlertForm({ ...alertForm, text: e.target.value })}
                    class="w-full max-w-md bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                  ></textarea>
                </div>

                <div class="pt-2">
                  <button
                    type="submit"
                    disabled={sendingAlert}
                    class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-navy hover:bg-navy-light text-gold font-bold uppercase tracking-wider rounded transition-all shadow"
                  >
                    <Bell size={14} />
                    <span>{sendingAlert ? 'Broadcasting Alert...' : 'Dispatch Alert'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: OUTCOME TRACKER MANAGER */}
          {activeTab === 'outcomes' && (
            <div class="space-y-6">
              <div class="border-b border-paper-border dark:border-paper-borderDark pb-2 flex justify-between items-center">
                <h3 class="font-serif text-sm font-black text-navy dark:text-gold uppercase tracking-wider">Outcome Tracker Manager</h3>
                {!showNewStoryForm && !selectedStoryForUpdate && (
                  <button
                    onClick={() => setShowNewStoryForm(true)}
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold text-navy font-bold text-[10px] uppercase tracking-wider rounded shadow hover:bg-gold-light transition-all"
                  >
                    <Plus size={12} />
                    <span>New Tracked Story</span>
                  </button>
                )}
              </div>

              {/* FORM: CREATE NEW STORY */}
              {showNewStoryForm && (
                <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded p-5 space-y-6">
                  <div class="flex justify-between items-center border-b border-paper-border dark:border-paper-borderDark pb-2">
                    <h4 class="font-serif text-xs font-black text-navy dark:text-gold uppercase tracking-widest">Create New Tracked Story</h4>
                    <button
                      onClick={() => { setShowNewStoryForm(false); setAiStatus(null); }}
                      class="text-gray-400 hover:text-red-500 font-bold uppercase tracking-widest text-[10px]"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* AI Suggestion Box */}
                  <div class="bg-navy/5 dark:bg-white/5 border border-navy/10 dark:border-white/10 rounded-xl p-4 space-y-3">
                    <span class="text-[9px] font-mono font-bold text-gold uppercase tracking-widest block">🤖 AI Suggestion Generator</span>
                    <p class="text-[10px] text-gray-500 leading-normal">
                      Paste news article text below and let Gemini extract the policy details to pre-fill the form.
                    </p>
                    <textarea
                      rows={4}
                      placeholder="Paste article text here..."
                      value={aiInputText}
                      onChange={(e) => setAiInputText(e.target.value)}
                      class="w-full bg-white dark:bg-black/40 border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                    ></textarea>
                    <button
                      type="button"
                      disabled={extractingPromise || !aiInputText.trim()}
                      onClick={handleAiExtractPromise}
                      class="inline-flex items-center gap-1.5 px-4 py-2 bg-navy hover:bg-navy-light text-accent-neon font-bold text-[10px] uppercase tracking-wider rounded transition-all disabled:opacity-50"
                    >
                      {extractingPromise ? <Loader size={12} class="animate-spin text-gold" /> : <Sparkles size={12} />}
                      <span>{extractingPromise ? 'AI Extracting...' : 'Suggest from News'}</span>
                    </button>

                    {aiStatus && (
                      <p class={`text-[10px] font-bold ${aiStatus.success ? 'text-green-500' : 'text-red-500'}`}>
                        {aiStatus.success ? '✓' : '✗'} {aiStatus.message}
                      </p>
                    )}
                  </div>

                  {/* Manual / pre-filled Form fields */}
                  <form onSubmit={handleCreateStorySubmit} class="space-y-4 text-xs font-semibold font-sans">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Story Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 10 Lakh Govt Jobs Announcement"
                          value={newStoryForm.title}
                          onChange={(e) => setNewStoryForm({ ...newStoryForm, title: e.target.value })}
                          class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                        />
                      </div>
                      <div>
                        <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Category</label>
                        <select
                          value={newStoryForm.category}
                          onChange={(e) => setNewStoryForm({ ...newStoryForm, category: e.target.value })}
                          class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                        >
                          <option value="Employment">Employment</option>
                          <option value="Government">Government</option>
                          <option value="Policy">Policy</option>
                          <option value="Infrastructure">Infrastructure</option>
                          <option value="Health">Health</option>
                          <option value="Education">Education</option>
                          <option value="Finance">Finance</option>
                          <option value="Business">Business</option>
                          <option value="Technology">Technology</option>
                          <option value="Science">Science</option>
                          <option value="Environment">Environment</option>
                          <option value="Travel">Travel</option>
                          <option value="Lifestyle">Lifestyle</option>
                          <option value="Law">Law & Crime</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Original Promise / Scheme Detail</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="What was promised - keep it clear and short..."
                        value={newStoryForm.promise}
                        onChange={(e) => setNewStoryForm({ ...newStoryForm, promise: e.target.value })}
                        class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                      ></textarea>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Original News URL</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={newStoryForm.originalNewsUrl}
                          onChange={(e) => setNewStoryForm({ ...newStoryForm, originalNewsUrl: e.target.value })}
                          class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                        />
                      </div>
                      <div>
                        <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Original News Date</label>
                        <input
                          type="date"
                          value={newStoryForm.originalNewsDate}
                          onChange={(e) => setNewStoryForm({ ...newStoryForm, originalNewsDate: e.target.value })}
                          class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                        />
                      </div>
                      <div>
                        <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Next Expected Update</label>
                        <input
                          type="date"
                          value={newStoryForm.nextUpdateExpected}
                          onChange={(e) => setNewStoryForm({ ...newStoryForm, nextUpdateExpected: e.target.value })}
                          class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                        />
                      </div>
                    </div>

                    <div class="border-t border-dashed border-paper-border dark:border-paper-borderDark pt-4">
                      <span class="text-[9px] font-mono font-bold text-gray-450 uppercase tracking-widest block mb-2">Stage 1: Announcement Details</span>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Announcement Description</label>
                          <input
                            type="text"
                            placeholder="e.g. Finance ministry signs off on scheme framework."
                            value={newStoryForm.initialStageDescription}
                            onChange={(e) => setNewStoryForm({ ...newStoryForm, initialStageDescription: e.target.value })}
                            class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                          />
                        </div>
                        <div>
                          <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Source link</label>
                          <input
                            type="url"
                            placeholder="https://..."
                            value={newStoryForm.initialStageSourceUrl}
                            onChange={(e) => setNewStoryForm({ ...newStoryForm, initialStageSourceUrl: e.target.value })}
                            class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div class="flex justify-end gap-3 pt-4 border-t border-paper-border dark:border-paper-borderDark">
                      <button
                        type="button"
                        onClick={() => { setShowNewStoryForm(false); setAiStatus(null); }}
                        class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-navy dark:text-white font-bold uppercase tracking-wider rounded text-[10px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        class="px-5 py-2.5 bg-navy hover:bg-navy-light text-gold font-bold uppercase tracking-wider rounded transition-all shadow"
                      >
                        <span>Save Tracked Story</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* FORM: ADD STAGE UPDATE */}
              {selectedStoryForUpdate && (
                <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded p-5 space-y-4">
                  <div class="flex justify-between items-center border-b border-paper-border dark:border-paper-borderDark pb-2">
                    <div>
                      <h4 class="font-serif text-xs font-black text-navy dark:text-gold uppercase tracking-widest">Add Timeline Milestone</h4>
                      <p class="text-[10px] text-gray-450">Story: {selectedStoryForUpdate.title}</p>
                    </div>
                    <button
                      onClick={() => setSelectedStoryForUpdate(null)}
                      class="text-gray-450 hover:text-red-500 font-bold uppercase tracking-widest text-[10px]"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleAddUpdateSubmit} class="space-y-4 text-xs font-semibold font-sans">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Milestone Stage Type</label>
                        <select
                          value={newUpdateForm.stage}
                          onChange={(e) => setNewUpdateForm({ ...newUpdateForm, stage: e.target.value })}
                          class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                        >
                          <option value="notification">Notification / Guidelines</option>
                          <option value="process">Implementation Process</option>
                          <option value="result">Milestone / Result</option>
                          <option value="completed">Successfully Completed</option>
                          <option value="failed">Failed / Shelved</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Milestone Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Official Gazette Published"
                          value={newUpdateForm.title}
                          onChange={(e) => setNewUpdateForm({ ...newUpdateForm, title: e.target.value })}
                          class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Description / Details</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Provide details about this milestone update..."
                        value={newUpdateForm.description}
                        onChange={(e) => setNewUpdateForm({ ...newUpdateForm, description: e.target.value })}
                        class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                      ></textarea>
                    </div>

                    <div>
                      <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Verification Source URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newUpdateForm.sourceUrl}
                        onChange={(e) => setNewUpdateForm({ ...newUpdateForm, sourceUrl: e.target.value })}
                        class="w-full bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                      />
                    </div>

                    <div class="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedStoryForUpdate(null)}
                        class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-navy dark:text-white font-bold uppercase tracking-wider rounded text-[10px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        class="px-5 py-2.5 bg-navy hover:bg-navy-light text-gold font-bold uppercase tracking-wider rounded transition-all shadow"
                      >
                        <span>Publish Milestone Update</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* LIST OF TRACKED STORIES */}
              {!showNewStoryForm && !selectedStoryForUpdate && (
                <div class="space-y-4">
                  {loadingStories ? (
                    <div class="flex items-center justify-center py-20 text-xs font-bold text-gray-400 gap-2">
                      <RefreshCw size={14} class="animate-spin text-gold" />
                      <span>RETRIEVING TRACKED PROJECTS...</span>
                    </div>
                  ) : storiesList.length === 0 ? (
                    <div class="py-16 text-center border border-dashed border-paper-border dark:border-paper-borderDark rounded bg-white dark:bg-paper-cardDark">
                      <ClipboardList size={36} class="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                      <h4 class="font-serif text-sm font-black text-navy dark:text-white mb-1">No Tracked Stories</h4>
                      <p class="text-xs text-gray-400">Click "+ New Tracked Story" to create a new outcome tracking pipeline.</p>
                    </div>
                  ) : (
                    <div class="overflow-x-auto bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded">
                      <table class="w-full text-left text-[11px] font-sans text-navy dark:text-gray-300">
                        <thead>
                          <tr class="border-b border-paper-border dark:border-paper-borderDark text-[9px] uppercase tracking-widest text-gray-450 font-bold">
                            <th class="p-3">Tracked Story</th>
                            <th class="p-3">Category</th>
                            <th class="p-3">Current Stage</th>
                            <th class="p-3">Followers</th>
                            <th class="p-3">Last Updated</th>
                            <th class="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                          {storiesList.map((story) => (
                            <tr key={story.id} class="hover:bg-gray-50/50 dark:hover:bg-white/5">
                              <td class="p-3">
                                <span class="font-serif font-black text-navy dark:text-white block truncate max-w-xs">{story.title}</span>
                                <span class="text-[9px] text-gray-450 block truncate max-w-xs italic">{story.promise}</span>
                              </td>
                              <td class="p-3 font-bold uppercase text-[9px] text-gold">{story.category}</td>
                              <td class="p-3">
                                <span class={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  story.currentStage === 'completed' 
                                    ? 'bg-green-500/10 text-green-600' 
                                    : story.currentStage === 'failed' 
                                    ? 'bg-red-500/10 text-red-650' 
                                    : 'bg-yellow-500/10 text-yellow-600'
                                }`}>
                                  {story.currentStage}
                                </span>
                              </td>
                              <td class="p-3 font-mono font-bold">{story.followersCount || 0}</td>
                              <td class="p-3 font-mono text-[10px] text-gray-400">
                                {new Date(story.updatedAt).toLocaleDateString()}
                              </td>
                              <td class="p-3 text-right space-x-1.5">
                                <button
                                  onClick={() => setSelectedStoryForUpdate(story)}
                                  class="px-2 py-1 bg-navy hover:bg-navy-light text-gold text-[9px] font-bold uppercase tracking-wider rounded shadow transition-all"
                                  title="Add Update Milestone"
                                >
                                  + Update
                                </button>
                                <button
                                  onClick={() => handleDeleteStory(story.id)}
                                  class="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-650 rounded transition-colors inline-flex items-center justify-center"
                                  title="Delete Tracked Story"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
