'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  WorshipSong,
  fetchWorshipSongs,
  deleteWorshipSong,
  isYouTubeUrl,
  extractYouTubeId,
  subscribeToSongsChanges,
  getDefaultVisualizerVideo,
  setDefaultVisualizerVideo,
  resolveVisualizerVideoUrl,
  resolvePlayableVideoUrl,
  toProxyVideoUrl,
  uploadSongVideo,
  fetchChapterVisualizerSettingsFromDB,
  saveChapterVisualizerSettingsToDB,
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
  Video,
  Check,
  Upload,
  X,
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

  // Visualizer Video Background Modal
  const [showVisualizerModal, setShowVisualizerModal] = useState<boolean>(false);
  const [defaultVideo, setDefaultVideo] = useState<string>('');
  const [playableDefaultVideo, setPlayableDefaultVideo] = useState<string>('');
  const [uploadingDefaultVideo, setUploadingDefaultVideo] = useState<boolean>(false);
  const [customVideoUrlInput, setCustomVideoUrlInput] = useState<string>('');
  const [isBlurred, setIsBlurred] = useState<boolean>(false);
  const [blurAmount, setBlurAmount] = useState<number>(8); // px

  // Resolve playable preview URL for defaultVideo
  useEffect(() => {
    let active = true;
    if (!defaultVideo) {
      setPlayableDefaultVideo('');
      return;
    }
    setPlayableDefaultVideo(toProxyVideoUrl(defaultVideo));
    resolvePlayableVideoUrl(defaultVideo)
      .then((resolved) => {
        if (active && resolved) setPlayableDefaultVideo(resolved);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [defaultVideo]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load default visualizer video and blur setting from Supabase DB
  useEffect(() => {
    async function loadVid() {
      if (typeof window !== 'undefined') {
        try {
          const resolved = await resolveVisualizerVideoUrl();
          if (resolved) setDefaultVideo(resolved);
          const rawToken = getDefaultVisualizerVideo() || '';
          if (rawToken.startsWith('idb:')) {
            setCustomVideoUrlInput('Uploaded Video File (Stored locally in Browser)');
          } else if (rawToken.startsWith('data:video/')) {
            setCustomVideoUrlInput('Custom Video Data Loop');
          } else {
            setCustomVideoUrlInput(rawToken);
          }

          const dbConfig = await fetchChapterVisualizerSettingsFromDB();
          if (dbConfig) {
            if (dbConfig.defaultVideoUrl) {
              setDefaultVideo(dbConfig.defaultVideoUrl);
              setCustomVideoUrlInput(dbConfig.defaultVideoUrl);
            }
            if (typeof dbConfig.isBlurred === 'boolean') {
              setIsBlurred(dbConfig.isBlurred);
            }
            if (dbConfig.blurAmount) {
              setBlurAmount(dbConfig.blurAmount);
            }
          }
        } catch (err) {
          console.warn('Failed to load default visualizer video:', err);
        }
      }
    }
    loadVid();
  }, []);

  const handleDefaultVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingDefaultVideo(true);
      const { url } = await uploadSongVideo(file, 'default_visualizer');
      setDefaultVideo(url);
      setCustomVideoUrlInput(url);
      await saveChapterVisualizerSettingsToDB({
        defaultVideoUrl: url,
        isBlurred,
        blurAmount,
      });
      triggerToast(`Motion video "${file.name}" uploaded and saved to database!`);
    } catch (err: any) {
      console.error('Failed to attach video:', err);
      alert(err.message || 'Could not attach video file.');
    } finally {
      setUploadingDefaultVideo(false);
    }
  };

  const handleSaveDefaultVisualizer = async () => {
    try {
      let videoToSave = customVideoUrlInput.trim() || defaultVideo;

      if (videoToSave) {
        if (videoToSave.startsWith('blob:') || videoToSave.startsWith('Uploaded:')) {
          alert('Please click "Upload Video File" to upload your video file directly to the database.');
          return;
        }
        if (
          !isYouTubeUrl(videoToSave) &&
          !videoToSave.startsWith('http://') &&
          !videoToSave.startsWith('https://') &&
          !videoToSave.startsWith('/api/video')
        ) {
          alert('Please enter a valid video link (YouTube URL or direct .mp4 link), or click "Upload Video File".');
          return;
        }
      }

      await saveChapterVisualizerSettingsToDB({
        defaultVideoUrl: videoToSave,
        isBlurred,
        blurAmount,
      });
      const resolved = await resolveVisualizerVideoUrl();
      setDefaultVideo(resolved);
      triggerToast('Chapter visualizer background video saved to database!');
      setShowVisualizerModal(false);
    } catch (err: any) {
      console.error('Error saving visualizer video:', err);
      alert('Could not save visualizer video: ' + (err.message || 'Unknown error'));
    }
  };

  const handleClearDefaultVideo = async () => {
    try {
      setDefaultVideo('');
      setCustomVideoUrlInput('');
      setIsBlurred(false);
      await saveChapterVisualizerSettingsToDB({ defaultVideoUrl: '', isBlurred: false });
      triggerToast('Visualizer video removed from database.');
      setShowVisualizerModal(false);
    } catch (err: any) {
      console.error('Error clearing visualizer video:', err);
    }
  };

  // Check for saved searchParam from redirect
  const hasHandledSavedParam = useRef(false);
  useEffect(() => {
    if (hasHandledSavedParam.current) return;
    const savedTitle = searchParams ? searchParams.get('saved') : null;
    if (savedTitle) {
      hasHandledSavedParam.current = true;
      triggerToast(`"${savedTitle}" saved successfully!`);
    }
  }, [searchParams]);

  // Load songs + Real-time Sync
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        const data = await fetchWorshipSongs();
        if (isMounted) {
          setSongs(data);
        }
      } catch (err) {
        console.error('Failed to load songs:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();

    // Subscribe to cross-device and cross-tab real-time songs changes
    const unsubscribe = subscribeToSongsChanges(async () => {
      try {
        const fresh = await fetchWorshipSongs();
        if (isMounted) {
          setSongs(fresh);
        }
      } catch (err) {
        console.error('Songs admin realtime sync refresh error:', err);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Filtered & Sorted Songs
  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = songs.filter((s) => {
      if (!s) return false;
      const titleStr = (s.title || '').toLowerCase();
      const artistStr = (s.artist || '').toLowerCase();
      const lyricsStr = (s.lyricsAndChords || '').toLowerCase();
      const keyStr = (s.key || '').toLowerCase();

      const matchesSearch =
        !q ||
        titleStr.includes(q) ||
        artistStr.includes(q) ||
        lyricsStr.includes(q) ||
        keyStr.includes(q);

      const matchesCat = selectedCategory === 'ALL' || (s.category || '').toLowerCase() === selectedCategory.toLowerCase();
      const matchesKey = selectedKey === 'ALL' || (s.key || '').toUpperCase() === selectedKey.toUpperCase();

      return matchesSearch && matchesCat && matchesKey;
    });

    return list.sort((a, b) => {
      if (sortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'title-desc') return (b.title || '').localeCompare(a.title || '');
      if (sortBy === 'key-asc') return (a.key || '').localeCompare(b.key || '');
      if (sortBy === 'category-asc') return (a.category || '').localeCompare(b.category || '');
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

  // Extract unique chords from a song's lyricsAndChords string safely
  const getSongChordsList = (content?: string): string[] => {
    if (!content) return [];
    try {
      const chords = new Set<string>();
      const matches = content.matchAll(/\[([A-G][#b]?[^\]]*)\]/g);
      for (const m of matches) {
        const c = m[1]?.trim();
        if (
          c &&
          !['verse', 'chorus', 'bridge', 'intro', 'outro', 'refrain', 'c:', 'comment:'].some((tag) =>
            c.toLowerCase().includes(tag)
          )
        ) {
          chords.add(c);
        }
      }
      return Array.from(chords).slice(0, 6);
    } catch {
      return [];
    }
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

        <div className="relative z-10 flex items-center gap-2.5 self-start md:self-center shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowVisualizerModal(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 shadow-md transition-all active:scale-95"
            title="Set chapter-wide default visualizer background video for presentations"
          >
            <Video className="w-4 h-4 text-amber-400" />
            <span>Visualizer Video</span>
          </button>

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
                      {(song.youtubeUrl || (song.audioUrl && isYouTubeUrl(song.audioUrl))) && (
                        <span
                          className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold border border-red-200 flex items-center gap-1"
                          title="YouTube Track Attached"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          <span>YouTube</span>
                        </span>
                      )}

                      {song.audioUrl && !isYouTubeUrl(song.audioUrl) && (
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
      {/* VISUALIZER BACKGROUND VIDEO MODAL                                    */}
      {/* ===================================================================== */}
      {showVisualizerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-[#243c81] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Presentation Visualizer Video</h2>
                  <p className="text-xs text-blue-200">Default motion background loop synced across all devices and web users</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVisualizerModal(false)}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Live Preview Screen */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Live Loop Preview
                </label>
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
                  {defaultVideo ? (
                    <>
                      {isYouTubeUrl(defaultVideo) ? (
                        <iframe
                          key={defaultVideo}
                          src={`https://www.youtube.com/embed/${extractYouTubeId(defaultVideo)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${extractYouTubeId(defaultVideo)}&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1`}
                          className={`w-full h-full pointer-events-none transition-all duration-300 scale-125 ${
                            isBlurred ? 'scale-135' : ''
                          }`}
                          style={{
                            filter: isBlurred ? `blur(${blurAmount}px)` : 'none',
                            border: 'none',
                          }}
                          allow="autoplay; encrypted-media"
                          title="YouTube Visualizer Preview"
                        />
                      ) : (
                        <video
                          key={playableDefaultVideo || defaultVideo}
                          src={playableDefaultVideo || toProxyVideoUrl(defaultVideo)}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className={`w-full h-full object-cover transition-all duration-300 ${
                            isBlurred ? 'scale-105' : ''
                          }`}
                          style={{
                            filter: isBlurred ? `blur(${blurAmount}px)` : 'none',
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center p-4 pointer-events-none text-center">
                        <p className="text-white text-lg sm:text-2xl font-bold font-montserrat drop-shadow-lg leading-tight">
                          &quot;I once was lost, but now am found&quot;
                        </p>
                        <p className="text-white/80 text-xs sm:text-sm font-bold font-montserrat drop-shadow-md mt-1">
                          Was blind, but now I see.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 text-slate-400">
                      <Video className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-bold">No motion video selected (Solid Theme BG active)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Custom MP4 or WebM */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800">Upload Motion Video Loop</h4>
                  <p className="text-xs text-slate-500">Uploads directly to Cloud Database Storage (.mp4, .webm, .mov)</p>
                </div>
                <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#243c81] hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 shrink-0">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>{uploadingDefaultVideo ? 'Uploading to Database...' : 'Upload Video File'}</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    onChange={handleDefaultVideoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Direct Video / YouTube URL input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    Or YouTube / Direct Video URL:
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Supports YouTube loops or .mp4 links
                  </span>
                </div>
                <input
                  type="text"
                  value={customVideoUrlInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomVideoUrlInput(val);
                    setDefaultVideo(val);
                  }}
                  placeholder="https://www.youtube.com/watch?v=0JX8ZbTsBic or direct .mp4 URL"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                />
              </div>

              {/* Blur Visualizer Control */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-[#243c81]">
                        Blur Visualizer Background
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Softens the motion video loop so worship lyrics stand out clearly on projector
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBlurred((prev) => !prev)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border ${
                      isBlurred
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Blur {isBlurred ? 'ON' : 'OFF'}
                  </button>
                </div>

                {isBlurred && (
                  <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs font-bold text-slate-700">Blur Intensity:</span>
                    <div className="flex items-center gap-1.5">
                      {[
                        { label: 'Subtle', val: 4 },
                        { label: 'Medium', val: 8 },
                        { label: 'Deep', val: 12 },
                        { label: 'Max', val: 18 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setBlurAmount(item.val)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                            blurAmount === item.val
                              ? 'bg-[#243c81] text-white border-[#243c81] shadow-2xs font-black'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item.label} ({item.val}px)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClearDefaultVideo}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Clear / Remove Video
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVisualizerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDefaultVisualizer}
                  className="px-5 py-2 rounded-xl bg-[#243c81] hover:bg-blue-800 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span>Save to Database</span>
                </button>
              </div>
            </div>
          </div>
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
