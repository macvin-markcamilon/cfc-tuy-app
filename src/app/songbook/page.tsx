'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  WorshipSong,
  fetchWorshipSongs,
} from '@/lib/data/songs-service';
import {
  Music,
  Search,
  Play,
  Pause,
  Filter,
  Sparkles,
  Guitar,
  BookOpen,
  Volume2,
  ArrowRight,
  List,
  LayoutGrid,
  Headphones,
  RotateCcw,
  Disc3,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

export default function SongbookPage() {
  const router = useRouter();
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedKey, setSelectedKey] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'title-asc' | 'title-desc' | 'key-asc' | 'category-asc'>('title-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Audio preview state
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load songs on mount
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchWorshipSongs();
        setSongs(data);
      } catch (err) {
        console.error('Failed to load songs repertoire:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Categories list with counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: songs.length };
    songs.forEach((s) => {
      const cat = s.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [songs]);

  // Unique keys available in the database
  const availableKeys = useMemo(() => {
    const keys = new Set<string>();
    songs.forEach((s) => {
      if (s.key) keys.add(s.key.toUpperCase());
    });
    return Array.from(keys).sort();
  }, [songs]);

  // Filtered & Sorted Songs
  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = songs.filter((s) => {
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.lyricsAndChords.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q) ||
        (s.tags && s.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesCat =
        selectedCategory === 'ALL' ||
        s.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesKey =
        selectedKey === 'ALL' ||
        s.key?.toUpperCase() === selectedKey.toUpperCase();

      return matchesSearch && matchesCat && matchesKey;
    });

    return list.sort((a, b) => {
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
      if (sortBy === 'key-asc') return a.key.localeCompare(b.key);
      if (sortBy === 'category-asc') return (a.category || '').localeCompare(b.category || '');
      return 0;
    });
  }, [songs, searchQuery, selectedCategory, selectedKey, sortBy]);

  // Audio preview toggle
  const toggleAudio = (song: WorshipSong, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!song.audioUrl) return;

    if (playingSongId === song.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingSongId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(song.audioUrl);
      audioRef.current = audio;
      audio.play().catch(() => {});
      setPlayingSongId(song.id);
      audio.onended = () => setPlayingSongId(null);
    }
  };

  // Helper to extract chord names
  const extractChords = (content: string): string[] => {
    const matches = content.match(/\[([A-G][b#]?[^\]]*)\]/g);
    if (!matches) return [];
    const nonChords = new Set(['verse', 'chorus', 'bridge', 'intro', 'outro', 'ending', 'instrumental', 'refrain']);
    const unique = Array.from(new Set(matches.map((c) => c.slice(1, -1))))
      .filter((c) => !nonChords.has(c.toLowerCase()) && !c.toLowerCase().startsWith('verse') && !c.toLowerCase().startsWith('chorus'));
    return unique.slice(0, 5);
  };

  // Helper to format clean preview lyrics
  const cleanLyricsPreview = (content: string): string => {
    const lines = content.split('\n');
    const lyricLines = lines
      .filter((l) => !l.startsWith('#') && !l.startsWith('{') && !l.match(/^\[(Verse|Chorus|Bridge|Ending|Intro|Outro)/i))
      .map((l) => l.replace(/\[[^\]]+\]/g, '').trim())
      .filter((l) => l.length > 0);
    return lyricLines.slice(0, 2).join(' / ') || 'Tap to view chords, lyrics & chord chart.';
  };

  const praiseCount = songs.filter((s) => s.category?.toLowerCase() === 'praise').length;
  const worshipCount = songs.filter((s) => s.category?.toLowerCase() === 'worship').length;
  const audioCount = songs.filter((s) => Boolean(s.audioUrl)).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ===================================================================== */}
      {/* HERO BANNER SECTION                                                   */}
      {/* ===================================================================== */}
      <section className="bg-gradient-to-br from-[#12224d] via-[#243c81] to-[#1a2d63] text-white pt-10 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b-4 border-amber-500 shadow-md relative overflow-hidden">
        {/* Ambient background glow & watermark */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none pr-8 hidden md:block">
          <Music className="w-80 h-80 text-white" />
        </div>
        <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-inner">
              <Guitar className="w-4 h-4 text-amber-400" />
              <span>Music &amp; Praise Ministry • Tuy Chapter</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Worship &amp; Praise Songbook
            </h1>

            <p className="mt-3 text-sm sm:text-base text-blue-100/90 leading-relaxed font-normal max-w-3xl">
              Lift your heart in praise and adoration. Browse our official songbook complete with
              authentic chord sheets, transposing, guitar fingerings, and audio recordings for
              CLP assemblies, household meetings, and community prayer gatherings.
            </p>

            {/* Quick Repertoire Stats */}
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold">
              <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span><strong>{songs.length}</strong> Total Songs</span>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span><strong>{praiseCount}</strong> Praise</span>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-center gap-2">
                <Music className="w-4 h-4 text-blue-300" />
                <span><strong>{worshipCount}</strong> Worship</span>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-300" />
                <span><strong>{audioCount}</strong> With Audio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* FILTER & SEARCH TOOLBAR                                               */}
      {/* ===================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-200 space-y-4">
          
          {/* Top Row: Search Input + View Mode + Key Filter + Sort */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by song title, artist, key (e.g. G, D), or lyrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#243c81] text-slate-800 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-slate-200 hover:bg-slate-300 w-5 h-5 rounded-full flex items-center justify-center font-bold"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Key Filter Dropdown */}
            <div className="md:col-span-2 relative">
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] appearance-none cursor-pointer"
              >
                <option value="ALL">All Keys</option>
                {availableKeys.map((k) => (
                  <option key={k} value={k}>
                    Key of {k}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-2 relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] appearance-none cursor-pointer"
              >
                <option value="title-asc">Title (A to Z)</option>
                <option value="title-desc">Title (Z to A)</option>
                <option value="key-asc">Key (A to Z)</option>
                <option value="category-asc">Category</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="md:col-span-2 flex items-center justify-end gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#243c81] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-[#243c81] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>

          </div>

          {/* Category Filter Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-slate-100">
            {['ALL', 'Praise', 'Worship', 'Reflection', 'Gathering', 'Offertory', 'Recessional', 'Marian'].map((cat) => {
              const count = categoriesWithCounts[cat] || 0;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-[#243c81] text-white shadow-md shadow-blue-900/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#243c81] border border-slate-200'
                  }`}
                >
                  <span>{cat === 'ALL' ? 'All Songs' : cat}</span>
                  {count > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {(searchQuery || selectedCategory !== 'ALL' || selectedKey !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedKey('ALL');
                }}
                className="px-3.5 py-2 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-all flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* SONGS REPERTOIRE LIST / GRID                                          */}
      {/* ===================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Results summary header */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 font-medium mb-4 px-1">
          <div>
            Showing <strong className="text-slate-800">{filteredSongs.length}</strong> of{' '}
            <strong className="text-slate-800">{songs.length}</strong> worship songs
            {selectedCategory !== 'ALL' && <span> in <strong>{selectedCategory}</strong></span>}
            {selectedKey !== 'ALL' && <span> in <strong>Key of {selectedKey}</strong></span>}
            {searchQuery && <span> matching &quot;{searchQuery}&quot;</span>}
          </div>
          {filteredSongs.length > 0 && (
            <div className="hidden sm:block text-slate-400 text-xs">
              Click any song to open interactive chord sheet &amp; audio player
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-[#243c81] border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-bold text-base">Loading CFC Songbook...</p>
            <p className="text-slate-400 text-xs mt-1">Retrieving lyrics, chords, and recordings</p>
          </div>
        ) : filteredSongs.length === 0 ? (
          /* Empty Search State */
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs max-w-xl mx-auto my-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#243c81] flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Music className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">No Worship Songs Found</h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              We couldn&apos;t find any songs matching your current filter criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedKey('ALL');
              }}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#243c81] hover:bg-[#1a2d63] text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Search &amp; Filters</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ================================================================= */
          /* GRID VIEW                                                         */
          /* ================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredSongs.map((song) => {
              const chords = extractChords(song.lyricsAndChords);
              const preview = cleanLyricsPreview(song.lyricsAndChords);
              const isPlaying = playingSongId === song.id;

              return (
                <div
                  key={song.id}
                  onClick={() => {
                    router.push(`/songbook/${song.id}`);
                  }}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-[#243c81] p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                >
                  {/* Category Accent top border */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${
                      song.category?.toLowerCase() === 'praise'
                        ? 'bg-amber-400'
                        : song.category?.toLowerCase() === 'worship'
                        ? 'bg-[#243c81]'
                        : 'bg-purple-500'
                    }`}
                  />

                  <div>
                    {/* Top Row: Category, Key, Audio Button */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            song.category?.toLowerCase() === 'praise'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : song.category?.toLowerCase() === 'worship'
                              ? 'bg-blue-100 text-[#243c81] border border-blue-200'
                              : 'bg-purple-100 text-purple-900 border border-purple-200'
                          }`}
                        >
                          {song.category || 'Worship'}
                        </span>

                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          Key: {song.key}
                        </span>

                        {song.timeSignature && (
                          <span className="text-[10px] font-semibold text-slate-500">
                            {song.timeSignature}
                          </span>
                        )}
                      </div>

                      {/* Audio Button Preview */}
                      {song.audioUrl ? (
                        <button
                          type="button"
                          onClick={(e) => toggleAudio(song, e)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                            isPlaying
                              ? 'bg-[#243c81] text-white shadow-md animate-pulse'
                              : 'bg-blue-50 text-[#243c81] hover:bg-blue-100 border border-blue-200'
                          }`}
                          title={isPlaying ? 'Pause preview' : 'Play audio preview'}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>Playing</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Audio</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Chord Sheet</span>
                      )}
                    </div>

                    {/* Title & Artist */}
                    <h2 className="text-xl font-black text-slate-900 group-hover:text-[#243c81] transition-colors line-clamp-1">
                      {song.title}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {song.artist || 'Couples for Christ Music Ministry'}
                    </p>

                    {/* Lyric Preview Snippet */}
                    <p className="mt-3.5 text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed font-sans">
                      &quot;{preview}&quot;
                    </p>
                  </div>

                  {/* Bottom Row: Chords Badges + Open Action */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Chords Used */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {chords.length > 0 ? (
                        chords.map((ch) => (
                          <span
                            key={ch}
                            className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200"
                          >
                            {ch}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400">Chords included</span>
                      )}
                    </div>

                    {/* Action link */}
                    <span className="text-xs font-bold text-[#243c81] group-hover:underline flex items-center gap-1 shrink-0">
                      <span>View Chords</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================================================================= */
          /* COMPACT LIST VIEW                                                 */
          /* ================================================================= */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 px-4 sm:px-6">Title &amp; Artist</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Key</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Time</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">Chords Sample</th>
                    <th className="py-3.5 px-4 text-center">Audio</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSongs.map((song) => {
                    const chords = extractChords(song.lyricsAndChords);
                    const isPlaying = playingSongId === song.id;

                    return (
                      <tr
                        key={song.id}
                        onClick={() => {
                          router.push(`/songbook/${song.id}`);
                        }}
                        className="hover:bg-blue-50/60 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-bold text-slate-900 group-hover:text-[#243c81] transition-colors">
                            {song.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {song.artist || 'Couples for Christ'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              song.category?.toLowerCase() === 'praise'
                                ? 'bg-amber-100 text-amber-900'
                                : song.category?.toLowerCase() === 'worship'
                                ? 'bg-blue-100 text-[#243c81]'
                                : 'bg-purple-100 text-purple-900'
                            }`}
                          >
                            {song.category || 'Worship'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {song.key}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-500 hidden md:table-cell">
                          {song.timeSignature || '4/4'}
                        </td>

                        <td className="py-3.5 px-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1 flex-wrap">
                            {chords.slice(0, 4).map((ch) => (
                              <span
                                key={ch}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono"
                              >
                                {ch}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {song.audioUrl ? (
                            <button
                              type="button"
                              onClick={(e) => toggleAudio(song, e)}
                              className={`p-2 rounded-full transition-all active:scale-90 ${
                                isPlaying
                                  ? 'bg-[#243c81] text-white shadow-md'
                                  : 'bg-blue-50 text-[#243c81] hover:bg-blue-100'
                              }`}
                              title={isPlaying ? 'Pause preview' : 'Play audio preview'}
                            >
                              {isPlaying ? (
                                <Pause className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/songbook/${song.id}`);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-[#243c81] hover:bg-[#243c81] hover:text-white font-bold text-xs transition-all"
                          >
                            <span>Open Chords</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
