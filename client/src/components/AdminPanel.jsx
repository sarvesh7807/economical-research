import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Users, FileText, Bell, ShieldAlert, ArrowLeft, RefreshCw, Plus, Ban, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';

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
            { id: 'alerts', name: 'Push Dispatches', icon: <Bell size={14} /> }
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

        </div>
      </div>
    </div>
  );
}
