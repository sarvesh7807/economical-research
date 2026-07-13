// client/src/components/DebatePage.jsx
import React, { useState, useEffect } from 'react';
import { callGemini } from '../utils/geminiCaller';

const EXAMPLE_TOPICS = [
  "Will India overtake China by 2030?",
  "Is Bitcoin a good store of value?",
  "Should central banks launch CBDCs?",
  "Is global protectionism here to stay?"
];

export default function DebatePage({ setView }) {
  const [topic, setTopic] = useState(EXAMPLE_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [debateText, setDebateText] = useState('');
  const [parsedConsensus, setParsedConsensus] = useState(null);

  const runDebate = async (targetTopic) => {
    const t = targetTopic || topic;
    setLoading(true);
    setDebateText('');
    setParsedConsensus(null);

    const prompt = `
    You are Economical Research AI.
    Generate a structured economic debate on:
    "${t}"
    
    Provide:
    
    ## FOR (Arguments Supporting)
    Argument 1: [strong economic argument]
    Evidence: [data/historical example]
    
    Argument 2: [second argument]
    Evidence: [supporting data]
    
    Argument 3: [third argument]
    Evidence: [supporting data]
    
    ## AGAINST (Arguments Opposing)
    Argument 1: [strong counter-argument]
    Evidence: [data/historical example]
    
    Argument 2: [second counter-argument]
    Evidence: [supporting data]
    
    Argument 3: [third counter-argument]
    Evidence: [supporting data]
    
    ## EXPERT CONSENSUS
    [What majority of economists think]
    
    ## ER VERDICT
    [Balanced, evidence-based conclusion]
    Confidence: [0-100%]

    IMPORTANT: At the very end of your response, output a raw JSON block enclosed between \`\`\`json and \`\`\` containing the consensus metrics. Example:
    \`\`\`json
    {
      "agreementPercentage": 65,
      "agreementPoints": ["Economic efficiency arguments are valid", "Implementation costs are high"],
      "disagreementPoints": ["Long-term distributional impacts", "Speed of adaptation"],
      "likelyOutcome": "Gradual phase-in with significant concessions."
    }
    \`\`\`
    `;

    try {
      const response = await Promise.race([
        callGemini(prompt, 2000),
        new Promise(resolve => 
          setTimeout(() => resolve(null), 45000)
        )
      ]);
      
      if (response) {
        setDebateText(response);
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const parsed = JSON.parse(jsonMatch[1].trim());
            setParsedConsensus(parsed);
          } catch (e) {
            console.error("Failed to parse debate JSON block:", e);
          }
        }
      } else {
        setDebateText('Service busy. Please try again in 2 minutes.');
      }
    } catch (err) {
      console.error(err);
      setDebateText('Error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDebate();
  }, [topic]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = customTopic.trim();
    if (!clean) return;
    setTopic(clean);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      
      {/* Header */}
      <div className="border-b border-[#F4A726]/10 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
            algorithmic synthesis forum
          </span>
          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
            AI Debate Engine
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Economic debates structured by arguments FOR, AGAINST, and the Consensus ratings of global economists.
          </p>
        </div>
      </div>

      {/* Selectors & Custom Query Input */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center border-b border-white/5 pb-4">
        {/* Preset list */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_TOPICS.map(item => (
            <button
              key={item}
              onClick={() => {
                setTopic(item);
                setCustomTopic('');
              }}
              className={`px-4 py-2 border rounded-md text-xs uppercase font-mono font-bold tracking-wide transition-all cursor-pointer ${
                topic === item
                  ? 'bg-[#F4A726] border-[#F4A726] text-navy'
                  : 'bg-[#0A1628] border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {item.length > 25 ? item.slice(0, 25) + '...' : item}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={customTopic}
            onChange={e => setCustomTopic(e.target.value)}
            placeholder="Enter custom debate topic..."
            style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(244,167,38,0.2)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              width: '280px'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              background: '#F4A726',
              color: '#0A1628',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Debate
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3 width) - Debate content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0A1628] border border-white/5 rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-serif font-black uppercase text-white border-b border-white/5 pb-2">
              Structured Economic Debate: "{topic}"
            </h2>

            {loading ? (
              <div className="space-y-6 animate-pulse py-8 text-center text-gray-500">
                <div className="h-6 bg-gray-800 rounded w-1/4 mx-auto"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2 mx-auto"></div>
                <div className="h-20 bg-gray-850 rounded"></div>
                <span>⚡ Mobilizing debating agents and sourcing empirical data briefs...</span>
              </div>
            ) : (
              <div className="prose prose-invert text-xs text-gray-300 font-serif leading-relaxed max-w-none space-y-4">
                {debateText.replace(/```json[\s\S]*?```/, '').split('\n').map((line, i) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-xl font-bold font-serif text-white uppercase pt-4 border-b border-white/5 pb-1">{line.slice(2)}</h1>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-base font-bold font-serif text-[#F4A726] uppercase pt-3">{line.slice(3)}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-sm font-bold text-white uppercase pt-2">{line.slice(4)}</h3>;
                  }
                  return <p key={i} className="leading-relaxed">{line}</p>;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3 width) - Consensus Builder */}
        <div className="space-y-6">
          <div className="bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-6 space-y-6 shadow">
            <div>
              <span className="text-[9px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
                editorial consensus engine
              </span>
              <h2 className="font-serif text-xl font-black uppercase text-white border-b border-white/5 pb-2">
                AI Consensus Builder
              </h2>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-500 animate-pulse text-xs font-mono">
                ⚡ Sifting economist polling indicators...
              </div>
            ) : parsedConsensus ? (
              <div className="space-y-6">
                {/* Consensus Gauge */}
                <div className="flex flex-col items-center justify-center py-4 bg-[#060D17] border border-white/5 rounded-lg">
                  <div className="relative w-36 h-20 flex items-center justify-center overflow-hidden">
                    <svg className="w-full h-full transform translate-y-3" viewBox="0 0 100 50">
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#222"
                        strokeWidth="10"
                      />
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#F4A726"
                        strokeWidth="10"
                        strokeDasharray="125"
                        strokeDashoffset={125 - (125 * parsedConsensus.agreementPercentage) / 100}
                      />
                    </svg>
                    <div className="absolute bottom-0 text-center">
                      <span className="text-3xl font-black tracking-tight text-[#F4A726]">
                        {parsedConsensus.agreementPercentage}%
                      </span>
                      <span className="text-[9px] font-mono block uppercase text-gray-400 mt-0.5">
                        Consensus Agreement
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase block border-b border-white/5 pb-1 mb-1">Points of Consensus</span>
                    <ul className="list-disc list-inside text-gray-300 mt-1 space-y-1">
                      {parsedConsensus.agreementPoints?.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase block border-b border-white/5 pb-1 mb-1">Core Disputes</span>
                    <ul className="list-disc list-inside text-gray-300 mt-1 space-y-1">
                      {parsedConsensus.disagreementPoints?.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase block border-b border-white/5 pb-1 mb-1">Most Likely Outcome</span>
                    <p className="text-gray-300 font-serif leading-relaxed mt-1">
                      {parsedConsensus.likelyOutcome}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-xs font-mono">
                No consensus metrics generated yet.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
