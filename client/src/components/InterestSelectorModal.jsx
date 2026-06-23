import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Check, X } from 'lucide-react';

export default function InterestSelectorModal({ isOpen, onClose, isUpdate = false }) {
  const { userPreferences, saveUserPreferences } = useAuth();
  const [selected, setSelected] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'technology', label: 'Technology', icon: '💻' },
    { id: 'sports', label: 'Sports', icon: '⚽' },
    { id: 'politics', label: 'Politics', icon: '🏛️' },
    { id: 'health', label: 'Health', icon: '❤️' },
    { id: 'science', label: 'Science', icon: '🔬' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { id: 'world', label: 'World News', icon: '🌍' },
    { id: 'finance', label: 'Finance', icon: '📈' },
    { id: 'cricket', label: 'Cricket', icon: '🏏' },
    { id: 'football', label: 'Football', icon: '⚽' },
    { id: 'mma', label: 'MMA', icon: '🥊' }
  ];

  useEffect(() => {
    if (isOpen && userPreferences?.selectedTopics) {
      setSelected(userPreferences.selectedTopics);
    } else {
      setSelected([]);
    }
  }, [isOpen, userPreferences]);

  if (!isOpen) return null;

  const handleToggle = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selected.length < 3) return;
    setIsSaving(true);
    try {
      await saveUserPreferences(selected);
      onClose();
    } catch (e) {
      console.error('Error saving interests:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl overflow-hidden border border-white/10 rounded-3xl bg-[#0A1628]/90 text-white shadow-2xl shadow-purple-950/20 max-h-[90vh] flex flex-col">
        
        {/* Background glow effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#3b82f6]/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#ec4899]/10 blur-[120px] pointer-events-none"></div>

        {/* Close Button (only for updates) */}
        {isUpdate && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
          >
            <X size={18} />
          </button>
        )}

        <div className="p-6 md:p-8 flex flex-col flex-grow overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-6 shrink-0 mt-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase font-black tracking-widest mb-3 animate-pulse">
              <Sparkles size={11} />
              <span>Personalized Experience</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight text-white mb-2 leading-tight uppercase">
              {isUpdate ? "Update Your Interests" : "Welcome to Economical Research!"}
            </h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              {isUpdate ? "Change your preferences anytime:" : "Select your interests for a personalized feed:"}
            </p>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 my-4 flex-grow">
            {categories.map((cat) => {
              const isSelected = selected.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => handleToggle(cat.id)}
                  className={`relative p-4 rounded-2xl text-left border transition-all duration-300 flex flex-col justify-between h-24 hover:scale-[1.02] active:scale-[0.98] group overflow-hidden ${
                    isSelected
                      ? 'border-gold bg-gold/10 text-white shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                      : 'border-white/5 bg-white/5 hover:border-white/20 text-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-gold text-navy flex items-center justify-center text-[10px] font-black animate-scale-in">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-xs md:text-sm uppercase tracking-wide truncate group-hover:text-gold transition-colors">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="mt-6 border-t border-white/5 pt-5 text-center shrink-0 flex flex-col items-center gap-3">
            <button
              onClick={handleSave}
              disabled={selected.length < 3 || isSaving}
              className={`w-full sm:w-auto px-10 py-3.5 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300 ${
                selected.length >= 3
                  ? 'bg-gradient-to-r from-gold to-yellow-500 hover:from-yellow-450 hover:to-gold text-navy shadow-lg hover:scale-105 active:scale-95'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {isSaving ? "Saving Profiles..." : selected.length < 3 ? `Select ${3 - selected.length} More` : "Save Preferences"}
            </button>
            <p className="text-[10px] text-gray-400 uppercase font-semibold font-mono">
              Please choose at least 3 topics to build your recommendation profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
