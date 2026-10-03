'use client';

import React, { useState, useRef } from 'react';
import { WorshipSong, uploadSongAudio, fileToAudioDataUrl } from '@/lib/data/songs-service';
import InteractiveChordSheet from './InteractiveChordSheet';
import {
  X,
  Music,
  Upload,
  Play,
  Pause,
  Trash2,
  FileAudio,
  Sparkles,
  Layers,
  Edit3,
  Eye,
  Check,
  Plus,
} from 'lucide-react';

interface SongEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (song: Partial<WorshipSong>) => Promise<void>;
  initialSong?: WorshipSong | null;
}

export default function SongEditorModal({
  isOpen,
  onClose,
  onSave,
  initialSong,
}: SongEditorModalProps) {
  const [title, setTitle] = useState(initialSong?.title || '');
  const [artist, setArtist] = useState(initialSong?.artist || 'CFC Music Ministry');
  const [key, setKey] = useState(initialSong?.key || 'G');
  const [tempo, setTempo] = useState(initialSong?.tempo || 'Moderate (85 BPM)');
  const [timeSignature, setTimeSignature] = useState(initialSong?.timeSignature || '4/4');
  const [category, setCategory] = useState<WorshipSong['category']>(initialSong?.category || 'Praise');
  const [ministry, setMinistry] = useState<WorshipSong['ministry']>(initialSong?.ministry || 'CFC');
  const [lyricsAndChords, setLyricsAndChords] = useState(
    initialSong?.lyricsAndChords ||
      `[Intro]\n[G]  [C]  [D]  [G]\n\n[Verse 1]\n[G]Amazing grace how [C]sweet the [G]sound\nThat [Em]saved a wretch like [D]me\n\n[Chorus]\n[G]I once was lost, but [C]now am [G]found\nWas [Em]blind, but [D]now I [G]see.`
  );
  const [audioUrl, setAudioUrl] = useState(initialSong?.audioUrl || '');
  const [audioFileName, setAudioFileName] = useState(initialSong?.audioFileName || '');
  const [ccliNumber, setCcliNumber] = useState(initialSong?.ccliNumber || '');

  // Editor View: 'edit' | 'split' | 'preview'
  const [editorMode, setEditorMode] = useState<'edit' | 'split' | 'preview'>('edit');
  const [customChordInput, setCustomChordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

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

  // Handle MP3 File upload directly to Supabase Storage
  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAudio(true);
      try {
        const { url, fileName } = await uploadSongAudio(file);
        setAudioUrl(url);
        setAudioFileName(fileName);
      } catch (storageErr: any) {
        console.warn('Supabase storage upload failed, attempting fallback data URI:', storageErr);
        // Fallback to data URI for temporary in-session preview
        const dataUri = await fileToAudioDataUrl(file);
        setAudioUrl(dataUri);
        setAudioFileName(file.name);
        alert(
          `Supabase Storage Notice:\n${storageErr.message || 'Audio upload to Supabase failed.'}\n\nPlease check your Supabase Storage setup so songs persist across devices and browsers.`
        );
      }
    } catch (err) {
      console.error('Failed to read MP3 file:', err);
      alert('Could not read the audio file. Please ensure it is an MP3 or audio format.');
    } finally {
      setUploadingAudio(false);
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a song title.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        id: initialSong?.id,
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
      });
      onClose();
    } catch (err) {
      console.error('Failed to save song:', err);
      alert('Failed to save worship song. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Common chords bar for Praise & Worship
  const quickChords = ['G', 'C', 'D', 'Em', 'Am', 'F', 'Bm', 'A', 'E', 'D/F#', 'Cadd9', 'Dsus4', 'B7', 'A7'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* =================================================================== */}
        {/* MODAL HEADER                                                        */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-5 bg-[#243c81] text-white flex items-center justify-between shrink-0 border-b border-[#1a2c60]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                {initialSong ? 'Edit Worship Song' : 'Add New Worship Song'}
              </h2>
              <p className="text-xs text-blue-200">
                Add lyrics, attach MP3 audio, and create interactive Ultimate Guitar chords.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-black/30 p-1 rounded-xl flex items-center text-xs font-bold border border-white/10 hidden sm:flex">
              <button
                type="button"
                onClick={() => setEditorMode('edit')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  editorMode === 'edit' ? 'bg-white text-[#243c81] shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('split')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  editorMode === 'split' ? 'bg-white text-[#243c81] shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('preview')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  editorMode === 'preview' ? 'bg-white text-[#243c81] shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* FORM BODY                                                           */}
        {/* =================================================================== */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col p-4 sm:p-6 gap-5">
          {/* Row 1: Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Title */}
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 font-black focus:ring-2 focus:ring-blue-500"
              >
                {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map((k) => (
                  <option key={k} value={k}>
                    Key of {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Liturgical Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
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
                Tempo (BPM / Feel)
              </label>
              <input
                type="text"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                placeholder="e.g. Upbeat (115 BPM)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
              >
                <option value="4/4">4/4 Common Time</option>
                <option value="3/4">3/4 Waltz Time</option>
                <option value="6/8">6/8 Compound Time</option>
                <option value="2/4">2/4 March Time</option>
              </select>
            </div>

            {/* Ministry Focus */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Ministry
              </label>
              <select
                value={ministry}
                onChange={(e) => setMinistry(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
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

          {/* Row 2: MP3 Audio Attachment */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-[#243c81] flex items-center gap-2">
                  <FileAudio className="w-4 h-4 text-blue-600" />
                  <span>MP3 Audio Track</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Attach an audio recording so musicians can listen and practice along with the chord sheet.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {audioUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl flex items-center gap-1.5 truncate max-w-[200px]">
                      <Check className="w-3.5 h-3.5" />
                      <span className="truncate">{audioFileName || 'MP3 Audio Attached'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAudioUrl('');
                        setAudioFileName('');
                      }}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                      title="Remove MP3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingAudio ? 'Uploading...' : 'Upload MP3 File'}</span>
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

            {/* Audio URL Manual Input */}
            <div className="mt-3 pt-3 border-t border-blue-200/60 flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium shrink-0">Or stream URL:</span>
              <input
                type="url"
                value={audioUrl.startsWith('data:') ? '' : audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="https://example.com/worship-song.mp3"
                className="flex-1 px-3 py-1 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Row 3: Ultimate Guitar Chords & Lyrics Editor */}
          <div className="flex-1 flex flex-col gap-3">
            {/* Quick Chord Insertion Bar */}
            <div className="p-3 bg-slate-900 rounded-2xl text-white flex flex-wrap items-center justify-between gap-2 text-xs">
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
                    className="px-2 py-0.8 rounded-lg bg-white/15 hover:bg-amber-400 hover:text-slate-950 font-mono font-black text-xs transition-all active:scale-90"
                    title={`Insert [${chord}] at cursor`}
                  >
                    [{chord}]
                  </button>
                ))}
              </div>

              {/* Custom Chord + Section Tags */}
              <div className="flex items-center gap-2">
                {/* Custom Chord input */}
                <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/15">
                  <input
                    type="text"
                    value={customChordInput}
                    onChange={(e) => setCustomChordInput(e.target.value)}
                    placeholder="e.g. F#m"
                    className="w-16 px-1.5 py-0.5 bg-transparent text-white font-mono text-xs focus:outline-hidden placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customChordInput.trim()) {
                        insertChordAtCursor(customChordInput.trim());
                        setCustomChordInput('');
                      }
                    }}
                    className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-bold text-[10px] hover:bg-amber-300"
                  >
                    + Add
                  </button>
                </div>

                {/* Section tags */}
                <div className="hidden md:flex items-center gap-1">
                  {['Verse 1', 'Chorus', 'Bridge', 'Intro'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertSectionTag(tag)}
                      className="px-2 py-0.8 rounded-lg bg-blue-500/30 hover:bg-blue-500 text-white font-bold text-[10px] border border-blue-400/30 transition-all"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Editor & Preview Area */}
            <div className={`grid gap-4 flex-1 ${editorMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Textarea (Edit) */}
              {(editorMode === 'edit' || editorMode === 'split') && (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500">
                    <span className="font-bold text-slate-700">Lyrics &amp; Chords (ChordPro Format)</span>
                    <span className="text-[11px]">Wrap chords in brackets: [G]Amazing [C]grace</span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    rows={16}
                    value={lyricsAndChords}
                    onChange={(e) => setLyricsAndChords(e.target.value)}
                    placeholder="[Intro]&#10;[G]  [C]  [D]  [G]&#10;&#10;[Verse 1]&#10;[G]The light of Christ has [C]come into the [G]world&#10;..."
                    className="w-full p-4 rounded-2xl border border-slate-300 bg-slate-900 text-amber-200 font-mono text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y flex-1"
                  />
                </div>
              )}

              {/* Live Preview (Sheet) */}
              {(editorMode === 'preview' || editorMode === 'split') && (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500">
                    <span className="font-bold text-slate-700">Live Ultimate Guitar Interactive Preview</span>
                    <span className="text-[11px] text-blue-600 font-bold">Click any chord to preview diagram</span>
                  </div>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden flex-1 max-h-[500px] overflow-y-auto">
                    <InteractiveChordSheet
                      content={lyricsAndChords}
                      originalKey={key}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================================================================= */}
          {/* MODAL FOOTER BUTTONS                                              */}
          {/* ================================================================= */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all shadow-2xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'Saving Song...' : initialSong ? 'Update Song' : 'Save Worship Song'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
