import React, { useState } from 'react';
import { Play, Tv, Volume2, VolumeX, Maximize, ArrowLeft, Radio, AlertCircle } from 'lucide-react';

export default function LiveTV({ setView }) {
  const channels = [
    {
      id: 'aljazeera',
      name: 'Al Jazeera English',
      source: 'YouTube Live',
      videoId: '21X5lGlDOfg',
      description: 'Comprehensive international news coverage and independent analysis from the Middle East and beyond.',
      region: 'Qatar / Middle East'
    },
    {
      id: 'dwnews',
      name: 'DW News',
      source: 'YouTube Live',
      videoId: 'mGC74ktp0Zg',
      description: 'In-depth global news, analysis, and documentary reports from Germany\'s international broadcaster.',
      region: 'Germany / Global'
    },
    {
      id: 'ndtv',
      name: 'NDTV 24x7',
      source: 'YouTube Live',
      videoId: 'FPSzDkQkHdU',
      description: 'Leading English news channel from India, delivering local and global bulletins.',
      region: 'India / Asia-Pacific'
    },
    {
      id: 'skynews',
      name: 'Sky News Live',
      source: 'YouTube Live',
      videoId: '9Auq9mYxFEE',
      description: 'First for breaking news, video, headlines, analysis and top stories from the UK and around the world.',
      region: 'United Kingdom / Global'
    }
  ];

  const [activeChannel, setActiveChannel] = useState(channels[0]);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);

  const getEmbedUrl = (channel) => {
    return `https://www.youtube.com/embed/${channel.videoId}?autoplay=${isPlaying ? 1 : 0}&mute=1&playsinline=1&rel=0`;
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
      {/* Navigation Header */}
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

        {/* Live Indicator */}
        <div class="flex items-center gap-2 px-3 py-1 bg-red-600/10 border border-red-500/20 rounded">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-red-655"></span>
          </span>
          <span class="text-[9px] font-black uppercase text-red-600 tracking-wider font-mono">FEED ACTIVE</span>
        </div>
      </div>

      {/* Main player layout grid */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left/Middle Column: Main Player & Controls */}
        <div class="lg:col-span-2 space-y-4">
          
          {/* Iframe player container */}
          <div class="video-container relative w-full aspect-video bg-black border border-paper-border dark:border-paper-borderDark rounded shadow-lg overflow-hidden">
            {!isPlaying && (
              <div 
                class="absolute inset-0 flex items-center justify-center bg-black/50 z-10 cursor-pointer md:hidden"
                onClick={() => setIsPlaying(true)}
              >
                <div class="bg-red-600 rounded-full p-4 hover:bg-red-700 transition-colors shadow-lg flex items-center justify-center">
                  <Play size={40} class="text-white ml-2" />
                </div>
              </div>
            )}
            <iframe
              id="er-live-player"
              title={activeChannel.name}
              src={getEmbedUrl(activeChannel)}
              class="w-full h-full border-none"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              muted={true}
              loading="lazy"
              style={{ width: '100%', height: '100%' }}
            ></iframe>
          </div>

          {/* Quick Info & Custom Overlay control simulator */}
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

            {/* Custom controls bar */}
            <div class="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setIsMuted(!isMuted)}
                class="p-2 border border-paper-border dark:border-paper-borderDark hover:border-gold rounded hover:bg-gray-50 dark:hover:bg-navy-light/10 text-navy dark:text-gray-300 transition-colors"
                title={isMuted ? 'Unmute stream' : 'Mute stream'}
              >
                {isMuted ? <VolumeX size={15} class="text-red-500" /> : <Volume2 size={15} />}
              </button>

              <button
                onClick={handleFullscreen}
                class="p-2 border border-paper-border dark:border-paper-borderDark hover:border-gold rounded hover:bg-gray-50 dark:hover:bg-navy-light/10 text-navy dark:text-gray-300 transition-colors"
                title="Fullscreen"
              >
                <Maximize size={15} />
              </button>
            </div>
          </div>

          {/* Channel Briefing description */}
          <div class="bg-white dark:bg-paper-cardDark border border-paper-border dark:border-paper-borderDark p-4 rounded shadow-sm">
            <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono block mb-1">Station Intelligence Brief</span>
            <p class="text-xs text-navy/90 dark:text-gray-300 leading-relaxed font-serif">
              {activeChannel.description}
            </p>
          </div>

        </div>

        {/* Right Column: Station Directory / Selector */}
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
                    onClick={() => setActiveChannel(chan)}
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

            {/* Quality Warning message */}
            <div class="mt-4 p-2.5 bg-gold/5 border border-gold/15 rounded flex gap-2 text-[10px] text-gray-550 dark:text-gray-400 leading-normal">
              <AlertCircle size={14} class="text-gold shrink-0 mt-0.5" />
              <span>Streams are aggregated from public channels. Resolution and load latency may vary depending on local connection throughput.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
