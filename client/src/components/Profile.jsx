import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Award, Mail, Calendar, KeyRound, Clock, ShieldCheck, Trash2, ArrowLeft, Bookmark, BookOpen, Search, User, Edit2, CheckCircle, LogOut, Bell, Plus, BellRing, Receipt } from 'lucide-react';

export default function Profile({ setView, onSearchSubmit }) {
  const { 
    user, 
    logout,
    searchHistory, 
    deleteSearchQuery, 
    clearSearchHistory,
    bookmarks,
    deleteBookmark,
    readingHistory,
    clearReadingHistory,
    subscription,
    settings,
    updateSettings,
    updateUserProfile,
    deleteUserAccount,
    userAlerts,
    addAlert,
    deleteAlert
  } = useAuth();

  const [activeTab, setActiveTab] = useState('bookmarks'); // 'bookmarks', 'history', 'search', 'settings', 'alerts'
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newAlertTopic, setNewAlertTopic] = useState('');
  const [alertAddError, setAlertAddError] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  const isPro = subscription?.tier === 'PRO';

  const avatarPresets = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Cody',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Jane',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Sophia',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Robert',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Buster'
  ];

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

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(displayName, photoURL);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Profile save error:', err);
    }
  };

  const handleFavoriteToggle = (catId) => {
    const currentFavs = settings?.favorites || [];
    let nextFavs;
    if (currentFavs.includes(catId)) {
      nextFavs = currentFavs.filter(id => id !== catId);
    } else {
      nextFavs = [...currentFavs, catId];
    }
    updateSettings({ favorites: nextFavs });
  };

  const handleAddAlert = async () => {
    if (!newAlertTopic.trim()) {
      setAlertAddError('Please enter a topic.');
      return;
    }
    const alreadyExists = userAlerts.some(a => a.topic.toLowerCase() === newAlertTopic.trim().toLowerCase());
    if (alreadyExists) {
      setAlertAddError('This topic alert already exists.');
      return;
    }
    await addAlert(newAlertTopic.trim());
    setNewAlertTopic('');
    setAlertAddError('');
  };

  const handleHistoryItemClick = (query) => {
    onSearchSubmit(query);
    setView('feed');
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Recent';
    try {
      const date = new Date(timeString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' @ ' + 
             date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch(e) {
      return 'Recent';
    }
  };

  if (!user) {
    return (
      <div class="max-w-md mx-auto px-4 py-16 text-center">
        <h3 class="font-serif text-2xl font-bold text-navy dark:text-white mb-2">Access Restricted</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">You must be logged in to view your research credentials.</p>
        <button 
          onClick={() => setView('feed')}
          class="px-4 py-2 bg-navy text-gold hover:bg-navy-light rounded font-bold text-xs uppercase"
        >
          Return to Wire
        </button>
      </div>
    );
  }

  return (
    <div class="max-w-5xl mx-auto px-4 md:px-6 py-8">
      {/* Back to Feed */}
      <button 
        onClick={() => setView('feed')}
        class="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold dark:text-gray-300 dark:hover:text-gold uppercase tracking-wider mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Return to Wire Feed</span>
      </button>

      {/* Grid Layout */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: ID Badge & Quick Profile Actions */}
        <div class="space-y-6 lg:col-span-1">
          {/* Correspondent ID card */}
          <div class="bg-white dark:bg-paper-cardDark border-2 border-navy dark:border-gold p-6 rounded relative overflow-hidden shadow-lg text-center">
            {/* Top strip */}
            <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-navy via-gold to-navy"></div>
            
            <Award size={28} class="mx-auto text-gold mb-2 mt-2" />
            <h3 class="font-serif text-xs font-black text-navy dark:text-gold uppercase tracking-widest">
              Economical Research
            </h3>
            
            {/* PRO / Basic Badge */}
            <div class="mt-2.5 mb-4">
              {isPro ? (
                <span class="bg-gold text-navy text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded shadow">
                  PRO Press
                </span>
              ) : (
                <span class="bg-navy dark:bg-gray-800 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded border border-white/10">
                  Basic Wire
                </span>
              )}
            </div>

            {/* Avatar image */}
            <div class="w-24 h-24 rounded-full mx-auto overflow-hidden bg-gray-150 dark:bg-gray-800 border-2 border-gold/40 flex items-center justify-center mb-4">
              {photoURL ? (
                <img 
                  src={photoURL} 
                  referrerPolicy="no-referrer"
                  alt="Correspondent Avatar" 
                  class="w-full h-full object-cover filter saturate-[0.8] hover:saturate-100 transition-all duration-300" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=fallback';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gold text-navy flex items-center justify-center font-bold text-4xl">
                  {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                </div>
              )}
            </div>

            {/* User details */}
            <h4 class="font-serif text-lg font-bold text-navy dark:text-white truncate">
              {user.displayName || 'Anonymous Reader'}
            </h4>
            <p class="text-[9px] font-semibold text-gold uppercase tracking-widest mb-6 font-mono">
              Press ID Ledger
            </p>

            <div class="space-y-3 text-[11px] text-gray-500 dark:text-gray-400 border-t border-dashed border-gray-200 dark:border-gray-800 pt-4 font-mono text-left">
              <div class="flex items-center gap-2">
                <Mail size={12} class="text-gold shrink-0" />
                <span class="truncate" title={user.email}>{user.email}</span>
              </div>
              <div class="flex items-center gap-2">
                <Clock size={12} class="text-gold shrink-0" />
                <span>Zone: User Timezone</span>
              </div>
              <div class="flex items-center gap-2">
                <KeyRound size={12} class="text-gold shrink-0" />
                <span class="truncate text-[10px]" title={user.uid}>ID: {user.uid}</span>
              </div>
            </div>

            {/* Billing & Receipts Button */}
            <button
              onClick={() => setView('billing-history')}
              class="w-full mt-6 py-2 bg-navy hover:bg-navy-light text-gold border border-gold/20 rounded font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <Receipt size={13} />
              <span>Billing & Receipts</span>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={async () => {
                try {
                  await logout();
                  setView('feed');
                } catch (err) {
                  console.error('Logout error:', err);
                }
              }}
              class="w-full mt-3 py-2 bg-red-600/10 hover:bg-red-650 text-red-600 hover:text-white border border-red-600/20 rounded font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut size={13} />
              <span>Log Out Credentials</span>
            </button>
          </div>

          {/* Quick Stats overview panel */}
          <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark p-4 rounded shadow-sm">
            <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Reader Stats</span>
            <div class="grid grid-cols-2 gap-3 text-center">
              <div class="p-2.5 bg-gray-50 dark:bg-navy-light/10 border border-paper-border dark:border-paper-borderDark rounded">
                <span class="text-[20px] font-black text-navy dark:text-white font-mono">{readingHistory.length}</span>
                <span class="text-[8px] text-gray-450 dark:text-gray-500 uppercase tracking-wider block font-bold">Read Wire</span>
              </div>
              <div class="p-2.5 bg-gray-50 dark:bg-navy-light/10 border border-paper-border dark:border-paper-borderDark rounded">
                <span class="text-[20px] font-black text-navy dark:text-gold font-mono">{bookmarks.length}</span>
                <span class="text-[8px] text-gray-450 dark:text-gray-500 uppercase tracking-wider block font-bold">Bookmarked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed controls and Profile configurations */}
        <div class="lg:col-span-2 bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded shadow-sm flex flex-col">
          {/* Tabs header */}
          <div class="flex border-b border-paper-border dark:border-paper-borderDark bg-gray-50 dark:bg-paper-dark/30 rounded-t overflow-x-auto scrollbar-none font-sans">
            {[
              { id: 'bookmarks', name: 'Saved Briefings' },
              { id: 'history', name: 'Reading Logs' },
              { id: 'search', name: 'Search Ledger' },
              { id: 'alerts', name: `🔔 My Alerts${userAlerts.length > 0 ? ` (${userAlerts.length})` : ''}` },
              { id: 'settings', name: 'Edit Profile' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                class={`px-5 py-4 text-xs font-bold uppercase tracking-wider border-r border-paper-border dark:border-paper-borderDark whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-paper-cardDark text-gold border-b-2 border-b-gold font-black'
                    : 'text-gray-500 dark:text-gray-400 hover:text-navy'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Tab content panel */}
          <div class="p-6">
            
            {/* BOOKMARKS TAB */}
            {activeTab === 'bookmarks' && (
              <div class="space-y-4">
                {bookmarks.length === 0 ? (
                  <div class="text-center py-12 text-gray-400">
                    <Bookmark size={28} class="mx-auto text-gray-200 dark:text-gray-800 mb-2" />
                    <p class="text-xs font-semibold uppercase tracking-wider">No bookmarked briefings.</p>
                  </div>
                ) : (
                  bookmarks.map((art, idx) => (
                    <div key={idx} class="flex items-center justify-between gap-4 p-3 border border-paper-border dark:border-paper-borderDark rounded bg-gray-50/35 dark:bg-navy-light/5">
                      <div class="flex-grow min-w-0">
                        <span class="text-[9px] font-bold text-gold uppercase tracking-widest block">{art.source?.name}</span>
                        <a href={art.url} target="_blank" rel="noopener noreferrer" class="text-xs md:text-sm font-serif font-bold text-navy dark:text-gray-200 hover:text-gold block truncate">
                          {art.title}
                        </a>
                      </div>
                      <button
                        onClick={() => deleteBookmark(art.url)}
                        class="text-gray-400 hover:text-red-500 p-1.5 rounded transition-colors shrink-0"
                        title="Remove bookmark"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* READING HISTORY TAB */}
            {activeTab === 'history' && (
              <div>
                <div class="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Clippings Read History</span>
                  {readingHistory.length > 0 && (
                    <button 
                      onClick={clearReadingHistory}
                      class="text-[9px] font-bold text-red-600 hover:text-red-750 uppercase tracking-wider border border-red-200 px-2 py-0.5 rounded"
                    >
                      Clear Logs
                    </button>
                  )}
                </div>

                {readingHistory.length === 0 ? (
                  <div class="text-center py-12 text-gray-400">
                    <BookOpen size={28} class="mx-auto text-gray-200 dark:text-gray-800 mb-2" />
                    <p class="text-xs font-semibold uppercase tracking-wider">Reading log empty.</p>
                  </div>
                ) : (
                  <div class="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {readingHistory.map((art, idx) => (
                      <div key={idx} class="flex items-center justify-between gap-4 p-2.5 border-b border-gray-100 dark:border-gray-800">
                        <div class="min-w-0 flex-grow">
                          <a href={art.url} target="_blank" rel="noopener noreferrer" class="text-xs font-serif font-bold text-navy dark:text-gray-200 hover:text-gold block truncate">
                            {art.title}
                          </a>
                          <span class="text-[9px] font-mono text-gray-450 dark:text-gray-500 block mt-0.5">
                            {art.source?.name} • Read: {formatTime(art.readAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SEARCH HISTORY TAB */}
            {activeTab === 'search' && (
              <div>
                <div class="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Search Ledger Ledger</span>
                  {searchHistory.length > 0 && (
                    <button 
                      onClick={clearSearchHistory}
                      class="text-[9px] font-bold text-red-600 hover:text-red-750 uppercase tracking-wider border border-red-200 px-2 py-0.5 rounded"
                    >
                      Clear ledger
                    </button>
                  )}
                </div>

                {searchHistory.length === 0 ? (
                  <div class="text-center py-12 text-gray-400">
                    <Search size={28} class="mx-auto text-gray-200 dark:text-gray-800 mb-2" />
                    <p class="text-xs font-semibold uppercase tracking-wider">No searches recorded.</p>
                  </div>
                ) : (
                  <div class="space-y-2">
                    {searchHistory.map((query, idx) => (
                      <div key={idx} class="flex items-center justify-between p-1.5 hover:bg-gray-50 dark:hover:bg-navy-light/10 transition-colors rounded-sm">
                        <button
                          onClick={() => handleHistoryItemClick(query)}
                          class="text-left text-xs font-semibold text-navy dark:text-gray-200 hover:text-gold truncate flex-grow"
                        >
                          &ldquo;{query}&rdquo;
                        </button>
                        <button 
                          onClick={() => deleteSearchQuery(query)}
                          class="text-gray-400 hover:text-red-500 p-1 rounded transition-colors shrink-0"
                          title="Remove query"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SMART TOPIC ALERTS TAB */}
            {activeTab === 'alerts' && (
              <div class="space-y-5">
                <div class="border-b border-gray-100 dark:border-gray-800 pb-2">
                  <h4 class="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <BellRing size={12} class="text-gold" />
                    Smart Topic Alerts
                  </h4>
                  <p class="text-[10px] text-gray-400 mt-1 leading-relaxed">
                    Get notified when news matches your topics. Keywords are matched against article headlines.
                  </p>
                </div>

                {/* Add New Alert */}
                {user ? (
                  <div class="flex items-stretch gap-2">
                    <input
                      type="text"
                      value={newAlertTopic}
                      onChange={(e) => { setNewAlertTopic(e.target.value); setAlertAddError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddAlert(); }}
                      placeholder="e.g. Cricket, Stock Market, Elections..."
                      class="flex-grow bg-gray-50 dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white placeholder:text-gray-400"
                    />
                    <button
                      onClick={handleAddAlert}
                      class="flex items-center gap-1.5 px-4 py-2 bg-gold hover:bg-yellow-500 text-navy font-bold text-xs uppercase tracking-wider rounded transition-all shrink-0"
                    >
                      <Plus size={14} />
                      Add Alert
                    </button>
                  </div>
                ) : (
                  <div class="text-center py-6 text-gray-400">
                    <Bell size={24} class="mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                    <p class="text-xs">Log in to create topic alerts.</p>
                  </div>
                )}

                {alertAddError && (
                  <p class="text-[10px] text-red-500 font-semibold">{alertAddError}</p>
                )}

                {/* Alert List */}
                <div>
                  <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Your Alerts ({userAlerts.length})</span>
                  {userAlerts.length === 0 ? (
                    <div class="text-center py-10">
                      <Bell size={28} class="mx-auto text-gray-200 dark:text-gray-800 mb-2" />
                      <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">No alerts set. Add a topic above.</p>
                    </div>
                  ) : (
                    <div class="space-y-2">
                      {userAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-light/5 border border-paper-border dark:border-paper-borderDark rounded-lg group"
                        >
                          <div class="flex items-center gap-2.5">
                            <span class="w-7 h-7 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                              <Bell size={12} class="text-gold" />
                            </span>
                            <div>
                              <span class="text-xs font-bold text-navy dark:text-white block">{alert.topic}</span>
                              <span class="text-[9px] font-mono text-gray-400">Added {new Date(alert.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteAlert(alert.id)}
                            class="text-gray-400 hover:text-red-500 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove alert"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info notice */}
                <div class="bg-gold/5 border border-gold/20 rounded-lg p-3 text-[10px] text-navy/70 dark:text-gray-400 leading-relaxed">
                  <span class="font-bold text-gold">How it works:</span> When you visit the news feed, articles matching your topics will show a 🔔 badge and the bell icon in the header will display a notification count.
                </div>
              </div>
            )}

            {/* EDIT PROFILE & PREFERENCES TAB */}
            {activeTab === 'settings' && (
              <div class="space-y-6">
                <div class="border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center justify-between">
                  <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Account Credentials & Preferences</span>
                  {saveSuccess && (
                    <span class="text-[9px] text-green-600 dark:text-green-400 font-bold flex items-center gap-0.5 animate-pulse">
                      <CheckCircle size={12} />
                      <span>CREDENTIALS UPDATE SYNCED</span>
                    </span>
                  )}
                </div>

                {/* Profile form */}
                <form onSubmit={handleProfileSave} class="space-y-5 text-xs font-semibold font-sans text-navy dark:text-gray-200">
                  {/* Name input */}
                  <div>
                    <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Correspondent Jane"
                      class="w-full max-w-md bg-gray-50 dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                    />
                  </div>

                  {/* Preset avatar select grid */}
                  <div>
                    <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-2">Preset Monograms / Avatars</label>
                    <div class="grid grid-cols-4 sm:grid-cols-8 gap-2.5 max-w-md">
                      {avatarPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPhotoURL(preset)}
                          class={`w-10 h-10 rounded-full overflow-hidden bg-gray-100 border-2 transition-all p-0.5 shrink-0 ${
                            photoURL === preset ? 'border-gold shadow scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt={`avatar-${idx}`} class="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Favorite Categories check grid */}
                  <div>
                    <label class="block text-gray-400 uppercase tracking-wider text-[9px] mb-2">Favorite News categories</label>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl">
                      {categories.map((cat) => {
                        const checked = settings?.favorites?.includes(cat.id) || false;
                        return (
                          <label 
                            key={cat.id} 
                            class={`flex items-center gap-1.5 p-2 border rounded cursor-pointer select-none transition-all ${
                              checked 
                                ? 'bg-navy/5 border-navy dark:bg-gold/10 dark:border-gold text-navy dark:text-gold-light'
                                : 'bg-transparent border-paper-border dark:border-paper-borderDark hover:bg-gray-50/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleFavoriteToggle(cat.id)}
                              class="sr-only"
                            />
                            <span class="text-[10px] font-bold uppercase tracking-wider">{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div class="pt-2">
                    <button
                      type="submit"
                      class="px-5 py-2.5 bg-navy text-gold hover:bg-navy-light font-bold text-xs uppercase tracking-widest rounded transition-all shadow"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>

                {/* Account erasures */}
                <div class="pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div class="bg-red-500/5 p-4 rounded border border-red-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h5 class="text-xs font-black text-red-650 dark:text-red-400 uppercase tracking-wide">Erase Press Registry Profile</h5>
                      <p class="text-[10px] text-gray-400 leading-relaxed font-semibold">
                        This action will immediately delete your bookmarks, credentials ledger, and sync access.
                      </p>
                    </div>

                    {showDeleteConfirm ? (
                      <div class="flex gap-2 shrink-0">
                        <button
                          onClick={deleteUserAccount}
                          class="px-3 py-2 bg-red-600 text-white rounded text-[10px] font-bold uppercase"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          class="px-3 py-2 bg-gray-200 dark:bg-gray-800 text-navy dark:text-gray-200 rounded text-[10px] font-bold uppercase"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        class="px-3 py-2 bg-red-600/10 hover:bg-red-650 text-red-600 hover:text-white border border-red-600/30 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all"
                      >
                        Delete Account
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
