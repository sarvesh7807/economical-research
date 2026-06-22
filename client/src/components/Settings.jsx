import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, Sun, Moon, Type, Bell, Trash2, ArrowLeft, CheckCircle, Mail, Sparkles, Shield, Clock, Calendar } from 'lucide-react';

export default function Settings({ setView }) {
  const { 
    user, 
    settings, 
    updateSettings, 
    clearReadingHistory,
    bookmarks,
    deleteBookmark
  } = useAuth();

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const [showClearBookmarksConfirm, setShowClearBookmarksConfirm] = useState(false);

  const handleThemeChange = (newTheme) => {
    updateSettings({ theme: newTheme });
    triggerSuccess();
  };

  const handleFontSizeChange = (size) => {
    updateSettings({ fontSize: size });
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleClearHistory = async () => {
    await clearReadingHistory();
    setShowClearHistoryConfirm(false);
    triggerSuccess();
  };

  const handleClearBookmarks = async () => {
    for (const art of bookmarks) {
      await deleteBookmark(art.url);
    }
    setShowClearBookmarksConfirm(false);
    triggerSuccess();
  };

  // Toggle specific setting helper
  const handleToggle = (key) => {
    updateSettings({ [key]: !settings[key] });
    triggerSuccess();
  };

  // Quiet hours update
  const handleQuietHoursToggle = () => {
    const enabled = !settings.quietHours?.enabled;
    const start = settings.quietHours?.start || "22:00";
    const end = settings.quietHours?.end || "07:00";
    updateSettings({ quietHours: { enabled, start, end } });
    triggerSuccess();
  };

  const handleQuietHoursTimeChange = (type, val) => {
    const current = settings.quietHours || { enabled: false, start: "22:00", end: "07:00" };
    updateSettings({ quietHours: { ...current, [type]: val } });
    triggerSuccess();
  };

  const handleFrequencyChange = (val) => {
    updateSettings({ alertFrequency: val });
    triggerSuccess();
  };

  if (!user) {
    return (
      <div class="max-w-md mx-auto px-4 py-16 text-center">
        <h3 class="font-serif text-2xl font-bold text-navy dark:text-white mb-2">Access Restricted</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">You must be authenticated to access editorial configuration parameters.</p>
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
    <div class="max-w-3xl mx-auto px-4 md:px-6 py-8 font-sans">
      {/* Back Button */}
      <button 
        onClick={() => setView('feed')}
        class="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold dark:text-gray-300 dark:hover:text-gold uppercase tracking-wider mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Return to Wire Feed</span>
      </button>

      {/* Main Settings Panel */}
      <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark rounded p-6 shadow-sm relative overflow-hidden">
        {/* Masthead Style Title */}
        <div class="border-double-bottom-navy pb-3 mb-6 flex items-center justify-between">
          <h2 class="font-serif text-2xl font-black text-navy dark:text-gold flex items-center gap-2">
            <SettingsIcon size={22} class="text-gold animate-[spin_5s_linear_infinite]" />
            <span>EDITORIAL PREFERENCES</span>
          </h2>
          {saveSuccess && (
            <span class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-bold animate-pulse">
              <CheckCircle size={14} />
              <span>SAVED & SYNCED</span>
            </span>
          )}
        </div>

        <div class="space-y-8 divide-y divide-gray-150 dark:divide-gray-800">
          
          {/* 1. Theme Configuration */}
          <div class="pt-2">
            <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Sun size={14} class="text-gold" />
              <span>Visual Layout Theme</span>
            </h3>
            <div class="grid grid-cols-3 gap-3">
              {['light', 'dark', 'auto'].map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  class={`py-2 px-3 border rounded text-xs font-bold uppercase tracking-wider transition-all ${
                    settings.theme === t
                      ? 'bg-navy text-gold border-transparent dark:bg-gold dark:text-navy font-black shadow'
                      : 'bg-transparent border-paper-border dark:border-paper-borderDark hover:bg-gray-50 dark:hover:bg-navy-light/20 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p class="text-[10px] text-gray-400 mt-2">
              Select Light for traditional newsprint white, Dark for late-night review, or Auto to sync with your operating system settings.
            </p>
          </div>

          {/* 2. Typography Sizing */}
          <div class="pt-6">
            <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Type size={14} class="text-gold" />
              <span>Typography Sizing</span>
            </h3>
            <div class="grid grid-cols-3 gap-3">
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  onClick={() => handleFontSizeChange(size)}
                  class={`py-2 px-3 border rounded text-xs font-bold uppercase tracking-wider transition-all ${
                    settings.fontSize === size
                      ? 'bg-navy text-gold border-transparent dark:bg-gold dark:text-navy font-black shadow'
                      : 'bg-transparent border-paper-border dark:border-paper-borderDark hover:bg-gray-50 dark:hover:bg-navy-light/20 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <p class="text-[10px] text-gray-400 mt-2 font-serif">
              Adjusts the body size of articles in reports drawer.
            </p>
          </div>

          {/* 3. Granular Notifications System Preferences */}
          <div class="pt-6 space-y-5">
            <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Bell size={14} class="text-gold" />
              <span>Alert & Notification Registry</span>
            </h3>

            {/* Grid of Toggles */}
            <div class="space-y-4 text-xs font-semibold">
              {/* T1: Email Notifications */}
              <div class="flex items-center justify-between p-2.5 border border-paper-border dark:border-paper-borderDark rounded bg-gray-50/20 dark:bg-navy-light/5">
                <div class="flex items-start gap-3">
                  <Mail size={16} class="text-gold shrink-0 mt-0.5" />
                  <div>
                    <h4 class="font-bold text-navy dark:text-gray-200">Email News Alerts</h4>
                    <p class="text-[9.5px] text-gray-400 font-medium leading-relaxed">Receive breaking headlines, daily digests, and payment receipts directly in your inbox.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('emailAlerts')}
                  class={`w-11 h-5 flex items-center rounded-full p-0.5 shrink-0 transition-all ${
                    settings.emailAlerts ? 'bg-navy dark:bg-gold' : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                >
                  <div class={`w-4 h-4 rounded-full bg-white shadow transform transition-all ${settings.emailAlerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* T2: Browser Push Notifications */}
              <div class="flex items-center justify-between p-2.5 border border-paper-border dark:border-paper-borderDark rounded bg-gray-50/20 dark:bg-navy-light/5">
                <div class="flex items-start gap-3">
                  <Bell size={16} class="text-gold shrink-0 mt-0.5" />
                  <div>
                    <h4 class="font-bold text-navy dark:text-gray-200">Browser Push Notifications</h4>
                    <p class="text-[9.5px] text-gray-400 font-medium leading-relaxed">Enables dynamic HTML5 alerts mapping breaking dispatches on your desktop screen.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('pushAlerts')}
                  class={`w-11 h-5 flex items-center rounded-full p-0.5 shrink-0 transition-all ${
                    settings.pushAlerts ? 'bg-navy dark:bg-gold' : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                >
                  <div class={`w-4 h-4 rounded-full bg-white shadow transform transition-all ${settings.pushAlerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* T3: Favorite Categories alerts */}
              <div class="flex items-center justify-between p-2.5 border border-paper-border dark:border-paper-borderDark rounded bg-gray-50/20 dark:bg-navy-light/5">
                <div class="flex items-start gap-3">
                  <Sparkles size={16} class="text-gold shrink-0 mt-0.5" />
                  <div>
                    <h4 class="font-bold text-navy dark:text-gray-200">Topic-Match Bulletins</h4>
                    <p class="text-[9.5px] text-gray-400 font-medium leading-relaxed">Instantly alerts you when new wire bulletins align with your selected interest categories.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('favTopicAlerts')}
                  class={`w-11 h-5 flex items-center rounded-full p-0.5 shrink-0 transition-all ${
                    settings.favTopicAlerts ? 'bg-navy dark:bg-gold' : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                >
                  <div class={`w-4 h-4 rounded-full bg-white shadow transform transition-all ${settings.favTopicAlerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* T4: Subscription alerts */}
              <div class="flex items-center justify-between p-2.5 border border-paper-border dark:border-paper-borderDark rounded bg-gray-50/20 dark:bg-navy-light/5">
                <div class="flex items-start gap-3">
                  <Calendar size={16} class="text-gold shrink-0 mt-0.5" />
                  <div>
                    <h4 class="font-bold text-navy dark:text-gray-200">Subscription Alerts</h4>
                    <p class="text-[9.5px] text-gray-400 font-medium leading-relaxed">Receive billing schedule notices, renewals alerts, and payment log logs.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('subReminderAlerts')}
                  class={`w-11 h-5 flex items-center rounded-full p-0.5 shrink-0 transition-all ${
                    settings.subReminderAlerts ? 'bg-navy dark:bg-gold' : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                >
                  <div class={`w-4 h-4 rounded-full bg-white shadow transform transition-all ${settings.subReminderAlerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* T5: Account activity */}
              <div class="flex items-center justify-between p-2.5 border border-paper-border dark:border-paper-borderDark rounded bg-gray-50/20 dark:bg-navy-light/5">
                <div class="flex items-start gap-3">
                  <Shield size={16} class="text-gold shrink-0 mt-0.5" />
                  <div>
                    <h4 class="font-bold text-navy dark:text-gray-200">Account Activity Ledger</h4>
                    <p class="text-[9.5px] text-gray-400 font-medium leading-relaxed">Alerts regarding sign-ins, profile monograms update, and security profile syncs.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('activityAlerts')}
                  class={`w-11 h-5 flex items-center rounded-full p-0.5 shrink-0 transition-all ${
                    settings.activityAlerts ? 'bg-navy dark:bg-gold' : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                >
                  <div class={`w-4 h-4 rounded-full bg-white shadow transform transition-all ${settings.activityAlerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>

            {/* Quiet Hours Settings Panel */}
            <div class="p-3 border border-paper-border dark:border-paper-borderDark rounded bg-gray-50/10 dark:bg-navy-light/5 text-xs font-semibold space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Clock size={15} class="text-gold" />
                  <h4 class="font-bold text-navy dark:text-gray-300">Quiet Hours Schedule</h4>
                </div>
                <button
                  onClick={handleQuietHoursToggle}
                  class={`w-11 h-5 flex items-center rounded-full p-0.5 shrink-0 transition-all ${
                    settings.quietHours?.enabled ? 'bg-navy dark:bg-gold' : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                >
                  <div class={`w-4 h-4 rounded-full bg-white shadow transform transition-all ${settings.quietHours?.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
              <p class="text-[9.5px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                When enabled, browser push alerts will remain silent between selected hours to ensure focus.
              </p>

              {settings.quietHours?.enabled && (
                <div class="flex items-center gap-3 pt-1 animate-pulse-slow">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] text-gray-400 uppercase tracking-wider">Start:</span>
                    <input
                      type="time"
                      value={settings.quietHours.start || "22:00"}
                      onChange={(e) => handleQuietHoursTimeChange('start', e.target.value)}
                      class="bg-white dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                    />
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] text-gray-400 uppercase tracking-wider">End:</span>
                    <input
                      type="time"
                      value={settings.quietHours.end || "07:00"}
                      onChange={(e) => handleQuietHoursTimeChange('end', e.target.value)}
                      class="bg-white dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Frequency selection */}
            <div class="p-3 border border-paper-border dark:border-paper-borderDark rounded bg-gray-50/10 dark:bg-navy-light/5 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 class="font-bold text-navy dark:text-gray-255">Alert Dispatch Frequency</h4>
                <p class="text-[9.5px] text-gray-450 dark:text-gray-400 font-medium mt-0.5">Configure intervals for digest dispatches.</p>
              </div>

              <select
                value={settings.alertFrequency || "Instant"}
                onChange={(e) => handleFrequencyChange(e.target.value)}
                class="bg-white dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <option value="Instant">Instant (Realtime)</option>
                <option value="Daily">Daily Digest</option>
                <option value="Weekly">Weekly Digest</option>
              </select>
            </div>

          </div>

          {/* 4. Ledger Erasure Controls */}
          <div class="pt-6">
            <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Trash2 size={14} class="text-red-500" />
              <span>Data Ledger Management</span>
            </h3>
            
            <div class="space-y-4">
              {/* Clear History */}
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-500/5 p-3 rounded border border-red-500/10">
                <div>
                  <h4 class="text-xs font-bold text-red-650 dark:text-red-400">Purge Reading History Ledger</h4>
                  <p class="text-[10px] text-gray-400 mt-0.5">Erases all record of articles you have read from your reporter session.</p>
                </div>
                {showClearHistoryConfirm ? (
                  <div class="flex gap-2">
                    <button
                      onClick={handleClearHistory}
                      class="px-2.5 py-1 bg-red-650 text-white rounded text-[10px] font-bold"
                    >
                      CONFIRM PURGE
                    </button>
                    <button
                      onClick={() => setShowClearHistoryConfirm(false)}
                      class="px-2.5 py-1 bg-gray-200 text-navy dark:bg-gray-850 dark:text-gray-200 rounded text-[10px] font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearHistoryConfirm(true)}
                    class="px-3 py-1.5 bg-red-600/10 hover:bg-red-650 text-red-600 hover:text-white rounded text-[10px] font-bold border border-red-600/30 transition-all uppercase tracking-wider shrink-0"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {/* Clear Bookmarks */}
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-500/5 p-3 rounded border border-red-500/10">
                <div>
                  <h4 class="text-xs font-bold text-red-650 dark:text-red-400">Purge Saved Bookmarks</h4>
                  <p class="text-[10px] text-gray-400 mt-0.5">Deletes all saved briefings and bookmarked clippings from your desk.</p>
                </div>
                {showClearBookmarksConfirm ? (
                  <div class="flex gap-2">
                    <button
                      onClick={handleClearBookmarks}
                      class="px-2.5 py-1 bg-red-650 text-white rounded text-[10px] font-bold"
                    >
                      CONFIRM PURGE
                    </button>
                    <button
                      onClick={() => setShowClearBookmarksConfirm(false)}
                      class="px-2.5 py-1 bg-gray-200 text-navy dark:bg-gray-850 dark:text-gray-200 rounded text-[10px] font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearBookmarksConfirm(true)}
                    class="px-3 py-1.5 bg-red-650/10 hover:bg-red-650 text-red-600 hover:text-white rounded text-[10px] font-bold border border-red-600/30 transition-all uppercase tracking-wider shrink-0"
                  >
                    Clear Bookmarks
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
