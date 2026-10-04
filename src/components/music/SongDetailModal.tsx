'use client';

import React, { useState } from 'react';
import { WorshipSong } from '@/lib/data/songs-service';
import InteractiveChordSheet from './InteractiveChordSheet';
import SongAudioPlayer from './SongAudioPlayer';
import SongPresentationModal from './SongPresentationModal';
import SongPrintModal from './SongPrintModal';
import {
  X,
  Music,
  Printer,
  Edit3,
  Calendar,
  Layers,
  Heart,
  ExternalLink,
  Sparkles,
  Tv,
} from 'lucide-react';

interface SongDetailModalProps {
  isOpen: boolean;
  song: WorshipSong | null;
  onClose: () => void;
  onEdit?: (song: WorshipSong) => void;
}

export default function SongDetailModal({
  isOpen,
  song,
  onClose,
  onEdit,
}: SongDetailModalProps) {
  const [isPresenting, setIsPresenting] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  if (!isOpen || !song) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* =================================================================== */}
        {/* HEADER                                                              */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-6 bg-[#243c81] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-amber-500 shrink-0 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0 text-amber-300 shadow-inner">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  {song.category}
                </span>
                <span className="text-xs font-mono font-bold text-blue-200">
                  Key of {song.key} • {song.timeSignature || '4/4'}
                </span>
                {song.tempo && (
                  <span className="text-xs text-white/70 font-medium">
                    • {song.tempo}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                {song.title}
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                {song.artist} {song.ministry ? `• Ministry: ${song.ministry}` : ''}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Present Lyrics Mode Button */}
            <button
              type="button"
              onClick={() => setIsPresenting(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              title="Present song lyrics in full screen presentation mode"
            >
              <Tv className="w-4 h-4 text-slate-950" />
              <span>Present</span>
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(song)}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 border border-white/15 transition-all active:scale-95"
                title="Edit song details, lyrics, and chords"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                <span>Edit Song</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/15 transition-all cursor-pointer"
              title="Print Sheet (Chords / Lyrics)"
            >
              <Printer className="w-4 h-4 text-amber-300" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/15 transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* BODY                                                                */}
        {/* =================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
        </div>
      </div>

      {/* Song Presentation Fullscreen Modal */}
      <SongPresentationModal
        isOpen={isPresenting}
        song={song}
        onClose={() => setIsPresenting(false)}
      />

      {/* Song Print Sheet Modal */}
      <SongPrintModal
        isOpen={isPrintModalOpen}
        song={song}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
}
