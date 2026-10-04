'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WorshipSong } from '@/lib/data/songs-service';
import { transposeChord, transposeSongContent, getChordShape } from '@/lib/music/guitarChords';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  Tv,
  Music,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Palette,
  ListMusic,
} from 'lucide-react';

interface SongPresentationModalProps {
  isOpen: boolean;
  song: WorshipSong | null;
  playlist?: WorshipSong[];
  initialSongIndex?: number;
  onClose: () => void;
  initialKey?: string;
}

export interface PresentationSlide {
  id: number;
  globalSlideId: number;
  title: string;
  type?: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'pre-chorus' | 'general';
  lines: PresentationLine[];
  // Playlist song metadata
  songId: string;
  songTitle: string;
  songKey: string;
  songCategory: string;
  songIndex: number;
  totalSongsInPlaylist: number;
}

export interface PresentationLine {
  isChordOnly?: boolean;
  rawChordLine?: string;
  cleanLyricText: string;
  segments: {
    chord?: string;
    text: string;
  }[];
}

export default function SongPresentationModal({
  isOpen,
  song,
  playlist,
  initialSongIndex = 0,
  onClose,
  initialKey,
}: SongPresentationModalProps) {
  // Transposition & display settings
  const [transposeOffset, setTransposeOffset] = useState<number>(0);
  const [showChords, setShowChords] = useState<boolean>(true);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState<number>(1); // 0.7x to 1.8x scale
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Auto slideshow settings
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState<number>(8); // seconds

  // Theme styling (White background with brand blue text default, Stage Dark, Deep Navy, High Contrast Black, Warm Sunset)
  const [theme, setTheme] = useState<'white' | 'stage' | 'navy' | 'black' | 'warm'>('white');

  // Compute active playlist songs list
  const activePlaylist = useMemo<WorshipSong[]>(() => {
    if (playlist && playlist.length > 0) return playlist;
    if (song) return [song];
    return [];
  }, [playlist, song]);

  // Reset slide index when song/playlist changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0);
      setTransposeOffset(0);
      setIsAutoPlay(false);
    }
  }, [isOpen, song?.id, playlist?.length]);

  // Helper: Detect if a line consists mostly of chords
  const isChordLine = useCallback((line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const inner = trimmed.slice(1, -1).trim();
      if (/^(verse|chorus|bridge|intro|outro|pre-chorus|refrain)/i.test(inner)) return false;
    }

    const tokens = trimmed.split(/\s+/);
    if (!tokens.length) return false;

    let validCount = 0;
    tokens.forEach((t) => {
      const c = t.replace(/[^A-Ga-g#0-9/]/g, '');
      if (getChordShape(c) || /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13|\/)*$/i.test(c)) {
        validCount++;
      }
    });

    return validCount / tokens.length >= 0.65;
  }, []);

  // Helper: Parse explicit section titles from lines like [Verse 1], [Chorus], • CHORUS, VERSE 2:
  const parseExplicitHeader = useCallback((line: string): { title: string; type: PresentationSlide['type'] } | null => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const clean = trimmed.replace(/^[\s•\*#\-:=]+|[\s:=]+$/g, '').trim();

    const match = clean.match(/^\[?\s*(verse\s*\d*|chorus\s*\d*|bridge\s*\d*|intro\s*\d*|outro\s*\d*|pre-?chorus\s*\d*|refrain\s*\d*|interlude\s*\d*|ending\s*\d*|tag\s*\d*|coda\s*\d*)\s*\]?$/i);

    if (match) {
      const rawName = match[1].trim();
      const title = rawName
        .toLowerCase()
        .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
      const lower = rawName.toLowerCase();
      let type: PresentationSlide['type'] = 'general';
      if (lower.includes('verse')) type = 'verse';
      else if (lower.includes('chorus')) type = 'chorus';
      else if (lower.includes('bridge')) type = 'bridge';
      else if (lower.includes('intro')) type = 'intro';
      else if (lower.includes('outro')) type = 'outro';
      else if (lower.includes('pre')) type = 'pre-chorus';

      return { title, type };
    }

    return null;
  }, []);

  // Parse all song texts in the playlist into continuous slides
  const slides = useMemo<PresentationSlide[]>(() => {
    if (!activePlaylist.length) return [];

    const allParsedSlides: PresentationSlide[] = [];
    let globalSlideCounter = 0;

    activePlaylist.forEach((currentSong, songIdx) => {
      const lyrics = currentSong.lyricsAndChords || '';
      const transposedLyrics = transposeSongContent(lyrics, transposeOffset);
      if (!transposedLyrics) return;

      const rawStanzas = transposedLyrics
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      let verseCounter = 0;
      let chorusCounter = 0;

      rawStanzas.forEach((stanza, sIdx) => {
        const stanzaLines = stanza.split('\n');
        let slideTitle = '';
        let slideType: PresentationSlide['type'] = 'general';
        const parsedLines: PresentationLine[] = [];

        let lineIdx = 0;
        if (stanzaLines.length > 0) {
          const headerInfo = parseExplicitHeader(stanzaLines[0]);
          if (headerInfo) {
            slideTitle = headerInfo.title;
            slideType = headerInfo.type;
            lineIdx = 1;
          }
        }

        while (lineIdx < stanzaLines.length) {
          const currentLine = stanzaLines[lineIdx];

          const inlineHeader = parseExplicitHeader(currentLine);
          if (inlineHeader && !slideTitle) {
            slideTitle = inlineHeader.title;
            slideType = inlineHeader.type;
            lineIdx++;
            continue;
          }

          if (currentLine.includes('[')) {
            const parts = currentLine.split(/(\[[A-G][#b]?[^\]]*\])/g);
            const segments: { chord?: string; text: string }[] = [];
            let pendingChord: string | undefined = undefined;

            parts.forEach((part) => {
              if (!part) return;
              if (part.startsWith('[') && part.endsWith(']')) {
                const inner = part.slice(1, -1).trim();
                const tagHeader = parseExplicitHeader(inner);
                if (tagHeader) {
                  if (!slideTitle) {
                    slideTitle = tagHeader.title;
                    slideType = tagHeader.type;
                  }
                } else {
                  pendingChord = inner;
                }
              } else {
                segments.push({
                  chord: pendingChord,
                  text: part,
                });
                pendingChord = undefined;
              }
            });

            if (pendingChord) {
              segments.push({ chord: pendingChord, text: '' });
            }

            if (segments.length > 0) {
              const isAllChords = segments.every((seg) => !seg.text.trim());
              const cleanLyricText = segments.map((s) => s.text).join('').trim();
              parsedLines.push({
                isChordOnly: isAllChords,
                rawChordLine: isAllChords ? currentLine : undefined,
                cleanLyricText,
                segments,
              });
            }
            lineIdx++;
          } else if (isChordLine(currentLine) && lineIdx + 1 < stanzaLines.length && !isChordLine(stanzaLines[lineIdx + 1])) {
            const chordLineStr = currentLine;
            const lyricLineStr = stanzaLines[lineIdx + 1];

            const chordTokens = chordLineStr.trim().split(/\s+/);
            const lyricWords = lyricLineStr.trim().split(/\s+/);

            const segments: { chord?: string; text: string }[] = [];
            if (lyricWords.length > 0) {
              lyricWords.forEach((word, wIdx) => {
                segments.push({
                  chord: chordTokens[wIdx] || undefined,
                  text: word + (wIdx < lyricWords.length - 1 ? ' ' : ''),
                });
              });
            } else {
              segments.push({
                chord: chordLineStr,
                text: lyricLineStr,
              });
            }

            parsedLines.push({
              cleanLyricText: lyricLineStr.trim(),
              segments,
            });

            lineIdx += 2;
          } else {
            const isChordsOnly = isChordLine(currentLine);
            const cleanText = isChordsOnly ? '' : currentLine.trim();
            parsedLines.push({
              isChordOnly: isChordsOnly,
              rawChordLine: isChordsOnly ? currentLine : undefined,
              cleanLyricText: cleanText,
              segments: [
                {
                  chord: isChordsOnly ? currentLine.trim() : undefined,
                  text: isChordsOnly ? '' : currentLine,
                },
              ],
            });
            lineIdx++;
          }
        }

        if (!slideTitle) {
          const hasLyrics = parsedLines.some((l) => !l.isChordOnly && l.cleanLyricText.length > 0);
          if (!hasLyrics) {
            slideTitle = sIdx === 0 ? 'Intro' : 'Interlude';
            slideType = 'intro';
          } else {
            if (sIdx === 0) {
              verseCounter++;
              slideTitle = `Verse ${verseCounter}`;
              slideType = 'verse';
            } else if (sIdx === 1) {
              chorusCounter++;
              slideTitle = `Chorus`;
              slideType = 'chorus';
            } else if (sIdx === rawStanzas.length - 1) {
              slideTitle = 'Outro';
              slideType = 'outro';
            } else {
              verseCounter++;
              slideTitle = `Verse ${verseCounter}`;
              slideType = 'verse';
            }
          }
        }

        if (parsedLines.length > 0) {
          allParsedSlides.push({
            id: sIdx,
            globalSlideId: globalSlideCounter++,
            title: slideTitle,
            type: slideType,
            lines: parsedLines,
            songId: currentSong.id,
            songTitle: currentSong.title,
            songKey: currentSong.key,
            songCategory: currentSong.category || 'Worship',
            songIndex: songIdx,
            totalSongsInPlaylist: activePlaylist.length,
          });
        }
      });
    });

    return allParsedSlides;
  }, [activePlaylist, transposeOffset, isChordLine, parseExplicitHeader]);

  // Current active slide
  const activeSlide = slides[currentSlideIndex] || null;

  // Active song display info
  const activeSongInfo = useMemo(() => {
    if (!activeSlide) {
      const fallback = activePlaylist[0] || song;
      return {
        title: fallback?.title || 'Worship Song',
        key: fallback?.key || 'G',
        category: fallback?.category || 'Worship',
        songIndex: 0,
        totalSongs: activePlaylist.length || 1,
      };
    }
    return {
      title: activeSlide.songTitle,
      key: activeSlide.songKey,
      category: activeSlide.songCategory,
      songIndex: activeSlide.songIndex,
      totalSongs: activeSlide.totalSongsInPlaylist,
    };
  }, [activeSlide, activePlaylist, song]);

  // Transposed current key display
  const currentKey = useMemo(() => {
    const keyToUse = initialKey || activeSongInfo.key || 'G';
    return transposeChord(keyToUse, transposeOffset);
  }, [activeSongInfo.key, initialKey, transposeOffset]);

  // Filter lines for current slide based on showChords setting
  const activeLyricLines = useMemo(() => {
    if (!activeSlide) return [];
    return activeSlide.lines.filter((line) => {
      if (!showChords) {
        return !line.isChordOnly && line.cleanLyricText.length > 0;
      }
      return true;
    });
  }, [activeSlide, showChords]);

  // Dynamic Lyric Font Size calculation based on line count
  const dynamicLyricFontSize = useMemo(() => {
    const count = activeLyricLines.length;
    let base = 3.6;
    if (!showChords) {
      if (count <= 2) base = 4.5;
      else if (count <= 4) base = 3.6;
      else if (count <= 6) base = 2.9;
      else base = 2.3;
    } else {
      if (count <= 2) base = 3.8;
      else if (count <= 4) base = 3.1;
      else if (count <= 6) base = 2.5;
      else base = 2.0;
    }
    return Math.max(1.5, base * fontSizeMultiplier);
  }, [activeLyricLines.length, showChords, fontSizeMultiplier]);

  // Handle slide navigation
  const goToNextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
  }, [slides.length]);

  const goToPrevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Keyboard Navigation Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          goToNextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          goToPrevSlide();
          break;
        case 'Escape':
          onClose();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'c':
        case 'C':
          setShowChords((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNextSlide, goToPrevSlide, onClose]);

  // Auto-play slideshow timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAutoPlay && isOpen && slides.length > 1) {
      timer = setInterval(() => {
        setCurrentSlideIndex((prev) => {
          if (prev >= slides.length - 1) {
            setIsAutoPlay(false);
            return prev;
          }
          return prev + 1;
        });
      }, autoPlayInterval * 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoPlay, isOpen, slides.length, autoPlayInterval]);

  // HTML5 Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!isOpen || (!song && !playlist?.length)) return null;

  // Theme color definitions
  const themeClasses = {
    white: {
      bg: 'bg-white',
      headerBg: 'bg-white/95 border-slate-200/90 shadow-xs',
      toolbarBg: 'bg-white/95 border-slate-200/90 shadow-xs',
      badgeBg: 'bg-[#243c81] text-white font-bold',
      chordText: 'text-amber-600 font-mono font-bold',
      lyricText: 'text-[#243c81] font-black',
      accent: 'text-[#243c81]',
      headerText: 'text-[#243c81]',
      subText: 'text-slate-500',
      keyText: 'text-[#243c81] font-bold',
      iconBg: 'bg-blue-50 text-[#243c81] border border-blue-200/80',
      btnBg: 'bg-slate-100 hover:bg-slate-200 text-[#243c81] border border-slate-200',
      btnActive: 'bg-[#243c81] text-white border-[#243c81] shadow-xs',
      navBtn: 'bg-white hover:bg-[#243c81] hover:text-white border-slate-200 text-[#243c81] shadow-xl hover:scale-105 active:scale-95',
      navBtnDisabled: 'opacity-20 border-transparent text-slate-300 cursor-not-allowed',
      sectionBadge: 'bg-blue-50 border-blue-200/80 text-[#243c81]',
      pillBg: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-[#243c81]',
      pillActive: 'bg-[#243c81] text-white border-[#243c81] shadow-md scale-105 font-extrabold',
    },
    stage: {
      bg: 'bg-slate-950',
      headerBg: 'bg-slate-900/90 border-slate-800 shadow-lg',
      toolbarBg: 'bg-slate-900/95 border-slate-800 shadow-lg',
      badgeBg: 'bg-amber-400 text-slate-950 font-bold',
      chordText: 'text-amber-400 font-mono font-bold',
      lyricText: 'text-white font-black',
      accent: 'text-amber-400',
      headerText: 'text-white',
      subText: 'text-white/60',
      keyText: 'text-amber-300 font-bold',
      iconBg: 'bg-white/10 text-amber-400 border border-white/10',
      btnBg: 'bg-white/10 hover:bg-white/20 text-white border border-white/10',
      btnActive: 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30',
      navBtn: 'bg-black/40 hover:bg-amber-400 hover:text-slate-950 border-white/15 text-white shadow-2xl hover:scale-105 active:scale-90',
      navBtnDisabled: 'opacity-20 border-transparent text-white/30 cursor-not-allowed',
      sectionBadge: 'bg-white/10 border-white/20 text-amber-300',
      pillBg: 'bg-white/10 text-white/70 border-white/10 hover:bg-white/20 hover:text-white',
      pillActive: 'bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-105 font-extrabold',
    },
    navy: {
      bg: 'bg-[#0b132b]',
      headerBg: 'bg-[#1c2541]/90 border-blue-900/50 shadow-lg',
      toolbarBg: 'bg-[#1c2541]/95 border-blue-900/50 shadow-lg',
      badgeBg: 'bg-cyan-400 text-slate-950 font-bold',
      chordText: 'text-cyan-300 font-mono font-bold',
      lyricText: 'text-cyan-100 font-black',
      accent: 'text-cyan-400',
      headerText: 'text-white',
      subText: 'text-blue-200/60',
      keyText: 'text-cyan-300 font-bold',
      iconBg: 'bg-blue-900/40 text-cyan-400 border border-blue-700/40',
      btnBg: 'bg-white/10 hover:bg-white/20 text-white border border-white/10',
      btnActive: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40 hover:bg-cyan-400/30',
      navBtn: 'bg-[#1c2541]/80 hover:bg-cyan-400 hover:text-slate-950 border-blue-700/50 text-white shadow-2xl hover:scale-105 active:scale-90',
      navBtnDisabled: 'opacity-20 border-transparent text-white/30 cursor-not-allowed',
      sectionBadge: 'bg-blue-900/40 border-blue-700/40 text-cyan-300',
      pillBg: 'bg-white/10 text-white/70 border-white/10 hover:bg-white/20 hover:text-white',
      pillActive: 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md scale-105 font-extrabold',
    },
    black: {
      bg: 'bg-black',
      headerBg: 'bg-neutral-900/90 border-neutral-800 shadow-lg',
      toolbarBg: 'bg-neutral-900/95 border-neutral-800 shadow-lg',
      badgeBg: 'bg-yellow-400 text-black font-bold',
      chordText: 'text-yellow-400 font-mono font-bold',
      lyricText: 'text-white font-black',
      accent: 'text-yellow-400',
      headerText: 'text-white',
      subText: 'text-white/60',
      keyText: 'text-yellow-300 font-bold',
      iconBg: 'bg-white/10 text-yellow-400 border border-white/10',
      btnBg: 'bg-white/10 hover:bg-white/20 text-white border border-white/10',
      btnActive: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40 hover:bg-yellow-400/30',
      navBtn: 'bg-neutral-900 hover:bg-yellow-400 hover:text-black border-neutral-700 text-white shadow-2xl hover:scale-105 active:scale-90',
      navBtnDisabled: 'opacity-20 border-transparent text-white/30 cursor-not-allowed',
      sectionBadge: 'bg-white/10 border-white/20 text-yellow-300',
      pillBg: 'bg-white/10 text-white/70 border-white/10 hover:bg-white/20 hover:text-white',
      pillActive: 'bg-yellow-400 text-black border-yellow-300 shadow-md scale-105 font-extrabold',
    },
    warm: {
      bg: 'bg-stone-900',
      headerBg: 'bg-stone-850/90 border-stone-800 shadow-lg',
      toolbarBg: 'bg-stone-850/95 border-stone-800 shadow-lg',
      badgeBg: 'bg-orange-400 text-stone-950 font-bold',
      chordText: 'text-amber-300 font-mono font-bold',
      lyricText: 'text-orange-50 font-black',
      accent: 'text-orange-400',
      headerText: 'text-white',
      subText: 'text-stone-400',
      keyText: 'text-orange-300 font-bold',
      iconBg: 'bg-stone-800 text-orange-400 border border-stone-700',
      btnBg: 'bg-white/10 hover:bg-white/20 text-white border border-white/10',
      btnActive: 'bg-orange-400/20 text-orange-300 border-orange-400/40 hover:bg-orange-400/30',
      navBtn: 'bg-stone-800 hover:bg-orange-400 hover:text-stone-950 border-stone-700 text-white shadow-2xl hover:scale-105 active:scale-90',
      navBtnDisabled: 'opacity-20 border-transparent text-white/30 cursor-not-allowed',
      sectionBadge: 'bg-stone-800 border-stone-700 text-orange-300',
      pillBg: 'bg-white/10 text-white/70 border-white/10 hover:bg-white/20 hover:text-white',
      pillActive: 'bg-orange-400 text-stone-950 border-orange-300 shadow-md scale-105 font-extrabold',
    },
  }[theme];

  return (
    <div className={`fixed inset-0 z-[100] w-screen h-screen ${themeClasses.bg} flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200`}>
      {/* =================================================================== */}
      {/* TOP PRESENTATION BAR                                                */}
      {/* =================================================================== */}
      <header className={`px-4 sm:px-8 py-3.5 ${themeClasses.headerBg} backdrop-blur-md border-b flex items-center justify-between gap-4 shrink-0 shadow-xs z-20`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-10 h-10 rounded-xl ${themeClasses.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
            {activeSongInfo.totalSongs > 1 ? (
              <ListMusic className="w-5 h-5" />
            ) : (
              <Tv className="w-5 h-5" />
            )}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${themeClasses.badgeBg}`}>
                {activeSongInfo.category}
              </span>
              <span className={`text-xs font-mono font-bold ${themeClasses.keyText}`}>
                Key of {currentKey}
              </span>
              {activeSongInfo.totalSongs > 1 && (
                <span className={`text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 px-2 py-0.5 rounded-full`}>
                  Song {activeSongInfo.songIndex + 1} of {activeSongInfo.totalSongs}
                </span>
              )}
            </div>
            <h1 className={`text-base sm:text-xl font-black ${themeClasses.headerText} truncate tracking-tight`}>
              {activeSongInfo.title}
            </h1>
          </div>
        </div>

        {/* Slide Counter & Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Current Slide Indicator */}
          {slides.length > 0 && (
            <div className={`px-3 py-1.5 rounded-xl ${themeClasses.btnBg} text-xs font-mono font-bold flex items-center gap-1.5`}>
              <span className={`${themeClasses.accent} font-black`}>{currentSlideIndex + 1}</span>
              <span className="opacity-40">/</span>
              <span className="opacity-80">{slides.length}</span>
            </div>
          )}

          {/* Toggle Chords */}
          <button
            type="button"
            onClick={() => setShowChords((prev) => !prev)}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              showChords ? themeClasses.btnActive : themeClasses.btnBg
            }`}
            title="Toggle Chords Visibility (Hotkey: C)"
          >
            {showChords ? (
              <>
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Chords ON</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 opacity-60" />
                <span className="hidden sm:inline">Chords OFF</span>
              </>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl ${themeClasses.btnBg} transition-all font-bold text-xs flex items-center gap-1.5`}
            title="Toggle Fullscreen (Hotkey: F)"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Fill Screen</span>
              </>
            )}
          </button>

          {/* Theme Selector */}
          <button
            type="button"
            onClick={() => {
              const themeKeys: ('white' | 'stage' | 'navy' | 'black' | 'warm')[] = ['white', 'stage', 'navy', 'black', 'warm'];
              const nextIdx = (themeKeys.indexOf(theme) + 1) % themeKeys.length;
              setTheme(themeKeys[nextIdx]);
            }}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${themeClasses.btnBg}`}
            title="Switch Theme (White, Stage, Navy, Black, Warm)"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline capitalize">{theme}</span>
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl ${themeClasses.btnBg} hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95`}
            aria-label="Exit Presentation"
            title="Exit Presentation (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* PRESENTATION SLIDE CANVAS (FILLED SCREEN CONTENT)                   */}
      {/* =================================================================== */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 max-w-7xl mx-auto w-full text-center relative overflow-y-auto no-scrollbar">

        {/* SLIDE CONTENT AREA */}
        {activeSlide ? (
          <div
            key={activeSlide.globalSlideId}
            className="w-full max-w-6xl my-auto flex flex-col items-center justify-center py-1 px-4 space-y-2 sm:space-y-3 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Section Tag Badge (Song Title & Verse 1, Chorus, etc.) */}
            <div className="flex flex-col items-center gap-1">
              {activeSongInfo.totalSongs > 1 && (
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {activeSlide.songTitle}
                </div>
              )}
              {activeSlide.title && (
                <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full ${themeClasses.sectionBadge} border text-xs sm:text-sm font-black uppercase tracking-widest backdrop-blur-md shadow-xs mb-0.5`}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{activeSlide.title}</span>
                </div>
              )}
            </div>

            {/* STANZA LINES DISPLAY */}
            {!showChords ? (
              /* CLEAN CENTERED LYRICS WHEN CHORDS ARE OFF */
              <div className="space-y-1 sm:space-y-1.5 md:space-y-2 w-full max-w-6xl mx-auto flex flex-col items-center justify-center">
                {activeLyricLines.map((line, lIdx) => (
                  <p
                    key={lIdx}
                    className={`${themeClasses.lyricText} text-center leading-tight tracking-tight w-full px-2 transition-all`}
                    style={{
                      fontSize: `${dynamicLyricFontSize}rem`,
                      lineHeight: 1.15,
                    }}
                  >
                    {line.cleanLyricText}
                  </p>
                ))}
              </div>
            ) : (
              /* LYRICS WITH CHORDS ABOVE WHEN CHORDS ARE ON */
              <div className="space-y-2 sm:space-y-3 w-full max-w-6xl mx-auto flex flex-col items-center justify-center">
                {activeLyricLines.map((line, lIdx) => (
                  <div
                    key={lIdx}
                    className="flex flex-wrap items-end justify-center gap-x-3 sm:gap-x-4 gap-y-0.5 leading-tight text-center"
                  >
                    {line.isChordOnly ? (
                      <div className={`font-mono font-extrabold ${themeClasses.chordText} bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl text-lg sm:text-2xl tracking-widest shadow-xs my-0.5`}>
                        {line.rawChordLine || line.segments.map((s) => s.chord).join('   ')}
                      </div>
                    ) : (
                      line.segments.map((seg, sIdx) => (
                        <div
                          key={sIdx}
                          className="inline-flex flex-col items-center justify-end text-center"
                        >
                          {seg.chord && (
                            <span
                              className={`font-mono font-black ${themeClasses.chordText} tracking-wider transition-all select-none mb-0 opacity-95`}
                              style={{
                                fontSize: `${Math.max(1.2, dynamicLyricFontSize * 0.48)}rem`,
                                lineHeight: 1.1,
                              }}
                            >
                              {seg.chord}
                            </span>
                          )}
                          <span
                            className={`${themeClasses.lyricText} transition-all tracking-tight leading-tight`}
                            style={{
                              fontSize: `${dynamicLyricFontSize}rem`,
                              lineHeight: 1.15,
                            }}
                          >
                            {seg.text || '\u00A0'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={`${themeClasses.subText} text-lg`}>No slides available for this song or playlist.</div>
        )}

        {/* =================================================================== */}
        {/* LOWER RIGHT NAVIGATION CONTROLS (CLEAN LOWER RIGHT CORNER)         */}
        {/* =================================================================== */}
        {slides.length > 1 && (
          <div className="fixed bottom-16 sm:bottom-20 right-4 sm:right-8 z-30 flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-white/95 border border-slate-200/90 shadow-2xl backdrop-blur-md transition-all">
            {/* Previous Slide Button */}
            <button
              type="button"
              onClick={goToPrevSlide}
              disabled={currentSlideIndex === 0}
              className={`px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                currentSlideIndex === 0 ? themeClasses.navBtnDisabled : themeClasses.btnBg
              }`}
              title="Previous Slide (Left Arrow / Up / PageUp)"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Next Slide Button */}
            <button
              type="button"
              onClick={goToNextSlide}
              disabled={currentSlideIndex === slides.length - 1}
              className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl border transition-all flex items-center gap-2 text-xs sm:text-sm font-black ${
                currentSlideIndex === slides.length - 1
                  ? themeClasses.navBtnDisabled
                  : `${themeClasses.btnActive} shadow-lg active:scale-95 hover:scale-105`
              }`}
              title="Next Slide (Right Arrow / Space / Down / PageDown)"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* BOTTOM CONTROL TOOLBAR                                              */}
      {/* =================================================================== */}
      <footer className={`px-4 sm:px-8 py-3 ${themeClasses.toolbarBg} backdrop-blur-md border-t flex flex-wrap items-center justify-between gap-3 shrink-0 z-20`}>
        {/* Left: Quick Transpose Controls */}
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-black uppercase tracking-wider ${themeClasses.subText} hidden sm:inline`}>
            Key:
          </span>
          <div className={`flex items-center ${themeClasses.btnBg} rounded-xl p-1`}>
            <button
              type="button"
              onClick={() => setTransposeOffset((p) => p - 1)}
              className={`w-7 h-7 rounded-lg ${themeClasses.pillBg} font-black text-xs flex items-center justify-center transition-all`}
              title="Transpose Key Down (-1)"
            >
              -1
            </button>
            <span className={`px-2.5 font-mono text-xs font-black ${themeClasses.keyText}`}>
              {currentKey}
            </span>
            <button
              type="button"
              onClick={() => setTransposeOffset((p) => p + 1)}
              className={`w-7 h-7 rounded-lg ${themeClasses.pillBg} font-black text-xs flex items-center justify-center transition-all`}
              title="Transpose Key Up (+1)"
            >
              +1
            </button>
          </div>

          {transposeOffset !== 0 && (
            <button
              type="button"
              onClick={() => setTransposeOffset(0)}
              className={`text-[10px] font-bold ${themeClasses.subText} hover:underline px-1`}
            >
              Reset
            </button>
          )}
        </div>

        {/* Center: Slide Quick Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[280px] sm:max-w-xl py-1 mx-auto">
          {slides.map((slide, idx) => (
            <button
              key={slide.globalSlideId}
              type="button"
              onClick={() => setCurrentSlideIndex(idx)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                currentSlideIndex === idx ? themeClasses.pillActive : themeClasses.pillBg
              }`}
            >
              {slide.totalSongsInPlaylist > 1 ? `${slide.songTitle.substring(0, 8)}..: ${slide.title}` : (slide.title || `Slide ${idx + 1}`)}
            </button>
          ))}
        </div>

        {/* Right: Font Resizer & Slideshow Auto Play */}
        <div className="flex items-center gap-2">
          {/* Font Scaling */}
          <div className={`flex items-center ${themeClasses.btnBg} rounded-xl p-0.5`}>
            <button
              type="button"
              onClick={() => setFontSizeMultiplier((p) => Math.max(p - 0.1, 0.7))}
              className="p-1.5 rounded-lg hover:bg-black/10 text-slate-600 hover:text-slate-900"
              title="Smaller Font"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className={`px-1.5 font-mono text-[10px] font-bold ${themeClasses.subText}`}>
              {Math.round(fontSizeMultiplier * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setFontSizeMultiplier((p) => Math.min(p + 0.1, 1.8))}
              className="p-1.5 rounded-lg hover:bg-black/10 text-slate-600 hover:text-slate-900"
              title="Larger Font"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Auto Slideshow */}
          <button
            type="button"
            onClick={() => setIsAutoPlay((p) => !p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isAutoPlay
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md animate-pulse'
                : themeClasses.btnBg
            }`}
            title="Auto Advance Slides"
          >
            {isAutoPlay ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Playing</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Auto</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
