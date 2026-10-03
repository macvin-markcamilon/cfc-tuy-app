'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Repeat,
  Music,
  Upload,
  ExternalLink,
} from 'lucide-react';

interface SongAudioPlayerProps {
  audioUrl?: string;
  songTitle?: string;
  artist?: string;
  onAudioUpload?: (file: File) => void;
  className?: string;
}

export default function SongAudioPlayer({
  audioUrl,
  songTitle = 'Worship Song Demo',
  artist = 'CFC Music Ministry',
  onAudioUpload,
  className = '',
}: SongAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [audioError, setAudioError] = useState<boolean>(false);

  // Reset and reload audio when audioUrl changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.load();
      setCurrentTime(0);
      setIsPlaying(false);
      setAudioError(false);
    }
  }, [audioUrl]);

  // Sync Audio element
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
        setIsPlaying(false);
      }
    };

    const handleError = () => {
      setAudioError(true);
      setIsPlaying(false);
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
  }, [audioUrl, isLooping]);

  // Volume & Speed updates
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio playback error:', err);
        setAudioError(true);
      });
    }
  };

  // Seek Progress
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

  return (
    <div className={`p-4 bg-gradient-to-r from-slate-900 via-[#101c42] to-slate-900 text-white rounded-2xl border border-white/10 shadow-lg ${className}`}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          loop={isLooping}
          preload="metadata"
        />
      )}

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
        {audioUrl ? (
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black flex items-center justify-center shadow-md transition-all active:scale-90 shrink-0"
              title={isPlaying ? 'Pause' : 'Play MP3'}
            >
              {isPlaying ? (
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
        ) : (
          /* Upload Audio Prompt if no audio exists */
          <div className="flex items-center gap-2">
            {onAudioUpload && (
              <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-white/15">
                <Upload className="w-3.5 h-3.5 text-amber-300" />
                <span>Attach MP3</span>
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

      {/* Progress Timeline Scrubber */}
      {audioUrl && (
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
      )}

      {audioError && (
        <p className="text-[11px] text-amber-300 mt-2 font-medium">
          Note: Demo audio track preview is offline. You can upload an MP3 file directly to play.
        </p>
      )}
    </div>
  );
}
