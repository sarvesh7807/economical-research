// client/src/components/WatchlistManager.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function WatchlistManager({ setView, onSelectAsset, onSelectCountry, onSelectCompany }) {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load watchlist items from Firestore
  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'er_user_watchlists'),
        where('userId', '==', 'guest')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setWatchlist(list);
    } catch (e) {
      console.error('Failed to load watchlist items:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  // Remove watchlist item
  const handleRemove = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'er_user_watchlists', id));
      setWatchlist(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to remove watchlist item:', err);
    }
  };

  // Open asset report depending on type
  const handleOpenItem = (item) => {
    if (item.itemType === 'country') {
      if (onSelectCountry) onSelectCountry(item.itemName);
      setView('country-intel');
    } else if (item.itemType === 'company') {
      if (onSelectCompany) onSelectCompany(item.itemId);
      setView('company-intel');
    } else {
      if (onSelectAsset) onSelectAsset({ symbol: item.itemId, name: item.itemName, type: item.itemType });
      setView('financials');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      
      {/* Title */}
      <div className="border-b border-[#F4A726]/10 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
            sovereign & securities watch registry
          </span>
          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
            Personal Watchlists
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Monitor countries, public companies, currency pairs, commodities, and key indices that you follow.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[11px] font-mono text-[#F4A726] uppercase tracking-widest animate-pulse">
          ⏳ Compiling watchlist ledger...
        </div>
      ) : watchlist.length === 0 ? (
        <div className="text-center py-20 bg-[#0A1628]/30 border border-[#F4A726]/10 rounded-lg p-6 max-w-2xl mx-auto">
          <span className="text-3xl block mb-3">⭐</span>
          <h3 className="text-sm font-bold text-white uppercase mb-1 font-serif">Watchlist is Clear</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
            You are not following any assets yet. Go to the Financial, Country, or Company Intelligence panels and click "Follow" or "Watch" to build your radar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map(item => (
            <div
              key={item.id}
              onClick={() => handleOpenItem(item)}
              style={{
                background: 'linear-gradient(135deg, #0A1628 0%, #060D17 100%)',
                border: '1px solid rgba(244,167,38,0.15)',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer'
              }}
              className="hover:scale-[1.02] hover:border-[#F4A726]/40 transition-all duration-150 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="px-1.5 py-0.2 bg-[#060D17] border border-white/5 rounded text-[8px] uppercase tracking-wider text-[#F4A726] font-mono font-bold">
                    {item.itemType}
                  </span>
                  <button
                    onClick={(e) => handleRemove(e, item.id)}
                    className="text-[10px] font-mono text-red-400 hover:text-red-300 bg-transparent border-none cursor-pointer p-0.5"
                    title="Unfollow asset"
                  >
                    Unfollow
                  </button>
                </div>

                <h3 className="text-sm font-bold text-white uppercase tracking-wide mt-3 font-serif">
                  {item.itemName}
                </h3>
                <p className="text-[10px] font-mono text-gray-500 uppercase mt-0.5">
                  ID: {item.itemId}
                </p>
              </div>

              <div className="flex justify-between items-center mt-6 pt-3 border-t border-white/5 text-[10px] font-mono">
                <span className="text-gray-500">Added {new Date(item.addedAt).toLocaleDateString()}</span>
                <span className="text-[#F4A726] hover:underline uppercase">View Desk →</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
