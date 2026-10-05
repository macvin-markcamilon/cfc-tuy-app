'use client';

import React, { useState } from 'react';
import { Play, Sparkles, ExternalLink, Video } from 'lucide-react';

const YoutubeIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface ReflectionVideo {
  id: string;
  title: string;
  subtitle: string;
  embedUrl: string;
  thumbnailUrl: string;
  duration: string;
}

const FEATURED_VIDEOS: ReflectionVideo[] = [
  {
    id: 'video-1',
    title: 'Only by Grace Reflections: Faith & Family in Mission',
    subtitle: 'Spiritual guidance on strengthening marriages and deepening trust in God.',
    embedUrl: 'https://www.youtube.com/embed/videoseries?list=PLnnwVvH8pzEiLnl4dAekN_Hbo66m22B2d',
    thumbnailUrl: 'https://img.youtube.com/vi/uwKeGjfZbhv/hqdefault.jpg',
    duration: 'Pastoral Series',
  },
  {
    id: 'video-2',
    title: 'Only by Grace Reflections: Walking as One Community',
    subtitle: 'Pastoral message on living out Christ’s love in our daily household life.',
    embedUrl: 'https://www.youtube.com/embed/videoseries?list=PLnnwVvH8pzEiLnl4dAekN_Hbo66m22B2d&index=2',
    thumbnailUrl: 'https://img.youtube.com/vi/uwKeGjfZbhv/hqdefault.jpg',
    duration: 'Episode 2',
  },
  {
    id: 'video-3',
    title: 'Only by Grace Reflections: Renewed in the Holy Spirit',
    subtitle: 'Inspirational talk on grace, forgiveness, and renewal of Christian family life.',
    embedUrl: 'https://www.youtube.com/embed/videoseries?list=PLnnwVvH8pzEiLnl4dAekN_Hbo66m22B2d&index=3',
    thumbnailUrl: 'https://img.youtube.com/vi/uwKeGjfZbhv/hqdefault.jpg',
    duration: 'Episode 3',
  },
];

export default function OnlyByGraceReflections() {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(0);
  const activeVideo = FEATURED_VIDEOS[selectedVideoIndex];

  return (
    <section id="only-by-grace" className="py-16 sm:py-20 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black uppercase tracking-wider">
              <YoutubeIcon className="w-4 h-4 text-rose-500" />
              <span>Official Video Reflections</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Only by Grace Reflections
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl font-medium">
              Pastoral teachings, spiritual talks, and reflections from the official Couples for Christ Global media channel.
            </p>
          </div>

          <a
            href="https://www.youtube.com/channel/UCVb6g46-SKkTLTHTF-wO8Kw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 shrink-0 self-start md:self-auto"
          >
            <YoutubeIcon className="w-4 h-4" />
            <span>Watch All on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Main Player & Playlist Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main YouTube Video Embed */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
              <iframe
                src={activeVideo.embedUrl}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <h3 className="text-lg font-black text-white">{activeVideo.title}</h3>
              <p className="text-xs text-slate-300 font-medium">{activeVideo.subtitle}</p>
            </div>
          </div>

          {/* 3 Latest Video Cards List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Featured Episodes ({FEATURED_VIDEOS.length})</span>
              <span className="text-rose-400 font-bold">CFC Global Channel</span>
            </div>

            {FEATURED_VIDEOS.map((video, idx) => {
              const isSelected = selectedVideoIndex === idx;

              return (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideoIndex(idx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-950/60 to-slate-800 border-rose-500/80 shadow-md translate-x-1'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                    {isSelected ? (
                      <Play className="w-5 h-5 text-rose-500 fill-rose-500" />
                    ) : (
                      <Video className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block">
                      {video.duration}
                    </span>
                    <h4 className="text-xs font-extrabold text-white truncate">
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {video.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
