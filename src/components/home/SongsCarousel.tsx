'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchWorshipSongs, WorshipSong, isYouTubeUrl, extractYouTubeId } from '@/lib/data/songs-service';
import {
  Music,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Play,
  Pause,
  ArrowRight,
  Sparkles,
  Guitar,
  BookOpen,
} from 'lucide-react';

export default function SongsCarousel() {
  const router = useRouter();
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [activeYouTubeId, setActiveYouTubeId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch songs on mount
  useEffect(() => {
    async function loadSongs() {
      try {
        const data = await fetchWorshipSongs();
        setSongs(data);
      } catch (err) {
        console.error('Failed to load songs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSongs();
  }, []);

  // Filter songs
  const categories = ['All', 'Praise', 'Worship', 'Youth', 'Reflection'];
  const filteredSongs = activeCategory === 'All'
    ? songs
    : songs.filter((s) => s.category?.toLowerCase() === activeCategory.toLowerCase());

  // Carousel scroll helpers
  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const scrollAmount = clientWidth * 0.8;
    scrollContainerRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  // Quick audio toggle
  const togglePlayAudio = (song: WorshipSong, e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Extract unique chords from ChordPro bracket format [G], [C], etc.
  const extractChords = (content: string): string[] => {
    const matches = content.match(/\[([A-G][b#]?[^\]]*)\]/g);
    if (!matches) return [];
    const nonChords = new Set(['verse', 'chorus', 'bridge', 'intro', 'outro', 'ending', 'instrumental', 'refrain']);
    const unique = Array.from(new Set(matches.map((c) => c.slice(1, -1))))
      .filter((c) => !nonChords.has(c.toLowerCase()) && !c.toLowerCase().startsWith('verse') && !c.toLowerCase().startsWith('chorus'));
    return unique.slice(0, 6); // return top 6
  };

  // Clean preview text without bracketed chords
  const cleanLyricsPreview = (content: string): string => {
    const lines = content.split('\n');
    const lyricLines = lines
      .filter((l) => !l.startsWith('#') && !l.startsWith('{') && !l.match(/^\[(Verse|Chorus|Bridge|Ending|Intro|Outro)/i))
      .map((l) => l.replace(/\[[^\]]+\]/g, '').trim())
      .filter((l) => l.length > 0);
    return lyricLines.slice(0, 2).join(' / ') || 'Tap to view full chords and lyrics.';
  };

  return (
    <section className="py-14 sm:py-20 bg-white border-t border-slate-200/80 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header with Title and Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#243c81] text-xs font-bold uppercase tracking-wider mb-2">
              <Guitar className="w-3.5 h-3.5 text-[#243c81]" />
              <span>CFC Tuy Music Ministry</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Worship & Praise Songs
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl font-medium">
              Explore chords, lyrics, and MP3 recordings for household prayer meetings, assemblies, and personal worship.
            </p>
          </div>

          {/* Navigation Arrows & Admin Link */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs hover:shadow-md transition-all active:scale-95"
              aria-label="Previous Songs"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs hover:shadow-md transition-all active:scale-95"
              aria-label="Next Songs"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <Link
              href="/songbook"
              className="ml-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#243c81] font-bold text-xs sm:text-sm transition-all"
            >
              <span>Songbook</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-[#243c81] text-white shadow-md shadow-blue-900/20'
                    : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-[#243c81] border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mb-3" />
            <p className="text-slate-500 font-medium text-sm">Loading songs library...</p>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
            <Music className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No songs found in this category</h3>
            <p className="text-sm text-slate-500 mt-1">Select &quot;All&quot; to browse all available worship songs.</p>
          </div>
        ) : (
          /* Carousel Scroll Container */
          <div
            ref={scrollContainerRef}
            className="flex gap-5 sm:gap-6 overflow-x-auto pb-6 pt-2 px-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
          >
            {filteredSongs.map((song) => {
              const chords = extractChords(song.lyricsAndChords);
              const previewLyrics = cleanLyricsPreview(song.lyricsAndChords);
              const isPlaying = playingSongId === song.id;

              return (
                <div
                  key={song.id}
                  onClick={() => {
                    router.push(`/songbook/${song.id}`);
                  }}
                  className="snap-start shrink-0 w-[300px] sm:w-[350px] lg:w-[380px] bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-lg hover:border-[#243c81] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Top Row: Category + Key + Audio Status */}
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            song.category === 'Praise'
                              ? 'bg-amber-100 text-amber-900'
                              : song.category === 'Worship'
                              ? 'bg-blue-100 text-[#243c81]'
                              : 'bg-purple-100 text-purple-900'
                          }`}
                        >
                          {song.category}
                        </span>

                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          Key: {song.key}
                        </span>
                      </div>

                      {(song.audioUrl || song.youtubeUrl) && (
                        <button
                          type="button"
                          onClick={(e) => togglePlayAudio(song, e)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 ${
                            isPlaying
                              ? 'bg-[#243c81] text-white animate-pulse shadow-md'
                              : 'bg-blue-50 text-[#243c81] hover:bg-blue-100 border border-blue-200'
                          }`}
                          title={isPlaying ? 'Pause Audio' : 'Play Audio Preview'}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-3 h-3 fill-current text-amber-400" />
                              <span>Playing</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Audio</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Title & Artist */}
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight group-hover:text-[#243c81] transition-colors line-clamp-1">
                      {song.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {song.artist || 'CFC Music Ministry'}
                    </p>

                    {/* Chords Chips preview */}
                    {chords.length > 0 && (
                      <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Chords:
                        </span>
                        {chords.map((chord) => (
                          <span
                            key={chord}
                            className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200/80"
                          >
                            {chord}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Lyrics Preview snippet */}
                    <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic line-clamp-2">
                      &ldquo;{previewLyrics}&rdquo;
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      {song.tempo ? `${song.tempo} • ` : ''}
                      {song.timeSignature || '4/4'}
                    </span>

                    <span className="inline-flex items-center gap-1 font-bold text-[#243c81] group-hover:translate-x-0.5 transition-transform">
                      <span>View Chords</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

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
            <Headphones className="w-4 h-4" />
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
    </section>
  );
}
