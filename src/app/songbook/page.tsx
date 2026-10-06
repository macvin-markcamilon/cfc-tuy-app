'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  WorshipSong,
  fetchWorshipSongs,
  isYouTubeUrl,
  extractYouTubeId,
} from '@/lib/data/songs-service';
import {
  getActivePlaylistIds,
  setActivePlaylistIds,
  getSavedPlaylists,
  savePlaylist,
  deletePlaylist,
  SavedPlaylist,
} from '@/lib/music/playlist-service';
import SongPresentationModal from '@/components/music/SongPresentationModal';
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
  Plus,
  Check,
  X,
  ListMusic,
  Tv,
  Save,
  Trash2,
  FolderHeart,
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

  // Playlist & Presentation state
  const [playlistIds, setPlaylistIds] = useState<string[]>([]);
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [isPresentingPlaylist, setIsPresentingPlaylist] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);

  // Audio preview state
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [activeYouTubeId, setActiveYouTubeId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load songs & playlists on mount
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchWorshipSongs();
        setSongs(data);
        setPlaylistIds(getActivePlaylistIds());
        setSavedPlaylists(getSavedPlaylists());
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

  // Derived active playlist songs list
  const playlistSongs = useMemo(() => {
    return playlistIds
      .map((id) => songs.find((s) => s.id === id))
      .filter((s): s is WorshipSong => Boolean(s));
  }, [playlistIds, songs]);

  // Playlist Management Handlers
  const togglePlaylistSong = (songId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (playlistIds.includes(songId)) {
      updated = playlistIds.filter((id) => id !== songId);
    } else {
      updated = [...playlistIds, songId];
    }
    setPlaylistIds(updated);
    setActivePlaylistIds(updated);
  };

  const removeFromPlaylist = (songId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = playlistIds.filter((id) => id !== songId);
    setPlaylistIds(updated);
    setActivePlaylistIds(updated);
  };

  const clearPlaylistQueue = () => {
    setPlaylistIds([]);
    setActivePlaylistIds([]);
  };

  const handleSavePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !playlistIds.length) return;
    const saved = savePlaylist(newPlaylistName, playlistIds);
    setSavedPlaylists(getSavedPlaylists());
    setNewPlaylistName('');
    setShowSaveModal(false);
  };

  const loadSavedPlaylistSet = (saved: SavedPlaylist) => {
    setPlaylistIds(saved.songIds);
    setActivePlaylistIds(saved.songIds);
    setShowSavedDrawer(false);
  };

  const handleDeleteSavedPlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePlaylist(id);
    setSavedPlaylists(getSavedPlaylists());
  };

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

  // Audio / YouTube preview toggle
  const toggleAudio = (song: WorshipSong, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!song.audioUrl && !song.youtubeUrl) return;

    if (playingSongId === song.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingSongId(null);
      setActiveYouTubeId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const ytId = extractYouTubeId(song.youtubeUrl) || (isYouTubeUrl(song.audioUrl) ? extractYouTubeId(song.audioUrl) : null);

      if (ytId) {
        setActiveYouTubeId(ytId);
        setPlayingSongId(song.id);
      } else if (song.audioUrl) {
        setActiveYouTubeId(null);
        const audio = new Audio(song.audioUrl);
        audioRef.current = audio;
        audio.play().catch(() => {});
        setPlayingSongId(song.id);
        audio.onended = () => {
          setPlayingSongId(null);
          setActiveYouTubeId(null);
        };
      }
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
              authentic chord sheets, transposing, guitar fingerings, audio recordings, and custom playlist creation for continuous lyrics presentation during CLP assemblies and household meetings.
            </p>

            {/* Quick Repertoire Stats & Saved Playlists Button */}
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
              
              {savedPlaylists.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSavedDrawer((prev) => !prev)}
                  className="px-4 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <FolderHeart className="w-4 h-4" />
                  <span>Saved Playlists ({savedPlaylists.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SAVED PLAYLISTS DRAWER / PANEL                                       */}
      {/* ===================================================================== */}
      {showSavedDrawer && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-amber-500/10 border-2 border-amber-400/40 rounded-3xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                <FolderHeart className="w-5 h-5 text-amber-600" />
                <span>Your Saved Worship Playlists</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSavedDrawer(false)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-200 text-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {savedPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => loadSavedPlaylistSet(pl)}
                  className="bg-white p-4 rounded-2xl border border-amber-300/60 hover:border-[#243c81] shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#243c81] transition-colors">
                      {pl.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {pl.songIds.length} Worship Songs
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSavedPlaylist(pl.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Delete Saved Playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ACTIVE PLAYLIST / QUEUE BANNER                                        */}
      {/* ===================================================================== */}
      {playlistSongs.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 animate-in fade-in duration-200">
          <div className="bg-[#243c81] text-white rounded-3xl p-4 sm:p-5 shadow-xl border-2 border-amber-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-md">
                <ListMusic className="w-6 h-6" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                    Playlist Queue
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {playlistSongs.length} Song{playlistSongs.length > 1 ? 's' : ''} Selected
                  </span>
                </div>
                {/* Song Pills List */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5 max-w-2xl">
                  {playlistSongs.map((s, idx) => (
                    <div
                      key={s.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 border border-white/20 text-xs font-bold whitespace-nowrap text-white"
                    >
                      <span className="text-amber-300 font-mono text-[11px]">{idx + 1}.</span>
                      <span>{s.title}</span>
                      <button
                        type="button"
                        onClick={(e) => removeFromPlaylist(s.id, e)}
                        className="p-0.5 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"
                        title="Remove from playlist"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Playlist Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
              {/* Present Playlist Button */}
              <button
                type="button"
                onClick={() => setIsPresentingPlaylist(true)}
                className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Tv className="w-4 h-4 text-slate-950" />
                <span>Present Playlist ({playlistSongs.length})</span>
              </button>

              {/* Save Playlist Button */}
              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition-all active:scale-95"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>Save Set</span>
              </button>

              {/* Clear Queue Button */}
              <button
                type="button"
                onClick={clearPlaylistQueue}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-white border border-white/15 transition-all"
                title="Clear Playlist Queue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FILTER & SEARCH TOOLBAR                                               */}
      {/* ===================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
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
              Click any song to view chords or add to custom presentation playlist
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
              const inPlaylist = playlistIds.includes(song.id);

              return (
                <div
                  key={song.id}
                  onClick={() => {
                    router.push(`/songbook/${song.id}`);
                  }}
                  className={`bg-white rounded-3xl border p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                    inPlaylist ? 'border-[#243c81] ring-2 ring-[#243c81]/20' : 'border-slate-200 hover:border-[#243c81]'
                  }`}
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
                    {/* Top Row: Category, Key, Playlist Toggle */}
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
                      </div>

                      {/* Add to Playlist Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => togglePlaylistSong(song.id, e)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 border ${
                          inPlaylist
                            ? 'bg-[#243c81] text-white border-[#243c81] shadow-xs'
                            : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#243c81] border-slate-200'
                        }`}
                        title={inPlaylist ? 'Remove from active playlist' : 'Add song to active presentation playlist'}
                      >
                        {inPlaylist ? (
                          <>
                            <Check className="w-3 h-3 text-amber-300" />
                            <span>In Playlist</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>+ Playlist</span>
                          </>
                        )}
                      </button>
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

                  {/* Bottom Row: Chords Badges + Audio / Open Action */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Audio / YouTube Preview Button */}
                    {(song.audioUrl || song.youtubeUrl) ? (
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
                            <Pause className="w-3.5 h-3.5 fill-current text-amber-400" />
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
                      <div className="flex items-center gap-1 flex-wrap">
                        {chords.slice(0, 3).map((ch) => (
                          <span
                            key={ch}
                            className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    )}

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
                    <th className="py-3.5 px-4 text-center">Playlist</th>
                    <th className="py-3.5 px-4 text-center">Audio</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSongs.map((song) => {
                    const isPlaying = playingSongId === song.id;
                    const inPlaylist = playlistIds.includes(song.id);

                    return (
                      <tr
                        key={song.id}
                        onClick={() => {
                          router.push(`/songbook/${song.id}`);
                        }}
                        className={`hover:bg-blue-50/60 cursor-pointer transition-colors group ${
                          inPlaylist ? 'bg-blue-50/40' : ''
                        }`}
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

                        {/* Playlist Toggle */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => togglePlaylistSong(song.id, e)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 border ${
                              inPlaylist
                                ? 'bg-[#243c81] text-white border-[#243c81]'
                                : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#243c81] border-slate-200'
                            }`}
                          >
                            {inPlaylist ? (
                              <>
                                <Check className="w-3 h-3 text-amber-300" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>+ Add</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {(song.audioUrl || song.youtubeUrl) ? (
                            <button
                              type="button"
                              onClick={(e) => toggleAudio(song, e)}
                              className={`p-2 rounded-full transition-all active:scale-90 ${
                                isPlaying
                                  ? 'bg-[#243c81] text-white shadow-md animate-pulse'
                                  : 'bg-blue-50 text-[#243c81] hover:bg-blue-100'
                              }`}
                              title={isPlaying ? 'Pause audio' : 'Play audio preview'}
                            >
                              {isPlaying ? (
                                <Pause className="w-3.5 h-3.5 fill-current text-amber-400" />
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

      {/* Save Playlist Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-w-md w-full animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 font-black text-slate-900 text-lg">
                <Save className="w-5 h-5 text-[#243c81]" />
                <span>Save Worship Playlist</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlaylistSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Playlist Title / Set Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sunday CLP Assembly, Household Gathering..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                  autoFocus
                  required
                />
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                Saves current queue of <strong>{playlistSongs.length} songs</strong> to your local repertoire list.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2d63] text-white text-xs font-black shadow-md transition-all active:scale-95"
                >
                  Save Setlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Continuous Playlist Presentation Modal */}
      <SongPresentationModal
        isOpen={isPresentingPlaylist}
        song={playlistSongs[0] || null}
        playlist={playlistSongs}
        onClose={() => setIsPresentingPlaylist(false)}
      />

      {/* Invisible YouTube Audio Player */}
      {activeYouTubeId && (
        <iframe
          key={activeYouTubeId}
          width="1"
          height="1"
          src={`https://www.youtube.com/embed/${activeYouTubeId}?autoplay=1&enablejsapi=1`}
          title="YouTube Audio Player"
          allow="autoplay; encrypted-media"
          className="fixed -top-[1000px] -left-[1000px] opacity-0 pointer-events-none"
        />
      )}

      {/* Floating Audio Player Control Toast */}
      {playingSongId && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#243c81] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 animate-pulse">
            <Music className="w-4 h-4" />
          </div>
          <div className="max-w-[200px] sm:max-w-[280px]">
            <p className="text-xs font-black truncate text-white">
              {songs.find((s) => s.id === playingSongId)?.title || 'Playing Audio'}
            </p>
            <p className="text-[10px] text-blue-200 font-medium truncate">
              {activeYouTubeId ? 'YouTube Audio Backing Track' : 'MP3 Audio Recording'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              setPlayingSongId(null);
              setActiveYouTubeId(null);
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90 ml-1"
            title="Stop Audio"
          >
            <Pause className="w-4 h-4 fill-current text-amber-300" />
          </button>
        </div>
      )}
    </div>
  );
}
