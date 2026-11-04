'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  WorshipSong,
  getDefaultVisualizerVideo,
  resolveVisualizerVideoUrl,
  fetchChapterVisualizerSettingsFromDB,
  subscribeToSongsChanges,
} from '@/lib/data/songs-service';
import { transposeChord, transposeSongContent, getChordShape } from '@/lib/music/guitarChords';
import { parseChordProLine, ChordProWord } from '@/lib/music/chordPro';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SkipBack,
  SkipForward,
  X,
  Maximize2,
  Minimize2,
  Tv,
  Music,
  Video,
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
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
  songVideoUrl?: string;
  songIndex: number;
  totalSongsInPlaylist: number;
}

export interface PresentationLine {
  isChordOnly?: boolean;
  rawChordLine?: string;
  cleanLyricText: string;
  words?: ChordProWord[];
  segments: {
    chord?: string;
    text: string;
  }[];
}

class PresentationErrorBoundary extends React.Component<
  { children: React.ReactNode; onClose?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('SongPresentationModal Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center mb-4 shadow-xl font-black">
            <Tv className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-2">Unable to load presentation view</h2>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'A display issue occurred while preparing the presentation slides.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onClose) this.props.onClose();
              }}
              className="px-5 py-2.5 rounded-2xl bg-white text-slate-950 font-black text-xs hover:bg-slate-200 transition-all shadow-md active:scale-95"
            >
              Exit Presentation
            </button>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-5 py-2.5 rounded-2xl bg-[#243c81] text-white font-black text-xs hover:bg-blue-800 transition-all shadow-md active:scale-95"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SongPresentationModalContent({
  isOpen,
  song,
  playlist,
  initialSongIndex = 0,
  onClose,
  initialKey,
}: SongPresentationModalProps) {
  // Transposition & display settings
  const [transposeOffset, setTransposeOffset] = useState<number>(0);
  const [showChords, setShowChords] = useState<boolean>(false); // Chords OFF by default for presentation
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState<number>(1); // 0.7x to 1.8x scale
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Auto slideshow settings
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState<number>(8); // seconds

  // Theme styling (White background with brand blue text default, Stage Dark, Deep Navy, High Contrast Black, Warm Sunset)
  const [theme, setTheme] = useState<'white' | 'stage' | 'navy' | 'black' | 'warm'>('stage');

  // Visualizer Background Video state
  const [showBgVideo, setShowBgVideo] = useState<boolean>(true);
  const [defaultBgVideo, setDefaultBgVideo] = useState<string>('');
  const [isBlurred, setIsBlurred] = useState<boolean>(false);
  const [blurAmount, setBlurAmount] = useState<number>(8); // px

  // Custom Font Color setting (default #ffffff for high contrast)
  const [fontColor, setFontColor] = useState<string>('#ffffff');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  // Compute active playlist songs list
  const activePlaylist = useMemo<WorshipSong[]>(() => {
    if (playlist && playlist.length > 0) return playlist;
    if (song) return [song];
    return [];
  }, [playlist, song]);

  // Load saved preferences & sync realtime database updates for visualizer video
  useEffect(() => {
    if (!isOpen) return;

    async function loadVisualizerSettings() {
      if (typeof window !== 'undefined') {
        try {
          const resolved = await resolveVisualizerVideoUrl();
          if (resolved) setDefaultBgVideo(resolved);

          const dbSettings = await fetchChapterVisualizerSettingsFromDB();
          if (dbSettings) {
            if (dbSettings.defaultVideoUrl) setDefaultBgVideo(dbSettings.defaultVideoUrl);
            if (typeof dbSettings.isBlurred === 'boolean') setIsBlurred(dbSettings.isBlurred);
            if (dbSettings.blurAmount) setBlurAmount(dbSettings.blurAmount);
            if (dbSettings.fontColor) setFontColor(dbSettings.fontColor);
          }
        } catch (err) {
          console.warn('Failed to resolve visualizer video:', err);
        }

        const savedColor = localStorage.getItem('cfc_presentation_font_color');
        if (savedColor) setFontColor(savedColor);
        const savedVideoPref = localStorage.getItem('cfc_presentation_show_video');
        if (savedVideoPref !== null) {
          setShowBgVideo(savedVideoPref === 'true');
        }
        const savedBlur = localStorage.getItem('cfc_presentation_blur_video');
        if (savedBlur !== null) {
          setIsBlurred(savedBlur === 'true');
        }
        const savedBlurAmount = localStorage.getItem('cfc_presentation_blur_amount');
        if (savedBlurAmount) {
          setBlurAmount(parseInt(savedBlurAmount, 10) || 8);
        }
      }
    }

    loadVisualizerSettings();

    // Subscribe to real-time visualizer changes while presentation is open
    const unsubscribe = subscribeToSongsChanges(async () => {
      try {
        const dbSettings = await fetchChapterVisualizerSettingsFromDB();
        if (dbSettings?.defaultVideoUrl) {
          setDefaultBgVideo(dbSettings.defaultVideoUrl);
        }
        if (typeof dbSettings?.isBlurred === 'boolean') {
          setIsBlurred(dbSettings.isBlurred);
        }
        if (dbSettings?.blurAmount) {
          setBlurAmount(dbSettings.blurAmount);
        }
      } catch (err) {
        console.warn('Realtime visualizer refresh error:', err);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  // Reset slide index when song/playlist changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0);
      setTransposeOffset(0);
      setShowChords(false); // Chords OFF as default when opening presentation
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

  // Helper: Parse explicit section titles from lines like {comment: Verse 1}, [Verse 1], [Chorus], • CHORUS, VERSE 2:
  const parseExplicitHeader = useCallback((line: string): { title: string; type: PresentationSlide['type'] } | null => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const parsed = parseChordProLine(trimmed);
    if (parsed.type === 'section') {
      return {
        title: parsed.title,
        type: parsed.sectionType as PresentationSlide['type'],
      };
    }

    const clean = trimmed.replace(/^[\s•\*#\-:=]+|[\s:=]+$/g, '').trim();

    const match = clean.match(/^\[?\s*(verse\s*\d*|chorus\s*\d*|bridge\s*\d*|intro\s*\d*|outro\s*\d*|pre-?chorus\s*\d*|refrain\s*\d*|interlude\s*\d*|instrumental\s*\d*|ending\s*\d*|tag\s*\d*|coda\s*\d*)\s*\]?$/i);

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
      else if (lower.includes('intro') || lower.includes('instrumental') || lower.includes('interlude')) type = 'intro';
      else if (lower.includes('outro') || lower.includes('ending') || lower.includes('coda')) type = 'outro';
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

          // Check if current line is a chord-only line (e.g. "[G]  [C]  [G]" or "G   C   G")
          const isCurrentChordOnly = (() => {
            const trimmed = currentLine.trim();
            if (!trimmed) return false;
            if (trimmed.includes('[')) {
              const cleaned = trimmed.replace(/\[[A-G][#b]?[^\]]*\]/g, '').trim();
              return cleaned.length === 0;
            }
            return isChordLine(currentLine);
          })();

          // Check if next line is a lyric line
          const hasNextLyricLine = lineIdx + 1 < stanzaLines.length && (() => {
            const nextTrimmed = stanzaLines[lineIdx + 1].trim();
            if (!nextTrimmed) return false;
            if (parseExplicitHeader(nextTrimmed)) return false;
            const isNextChordOnly = nextTrimmed.includes('[')
              ? nextTrimmed.replace(/\[[A-G][#b]?[^\]]*\]/g, '').trim().length === 0
              : isChordLine(nextTrimmed);
            return !isNextChordOnly;
          })();

          // PAIRING: If current line is chord-only and next line is lyrics, pair them word-by-word
          if (isCurrentChordOnly && hasNextLyricLine) {
            const chordLineStr = currentLine;
            const lyricLineStr = stanzaLines[lineIdx + 1];

            // Extract chord tokens
            let chordTokens: string[] = [];
            if (chordLineStr.includes('[')) {
              const matches = chordLineStr.match(/\[([A-G][#b]?[^\]]*)\]/g);
              if (matches) {
                chordTokens = matches.map((m) => m.slice(1, -1).trim());
              }
            } else {
              chordTokens = chordLineStr.trim().split(/\s+/).map((t) => t.replace(/[^A-Ga-g#0-9/]/g, '')).filter(Boolean);
            }

            // Extract lyric words
            const lyricWords = lyricLineStr.trim().split(/\s+/);
            const segments: { chord?: string; text: string }[] = [];

            if (lyricWords.length > 0) {
              let cTracker = 0;
              lyricWords.forEach((word, wIdx) => {
                let chordForWord: string | undefined = undefined;
                if (chordTokens.length === lyricWords.length) {
                  chordForWord = chordTokens[wIdx];
                } else if (cTracker < chordTokens.length) {
                  const targetWordIdx = Math.min(
                    Math.round((cTracker / Math.max(1, chordTokens.length - 1)) * (lyricWords.length - 1)),
                    lyricWords.length - 1
                  );
                  if (wIdx >= targetWordIdx) {
                    chordForWord = chordTokens[cTracker];
                    cTracker++;
                  }
                }

                segments.push({
                  chord: chordForWord,
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
            continue;
          }

          // Check ChordPro line syntax
          const parsed = parseChordProLine(currentLine);

          if (parsed.type === 'empty') {
            lineIdx++;
            continue;
          }

          if (parsed.type === 'end_directive') {
            lineIdx++;
            continue;
          }

          if (parsed.type === 'section') {
            if (!slideTitle) {
              slideTitle = parsed.title;
              slideType = parsed.sectionType as PresentationSlide['type'];
            }
            lineIdx++;
            continue;
          }

          if (parsed.type === 'chord_progression') {
            parsedLines.push({
              isChordOnly: true,
              rawChordLine: parsed.items.map((it) => it.value).join('   '),
              cleanLyricText: '',
              segments: parsed.items.filter((it) => it.isChord).map((it) => ({ chord: it.value, text: '' })),
            });
            lineIdx++;
            continue;
          }

          if (parsed.type === 'chords_and_lyrics') {
            const segments: { chord?: string; text: string }[] = [];
            parsed.words.forEach((w) => {
              if (w.isSpace) {
                segments.push({ chord: undefined, text: ' ' });
              } else {
                w.segments.forEach((seg) => {
                  segments.push(seg);
                });
              }
            });

            parsedLines.push({
              isChordOnly: false,
              cleanLyricText: parsed.cleanText,
              words: parsed.words,
              segments,
            });
            lineIdx++;
            continue;
          }

          // Plain lyric line or unpaired chord line
          const isChordsOnly = isChordLine(currentLine);
          const cleanText = isChordsOnly ? '' : currentLine.trim();
          const words = currentLine.trim().split(/\s+/);
          const segments: { chord?: string; text: string }[] = isChordsOnly
            ? [{ chord: currentLine.trim(), text: '' }]
            : words.map((w, idx) => ({
                chord: undefined,
                text: w + (idx < words.length - 1 ? ' ' : ''),
              }));

          parsedLines.push({
            isChordOnly: isChordsOnly,
            rawChordLine: isChordsOnly ? currentLine : undefined,
            cleanLyricText: cleanText,
            words: isChordsOnly
              ? undefined
              : [{ segments: [{ text: cleanText }] }],
            segments,
          });
          lineIdx++;
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
            songVideoUrl: currentSong.videoUrl || '',
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

  // Active visualizer background video URL
  const activeBgVideo = useMemo(() => {
    const currentSong = activePlaylist[activeSongInfo.songIndex] || song;
    const raw = currentSong?.videoUrl || defaultBgVideo || '';
    if (!raw || raw.startsWith('blob:') || raw.startsWith('Uploaded:')) {
      return '';
    }
    if (raw.includes('.supabase.co/storage/v1/object/public/songs/videos/')) {
      return `/api/video?url=${encodeURIComponent(raw)}`;
    }
    return raw;
  }, [activePlaylist, activeSongInfo.songIndex, song, defaultBgVideo]);

  const presentationVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (showBgVideo && activeBgVideo && presentationVideoRef.current) {
      presentationVideoRef.current.muted = true;
      presentationVideoRef.current.play().catch(() => {});
    }
  }, [showBgVideo, activeBgVideo]);

  // Dynamic font color resolution:
  // - If motion background video is active, default to white or chosen color with high-contrast text shadow
  // - If solid theme is active, protect against white-on-white by falling back to themeClasses.lyricText
  const effectiveFontColor = useMemo(() => {
    if (showBgVideo && activeBgVideo) {
      return fontColor || '#ffffff';
    }
    if (fontColor) {
      const lower = fontColor.toLowerCase().trim();
      const isWhiteOrNearWhite =
        lower === '#ffffff' ||
        lower === '#fff' ||
        lower === 'white' ||
        lower === '#f8fafc' ||
        lower === '#f1f5f9';
      if ((theme === 'white' || theme === 'warm') && isWhiteOrNearWhite) {
        return undefined;
      }
      return fontColor;
    }
    return undefined;
  }, [showBgVideo, activeBgVideo, fontColor, theme]);

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

  // Jump to next song in the presentation playlist
  const goToNextSong = useCallback(() => {
    if (!activeSlide || activeSongInfo.totalSongs <= 1) return;
    const currentSongIdx = activeSlide.songIndex;
    const nextSongSlideIdx = slides.findIndex((s) => s.songIndex > currentSongIdx);
    if (nextSongSlideIdx !== -1) {
      setCurrentSlideIndex(nextSongSlideIdx);
    }
  }, [activeSlide, activeSongInfo.totalSongs, slides]);

  // Jump to previous song (or first slide of current song)
  const goToPrevSong = useCallback(() => {
    if (!activeSlide || activeSongInfo.totalSongs <= 1) return;
    const currentSongIdx = activeSlide.songIndex;
    const firstSlideOfCurrentSong = slides.findIndex((s) => s.songIndex === currentSongIdx);

    if (currentSlideIndex > firstSlideOfCurrentSong) {
      setCurrentSlideIndex(firstSlideOfCurrentSong);
    } else if (currentSongIdx > 0) {
      const prevSongSlideIdx = slides.findIndex((s) => s.songIndex === currentSongIdx - 1);
      if (prevSongSlideIdx !== -1) {
        setCurrentSlideIndex(prevSongSlideIdx);
      }
    }
  }, [activeSlide, activeSongInfo.totalSongs, currentSlideIndex, slides]);

  // Detect if current slide is the last slide of the current song
  const isLastSlideOfCurrentSong = useMemo(() => {
    if (!activeSlide || activeSongInfo.totalSongs <= 1) return false;
    const nextSlide = slides[currentSlideIndex + 1];
    return !nextSlide || nextSlide.songIndex > activeSlide.songIndex;
  }, [activeSlide, activeSongInfo.totalSongs, currentSlideIndex, slides]);

  // Next upcoming song title if available
  const nextSongTitle = useMemo(() => {
    if (!activeSlide || activeSongInfo.totalSongs <= 1) return null;
    const nextSongIdx = activeSlide.songIndex + 1;
    const nextSong = activePlaylist[nextSongIdx];
    return nextSong ? nextSong.title : null;
  }, [activeSlide, activeSongInfo.totalSongs, activePlaylist]);

  // Detect if current slide is the first slide of the current song
  const isFirstSlideOfCurrentSong = useMemo(() => {
    if (!activeSlide || activeSongInfo.totalSongs <= 1) return false;
    const prevSlide = slides[currentSlideIndex - 1];
    return !prevSlide || prevSlide.songIndex < activeSlide.songIndex;
  }, [activeSlide, activeSongInfo.totalSongs, currentSlideIndex, slides]);

  // Keyboard Navigation Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault();
          goToNextSong();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          goToPrevSong();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          if (e.shiftKey) {
            goToNextSong();
          } else {
            goToNextSlide();
          }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          if (e.shiftKey) {
            goToPrevSong();
          } else {
            goToPrevSlide();
          }
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
  }, [isOpen, goToNextSlide, goToPrevSlide, goToNextSong, goToPrevSong, onClose]);

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
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          (document.documentElement as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
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
      {/* BACKGROUND VISUALIZER MOTION VIDEO LOOP (FOR PROJECTOR / STAGE)    */}
      {/* =================================================================== */}
      {showBgVideo && activeBgVideo && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <video
            ref={presentationVideoRef}
            key={activeBgVideo}
            src={activeBgVideo}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => {
              if (presentationVideoRef.current) {
                presentationVideoRef.current.play().catch(() => {});
              }
            }}
            onError={(e) => {
              console.warn('Background motion video failed to load:', activeBgVideo, e);
            }}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isBlurred ? 'scale-105' : ''
            }`}
            style={{
              filter: isBlurred ? `blur(${blurAmount}px)` : 'none',
            }}
          />
          {/* Subtle contrast scrim to ensure lyrics are 100% readable */}
          <div className="absolute inset-0 bg-slate-950/65" />
        </div>
      )}

      {/* =================================================================== */}
      {/* TOP PRESENTATION BAR                                                */}
      {/* =================================================================== */}
      <header className={`px-4 sm:px-8 py-3 sm:py-4 ${themeClasses.headerBg} backdrop-blur-md border-b flex items-center justify-between gap-4 shrink-0 shadow-xs relative z-20`}>
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${themeClasses.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
            {activeSongInfo.totalSongs > 1 ? (
              <ListMusic className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Tv className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${themeClasses.badgeBg}`}>
                {activeSongInfo.category}
              </span>
              <span className={`text-xs font-mono font-bold ${themeClasses.keyText}`}>
                Key of {currentKey}
              </span>
              {activeSongInfo.totalSongs > 1 && (
                <div className="relative inline-flex items-center">
                  <select
                    value={activeSongInfo.songIndex}
                    onChange={(e) => {
                      const targetSongIdx = parseInt(e.target.value, 10);
                      const targetSlideIdx = slides.findIndex((s) => s.songIndex === targetSongIdx);
                      if (targetSlideIdx !== -1) {
                        setCurrentSlideIndex(targetSlideIdx);
                      }
                    }}
                    className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 px-2.5 py-0.5 pr-6 rounded-full appearance-none cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors max-w-[200px] truncate"
                    title="Jump to another song in presentation playlist"
                  >
                    {activePlaylist.map((s, idx) => (
                      <option key={s.id || idx} value={idx}>
                        Song {idx + 1} of {activeSongInfo.totalSongs}: {s.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-amber-600 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>
            {/* Song Title (Large enough to easily identify across the hall / projector) */}
            <h1
              className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black ${themeClasses.headerText} truncate tracking-tight`}
              style={{ fontFamily: 'var(--font-montserrat), "Montserrat", sans-serif', fontWeight: 800 }}
              title={activeSongInfo.title}
            >
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

          {/* Text Alignment Selector (Left, Center, Right) */}
          <div className={`flex items-center rounded-xl p-0.5 border border-white/10 ${themeClasses.btnBg}`}>
            <button
              type="button"
              onClick={() => setTextAlign('left')}
              className={`p-1.5 rounded-lg transition-all ${
                textAlign === 'left' ? themeClasses.btnActive : 'opacity-60 hover:opacity-100'
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTextAlign('center')}
              className={`p-1.5 rounded-lg transition-all ${
                textAlign === 'center' ? themeClasses.btnActive : 'opacity-60 hover:opacity-100'
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTextAlign('right')}
              className={`p-1.5 rounded-lg transition-all ${
                textAlign === 'right' ? themeClasses.btnActive : 'opacity-60 hover:opacity-100'
              }`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Motion Video BG Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !showBgVideo;
              setShowBgVideo(nextVal);
              if (typeof window !== 'undefined') {
                localStorage.setItem('cfc_presentation_show_video', String(nextVal));
              }
            }}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              showBgVideo ? themeClasses.btnActive : themeClasses.btnBg
            }`}
            title="Toggle Motion Background Video Loop"
          >
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Motion BG {showBgVideo ? 'ON' : 'OFF'}</span>
          </button>

          {/* Blur Visualizer Video Toggle */}
          {showBgVideo && activeBgVideo && (
            <button
              type="button"
              onClick={() => {
                const nextVal = !isBlurred;
                setIsBlurred(nextVal);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('cfc_presentation_blur_video', String(nextVal));
                }
              }}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                isBlurred ? themeClasses.btnActive : themeClasses.btnBg
              }`}
              title="Toggle Blur Effect on Motion Visualizer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Blur {isBlurred ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Font Color Picker Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker((prev) => !prev)}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${themeClasses.btnBg}`}
              title="Customize Lyrics Font Color"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-xs shrink-0"
                style={{ backgroundColor: fontColor || (theme === 'white' ? '#243c81' : '#ffffff') }}
              />
              <span className="hidden sm:inline">Font Color</span>
            </button>

            {showColorPicker && (
              <div className="absolute right-0 top-full mt-2 p-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 w-60 flex flex-col gap-2.5 text-white">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Lyrics Font Color</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFontColor(theme === 'white' ? '#243c81' : '#ffffff');
                      setShowColorPicker(false);
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('cfc_presentation_font_color');
                      }
                    }}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { hex: '#ffffff', label: 'Pure White' },
                    { hex: '#facc15', label: 'Vibrant Yellow' },
                    { hex: '#fbbf24', label: 'Warm Amber' },
                    { hex: '#38bdf8', label: 'Sky Cyan' },
                    { hex: '#4ade80', label: 'Pastel Green' },
                    { hex: '#fb7185', label: 'Soft Rose' },
                    { hex: '#e2e8f0', label: 'Silver' },
                    { hex: '#243c81', label: 'CFC Navy' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        setFontColor(c.hex);
                        setShowColorPicker(false);
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('cfc_presentation_font_color', c.hex);
                        }
                      }}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${
                        fontColor.toLowerCase() === c.hex.toLowerCase() ? 'ring-2 ring-amber-400 scale-105 border-white' : 'border-slate-700'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {fontColor.toLowerCase() === c.hex.toLowerCase() && (
                        <Check
                          className={`w-4 h-4 ${
                            c.hex === '#ffffff' || c.hex === '#facc15' || c.hex === '#fbbf24' || c.hex === '#4ade80' || c.hex === '#e2e8f0'
                              ? 'text-black'
                              : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <label className="text-xs text-slate-400 font-medium">Custom:</label>
                  <input
                    type="color"
                    value={fontColor.startsWith('#') ? fontColor : '#ffffff'}
                    onChange={(e) => {
                      setFontColor(e.target.value);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('cfc_presentation_font_color', e.target.value);
                      }
                    }}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-300 uppercase truncate">{fontColor}</span>
                </div>
              </div>
            )}
          </div>

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
      <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 max-w-7xl mx-auto w-full relative z-10 overflow-y-auto no-scrollbar">

        {/* SLIDE CONTENT AREA */}
        {activeSlide ? (
          <div
            key={activeSlide.globalSlideId}
            className={`w-full max-w-6xl my-auto flex flex-col ${
              textAlign === 'left' ? 'items-start text-left' : textAlign === 'right' ? 'items-end text-right' : 'items-center text-center'
            } justify-center py-2 px-4 space-y-3 sm:space-y-4 animate-in fade-in zoom-in-95 duration-200`}
          >
            {/* Note: Song title and Verse badges removed from canvas per projector presentation requirements */}

            {/* STANZA LINES DISPLAY */}
            {activeLyricLines.length === 0 ? (
              /* TITLE / INTRO SLIDE (When slide has no lyrics, e.g. Intro or Title Slide) */
              <div className="my-auto flex flex-col items-center justify-center text-center space-y-4 py-8 sm:py-12 animate-in fade-in zoom-in-95 duration-300 max-w-5xl mx-auto px-4">
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${themeClasses.badgeBg} text-xs sm:text-sm font-black uppercase tracking-widest shadow-md`}>
                  <span>{activeSlide.songCategory}</span>
                  <span className="opacity-40">•</span>
                  <span>{activeSlide.title || 'Intro'}</span>
                </div>

                <h1
                  className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black ${
                    effectiveFontColor ? '' : themeClasses.lyricText
                  } tracking-tight font-montserrat leading-tight drop-shadow-md`}
                  style={{
                    fontFamily: 'var(--font-montserrat), "Montserrat", sans-serif',
                    fontWeight: 800,
                    ...(effectiveFontColor ? { color: effectiveFontColor } : {}),
                    textShadow: showBgVideo && activeBgVideo
                      ? '0 4px 24px rgba(0,0,0,0.95), 0 2px 6px rgba(0,0,0,0.9)'
                      : '0 2px 14px rgba(0,0,0,0.25)',
                  }}
                >
                  {activeSlide.songTitle}
                </h1>

                <p
                  className={`text-sm sm:text-lg font-bold font-montserrat opacity-80 ${
                    effectiveFontColor ? '' : themeClasses.headerText
                  }`}
                  style={{
                    fontFamily: 'var(--font-montserrat), "Montserrat", sans-serif',
                    fontWeight: 600,
                    ...(effectiveFontColor ? { color: effectiveFontColor } : {}),
                  }}
                >
                  Couples For Christ • Tuy Chapter
                </p>
              </div>
            ) : !showChords && !activeLyricLines.every((l) => l.isChordOnly) ? (
              /* CLEAN LYRICS WHEN CHORDS ARE OFF */
              <div className={`space-y-2 sm:space-y-3 md:space-y-4 w-full max-w-6xl mx-auto flex flex-col ${
                textAlign === 'left' ? 'items-start text-left' : textAlign === 'right' ? 'items-end text-right' : 'items-center text-center'
              }`}>
                {activeLyricLines.map((line, lIdx) => (
                  <p
                    key={lIdx}
                    className={`font-montserrat font-bold ${
                      effectiveFontColor ? '' : themeClasses.lyricText
                    } ${
                      textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'
                    } leading-snug tracking-normal w-full px-2 transition-all`}
                    style={{
                      fontSize: `${dynamicLyricFontSize}rem`,
                      lineHeight: 1.25,
                      fontFamily: 'var(--font-montserrat), "Montserrat", sans-serif',
                      fontWeight: 700,
                      ...(effectiveFontColor ? { color: effectiveFontColor } : {}),
                      textShadow: showBgVideo && activeBgVideo
                        ? '0 3px 18px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,0.9)'
                        : '0 2px 10px rgba(0,0,0,0.2)',
                    }}
                  >
                    {line.cleanLyricText}
                  </p>
                ))}
              </div>
            ) : (
              /* LYRICS WITH CHORDS ABOVE WHEN CHORDS ARE ON (OR PURE CHORD INTRO/INTERLUDE) */
              <div className={`space-y-2.5 sm:space-y-4 w-full max-w-6xl mx-auto flex flex-col ${
                textAlign === 'left' ? 'items-start text-left' : textAlign === 'right' ? 'items-end text-right' : 'items-center text-center'
              }`}>
                {activeLyricLines.map((line, lIdx) => (
                  <div
                    key={lIdx}
                    className={`flex flex-wrap items-end ${
                      textAlign === 'left' ? 'justify-start text-left' : textAlign === 'right' ? 'justify-end text-right' : 'justify-center text-center'
                    } leading-tight w-full`}
                  >
                    {line.isChordOnly ? (
                      <div
                        className={`font-mono font-extrabold ${themeClasses.chordText} bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-2xl tracking-widest shadow-xs my-0.5 inline-flex items-center justify-center gap-3 mx-auto`}
                        style={{
                          fontSize: `${dynamicLyricFontSize * 0.7}rem`,
                          lineHeight: 1.2,
                        }}
                      >
                        {line.rawChordLine || line.segments.map((s) => s.chord).filter(Boolean).join('   ')}
                      </div>
                    ) : line.words && line.words.length > 0 ? (
                      line.words.map((word, wIdx) => {
                        if (word.isSpace) {
                          return (
                            <span
                              key={wIdx}
                              className="inline-block whitespace-pre"
                              style={{ width: `${dynamicLyricFontSize * 0.28}rem` }}
                            >
                              {' '}
                            </span>
                          );
                        }

                        return (
                          <span key={wIdx} className="inline-flex flex-nowrap items-end select-text">
                            {word.segments.map((seg, sIdx) => (
                              <span key={sIdx} className="inline-flex flex-col items-center">
                                {seg.chord ? (
                                  <span
                                    className={`font-mono font-black ${themeClasses.chordText} tracking-wider transition-all select-none mb-0.5 opacity-95 text-center px-0.5`}
                                    style={{
                                      fontSize: `${Math.max(0.75, dynamicLyricFontSize * 0.52)}rem`,
                                      lineHeight: 1.0,
                                    }}
                                  >
                                    {seg.chord}
                                  </span>
                                ) : (
                                  <span
                                    className="inline-block"
                                    style={{
                                      height: `${Math.max(0.75, dynamicLyricFontSize * 0.52)}rem`,
                                    }}
                                  />
                                )}
                                <span
                                  className={`font-montserrat font-bold ${
                                    effectiveFontColor ? '' : themeClasses.lyricText
                                  } transition-all tracking-normal leading-snug whitespace-pre`}
                                  style={{
                                    fontSize: `${dynamicLyricFontSize}rem`,
                                    lineHeight: 1.25,
                                    fontFamily: 'var(--font-montserrat), "Montserrat", sans-serif',
                                    fontWeight: 700,
                                    ...(effectiveFontColor ? { color: effectiveFontColor } : {}),
                                    textShadow: showBgVideo && activeBgVideo
                                      ? '0 3px 18px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,0.9)'
                                      : '0 2px 10px rgba(0,0,0,0.2)',
                                  }}
                                >
                                  {seg.text || '\u00A0'}
                                </span>
                              </span>
                            ))}
                          </span>
                        );
                      })
                    ) : (
                      line.segments.map((seg, sIdx) => (
                        <div
                          key={sIdx}
                          className="inline-flex flex-col items-center justify-end"
                        >
                          {seg.chord ? (
                            <span
                              className={`font-mono font-black ${themeClasses.chordText} tracking-wider transition-all select-none mb-0.5 opacity-95 text-center px-0.5`}
                              style={{
                                fontSize: `${Math.max(0.75, dynamicLyricFontSize * 0.52)}rem`,
                                lineHeight: 1.0,
                              }}
                            >
                              {seg.chord}
                            </span>
                          ) : (
                            <span
                              className="inline-block"
                              style={{
                                height: `${Math.max(0.75, dynamicLyricFontSize * 0.52)}rem`,
                              }}
                            />
                          )}
                          <span
                            className={`font-montserrat font-bold ${
                              effectiveFontColor ? '' : themeClasses.lyricText
                            } transition-all tracking-normal leading-snug whitespace-pre`}
                            style={{
                              fontSize: `${dynamicLyricFontSize}rem`,
                              lineHeight: 1.25,
                              fontFamily: 'var(--font-montserrat), "Montserrat", sans-serif',
                              fontWeight: 700,
                              ...(effectiveFontColor ? { color: effectiveFontColor } : {}),
                              textShadow: showBgVideo && activeBgVideo
                                ? '0 3px 18px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,0.9)'
                                : '0 2px 10px rgba(0,0,0,0.2)',
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
            {/* "Up Next: [Song Title]" Banner on Last Slide of Song */}
            {isLastSlideOfCurrentSong && nextSongTitle && (
              <div className="pt-3 flex items-center justify-center animate-pulse">
                <button
                  type="button"
                  onClick={goToNextSong}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-500 text-xs sm:text-sm font-bold shadow-2xs hover:bg-amber-500/25 transition-all"
                  title="Click or hit Next/Space to advance to next song"
                >
                  <span>Up Next:</span>
                  <strong className="underline underline-offset-2">{nextSongTitle}</strong>
                  <span>→</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={`${themeClasses.subText} text-lg`}>No slides available for this song or playlist.</div>
        )}

        {/* =================================================================== */}
        {/* LOWER RIGHT NAVIGATION CONTROLS (PROJECTOR OPERATOR DOCK)          */}
        {/* =================================================================== */}
        {slides.length > 1 && (
          <div className={`fixed bottom-16 sm:bottom-20 right-4 sm:right-8 z-30 flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl ${themeClasses.headerBg} border shadow-2xl backdrop-blur-md transition-all`}>
            {/* Previous Song (if multi-song playlist) */}
            {activeSongInfo.totalSongs > 1 && (
              <button
                type="button"
                onClick={goToPrevSong}
                disabled={activeSongInfo.songIndex === 0 && isFirstSlideOfCurrentSong}
                className={`px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl border transition-all flex items-center gap-1 text-xs font-bold ${
                  activeSongInfo.songIndex === 0 && isFirstSlideOfCurrentSong ? themeClasses.navBtnDisabled : themeClasses.btnBg
                }`}
                title="Jump to Previous Song (P or Shift+Left)"
              >
                <SkipBack className="w-4 h-4" />
                <span className="hidden md:inline text-[11px]">Prev Song</span>
              </button>
            )}

            {/* Previous Slide Button */}
            <button
              type="button"
              onClick={goToPrevSlide}
              disabled={currentSlideIndex === 0}
              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                currentSlideIndex === 0 ? themeClasses.navBtnDisabled : themeClasses.btnBg
              }`}
              title="Previous Slide (Left Arrow / Up / PageUp)"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Slide Index Badge */}
            <div className={`px-2.5 py-1 rounded-xl ${themeClasses.btnBg} text-[11px] font-mono font-bold flex items-center gap-1 opacity-80`}>
              <span>{currentSlideIndex + 1}</span>
              <span className="opacity-40">/</span>
              <span>{slides.length}</span>
            </div>

            {/* Next Slide Button */}
            <button
              type="button"
              onClick={goToNextSlide}
              disabled={currentSlideIndex === slides.length - 1}
              className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs sm:text-sm font-black ${
                currentSlideIndex === slides.length - 1
                  ? themeClasses.navBtnDisabled
                  : `${themeClasses.btnActive} shadow-lg active:scale-95 hover:scale-105`
              }`}
              title="Next Slide (Right Arrow / Space / Down / PageDown)"
            >
              <span>{isLastSlideOfCurrentSong && nextSongTitle ? `Next: ${String(nextSongTitle).substring(0, 10)}..` : 'Next Slide'}</span>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Next Song Button (if multi-song playlist) */}
            {activeSongInfo.totalSongs > 1 && (
              <button
                type="button"
                onClick={goToNextSong}
                disabled={activeSongInfo.songIndex >= activeSongInfo.totalSongs - 1}
                className={`px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl border transition-all flex items-center gap-1 text-xs font-bold ${
                  activeSongInfo.songIndex >= activeSongInfo.totalSongs - 1
                    ? themeClasses.navBtnDisabled
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500 shadow-md active:scale-95'
                }`}
                title={`Jump to Next Song: ${nextSongTitle || 'End'} (N or Shift+Right)`}
              >
                <span className="hidden md:inline text-[11px] font-black">Next Song</span>
                <SkipForward className="w-4 h-4" />
              </button>
            )}
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
              {slide.totalSongsInPlaylist > 1 ? `${String(slide.songTitle || 'Song').substring(0, 8)}..: ${slide.title || 'Slide'}` : (slide.title || `Slide ${idx + 1}`)}
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

export default function SongPresentationModal(props: SongPresentationModalProps) {
  if (!props.isOpen) return null;
  return (
    <PresentationErrorBoundary onClose={props.onClose}>
      <SongPresentationModalContent {...props} />
    </PresentationErrorBoundary>
  );
}
