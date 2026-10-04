'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  WorshipSong,
  fetchWorshipSongById,
  fetchWorshipSongs,
} from '@/lib/data/songs-service';
import InteractiveChordSheet from '@/components/music/InteractiveChordSheet';
import SongAudioPlayer from '@/components/music/SongAudioPlayer';
import SongEditorModal from '@/components/music/SongEditorModal';
import {
  ArrowLeft,
  Music,
  Printer,
  Edit3,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Guitar,
  Clock,
  Tag,
} from 'lucide-react';

interface SongDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SongDetailPage({ params }: SongDetailPageProps) {
  const resolvedParams = use(params);
  const songId = resolvedParams.id;
  const router = useRouter();

  const [song, setSong] = useState<WorshipSong | null>(null);
  const [allSongs, setAllSongs] = useState<WorshipSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdminLoggedIn(localStorage.getItem('cfc_tuy_admin_auth') === 'true');
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [targetSong, list] = await Promise.all([
          fetchWorshipSongById(songId),
          fetchWorshipSongs(),
        ]);
        setSong(targetSong);
        setAllSongs(list);
      } catch (err) {
        console.error('Failed to load song detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [songId]);

  // Find next & previous songs for repertoire navigation
  const currentIndex = allSongs.findIndex((s) => s.id === songId);
  const prevSong = currentIndex > 0 ? allSongs[currentIndex - 1] : null;
  const nextSong = currentIndex >= 0 && currentIndex < allSongs.length - 1 ? allSongs[currentIndex + 1] : null;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center py-24 px-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#243c81] border-t-transparent animate-spin mb-4" />
        <p className="text-slate-600 font-bold text-base">Loading Song Details...</p>
        <p className="text-slate-400 text-xs mt-1">Retrieving lyrics, chords, and recordings</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center py-24 px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-lg text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#243c81] flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Song Not Found</h1>
          <p className="text-sm text-slate-600 mt-2">
            The worship song you are looking for may have been removed or updated.
          </p>
          <Link
            href="/songbook"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#243c81] hover:bg-[#1a2d63] text-white font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Songbook</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ===================================================================== */}
      {/* TOP HEADER / ACTION BAR                                               */}
      {/* ===================================================================== */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <Link
            href="/songbook"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-[#243c81] font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200 transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Songbook</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Share / Copy link button */}
            <button
              type="button"
              onClick={handleShare}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                copied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-xs'
              }`}
              title="Share song link"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            {/* Print chord sheet */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs font-bold text-xs transition-all"
              title="Print Chord Sheet"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Print Sheet</span>
            </button>

            {/* Edit Button (Admin Only) */}
            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={() => setIsEditorOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-xs transition-all active:scale-95"
                title="Edit song details"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Song</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SONG TITLE BANNER CARD                                                */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-br from-[#12224d] via-[#243c81] to-[#1a2d63] text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-b-4 border-amber-500 shadow-md">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-inner">
                  {song.category}
                </span>

                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-white/10 text-amber-300 border border-white/20">
                  Key of {song.key}
                </span>

                {song.timeSignature && (
                  <span className="text-xs font-semibold text-blue-200 bg-white/10 px-2.5 py-1 rounded-md border border-white/20">
                    Time: {song.timeSignature}
                  </span>
                )}

                {song.tempo && (
                  <span className="text-xs font-semibold text-blue-100 bg-white/10 px-2.5 py-1 rounded-md border border-white/20 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-300" />
                    <span>{song.tempo}</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {song.title}
              </h1>

              <p className="text-sm sm:text-base text-blue-100 font-medium flex items-center gap-2">
                <span>{song.artist || 'Couples for Christ Music Ministry'}</span>
                {song.ministry && (
                  <span className="text-amber-300 font-bold">• Ministry: {song.ministry}</span>
                )}
              </p>
            </div>

            {/* Quick Song Tags if available */}
            {song.tags && song.tags.length > 0 && (
              <div className="flex items-center md:flex-col md:items-end gap-1.5 flex-wrap">
                {song.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-white/10 text-blue-200 text-xs font-semibold border border-white/15 flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3 text-amber-300" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN CONTENT AREA: AUDIO PLAYER & CHORD SHEET                        */}
      {/* ===================================================================== */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* MP3 Audio Player Track (if attached or available) */}
        <SongAudioPlayer
          audioUrl={song.audioUrl}
          songTitle={song.title}
          artist={song.artist}
        />

        {/* Interactive Ultimate Guitar Chord Sheet */}
        <InteractiveChordSheet
          content={song.lyricsAndChords}
          originalKey={song.key}
        />

        {/* =================================================================== */}
        {/* REPERTOIRE NAVIGATION FOOTER                                        */}
        {/* =================================================================== */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevSong ? (
            <Link
              href={`/songbook/${prevSong.id}`}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#243c81] shadow-xs hover:shadow-md transition-all group flex items-center gap-3"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-[#243c81] transition-colors" />
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Previous Song
                </span>
                <span className="text-sm font-bold text-slate-900 group-hover:text-[#243c81] transition-colors truncate block">
                  {prevSong.title}
                </span>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextSong ? (
            <Link
              href={`/songbook/${nextSong.id}`}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#243c81] shadow-xs hover:shadow-md transition-all group flex items-center justify-between text-right gap-3 sm:col-start-2"
            >
              <div className="overflow-hidden w-full">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Next Song
                </span>
                <span className="text-sm font-bold text-slate-900 group-hover:text-[#243c81] transition-colors truncate block">
                  {nextSong.title}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#243c81] transition-colors shrink-0" />
            </Link>
          ) : null}
        </div>
      </main>

      {/* Admin Edit Modal if triggered */}
      {isAdminLoggedIn && isEditorOpen && (
        <SongEditorModal
          isOpen={isEditorOpen}
          initialSong={song}
          onClose={() => setIsEditorOpen(false)}
          onSave={async (updatedData) => {
            setIsEditorOpen(false);
            // Refresh data
            const updated = await fetchWorshipSongById(songId);
            if (updated) setSong(updated);
          }}
        />
      )}
    </div>
  );
}
