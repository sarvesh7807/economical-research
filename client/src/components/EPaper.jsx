import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Newspaper, Printer, Share2, Calendar, FileText, ArrowLeft, Loader, HelpCircle } from 'lucide-react';

export default function EPaper({ setView }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('Front Page'); // 'Front Page', 'National', 'International', 'Business', 'Sports', 'Technology'
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  const tabs = ['Front Page', 'National', 'International', 'Business', 'Sports', 'Technology'];

  // Map tabs to NewsAPI categories
  const getCategoryForTab = (tab) => {
    switch (tab) {
      case 'Front Page': return 'world';
      case 'National': return 'india';
      case 'International': return 'world';
      case 'Business': return 'business';
      case 'Sports': return 'sports';
      case 'Technology': return 'tech';
      default: return 'world';
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const cat = getCategoryForTab(activeTab);
    
    fetch(`/api/news?category=${cat}&pageSize=6`)
      .then(res => {
        if (!res.ok) throw new Error('E-Paper download failed');
        return res.json();
      })
      .then(data => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Connection to digital printing press interrupted.');
        setLoading(false);
      });
  }, [activeTab, selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}?view=epaper&date=${selectedDate}&tab=${activeTab}`;
    navigator.clipboard.writeText(shareUrl);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  // Generate date archive list (last 7 days)
  const getArchiveDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  return (
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-8 print:p-0">
      
      {/* 1. TOP HEADER & DATE SELECTOR (Hidden in Print) */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-paper-border dark:border-paper-borderDark pb-4 print:hidden">
        <button 
          onClick={() => setView('feed')}
          class="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold dark:text-gray-300 dark:hover:text-gold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Return to Wire Feed</span>
        </button>

        <div class="flex items-center gap-3 flex-wrap">
          {/* Date Selector */}
          <div class="flex items-center gap-1.5 border border-paper-border dark:border-paper-borderDark rounded px-2.5 py-1.5 bg-white dark:bg-paper-cardDark text-xs font-bold">
            <Calendar size={13} class="text-gold" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              class="bg-transparent focus:outline-none cursor-pointer border-none text-[11px]"
            >
              {getArchiveDates().map(d => (
                <option key={d} value={d} class="bg-paper dark:bg-paper-dark text-navy dark:text-white">
                  Edition: {new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <button
            onClick={handlePrint}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy text-gold hover:bg-navy-light text-xs font-bold uppercase tracking-wider rounded transition-all"
          >
            <Printer size={13} />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleShare}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-navy/20 dark:border-gold/30 hover:border-navy text-navy dark:text-gray-300 hover:bg-navy/5 text-xs font-bold uppercase tracking-wider rounded transition-all"
          >
            <Share2 size={13} />
            <span>{shareSuccess ? 'Copied Link' : 'Share Edition'}</span>
          </button>
        </div>
      </div>

      {/* 2. PRINT SECTION CONTROLS (Hidden in Web, shown in Print) */}
      <div class="hidden print:block text-center border-double border-b-4 border-navy pb-3 mb-6">
        <h1 class="font-serif text-3xl font-black tracking-tight text-navy uppercase">ECONOMICAL RESEARCH</h1>
        <p class="text-[9px] font-sans tracking-widest uppercase mt-1">Digital Broadsheet E-Paper • Edition Date: {selectedDate}</p>
      </div>

      {/* 3. CATEGORY SELECTOR (Hidden in Print) */}
      <div class="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-paper-border dark:border-paper-borderDark scrollbar-none print:hidden">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            class={`px-4 py-2 border text-xs font-bold uppercase tracking-wider rounded transition-all shrink-0 ${
              activeTab === tab
                ? 'bg-navy text-gold border-transparent dark:bg-gold dark:text-navy font-black shadow'
                : 'bg-white dark:bg-paper-cardDark border-paper-border dark:border-paper-borderDark text-gray-500 hover:text-navy dark:text-gray-400 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 4. MAIN NEWSPAPER BROADSHEET CONTENT */}
      {loading ? (
        <div class="flex flex-col items-center justify-center py-20 text-xs font-bold text-gray-400 gap-2">
          <Loader size={16} class="animate-spin text-gold" />
          <span>ENGRAVING E-PAPER SHEET...</span>
        </div>
      ) : error ? (
        <div class="text-center py-16">
          <HelpCircle size={40} class="mx-auto text-red-500 mb-3" />
          <h3 class="font-serif text-lg font-bold text-navy dark:text-gold uppercase mb-2">Broadsheet Offline</h3>
          <p class="text-xs text-gray-450 dark:text-gray-400">{error}</p>
        </div>
      ) : articles.length === 0 ? (
        <div class="text-center py-16">
          <Newspaper size={40} class="mx-auto text-gray-300 mb-3" />
          <h3 class="font-serif text-lg font-bold text-navy dark:text-white uppercase">Broadsheet Blank</h3>
          <p class="text-xs text-gray-400">No news articles registered under this category section today.</p>
        </div>
      ) : (
        /* Traditional Newspaper Columns Layout */
        <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark p-6 sm:p-8 shadow-md rounded relative print:shadow-none print:border-0 print:bg-white print:text-black">
          {/* Broadsheet Corner lines */}
          <div class="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-navy/30 dark:border-gold/30 print:hidden"></div>
          <div class="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-navy/30 dark:border-gold/30 print:hidden"></div>

          {/* Broadsheet Banner Page Flag */}
          <div class="border-b-4 border-double border-navy pb-3 mb-6 text-center">
            <h2 class="font-serif text-4xl sm:text-5xl font-black tracking-tight text-navy dark:text-gold uppercase">
              ECONOMICAL RESEARCH
            </h2>
            <div class="flex justify-between items-center text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest border-t border-navy/10 mt-3 pt-2 font-mono">
              <span>VOL. CLX ... NO. 152</span>
              <span>EDITION: {selectedDate}</span>
              <span class="text-gold dark:text-gold-light font-black">{activeTab.toUpperCase()} SECTION</span>
            </div>
          </div>

          {/* BroadSheet Grid Map */}
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-800">
            
            {/* COLUMN 1 & 2: Large Lead Print Story */}
            <div class="lg:col-span-2 space-y-6 lg:pr-8">
              {articles[0] && (
                <div class="space-y-4">
                  <span class="text-[9px] font-mono font-bold text-gold uppercase tracking-widest block">✦ LEAD INTELLIGENCE BULLETIN ✦</span>
                  <h3 class="font-serif text-2xl sm:text-3xl font-black text-navy dark:text-white leading-tight hover:underline">
                    {articles[0].title}
                  </h3>
                  
                  {articles[0].urlToImage && (
                    <div class="w-full h-56 sm:h-72 overflow-hidden bg-gray-100 dark:bg-gray-850 border border-gray-200 dark:border-gray-800">
                      <img src={articles[0].urlToImage} alt="Lead story" class="w-full h-full object-cover filter saturate-0 hover:saturate-50 transition-all" />
                    </div>
                  )}

                  {articles[0].author && (
                    <p class="text-[10px] italic text-gray-500 font-serif">By senior correspondent: {articles[0].author.toUpperCase()}</p>
                  )}

                  {/* Multi-column dropcap text for print broadsheet feel */}
                  <div class="columns-1 sm:columns-2 gap-6 text-xs text-navy/95 dark:text-gray-250 leading-relaxed font-serif text-justify print:text-black">
                    <span class="float-left text-4xl font-serif font-black mr-2 mt-1 line-height-1 text-gold">
                      {articles[0].title.charAt(0)}
                    </span>
                    {articles[0].description}
                    <br/><br/>
                    {articles[0].content || 'Full details of this release have been logged on the main ER wire. Check credentials for authenticated access parameters.'}
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 3: Secondary Editorial Columns */}
            <div class="lg:col-span-1 space-y-6 lg:pl-8 pt-6 lg:pt-0">
              <span class="text-[9px] font-mono font-bold text-gold uppercase tracking-widest block border-b border-gray-100 dark:border-gray-800 pb-1.5 mb-4">✦ WIRE CHRONICLES ✦</span>
              
              {articles.slice(1, 5).map((art, idx) => (
                <div key={idx} class="space-y-2 border-b border-dashed border-gray-200 dark:border-gray-800 pb-4 last:border-b-0 last:pb-0">
                  <span class="text-[9px] font-bold text-navy/60 dark:text-gold uppercase tracking-wider block font-sans">{art.source?.name}</span>
                  <h4 class="font-serif text-sm font-black text-navy dark:text-white leading-snug hover:underline">
                    {art.title}
                  </h4>
                  <p class="text-[10.5px] font-serif text-navy/80 dark:text-gray-300 leading-normal text-justify">
                    {art.description}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 5. PRINT SPECIFIC STYLESHEET */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav, footer, .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .prose, .markdown-preview, p, h1, h2, h3, h4 {
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
