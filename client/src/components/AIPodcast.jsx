import React, { useState } from 'react';
import { callGemini } from '../utils/geminiCaller';

export default function AIPodcast() {
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState(null);

  const generatePodcast = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setScript('');
    
    try {
      const prompt = `
      You are an ER News anchor for 
      "Economical Research Daily Podcast".
      
      Generate a 3-minute podcast script on: ${topic}
      
      Format:
      [INTRO]
      "Good morning, I'm your Economical Research AI 
      correspondent. Today we're covering ${topic}."
      
      [MAIN STORY]
      [3-4 paragraphs of news/analysis]
      
      [KEY TAKEAWAYS]
      "Here are today's key takeaways..."
      [3 bullet points as spoken text]
      
      [MARKET IMPACT]
      "In terms of market impact..."
      [Brief market implications]
      
      [OUTRO]  
      "This has been your Economical Research 
      Daily Briefing. Stay informed, stay ahead."
      
      Write as spoken podcast script.
      No brackets in final text except labels.
      Conversational but professional tone.
      Never mention Gemini or Google AI.
      `;

      const result = await callGemini(prompt, 2000);
      setScript(result);
    } catch (e) {
      console.error('Podcast error:', e);
      setScript('Error generating podcast briefing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const playPodcast = () => {
    if (!script) return;
    
    if (isPlaying && utterance) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    
    const cleanText = script.replace(/\[.*?\]/g, ''); // Remove header brackets
    const u = new SpeechSynthesisUtterance(cleanText);
    u.rate = 0.95;
    u.pitch = 1.05;
    u.lang = 'en-US';
    
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => 
      v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Natural')));
    if (preferred) u.voice = preferred;
    
    u.onstart = () => setIsPlaying(true);
    u.onend = () => setIsPlaying(false);
    u.onerror = () => setIsPlaying(false);
    
    setUtterance(u);
    window.speechSynthesis.speak(u);
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 120px)',
      color: '#fff'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          color: '#fff',
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '8px'
        }}>
          🎙️ ER Podcast Generator
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '14px',
          margin: 0
        }}>
          Generate and listen to high-fidelity AI economic briefings
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. India economy today, Fed rate decision, Bitcoin outlook"
          style={{
            flex: 1,
            minWidth: '250px',
            padding: '12px 16px',
            background: 'var(--navy-dark)',
            border: '1px solid rgba(244,167,38,0.25)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'Inter, sans-serif'
          }}
        />
        <button
          onClick={generatePodcast}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: '#F4A726',
            color: '#0A1628',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'opacity 0.2s'
          }}>
          {loading ? '⏳ Writing Script...' : '🎙️ Generate Podcast'}
        </button>
      </div>

      {script && (
        <div style={{
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
            padding: '20px',
            background: 'rgba(244,167,38,0.1)',
            border: '1px solid rgba(244,167,38,0.25)',
            borderRadius: '12px'
          }}>
            <button
              onClick={playPodcast}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#F4A726',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(244,167,38,0.3)',
                transition: 'transform 0.1s'
              }}>
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <div>
              <p style={{
                color: '#F4A726',
                fontWeight: '700',
                margin: '0 0 4px',
                fontSize: '15px',
                fontFamily: 'Inter, sans-serif'
              }}>
                ER Daily Briefing Broadcast
              </p>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '13px',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                {topic} • Powered by Economical Research AI
              </p>
            </div>
          </div>

          <div style={{
            background: 'rgba(26,58,92,0.2)',
            border: '1px solid rgba(244,167,38,0.15)',
            borderRadius: '12px',
            padding: '24px',
            color: '#fff',
            fontSize: '15px',
            lineHeight: '1.9',
            whiteSpace: 'pre-wrap',
            fontFamily: 'Inter, sans-serif',
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            {script}
          </div>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '11px',
            marginTop: '12px',
            textAlign: 'center',
            opacity: 0.7
          }}>
            Uses browser text-to-speech engine. Generated by Economical Research AI.
          </p>
        </div>
      )}
    </div>
  );
}
