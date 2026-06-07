import React, { useState, useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const accepted = localStorage.getItem('er_cookies_accepted');
    if (!accepted) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('er_cookies_accepted', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div class="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md bg-navy text-white border-2 border-gold p-4 rounded-lg shadow-2xl z-50 animate-slide-up font-sans">
      <div class="flex items-start gap-3">
        <ShieldAlert size={20} class="text-gold shrink-0 mt-0.5" />
        
        <div class="flex-grow min-w-0">
          <div class="flex justify-between items-center mb-1">
            <h4 class="font-serif text-xs font-black uppercase tracking-wider text-gold">Privacy Consent Ledger</h4>
            <button 
              onClick={() => setShowBanner(false)} 
              class="text-gray-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          
          <p class="text-[10.5px] leading-relaxed text-gray-300 font-medium">
            We store session logs, bookmarks, and interface parameters locally to deliver high-quality editorial tools. By continuing, you agree to our ledger policies.
          </p>

          <div class="mt-3 flex gap-2.5 justify-end">
            <button
              onClick={() => {
                setShowBanner(false);
                // Dispatch view change to privacy policy
                window.dispatchEvent(new CustomEvent('change-view', { detail: 'privacy' }));
              }}
              class="text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-gold transition-colors"
            >
              Read Policy
            </button>

            <button
              onClick={handleAccept}
              class="bg-gold hover:bg-gold-light text-navy font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded transition-all shadow"
            >
              Accept Ledger
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slideUp 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
