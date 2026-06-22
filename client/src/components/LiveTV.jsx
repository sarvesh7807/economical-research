import React, { useState, useEffect } from 'react';
import { Tv, Maximize, ArrowLeft, Radio, AlertCircle } from 'lucide-react';

const channels = [
  {
    id: 'aljazeera',
    name: 'Al Jazeera English',
    source: 'YouTube Live',
    channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg',
    description: 'Comprehensive international news coverage and independent analysis from the Middle East and beyond.',
    region: 'Qatar / Middle East'
  },
  {
    id: 'bbc',
    name: 'BBC News',
    source: 'YouTube Live',
    channelId: 'UC16niRr50-MSBwiO3YDb3RA',
    description: 'Latest breaking news, business, and world news from the BBC.',
    region: 'United Kingdom / Global'
  },
  {
    id: 'skynews',
    name: 'Sky News Live',
    source: 'YouTube Live',
    channelId: 'UCoMdktPbSTixAyNGwb-UYkQ',
    description: 'First for breaking news, video, headlines, analysis and top stories from the UK and around the world.',
    region: 'United Kingdom / Global'
  },
  {
    id: 'dw',
    name: 'DW News',
    source: 'YouTube Live',
    channelId: 'UCknLrEdhRCp1aegoMqRaCZg',
    description: 'In-depth global news, analysis, and documentary reports from Germany\'s international broadcaster.',
    region: 'Germany / Global'
  },
  {
    id: 'ndtv',
    name: 'NDTV 24x7',
    source: 'YouTube Live',
    channelId: 'UCZFMm1mMw0F81Z37aaEzTUA',
    description: 'Leading English news channel from India, delivering local and global bulletins.',
    region: 'India / Asia-Pacific'
  },
  {
    id: 'republic',
    name: 'Republic World',
    source: 'YouTube Live',
    channelId: 'UCwqusr8YDwM-3mEYTDeJHzw',
    description: 'India\'s fastest-growing English news channel covering national and international updates.',
    region: 'India / Asia-Pacific'
  }
];

const videoCache = {};

const getChannelVideo = async (channelId, channelKey) => {
  const cached = videoCache[channelKey];
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < 300000) {
    return cached.data;
  }
  
  try {
    const url = `/api/youtube-live?channelId=${channelId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    
    if (data.videoId) {
      const isLive = !data.isFallback;
      const result = {
        videoId: data.videoId,
        isLive: isLive
      };
      videoCache[channelKey] = { data: result, timestamp: now };
      return result;
    }
  } catch (err) {
    console.error('Failed to fetch live stream video ID:', err);
  }

  // Fallback: return the channel ID directly, which will be embedded as live_stream
  return { videoId: channelId, isLive: true };
};

export default function LiveTV({ setView }) {
  const [activeChannel, setActiveChannel] = useState(channels[0]);
  const [videoId, setVideoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isLive, setIsLive] = useState(true);

  const switchChannel = async (channel) => {
    setActiveChannel(channel);
    setLoading(true);
    setVideoId(null);
    setError(false);
    
    const result = await getChannelVideo(channel.channelId, channel.id);
    
    setVideoId(result.videoId);
    setIsLive(result.isLive);
    setLoading(false);
  };

  useEffect(() => {
    switchChannel(channels[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getEmbedUrl = () => {
    if (videoId && videoId.startsWith('UC')) {
      return `https://www.youtube.com/embed/live_stream?channel=${videoId}&autoplay=1&mute=1&playsinline=1&rel=0`;
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`;
  };

  const handleFullscreen = () => {
    const iframe = document.getElementById('er-live-player');
    if (iframe) {
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      } else if (iframe.webkitRequestFullscreen) { /* Safari */
        iframe.webkitRequestFullscreen();
      } else if (iframe.msRequestFullscreen) { /* IE11 */
        iframe.msRequestFullscreen();
      }
    }
  };

  return (
    <div class="max-w-6xl mx-auto px-4 md:px-6 py-8 font-sans">
      <button 
        onClick={() => setView('feed')}
        class="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold dark:text-gray-300 dark:hover:text-gold uppercase tracking-wider mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Return to Wire Feed</span>
      </button>

      <div class="border-double-bottom-navy pb-3 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 class="font-serif text-2xl font-black text-navy dark:text-gold uppercase tracking-wide flex items-center gap-2">
            <Tv size={22} class="text-gold" />
            <span>ER Live News Desk</span>
          </h2>
          <p class="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-0.5">Global Satellite Dispatch Wire</p>
        </div>

        <div class="flex items-center gap-2 px-3 py-1 bg-red-600/10 border border-red-500/20 rounded">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-red-655"></span>
          </span>
          <span class="text-[9px] font-black uppercase text-red-600 tracking-wider font-mono">FEED ACTIVE</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <div class="lg:col-span-2 space-y-4">
          
          <div class="video-container relative w-full aspect-video bg-black border border-paper-border dark:border-paper-borderDark rounded shadow-lg overflow-hidden flex items-center justify-center">
            {loading && <p class="text-gold animate-pulse font-mono text-sm">Loading {activeChannel.name} stream...</p>}
            
            {!loading && videoId && (
              <div class="absolute inset-0">
                <iframe
                  id="er-live-player"
                  title={activeChannel.name}
                  src={getEmbedUrl()}
                  class="absolute top-0 left-0 w-full h-full border-none"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                ></iframe>
                {isLive ? (
                  <span class="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 z-10 shadow-lg border border-red-400">
                    <span class="animate-pulse h-2 w-2 bg-white rounded-full"></span> LIVE
                  </span>
                ) : (
                  <span class="absolute top-3 right-3 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 z-10 shadow-lg border border-gray-600">
                    📼 Recent Video (Channel offline right now)
                  </span>
                )}
              </div>
            )}

            {!loading && !videoId && (
              <p class="text-red-500 font-mono text-sm px-4 text-center">Unable to load this channel. Please try another.</p>
            )}
          </div>
          
          {!loading && videoId && (
            <p class="text-[11px] text-gray-500 font-bold tracking-wide italic text-center mt-2">
              🔇 Tap video and use YouTube controls to unmute
            </p>
          )}

          <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark p-4 rounded shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[8px] bg-gold text-navy font-black px-1.5 py-0.5 uppercase tracking-wider rounded">
                  {activeChannel.source}
                </span>
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                  {activeChannel.region}
                </span>
              </div>
              <h3 class="font-serif text-base font-black text-navy dark:text-white mt-1">
                Currently Broadcasting: {activeChannel.name}
              </h3>
            </div>

            <div class="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <button
                onClick={handleFullscreen}
                class="p-2 border border-paper-border dark:border-paper-borderDark hover:border-gold rounded hover:bg-gray-50 dark:hover:bg-navy-light/10 text-navy dark:text-gray-300 transition-colors"
                title="Fullscreen"
              >
                <Maximize size={15} />
              </button>
            </div>
          </div>

          <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark p-4 rounded shadow-sm">
            <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono block mb-1">Station Intelligence Brief</span>
            <p class="text-xs text-navy/90 dark:text-gray-300 leading-relaxed font-serif">
              {activeChannel.description}
            </p>
          </div>

        </div>

        <div class="lg:col-span-1 space-y-4">
          <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark p-4 rounded shadow-sm flex flex-col">
            <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono block mb-3 pb-1 border-b border-gray-100 dark:border-gray-800">
              Station Broadcast Directory
            </span>

            <div class="space-y-2.5">
              {channels.map((chan) => {
                const isSelected = activeChannel.id === chan.id;
                return (
                  <button
                    key={chan.id}
                    onClick={() => switchChannel(chan)}
                    class={`w-full text-left p-3 border rounded transition-all flex items-start gap-3 select-none ${
                      isSelected
                        ? 'bg-navy/5 border-navy dark:bg-gold/10 dark:border-gold text-navy dark:text-gold-light shadow-sm'
                        : 'bg-transparent border-paper-border dark:border-paper-borderDark hover:bg-gray-50 dark:hover:bg-navy-light/5'
                    }`}
                  >
                    <div class={`p-2 rounded shrink-0 ${
                      isSelected ? 'bg-gold/20 text-gold-dark' : 'bg-gray-100 dark:bg-gray-800 text-gray-450'
                    }`}>
                      <Radio size={16} class={isSelected ? 'animate-pulse' : ''} />
                    </div>

                    <div class="min-w-0 flex-grow">
                      <div class="flex justify-between items-center gap-2">
                        <span class="text-xs font-black uppercase tracking-wider">{chan.name}</span>
                        {isSelected && (
                          <span class="flex h-1.5 w-1.5 shrink-0 rounded-full bg-red-655"></span>
                        )}
                      </div>
                      <span class="text-[9px] text-gray-450 block truncate font-mono mt-0.5">
                        {chan.region} • {chan.source}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div class="mt-4 p-2.5 bg-gold/5 border border-gold/15 rounded flex gap-2 text-[10px] text-gray-500 dark:text-gray-400 leading-normal">
              <AlertCircle size={14} class="text-gold shrink-0 mt-0.5" />
              <span>Streams are aggregated from public channels. Resolution and load latency may vary depending on local connection throughput.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
