'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  WorshipSong,
  fetchWorshipSongs,
  deleteWorshipSong,
} from '@/lib/data/songs-service';
import SongDetailModal from '@/components/music/SongDetailModal';
import {
  Music,
  Plus,
  Search,
  BookOpen,
  Trash2,
  Edit3,
  FileAudio,
  Sparkles,
  Mic2,
} from 'lucide-react';

function SongsAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedKey, setSelectedKey] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'title-asc' | 'title-desc' | 'key-asc' | 'category-asc'>('title-asc');

  // Modals & Detail View
  const [viewingSong, setViewingSong] = useState<WorshipSong | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check for saved searchParam from redirect
  useEffect(() => {
    const savedTitle = searchParams.get('saved');
    if (savedTitle) {
      triggerToast(`"${savedTitle}" saved successfully!`);
      // Clean up search param URL without refreshing
      window.history.replaceState({}, '', '/admin/songs');
    }
  }, [searchParams]);

  // Load songs
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchWorshipSongs();
        setSongs(data);
      } catch (err) {
        console.error('Failed to load songs:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filtered & Sorted Songs
  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = songs.filter((s) => {
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.lyricsAndChords.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
      const matchesKey = selectedKey === 'ALL' || s.key === selectedKey;

      return matchesSearch && matchesCat && matchesKey;
    });

    return list.sort((a, b) => {
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
      if (sortBy === 'key-asc') return a.key.localeCompare(b.key);
      if (sortBy === 'category-asc') return a.category.localeCompare(b.category);
      return 0;
    });
  }, [songs, searchQuery, selectedCategory, selectedKey, sortBy]);

  // Delete handler
  const handleDeleteSong = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    await deleteWorshipSong(id);
    setSongs((prev) => prev.filter((s) => s.id !== id));
    if (viewingSong?.id === id) setViewingSong(null);
    triggerToast(`"${title}" deleted.`);
  };

  // Extract unique chords from a song's lyricsAndChords string
  const getSongChordsList = (content: string): string[] => {
    const chords = new Set<string>();
    const matches = content.matchAll(/\[([A-G][#b]?[^\]]*)\]/g);
    for (const m of matches) {
      const c = m[1].trim();
      if (
        c &&
        !['verse', 'chorus', 'bridge', 'intro', 'outro', 'refrain'].some((tag) =>
          c.toLowerCase().includes(tag)
        )
      ) {
        chords.add(c);
      }
    }
    return Array.from(chords).slice(0, 6);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/20 text-xs font-black flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOP HEADER HERO CARD                                                  */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-[#243c81] text-white shadow-md border-b-4 border-amber-500 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Music className="w-56 h-56 text-white" />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded-full">
              Music &amp; Praise Ministry
            </span>
            <span className="text-xs text-blue-200 font-bold">
              • Couples For Christ Tuy Chapter
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Worship Songs Repertoire &amp; Chords
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 font-medium leading-relaxed">
            Manage praise and worship songs, attach MP3 recordings, and access interactive
            Ultimate Guitar style chord sheets with transposing, guitar diagrams, and auto-scroll.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 self-start md:self-center shrink-0">
          <Link
            href="/admin/songs/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Worship Song</span>
          </Link>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* KPI STATS ROW                                                         */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#243c81] flex items-center justify-center font-black shrink-0">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Songs
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {songs.length}
            </span>
            <span className="text-[10px] text-blue-700 font-semibold">In active repertoire</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black shrink-0">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Praise Songs
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {songs.filter((s) => s.category === 'Praise').length}
            </span>
            <span className="text-[10px] text-purple-700 font-semibold">Fast praise songs</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Worship Songs
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {songs.filter((s) => s.category === 'Worship' || s.category === 'Reflection').length}
            </span>
            <span className="text-[10px] text-amber-800 font-semibold">Slow worship &amp; reflection</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shrink-0">
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              MP3 Audio
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {songs.filter((s) => Boolean(s.audioUrl)).length}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">Tracks attached</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SEARCH & FILTERS TOOLBAR                                              */}
      {/* ===================================================================== */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search song title, artist, chords, lyrics..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Praise">Fast Praise</option>
            <option value="Worship">Slow Worship</option>
            <option value="Gathering">Gathering / Entrance</option>
            <option value="Offertory">Offertory</option>
            <option value="Reflection">Reflection</option>
            <option value="Recessional">Recessional</option>
            <option value="Marian">Marian</option>
            <option value="Mass Ordinary">Mass Ordinary</option>
          </select>

          {/* Key Filter */}
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Keys</option>
            {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((k) => (
              <option key={k} value={k}>
                Key of {k}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="title-asc">Sort: Title (A–Z)</option>
            <option value="title-desc">Sort: Title (Z–A)</option>
            <option value="key-asc">Sort: Musical Key</option>
            <option value="category-asc">Sort: Category</option>
          </select>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SONGS GRID CARDS                                                      */}
      {/* ===================================================================== */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-bold">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading worship songs repertoire...</p>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
          <Music className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-extrabold text-base text-slate-800">No worship songs found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'ALL' || selectedKey !== 'ALL'
              ? 'Try changing your search terms or filters.'
              : 'Start by clicking "Add Worship Song" above to create your first song sheet with chords and MP3.'}
          </p>
          <Link
            href="/admin/songs/new"
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Worship Song</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSongs.map((song) => {
            const chordsList = getSongChordsList(song.lyricsAndChords);

            return (
              <div
                key={song.id}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-black px-2.5 py-0.8 rounded-full bg-blue-50 text-[#243c81] border border-blue-200">
                      {song.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {song.audioUrl && (
                        <span
                          className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1"
                          title="MP3 Audio Attached"
                        >
                          <FileAudio className="w-3 h-3 text-emerald-600" />
                          <span>MP3</span>
                        </span>
                      )}

                      <span className="text-xs font-mono font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                        Key of {song.key}
                      </span>
                    </div>
                  </div>

                  {/* Title & Artist */}
                  <h3
                    onClick={() => setViewingSong(song)}
                    className="font-black text-lg text-slate-900 group-hover:text-blue-700 cursor-pointer transition-colors leading-snug"
                  >
                    {song.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {song.artist} {song.tempo ? `• ${song.tempo}` : ''}
                  </p>

                  {/* Chords Chips Preview */}
                  {chordsList.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                        Chords:
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {chordsList.map((c) => (
                          <span
                            key={c}
                            className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  {/* View Sheet Button */}
                  <button
                    type="button"
                    onClick={() => setViewingSong(song)}
                    className="inline-flex items-center gap-1.5 font-extrabold text-[#243c81] hover:text-blue-800 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <span>View Chord Sheet</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Edit Button -> Navigates to full page editor */}
                    <Link
                      href={`/admin/songs/${song.id}/edit`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                      title="Edit Song in Full Page Editor"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSong(song.id, song.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Song"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SONG DETAIL MODAL (Full Interactive Sheet with Diagrams & MP3)        */}
      {/* ===================================================================== */}
      <SongDetailModal
        isOpen={Boolean(viewingSong)}
        song={viewingSong}
        onClose={() => setViewingSong(null)}
        onEdit={(song) => {
          setViewingSong(null);
          router.push(`/admin/songs/${song.id}/edit`);
        }}
      />
    </div>
  );
}

export default function SongsAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500 font-bold">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading songs repertoire...</p>
        </div>
      }
    >
      <SongsAdminContent />
    </Suspense>
  );
}
