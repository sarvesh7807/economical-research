import React, { useState, useEffect } from 'react';
import { Shield, FileText, Info, Mail, ArrowLeft, Phone, MapPin, Send, Check } from 'lucide-react';

export default function LegalPages({ setView, initialSection = 'about' }) {
  const [activeTab, setActiveTab] = useState(initialSection); // 'terms', 'privacy', 'about', 'contact'
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    setActiveTab(initialSection);
  }, [initialSection]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Simulate contact form submission
    console.log('Contact dispatch log:', contactForm);
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    }, 4500);
  };

  return (
    <div class="max-w-4xl mx-auto px-4 md:px-6 py-8 font-sans">
      {/* Return Button */}
      <button 
        onClick={() => setView('feed')}
        class="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold dark:text-gray-300 dark:hover:text-gold uppercase tracking-wider mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Return to Wire Feed</span>
      </button>

      {/* Tabs Header */}
      <div class="flex border-b border-paper-border dark:border-paper-borderDark bg-gray-50 dark:bg-paper-dark/30 rounded-t overflow-x-auto scrollbar-none mb-6">
        {[
          { id: 'about', name: 'About Editorial', icon: Info },
          { id: 'contact', name: 'Contact Desk', icon: Mail },
          { id: 'terms', name: 'Terms of Use', icon: FileText },
          { id: 'privacy', name: 'Privacy Ledger', icon: Shield }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              class={`px-5 py-4 text-xs font-bold uppercase tracking-wider border-r border-paper-border dark:border-paper-borderDark whitespace-nowrap flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-paper-cardDark text-gold border-b-2 border-b-gold font-black'
                  : 'text-gray-500 dark:text-gray-400 hover:text-navy'
              }`}
            >
              <Icon size={13} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Content Body */}
      <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark p-6 sm:p-8 rounded shadow-sm">
        
        {/* 1. ABOUT US TAB */}
        {activeTab === 'about' && (
          <div class="space-y-6">
            <div class="border-double-bottom-navy pb-3 mb-6">
              <h2 class="font-serif text-2xl font-black text-navy dark:text-gold uppercase tracking-wide">
                About Economical Research
              </h2>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-0.5">ESTABLISHED 2026 • JOURNALISM REGISTRY</p>
            </div>

            <p class="text-xs text-navy/90 dark:text-gray-300 leading-relaxed font-serif text-justify">
              **Economical Research** (ER) is a leading global news platform committed to publishing premium, factual, and analytical bulletins across world affairs, finance, technology, politics, and science. Anchored in rigorous editorial standards, ER curates reports from active news wires (including Reuters, BBC, The Hindu, Al Jazeera) and aggregates them with advanced artificial intelligence features.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div class="p-4 bg-gray-50 dark:bg-navy-light/10 border border-paper-border dark:border-paper-borderDark rounded">
                <h4 class="text-xs font-black text-navy dark:text-gold uppercase tracking-wider mb-2">Our Mission</h4>
                <p class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-serif">
                  To filter out clickbait noise and deliver comprehensive, objective, and well-researched news wire briefs directly to global stakeholders.
                </p>
              </div>

              <div class="p-4 bg-gray-50 dark:bg-navy-light/10 border border-paper-border dark:border-paper-borderDark rounded">
                <h4 class="text-xs font-black text-navy dark:text-gold uppercase tracking-wider mb-2">AI-Driven Editorial</h4>
                <p class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-serif">
                  Leveraging cutting-edge language processing (advanced language models) to translate foreign dispatches, outline core key points, and summarize complex market documents.
                </p>
              </div>
            </div>

            <div class="border-t border-gray-150 dark:border-gray-800 pt-6">
              <h4 class="font-serif text-sm font-bold text-navy dark:text-white mb-2">Editorial Desk Governance</h4>
              <p class="text-xs text-navy/80 dark:text-gray-400 leading-relaxed font-serif text-justify">
                Our reports comply with international news standards. We implement continuous trust-score checks (Fake News Ratings) on wire feeds to identify inconsistencies, maintaining a ledger that is highly trustworthy and audit-ready.
              </p>
            </div>
          </div>
        )}

        {/* 2. CONTACT US TAB */}
        {activeTab === 'contact' && (
          <div class="space-y-6">
            <div class="border-double-bottom-navy pb-3 mb-6">
              <h2 class="font-serif text-2xl font-black text-navy dark:text-gold uppercase tracking-wide">
                Contact the News Desk
              </h2>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-0.5">INQUIRIES & EDITORIAL REPORTING</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Directory list */}
              <div class="md:col-span-2 space-y-5 text-xs text-navy/90 dark:text-gray-300">
                <p class="text-[11.5px] leading-relaxed font-serif">
                  Reach out directly to our editorial offices regarding press updates, corrections, waitlist queries, or technical issues.
                </p>

                <div class="space-y-4 pt-2 font-sans font-semibold text-xs">
                  <div class="flex items-center gap-2.5">
                    <Mail size={14} class="text-gold shrink-0" />
                    <div>
                      <span class="text-[8px] text-gray-400 uppercase tracking-widest block font-mono">General Desk</span>
                      <a href="mailto:economicalresearch@gmail.com" class="hover:underline text-navy dark:text-gray-200">economicalresearch@gmail.com</a>
                    </div>
                  </div>

                  <div class="flex items-center gap-2.5">
                    <Phone size={14} class="text-gold shrink-0" />
                    <div>
                      <span class="text-[8px] text-gray-400 uppercase tracking-widest block font-mono">Press Hotline</span>
                      <span class="font-mono text-navy dark:text-gray-200">+1 (800) ER-NEWS-8</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2.5">
                    <MapPin size={14} class="text-gold shrink-0" />
                    <div>
                      <span class="text-[8px] text-gray-400 uppercase tracking-widest block font-mono">HQ Bureau Address</span>
                      <span class="text-navy dark:text-gray-200">75 Wall St, New York, NY 10005</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div class="md:col-span-3">
                {formSuccess ? (
                  <div class="bg-green-500/10 border border-green-500/40 text-green-700 dark:text-green-400 p-6 rounded text-center space-y-2.5 animate-pulse">
                    <Check size={28} class="mx-auto text-green-500" />
                    <h4 class="text-xs font-black uppercase tracking-wider">Message Received</h4>
                    <p class="text-[10px] font-semibold leading-relaxed">
                      Your query has been logged under our editorial dispatch ledger. A representative will contact you shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} class="space-y-4 text-xs font-semibold text-navy dark:text-gray-200">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-gray-450 uppercase tracking-wider text-[8px] mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          class="w-full bg-gray-50 dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                          placeholder="e.g. Jane Doe"
                        />
                      </div>
                      <div>
                        <label class="block text-gray-450 uppercase tracking-wider text-[8px] mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          class="w-full bg-gray-50 dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                          placeholder="e.g. jane@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label class="block text-gray-450 uppercase tracking-wider text-[8px] mb-1">Subject</label>
                      <input
                        type="text"
                        required
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        class="w-full bg-gray-50 dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white"
                        placeholder="e.g. Press feedback / PRO invoice issue"
                      />
                    </div>

                    <div>
                      <label class="block text-gray-450 uppercase tracking-wider text-[8px] mb-1">Briefing / Inquiry Message</label>
                      <textarea
                        required
                        rows="4"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        class="w-full bg-gray-50 dark:bg-paper-dark border border-paper-border dark:border-paper-borderDark rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold text-navy dark:text-white font-sans text-xs"
                        placeholder="Detail your inquiry request..."
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      class="px-4 py-2 bg-navy text-gold hover:bg-navy-light font-bold uppercase tracking-wider rounded transition-all shadow flex items-center gap-1.5"
                    >
                      <Send size={12} />
                      <span>Submit Query</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. TERMS & CONDITIONS TAB */}
        {activeTab === 'terms' && (
          <div class="space-y-6 text-xs text-navy/90 dark:text-gray-300 font-serif leading-relaxed text-justify">
            <div class="border-double-bottom-navy pb-3 mb-6 font-sans">
              <h2 class="font-serif text-2xl font-black text-navy dark:text-gold uppercase tracking-wide">
                Terms and Conditions
              </h2>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-0.5">LAST REVISED: JUNE 7, 2026</p>
            </div>

            <p>
              Welcome to the Economical Research platform (economicalresearch.com). By entering our site, accessing the news feeds, registering credentials, or upgrading to premium (PRO tier), you agree to be bound by these Terms and Conditions in full.
            </p>

            <h4 class="font-sans text-xs font-black text-navy dark:text-white uppercase tracking-wider pt-2">1. User Account Registries</h4>
            <p>
              Users registering an account on our platform must supply valid email credentials. Scraping, botting, or automating queries to our AI assistant or News API endpoints is strictly prohibited and will result in immediate Press ID ledger revocation.
            </p>

            <h4 class="font-sans text-xs font-black text-navy dark:text-white uppercase tracking-wider pt-2">2. Subscription Payments & Stripe Sandboxing</h4>
            <p>
              Upgrades to the PRO tier are charged at $4.99/month. We reserve the right to route transactions through simulated sandbox modules when live card processing undergoes network rebalancing. Waitlist registrations do not constitute an active billing agreement until explicitly verified.
            </p>

            <h4 class="font-sans text-xs font-black text-navy dark:text-white uppercase tracking-wider pt-2">3. Content Disclaimers</h4>
            <p>
              Economical Research does not write or author aggregated wire stories directly. We map headlines via RSS feeds and NewsAPI indexes. AI-generated briefs, summaries, and sentiments are simulated analytics toolkits; they do not represent financial or legal counsel.
            </p>
          </div>
        )}

        {/* 4. PRIVACY POLICY TAB */}
        {activeTab === 'privacy' && (
          <div class="space-y-6 text-xs text-navy/90 dark:text-gray-300 font-serif leading-relaxed text-justify">
            <div class="border-double-bottom-navy pb-3 mb-6 font-sans">
              <h2 class="font-serif text-2xl font-black text-navy dark:text-gold uppercase tracking-wide">
                Privacy Policy Ledger
              </h2>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-0.5">LAST REVISED: JUNE 22, 2026</p>
            </div>

            <p>
              At <strong>Economical Research</strong>, we are committed to safeguarding the trust of our global readers. Our privacy framework aligns with the rigorous compliance and security standards established by leading news networks—such as the <strong>BBC, NDTV, and CNN</strong>. This Privacy Policy outlines the scope of data collections, cookie configurations, third-party integrations, and user control protocols.
            </p>

            <h4 class="font-sans text-xs font-black text-navy dark:text-gold uppercase tracking-wider pt-2">1. Information We Collect (BBC & CNN Standards)</h4>
            <p>
              In order to provide personalized news bulletins and advanced AI tools, we collect the following categories of information:
            </p>
            <ul class="list-disc pl-5 space-y-1">
              <li><strong>User Profile Data</strong>: When you register or upgrade to PRO, we sync your display name, email address, profile picture URL, and membership status.</li>
              <li><strong>Usage & Navigation</strong>: We log your bookmark choices, read articles ledger, local search terms, and active category preferences.</li>
              <li><strong>Workspace & AI Inputs</strong>: To support the <em>Deep Research Desk</em>, chat histories, compilation prompts, and generated files are saved locally on your browser.</li>
              <li><strong>Technical Metadata</strong>: Includes IP address, browser type, device information, and geolocation coordinate checks (used strictly for compiling local weather data).</li>
            </ul>

            <h4 class="font-sans text-xs font-black text-navy dark:text-gold uppercase tracking-wider pt-2">2. Cookies and Tracking (NDTV & BBC Standards)</h4>
            <p>
              Consistent with NDTV's digital media guidelines and the BBC Cookie Policy, we utilize first-party cookies and browser local storage to enhance UI performance and load custom preferences:
            </p>
            <ul class="list-disc pl-5 space-y-1">
              <li><strong>Functional Cookies</strong>: Retain active UI state (dark/light theme toggle, language translations preference, and weather city).</li>
              <li><strong>Session Cookies</strong>: Track your remaining free message limit counter for our AI assistant.</li>
              <li><strong>External Outlinks</strong>: Our platform aggregates news wires from third-party networks (like BBC, Reuters, NDTV, and Al Jazeera). Once you click on an external link to read the full report, you are governed by that respective provider's tracking policy.</li>
            </ul>

            <h4 class="font-sans text-xs font-black text-navy dark:text-gold uppercase tracking-wider pt-2">3. Data Sharing & Third-Party Services</h4>
            <p>
              We do not sell, trade, or lease your private search terms, reading history, or AI chat logs to advertisers or marketing hubs. We coordinate strictly with trusted cloud infrastructure providers to manage critical application utilities:
            </p>
            <ul class="list-disc pl-5 space-y-1">
              <li><strong>Firebase Firestore & Auth</strong>: To synchronize credentials and secure user profile logins across multiple devices.</li>
              <li><strong>Stripe</strong>: Handles all premium PRO payment transactions via highly-encrypted tokenized gateways. We do not store or process raw financial billing details on our servers.</li>
              <li><strong>Third-party AI Processing APIs</strong>: Transmit active prompts securely to compile dispatches. Prompt logs are not retained by our API partners for model training.</li>
            </ul>

            <h4 class="font-sans text-xs font-black text-navy dark:text-gold uppercase tracking-wider pt-2">4. International Disclosures & Regional Rights (GDPR, CCPA, DPDP)</h4>
            <p>
              We respect international data protection legislation. Depending on your region, you possess specific digital rights:
            </p>
            <ul class="list-disc pl-5 space-y-1">
              <li><strong>European Union (GDPR)</strong>: You have the right to request access to, correction of, or permanent deletion of your credentials, as well as the right to restrict processing.</li>
              <li><strong>California (CCPA/CPRA)</strong>: You have the right to opt-out of data collections, access your data ledger, and request deletion without fear of service discrimination.</li>
              <li><strong>India (DPDP Act)</strong>: We manage personal data identifiers in strict accordance with the Digital Personal Data Protection Act, providing clean mechanisms for consent revocation.</li>
            </ul>

            <h4 class="font-sans text-xs font-black text-navy dark:text-gold uppercase tracking-wider pt-2">5. Data Deletion & Contact</h4>
            <p>
              You can instantly purge all locally saved workspaces, chat sessions, and cookie configurations by selecting "Clear Search History" or "Sign Out" under settings. For persistent server-side account deletion requests, or if you have privacy inquiries, please contact our Editorial Privacy Desk at <code>economicalresearch@gmail.com</code>.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
