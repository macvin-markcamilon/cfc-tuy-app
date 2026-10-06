'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  WorshipSong,
  fetchWorshipSongById,
  saveWorshipSong,
  uploadSongAudio,
  fileToAudioDataUrl,
  isYouTubeUrl,
} from '@/lib/data/songs-service';
import InteractiveChordSheet from './InteractiveChordSheet';
import SongAudioPlayer from './SongAudioPlayer';
import {
  Music,
  ArrowLeft,
  Save,
  Check,
  Upload,
  FileAudio,
  Trash2,
  Sparkles,
  Edit3,
  Layers,
  Eye,
  Plus,
  HelpCircle,
  Sliders,
  Tag,
  Volume2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SongEditorPageProps {
  songId?: string;
  isNew?: boolean;
}

export default function SongEditorPage({ songId, isNew = false }: SongEditorPageProps) {
  const router = useRouter();

  // Initial song state loading
  const [loadingSong, setLoadingSong] = useState<boolean>(!isNew && Boolean(songId));
  const [initialSong, setInitialSong] = useState<WorshipSong | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('CFC Music Ministry');
  const [key, setKey] = useState('G');
  const [tempo, setTempo] = useState('Moderate (85 BPM)');
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [category, setCategory] = useState<WorshipSong['category']>('Praise');
  const [ministry, setMinistry] = useState<WorshipSong['ministry']>('CFC');
  const [lyricsAndChords, setLyricsAndChords] = useState(
    `[Intro]\n[G]  [C]  [D]  [G]\n\n[Verse 1]\n[G]Amazing grace how [C]sweet the [G]sound\nThat [Em]saved a wretch like [D]me\n\n[Chorus]\n[G]I once was lost, but [C]now am [G]found\nWas [Em]blind, but [D]now I [G]see.`
  );
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFileName, setAudioFileName] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [ccliNumber, setCcliNumber] = useState('');
  const [notes, setNotes] = useState('');

  // UI States
  const [editorMode, setEditorMode] = useState<'edit' | 'split' | 'preview'>('split');
  const [customChordInput, setCustomChordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [showAdvancedMetadata, setShowAdvancedMetadata] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch existing song if editing
  useEffect(() => {
    async function load() {
      if (!isNew && songId) {
        setLoadingSong(true);
        try {
          const fetched = await fetchWorshipSongById(songId);
          if (fetched) {
            setInitialSong(fetched);
            setTitle(fetched.title || '');
            setArtist(fetched.artist || 'CFC Music Ministry');
            setKey(fetched.key || 'G');
            setTempo(fetched.tempo || 'Moderate (85 BPM)');
            setTimeSignature(fetched.timeSignature || '4/4');
            setCategory(fetched.category || 'Praise');
            setMinistry(fetched.ministry || 'CFC');
            setLyricsAndChords(fetched.lyricsAndChords || '');
            setAudioUrl(fetched.audioUrl || '');
            setAudioFileName(fetched.audioFileName || '');
            setYoutubeUrl(fetched.youtubeUrl || '');
            setCcliNumber(fetched.ccliNumber || '');
            setNotes(fetched.notes || '');
          }
        } catch (err) {
          console.error('Failed to load song:', err);
        } finally {
          setLoadingSong(false);
        }
      }
    }
    load();
  }, [songId, isNew]);

  // Insert chord at current textarea cursor position
  const insertChordAtCursor = (chord: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setLyricsAndChords((prev) => prev + ` [${chord}]`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const chordToken = `[${chord}]`;

    const nextVal =
      lyricsAndChords.substring(0, start) +
      chordToken +
      lyricsAndChords.substring(end);

    setLyricsAndChords(nextVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + chordToken.length, start + chordToken.length);
    }, 50);
  };

  // Insert section tag like [Verse 1], [Chorus], etc.
  const insertSectionTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setLyricsAndChords((prev) => prev + `\n\n[${tag}]\n`);
      return;
    }

    const start = textarea.selectionStart;
    const sectionToken = `\n\n[${tag}]\n`;
    const nextVal =
      lyricsAndChords.substring(0, start) +
      sectionToken +
      lyricsAndChords.substring(start);

    setLyricsAndChords(nextVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + sectionToken.length, start + sectionToken.length);
    }, 50);
  };

  // Handle MP3 File upload
  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAudio(true);
      try {
        const { url, fileName } = await uploadSongAudio(file);
        setAudioUrl(url);
        setAudioFileName(fileName);
        setToastMsg('MP3 uploaded successfully to Supabase Storage!');
      } catch (storageErr: any) {
        console.warn('Supabase storage upload failed, attempting fallback data URI:', storageErr);
        const dataUri = await fileToAudioDataUrl(file);
        setAudioUrl(dataUri);
        setAudioFileName(file.name);
        alert(
          `Supabase Storage Notice:\n${storageErr.message || 'Audio upload to Supabase failed.'}\n\nFalling back to session audio URI.`
        );
      }
    } catch (err) {
      console.error('Failed to read MP3 file:', err);
      alert('Could not read audio file. Please upload a valid MP3.');
    } finally {
      setUploadingAudio(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a song title.');
      return;
    }

    try {
      setIsSubmitting(true);
      const saved = await saveWorshipSong({
        id: initialSong?.id || songId,
        title: title.trim(),
        artist: artist.trim(),
        key,
        tempo,
        timeSignature,
        category,
        ministry,
        lyricsAndChords,
        ccliNumber,
        audioUrl,
        audioFileName,
        youtubeUrl,
        notes,
      });

      // Redirect back to songs list page
      router.push('/admin/songs?saved=' + encodeURIComponent(saved.title));
    } catch (err) {
      console.error('Failed to save song:', err);
      alert('Failed to save worship song. Please try again.');
      setIsSubmitting(false);
    }
  };

  const quickChords = ['G', 'C', 'D', 'Em', 'Am', 'F', 'Bm', 'A', 'E', 'D/F#', 'Cadd9', 'Dsus4', 'B7', 'A7'];

  if (loadingSong) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500 font-bold p-6">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm">Loading worship song details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-5 max-w-[1600px] mx-auto pb-12">
      {/* Toast message if any */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 text-xs font-black flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOP HEADER NAVIGATION BAR                                             */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#243c81] text-white shadow-lg border-b-4 border-amber-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/songs"
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all shrink-0 active:scale-95"
            title="Back to Songs Repertoire"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded-full">
                {isNew ? 'New Sheet' : 'Edit Sheet'}
              </span>
              <span className="text-xs text-blue-200 font-medium">
                • Repertoire Editor
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              {isNew ? 'Add New Worship Song' : `Edit Song: ${title || initialSong?.title || 'Untitled'}`}
            </h1>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-3 flex-wrap self-start md:self-auto">
          {/* View Mode Switcher */}
          <div className="bg-black/30 p-1.5 rounded-2xl flex items-center text-xs font-bold border border-white/10">
            <button
              type="button"
              onClick={() => setEditorMode('edit')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                editorMode === 'edit' ? 'bg-white text-[#243c81] shadow-md font-black' : 'text-blue-100 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor Only</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('split')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                editorMode === 'split' ? 'bg-white text-[#243c81] shadow-md font-black' : 'text-blue-100 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('preview')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                editorMode === 'preview' ? 'bg-white text-[#243c81] shadow-md font-black' : 'text-blue-100 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>

          {/* Cancel */}
          <Link
            href="/admin/songs"
            className="px-4 py-2.5 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all"
          >
            Cancel
          </Link>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>{isSubmitting ? 'Saving...' : isNew ? 'Save Worship Song' : 'Update Worship Song'}</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SONG METADATA FORM PANEL                                              */}
      {/* ===================================================================== */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Music className="w-5 h-5 text-[#243c81]" />
              <span>Song Information &amp; Key Settings</span>
            </h2>

            <button
              type="button"
              onClick={() => setShowAdvancedMetadata((prev) => !prev)}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <span>{showAdvancedMetadata ? 'Hide Extra Fields' : 'More Options'}</span>
              {showAdvancedMetadata ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Primary Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Song Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Song Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Light of Christ"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Artist / Author */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Artist / Ministry
              </label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. CFC Music Ministry"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Musical Key */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Original Key
              </label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 font-black text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
              >
                {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map((k) => (
                  <option key={k} value={k}>
                    Key of {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Liturgical Category */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
              >
                <option value="Praise">Fast Praise</option>
                <option value="Worship">Slow Worship</option>
                <option value="Gathering">Gathering / Entrance</option>
                <option value="Offertory">Offertory / Preparation</option>
                <option value="Reflection">Reflection / Communion</option>
                <option value="Recessional">Recessional / Commissioning</option>
                <option value="Marian">Marian Hymn</option>
                <option value="Mass Ordinary">Mass Ordinary</option>
              </select>
            </div>

            {/* Tempo */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Tempo (BPM)
              </label>
              <input
                type="text"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                placeholder="e.g. Moderate (85 BPM)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 font-medium text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Time Signature */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Time Signature
              </label>
              <select
                value={timeSignature}
                onChange={(e) => setTimeSignature(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
              >
                <option value="4/4">4/4 Common Time</option>
                <option value="3/4">3/4 Waltz Time</option>
                <option value="6/8">6/8 Compound Time</option>
                <option value="2/4">2/4 March Time</option>
              </select>
            </div>

            {/* Target Ministry */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Ministry
              </label>
              <select
                value={ministry}
                onChange={(e) => setMinistry(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
              >
                <option value="CFC">Couples for Christ (CFC)</option>
                <option value="SFC">Singles for Christ (SFC)</option>
                <option value="YFC">Youth for Christ (YFC)</option>
                <option value="KFC">Kids for Christ (KFC)</option>
                <option value="HOLD">Handmaids of the Lord (HOLD)</option>
                <option value="SOLD">Servants of the Lord (SOLD)</option>
                <option value="ALL">All Ministries</option>
              </select>
            </div>
          </div>

          {/* Advanced Optional Metadata */}
          {showAdvancedMetadata && (
            <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  CCLI Song # / Copyright
                </label>
                <input
                  type="text"
                  value={ccliNumber}
                  onChange={(e) => setCcliNumber(e.target.value)}
                  placeholder="e.g. 7051511"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Performance Notes / Strumming Pattern
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Capo 2nd fret, Down-Down-Up-Up-Down-Up pattern"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 font-medium"
                />
              </div>
            </div>
          )}

          {/* YouTube Video / Audio Link & MP3 Upload */}
          <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-rose-50 border border-blue-200/90 space-y-4">
            {/* YouTube Link Input Field */}
            <div>
              <label className="block text-xs font-black uppercase text-[#243c81] mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>YouTube Link (Audio / Video backing track)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-900 focus:ring-2 focus:ring-red-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Paste a YouTube URL to let music ministry members listen or watch backing video performance directly alongside chord sheets.
              </p>
            </div>

            {/* MP3 Audio Track Upload */}
            <div className="pt-3 border-t border-blue-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-[#243c81] flex items-center gap-2">
                  <FileAudio className="w-4.5 h-4.5 text-blue-600" />
                  <span>MP3 Audio File</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Upload an MP3 track directly to Supabase Storage.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {audioUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 truncate max-w-[260px] border border-emerald-300">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="truncate">{audioFileName || 'MP3 Audio Attached'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAudioUrl('');
                        setAudioFileName('');
                      }}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-100/70 transition-colors"
                      title="Remove MP3 Track"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingAudio ? 'Uploading...' : 'Upload MP3 Recording'}</span>
                    <input
                      type="file"
                      accept="audio/mp3,audio/wav,audio/*"
                      onChange={handleAudioFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Audio URL Input fallback */}
            <div className="pt-3 border-t border-blue-200/60 flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold shrink-0">Direct Audio URL:</span>
              <input
                type="url"
                value={audioUrl.startsWith('data:') ? '' : audioUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setAudioUrl(val);
                  if (isYouTubeUrl(val)) {
                    setYoutubeUrl(val);
                  }
                }}
                placeholder="https://example.com/audio-track.mp3"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 font-mono"
              />
            </div>

            {/* Live Player Preview */}
            {(audioUrl || youtubeUrl) && (
              <div className="pt-3 border-t border-blue-200/60">
                <p className="text-xs font-bold text-slate-700 mb-2">Live Player Preview:</p>
                <SongAudioPlayer
                  audioUrl={audioUrl}
                  youtubeUrl={youtubeUrl}
                  songTitle={title || 'Song Recording'}
                  artist={artist || 'CFC Music Ministry'}
                />
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* MAXIMIZED WORKSPACE: CHORDPRO EDITOR & LIVE PREVIEW                 */}
        {/* ===================================================================== */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col gap-4">
          {/* Quick Insertion Toolbar */}
          <div className="p-3 bg-slate-900 rounded-2xl text-white flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Quick Chord Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase text-amber-400 mr-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tap to Insert Chord:</span>
              </span>

              {quickChords.map((chord) => (
                <button
                  key={chord}
                  type="button"
                  onClick={() => insertChordAtCursor(chord)}
                  className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-amber-400 hover:text-slate-950 font-mono font-black text-xs transition-all active:scale-90"
                  title={`Insert [${chord}] at cursor position`}
                >
                  [{chord}]
                </button>
              ))}
            </div>

            {/* Custom Chord + Section Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Custom Chord */}
              <div className="flex items-center bg-white/10 rounded-lg p-1 border border-white/15">
                <input
                  type="text"
                  value={customChordInput}
                  onChange={(e) => setCustomChordInput(e.target.value)}
                  placeholder="e.g. F#m"
                  className="w-16 px-2 py-0.5 bg-transparent text-white font-mono text-xs focus:outline-hidden placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customChordInput.trim()) {
                      insertChordAtCursor(customChordInput.trim());
                      setCustomChordInput('');
                    }
                  }}
                  className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 font-bold text-[10px] hover:bg-amber-300"
                >
                  + Add
                </button>
              </div>

              {/* Section Header Insert Tags */}
              <div className="hidden lg:flex items-center gap-1">
                {['Verse 1', 'Verse 2', 'Chorus', 'Bridge', 'Intro', 'Outro'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertSectionTag(tag)}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/30 hover:bg-blue-500 text-white font-bold text-[10px] border border-blue-400/30 transition-all"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Maximized Main Working Area (Edit vs Split vs Preview) */}
          <div
            className={`grid gap-5 ${
              editorMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {/* ChordPro Textarea Editor */}
            {(editorMode === 'edit' || editorMode === 'split') && (
              <div className="flex flex-col h-full min-h-[550px]">
                <div className="flex items-center justify-between mb-2 text-xs text-slate-600">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-amber-500" />
                    <span>ChordPro Lyrics &amp; Chords Editor</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Bracket format: [G]Amazing [C]grace
                  </span>
                </div>

                <textarea
                  ref={textareaRef}
                  value={lyricsAndChords}
                  onChange={(e) => setLyricsAndChords(e.target.value)}
                  placeholder="[Intro]&#10;[G]  [C]  [D]  [G]&#10;&#10;[Verse 1]&#10;[G]The light of Christ has [C]come into the [G]world&#10;..."
                  className="w-full p-5 rounded-2xl border-2 border-slate-300 bg-slate-950 text-amber-200 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y flex-1 shadow-inner min-h-[500px]"
                />
              </div>
            )}

            {/* Live Interactive Chord Sheet Preview */}
            {(editorMode === 'preview' || editorMode === 'split') && (
              <div className="flex flex-col h-full min-h-[550px]">
                <div className="flex items-center justify-between mb-2 text-xs text-slate-600">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Live Ultimate Guitar Interactive Chord Sheet</span>
                  </span>
                  <span className="text-[11px] text-blue-700 font-bold">
                    Transposing, diagrams &amp; scroll active
                  </span>
                </div>

                <div className="border-2 border-slate-200 rounded-2xl overflow-hidden flex-1 bg-slate-50 p-1 min-h-[500px] flex flex-col">
                  <InteractiveChordSheet
                    content={lyricsAndChords}
                    originalKey={key}
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
          <Link
            href="/admin/songs"
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
            <span>{isSubmitting ? 'Saving Song...' : isNew ? 'Save Worship Song' : 'Update Worship Song'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
