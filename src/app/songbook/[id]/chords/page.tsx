'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  WorshipSong,
  fetchWorshipSongById,
  subscribeToSongsChanges,
} from '@/lib/data/songs-service';
import InteractiveChordSheet from '@/components/music/InteractiveChordSheet';
import SongPresentationModal from '@/components/music/SongPresentationModal';
import SongPrintModal from '@/components/music/SongPrintModal';
import {
  ArrowLeft,
  Music,
  Printer,
  Share2,
  Check,
  Guitar,
  Tv,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

interface ChordsOnlyPageProps {
  params: Promise<{ id: string }>;
}

export default function ChordsOnlyPage({ params }: ChordsOnlyPageProps) {
  const resolvedParams = use(params);
  const songId = resolvedParams.id;

  const [song, setSong] = useState<WorshipSong | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const targetSong = await fetchWorshipSongById(songId);
        if (isMounted) {
          setSong(targetSong);
        }
      } catch (err) {
        console.error('Failed to load song chords:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();

    const unsubscribe = subscribeToSongsChanges(async () => {
      try {
        const targetSong = await fetchWorshipSongById(songId);
        if (isMounted) {
          setSong(targetSong);
        }
      } catch (err) {
        console.error('Song chords realtime sync refresh error:', err);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [songId]);

  // Audio control
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch((err) => console.log('Audio play error:', err));
      setIsPlayingAudio(true);
    }
  };

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center py-24 px-4">
        <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-4" />
        <p className="text-white font-extrabold text-base">Loading Chords Sheet...</p>
        <p className="text-slate-400 text-xs mt-1">Preparing lyrics and guitar diagrams</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center py-24 px-4">
        <div className="bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-700 shadow-2xl text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-3xl bg-amber-400/20 text-amber-300 flex items-center justify-center mx-auto mb-4">
            <Guitar className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Song Not Found</h1>
          <p className="text-sm text-slate-300 mt-2">
            The chords sheet you are looking for may have been removed or updated.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/songbook"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Songbook</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Audio element for backing track */}
      {song.audioUrl && (
        <audio
          ref={audioRef}
          src={song.audioUrl}
          onEnded={() => setIsPlayingAudio(false)}
          onPause={() => setIsPlayingAudio(false)}
          onPlay={() => setIsPlayingAudio(true)}
        />
      )}

      {/* ===================================================================== */}
      {/* STAGE-READY TOP NAVIGATION BAR                                        */}
      {/* ===================================================================== */}
      <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-md">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <Link
            href={`/songbook/${song.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95"
            title="View Song Details"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Song Details</span>
          </Link>
          <Link
            href="/songbook"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white font-medium text-xs transition-all"
            title="Return to Songbook"
          >
            <span className="hidden md:inline">Songbook</span>
          </Link>
        </div>

        {/* Center: Title & Key Badge */}
        <div className="flex items-center gap-2 text-center overflow-hidden">
          <div className="truncate">
            <span className="font-black text-sm sm:text-base text-white truncate block">
              {song.title}
            </span>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {song.artist || 'CFC Music Ministry'}
            </span>
          </div>
          <span className="shrink-0 font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
            Key: {song.key}
          </span>
        </div>

        {/* Right: Quick Stage Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Audio Backing Track Toggle (if song has audio) */}
          {song.audioUrl && (
            <button
              type="button"
              onClick={toggleAudio}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                isPlayingAudio
                  ? 'bg-amber-400 text-slate-950 shadow-md animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isPlayingAudio ? 'Pause backing audio' : 'Play backing track'}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">Playing</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">Audio</span>
                </>
              )}
            </button>
          )}

          {/* Present Mode Button */}
          <button
            type="button"
            onClick={() => setIsPresenting(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            title="Present lyrics on screen"
          >
            <Tv className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">Present</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-all active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (Stage Mode)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Print Sheet */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-all active:scale-95 hidden sm:inline-flex"
            title="Print Chord Sheet"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MAIN CHORDS CONTAINER (Optimized for Mobile, Tablet, and Desktop)     */}
      {/* ===================================================================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6 flex flex-col">
        <InteractiveChordSheet
          content={song.lyricsAndChords}
          originalKey={song.key}
          className="flex-1 shadow-xl"
        />
      </main>

      {/* Presentation Fullscreen Modal */}
      <SongPresentationModal
        isOpen={isPresenting}
        song={song}
        onClose={() => setIsPresenting(false)}
      />

      {/* Print Sheet Modal */}
      <SongPrintModal
        isOpen={isPrintModalOpen}
        song={song}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
}
