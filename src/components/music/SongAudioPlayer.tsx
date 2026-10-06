'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Repeat,
  Music,
  Upload,
  ExternalLink,
  Video,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { extractYouTubeId, isYouTubeUrl } from '@/lib/data/songs-service';

const YoutubeIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface SongAudioPlayerProps {
  audioUrl?: string;
  youtubeUrl?: string;
  songTitle?: string;
  artist?: string;
  onAudioUpload?: (file: File) => void;
  className?: string;
}

export default function SongAudioPlayer({
  audioUrl,
  youtubeUrl,
  songTitle = 'Worship Song Demo',
  artist = 'CFC Music Ministry',
  onAudioUpload,
  className = '',
}: SongAudioPlayerProps) {
  // Extract YouTube ID from youtubeUrl prop or audioUrl if it is a YouTube link
  const youtubeId = extractYouTubeId(youtubeUrl) || (isYouTubeUrl(audioUrl) ? extractYouTubeId(audioUrl) : null);
  
  // Clean MP3 URL (only if audioUrl is NOT a YouTube link)
  const mp3Url = audioUrl && !isYouTubeUrl(audioUrl) ? audioUrl : undefined;

  // Active Tab state if both YouTube and MP3 are present
  const [activeSource, setActiveSource] = useState<'youtube' | 'mp3'>(
    youtubeId ? 'youtube' : 'mp3'
  );

  // Sync default tab if props change
  useEffect(() => {
    if (youtubeId && !mp3Url) {
      setActiveSource('youtube');
    } else if (mp3Url && !youtubeId) {
      setActiveSource('mp3');
    }
  }, [youtubeId, mp3Url]);

  // MP3 Player Audio State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingMp3, setIsPlayingMp3] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [audioError, setAudioError] = useState<boolean>(false);

  // YouTube Player State
  const [showYouTubeVideo, setShowYouTubeVideo] = useState<boolean>(true);
  const [isYouTubePlaying, setIsYouTubePlaying] = useState<boolean>(false);

  // Reset MP3 audio when mp3Url changes
  useEffect(() => {
    if (audioRef.current && mp3Url) {
      audioRef.current.load();
      setCurrentTime(0);
      setIsPlayingMp3(false);
      setAudioError(false);
    }
  }, [mp3Url]);

  // Sync MP3 Audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setAudioError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      if (!isLooping) {
        setIsPlayingMp3(false);
      }
    };

    const handleError = () => {
      setAudioError(true);
      setIsPlayingMp3(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [mp3Url, isLooping]);

  // MP3 Volume & Speed updates
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

  // Toggle MP3 Play/Pause
  const toggleMp3Play = () => {
    if (!audioRef.current || !mp3Url) return;

    if (isPlayingMp3) {
      audioRef.current.pause();
      setIsPlayingMp3(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingMp3(true);
      }).catch((err) => {
        console.warn('Audio playback error:', err);
        setAudioError(true);
      });
    }
  };

  // Seek MP3 Progress
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Number(e.target.value);
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const hasMedia = Boolean(youtubeId || mp3Url);

  return (
    <div className={`p-4 bg-gradient-to-r from-slate-900 via-[#101c42] to-slate-900 text-white rounded-2xl border border-white/10 shadow-lg ${className}`}>
      {/* Source Selector Tabs (if both YouTube and MP3 exist) */}
      {youtubeId && mp3Url && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Audio Source:
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveSource('youtube');
              if (audioRef.current) audioRef.current.pause();
              setIsPlayingMp3(false);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSource === 'youtube'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <YoutubeIcon className="w-3.5 h-3.5 text-white" />
            <span>YouTube Track</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSource('mp3')}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSource === 'mp3'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span>MP3 Audio</span>
          </button>
        </div>
      )}

      {/* YOUTUBE TRACK PLAYER SECTION */}
      {hasMedia && (youtubeId && activeSource === 'youtube') && (
        <div className="flex flex-col space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Track Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shrink-0 shadow-md">
                <YoutubeIcon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-white truncate flex items-center gap-1.5">
                  <span>{songTitle}</span>
                  <span className="text-[10px] bg-red-500/30 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-md font-mono">
                    YouTube
                  </span>
                </h4>
                <p className="text-xs text-blue-200 truncate">
                  {artist} • YouTube Audio & Video
                </p>
              </div>
            </div>

            {/* YouTube Action Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setShowYouTubeVideo((p) => !p);
                  setIsYouTubePlaying(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Video className="w-3.5 h-3.5" />
                <span>{showYouTubeVideo ? 'Collapse Video' : 'Play YouTube Video'}</span>
                {showYouTubeVideo ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <a
                href={`https://www.youtube.com/watch?v=${youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 border border-white/15 transition-all"
                title="Open on YouTube website"
              >
                <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">YouTube</span>
              </a>
            </div>
          </div>

          {/* Embedded YouTube Player Container */}
          {showYouTubeVideo && (
            <div className="mt-3 relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=${isYouTubePlaying ? 1 : 0}&rel=0&modestbranding=1`}
                title={`${songTitle} - YouTube Worship Track`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          )}
        </div>
      )}

      {/* MP3 AUDIO TRACK PLAYER SECTION */}
      {hasMedia && (mp3Url && activeSource === 'mp3') && (
        <>
          <audio
            ref={audioRef}
            src={mp3Url}
            loop={isLooping}
            preload="metadata"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Track Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                <Music className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-white truncate">{songTitle}</h4>
                <p className="text-xs text-blue-200 truncate">{artist} • MP3 Audio Track</p>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={toggleMp3Play}
                className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black flex items-center justify-center shadow-md transition-all active:scale-90 shrink-0"
                title={isPlayingMp3 ? 'Pause' : 'Play MP3'}
              >
                {isPlayingMp3 ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Loop Toggle */}
              <button
                type="button"
                onClick={() => setIsLooping((p) => !p)}
                className={`p-2 rounded-xl transition-all ${
                  isLooping
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Loop track for practice"
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* Playback speed */}
              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
                className="bg-white/10 text-white rounded-lg text-xs font-bold px-2 py-1 border border-white/10 focus:outline-hidden"
                title="Practice speed"
              >
                <option value={0.75} className="text-slate-900 bg-white">0.75x</option>
                <option value={1.0} className="text-slate-900 bg-white">1.0x</option>
                <option value={1.25} className="text-slate-900 bg-white">1.25x</option>
              </select>

              {/* Volume */}
              <div className="flex items-center gap-1.5 hidden md:flex">
                <button
                  type="button"
                  onClick={() => setIsMuted((p) => !p)}
                  className="text-slate-400 hover:text-white"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Progress Timeline Scrubber */}
          <div className="mt-3 flex items-center gap-2.5 text-xs text-slate-300 font-mono">
            <span className="w-9 text-right shrink-0">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.5"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="w-9 shrink-0">{formatTime(duration)}</span>
          </div>

          {audioError && (
            <p className="text-[11px] text-amber-300 mt-2 font-medium">
              Note: Demo audio track preview is offline. You can upload an MP3 file or attach a YouTube link.
            </p>
          )}
        </>
      )}

      {/* NO AUDIO OR YOUTUBE ATTACHED PROMPT */}
      {!hasMedia && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center font-black shrink-0 border border-white/10">
              <Music className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-white truncate">{songTitle}</h4>
              <p className="text-xs text-slate-400 truncate">No audio or YouTube link attached yet.</p>
            </div>
          </div>

          {onAudioUpload && (
            <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0">
              <Upload className="w-4 h-4" />
              <span>Attach Audio / MP3</span>
              <input
                type="file"
                accept="audio/mp3,audio/wav,audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onAudioUpload(file);
                }}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

