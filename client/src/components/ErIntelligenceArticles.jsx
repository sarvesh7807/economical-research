import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

const FALLBACK_ARTICLES = [
  {
    id: 'fb-global',
    title: 'Decoding the 2026 Macro Landscape: Growth, Inflation, and Central Bank Trajectories',
    content: 'As we enter the mid-point of 2026, global financial systems are witnessing structural shifts. Major central banks are pivoting away from aggressive tightening, though structural inflation factors—such as supply-chain reorganization and energy transition investments—keep core inflation rates slightly above pre-pandemic levels. Observers predict moderate growth in G7 economies, with regional disparities widening depending on fiscal policy headroom.\n\nFurthermore, liquidity patterns indicate a return to value-oriented assets, with global bond yields stabilizing near decade highs. This has prompted multi-asset allocators to lock in longer-term fixed income instruments before anticipated policy easings. In the corporate landscape, productivity gains from artificial intelligence are starting to manifest in operating margins, offsetting elevated wage growth indices.',
    readTime: '5 min read'
  },
  {
    id: 'fb-emerging',
    title: 'Emerging Market Resilience: Capital Flows and Sovereign Debt Pressures',
    content: 'Emerging market (EM) economies continue to showcase varied resilience in a high-rate global environment. While commodity-exporting nations in Latin America and the Middle East leverage strong trade terms, countries heavily reliant on foreign-currency borrowing are facing refinancing challenges. Economists suggest that localized monetary policies in Brazil and Mexico have successfully anchored local currencies, paving the way for selective capital inflows.\n\nInstitutional capital flows are progressively moving towards high-governance and energy-surplus markets. Nonetheless, credit risks remain high in lower-income frontier markets facing food inflation and localized debt restructuring. Forward-looking strategies focus on building domestic bond markets to minimize exchange rate exposures in future cycles.',
    readTime: '4 min read'
  },
  {
    id: 'fb-india',
    title: "India's Economic Momentum: Domestic Consumption and Capital Expenditures",
    content: "India continues to stand out as a key growth driver in the Indo-Pacific region, with projected GDP growth hovering around 6.5%. The momentum is largely driven by resilient domestic consumption patterns and robust public sector capital expenditures (Capex). Observers point out that the digitization of the financial system has substantially lowered credit costs, encouraging micro and small enterprise investments.\n\nHowever, structural challenges persist, particularly in agricultural yields affected by volatile monsoon behaviors and employment generation for the urban youth. Analysts suggest that the ongoing shift towards advanced manufacturing and global capability centers (GCCs) will play a pivotal role in maintaining the current growth trajectory through the decade.",
    readTime: '3 min read'
  }
];

export default function ErIntelligenceArticles() {
  const [erArticles, setErArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndGenerateArticles = async () => {
      try {
        setLoading(true);
        // Fetch latest articles from Firestore
        const q = query(
          collection(db, 'er_original_articles'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const querySnapshot = await getDocs(q);
        let articlesList = [];
        querySnapshot.forEach((doc) => {
          articlesList.push({ id: doc.id, ...doc.data() });
        });

        // Check if we have articles generated recently (within the last 24 hours)
        let isRecent = false;
        if (articlesList.length === 3 && articlesList[0]?.createdAt) {
          try {
            const createdTime = new Date(articlesList[0].createdAt).getTime();
            if (!isNaN(createdTime)) {
              isRecent = (Date.now() - createdTime) < 24 * 3600000;
            }
          } catch (e) {
            isRecent = false;
          }
        }

        if (isRecent) {
          setErArticles(articlesList);
          return;
        }

        // Generate new articles using Gemini API
        const topics = [
          { key: 'global', name: 'Global economic outlook' },
          { key: 'emerging', name: 'Emerging markets analysis' },
          { key: 'india', name: 'India market intelligence' }
        ];

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const newArticles = await Promise.all(
          topics.map(async (topic) => {
            try {
              if (!apiKey) throw new Error("API Key missing");
              const prompt = `You are a senior economic editor at "Economical Research". Write a professional intelligence briefing on "${topic.name}". Return ONLY a JSON object with keys "title" (a compelling headline), "content" (two long, rich paragraphs of detailed macro analysis), and "readTime" (e.g. "4 min read"). Do not include markdown code block backticks. Make sure it is valid JSON.`;
              
              const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }]
                })
              });
              
              if (!res.ok) throw new Error();
              const json = await res.json();
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
              
              // Clean any backticks or potential wrapper texts
              const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleanText);

              // Save to Firestore
              const docRef = await addDoc(collection(db, 'er_original_articles'), {
                title: parsed?.title || topic.name,
                content: parsed?.content || 'Briefing details are being compiled.',
                readTime: parsed?.readTime || '5 min read',
                createdAt: new Date().toISOString()
              });

              return {
                id: docRef.id,
                title: parsed?.title || topic.name,
                content: parsed?.content || 'Briefing details are being compiled.',
                readTime: parsed?.readTime || '5 min read'
              };
            } catch (err) {
              console.error('Failed to generate article for topic', topic.name, err);
              // Fallback to local default
              const fallback = FALLBACK_ARTICLES.find(f => f.id.includes(topic.key)) || FALLBACK_ARTICLES[0];
              return { ...fallback, id: `${fallback.id}-${Date.now()}` };
            }
          })
        );

        setErArticles(newArticles);
      } catch (err) {
        console.error('Error fetching/generating original articles:', err);
        setErArticles(FALLBACK_ARTICLES);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGenerateArticles();
  }, []);

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-400 dark:text-gray-500 font-mono text-xs uppercase tracking-widest animate-pulse">
        Synthesizing Exclusive AI Reports...
      </div>
    );
  }

  if (!erArticles || erArticles.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: '#F4A726',
          color: '#0A1628',
          padding: '6px 16px',
          borderRadius: '4px',
          fontWeight: '800',
          fontSize: '13px'
        }} className="font-sans">ER INTELLIGENCE</div>
        <h2 style={{color: '#fff', margin: 0}} className="font-display text-lg md:text-xl font-bold uppercase tracking-tight text-white">
          Exclusive Research & Analysis
        </h2>
      </div>

      <div className="space-y-4">
        {erArticles && erArticles.length > 0 && erArticles.map((article, idx) => (
          <div 
            key={article?.id || `er-art-${idx}`} 
            onClick={() => article && setSelectedArticle(article)}
            style={{
              background: 'linear-gradient(145deg, #1A3A5C, #0A1628)',
              border: '1px solid rgba(244,167,38,0.2)',
              borderRadius: '6px',
              padding: '20px',
              cursor: 'pointer'
            }}
            className="hover:scale-[1.01] transition-transform duration-200 shadow-md group"
          >
            <h3 style={{color: '#fff', fontSize: '15px'}} className="font-display font-bold group-hover:text-gold transition-colors">
              {article?.title || 'Untitled Briefing'}
            </h3>
            <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '6px'}} className="font-sans">
              By ER Research Desk · {article?.readTime || '5 min read'}
            </p>
          </div>
        ))}
      </div>

      {/* Full Article Viewer Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/75 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-navy border border-gold/40 text-white w-full max-w-2xl rounded-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-navy-light/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded">Exclusive Intelligence</span>
              <button 
                onClick={() => setSelectedArticle(null)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 font-serif text-sm leading-relaxed text-gray-200">
              <h2 className="text-xl md:text-2xl font-display font-black text-white leading-tight">
                {selectedArticle?.title || 'Untitled Briefing'}
              </h2>
              <div className="text-xs font-sans text-gray-400 pb-2 border-b border-white/5">
                By ER Research Desk · Published: Daily Update · {selectedArticle?.readTime || '5 min read'}
              </div>
              <div className="whitespace-pre-line space-y-4 pt-2">
                {selectedArticle?.content || 'No content details available.'}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 bg-navy-light/10 text-right">
              <button 
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 bg-gold hover:bg-gold-light text-[#0A1628] font-bold text-xs uppercase rounded transition-colors"
              >
                Close Briefing
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
