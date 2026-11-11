'use client';

import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import {
  transposeChord,
  transposeSongContent,
  getChordShape,
} from '@/lib/music/guitarChords';
import { parseChordProLine, extractCleanLyricsFromChords } from '@/lib/music/chordPro';
import GuitarChordDiagram from './GuitarChordDiagram';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Type,
  ZoomIn,
  ZoomOut,
  X,
  Music,
  ChevronUp,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileText,
  Guitar,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface InteractiveChordSheetProps {
  content: string;
  lyricsOnly?: string;
  songTitle?: string;
  originalKey?: string;
  fontSize?: number;
  className?: string;
  initialShowLyricsOnly?: boolean;
}

export default function InteractiveChordSheet({
  content,
  lyricsOnly,
  songTitle,
  originalKey = 'G',
  fontSize: initialFontSize = 15,
  className = '',
  initialShowLyricsOnly = false,
}: InteractiveChordSheetProps) {
  const switchId = useId();
  // Mode switch: false = Lyrics with Chords, true = Lyrics Only
  const [showLyricsOnly, setShowLyricsOnly] = useState<boolean>(initialShowLyricsOnly);
  const [isSheetFullscreen, setIsSheetFullscreen] = useState<boolean>(false);

  // Sync when initialShowLyricsOnly prop changes (e.g. from editor mode switch)
  useEffect(() => {
    setShowLyricsOnly(initialShowLyricsOnly);
  }, [initialShowLyricsOnly]);

  // Load input-switch-polyfill if native HTML switch attribute is not supported
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof HTMLInputElement !== 'undefined') {
      if (!('switch' in HTMLInputElement.prototype)) {
        import('input-switch-polyfill').catch(() => {});
      }
    }
  }, []);

  // Transposition & Capo
  const [transposeOffset, setTransposeOffset] = useState<number>(0);
  const [capoFret, setCapoFret] = useState<number>(0);

  // Font size & Alignment
  const [fontSize, setFontSize] = useState<number>(initialFontSize);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // Container & Scroll references
  const sheetContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1); // 0.5x to 2x
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isAutoScrollingRef = useRef(isAutoScrolling);
  const scrollSpeedRef = useRef(scrollSpeed);
  const accumulatedScrollRef = useRef<number>(0);

  useEffect(() => {
    isAutoScrollingRef.current = isAutoScrolling;
  }, [isAutoScrolling]);

  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  // Active Chord Popover
  const [inspectedChord, setInspectedChord] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  // Transposed Content
  const transposedContent = useMemo(() => {
    return transposeSongContent(content, transposeOffset);
  }, [content, transposeOffset]);

  // Effective Lyrics-Only Content (uses separate lyricsOnly field if provided, else strips chords from content)
  const effectiveLyricsOnlyContent = useMemo(() => {
    if (lyricsOnly && lyricsOnly.trim()) {
      return lyricsOnly.trim();
    }
    return extractCleanLyricsFromChords(content, songTitle);
  }, [lyricsOnly, content, songTitle]);

  // Monitor fullscreen state
  useEffect(() => {
    const handleFs = () => {
      setIsSheetFullscreen(Boolean(document.fullscreenElement && sheetContainerRef.current && document.fullscreenElement === sheetContainerRef.current));
    };
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const toggleSheetFullscreen = () => {
    if (!sheetContainerRef.current || typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      sheetContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsSheetFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsSheetFullscreen(false);
    }
  };

  // Current Transposed Key
  const currentKey = useMemo(() => {
    return transposeChord(originalKey, transposeOffset);
  }, [originalKey, transposeOffset]);

  // Helper: Find active scrolling ancestor (modal container or window)
  const getScrollTarget = (el: HTMLElement | null): HTMLElement | Window => {
    if (!el || typeof window === 'undefined') return window;
    let parent = el.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        parent.scrollHeight > parent.clientHeight
      ) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return window;
  };

  // Extract all unique chords present in the transposed song
  const uniqueChords = useMemo(() => {
    const chordsFound = new Set<string>();

    // 1. Bracket notation [G]
    const bracketMatches = transposedContent.matchAll(/\[([A-G][#b]?[^\]]*)\]/g);
    for (const match of bracketMatches) {
      const c = match[1].trim();
      if (
        c &&
        !c.toLowerCase().includes('verse') &&
        !c.toLowerCase().includes('chorus') &&
        !c.toLowerCase().includes('bridge') &&
        !c.toLowerCase().includes('intro')
      ) {
        chordsFound.add(c);
      }
    }

    // 2. Standalone chord line tokens
    const lines = transposedContent.split('\n');
    lines.forEach((line) => {
      if (isChordLine(line)) {
        line.split(/\s+/).forEach((token) => {
          const clean = token.replace(/[^A-Ga-g#0-9/]/g, '');
          if (clean && getChordShape(clean)) {
            chordsFound.add(clean);
          }
        });
      }
    });

    return Array.from(chordsFound);
  }, [transposedContent]);

  // Auto-scroll logic powered by requestAnimationFrame for jitter-free 60/120fps scrolling on mobile & tablet
  useEffect(() => {
    if (!isAutoScrolling) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      accumulatedScrollRef.current = 0;
      return;
    }

    // CRITICAL: Temporarily override CSS 'scroll-behavior: smooth' on html/body.
    // If scroll-behavior: smooth is active in CSS, high-frequency frame scrolling
    // gets interrupted and cancelled by the browser animation engine, causing auto-scroll to stall!
    const htmlEl = typeof document !== 'undefined' ? document.documentElement : null;
    const bodyEl = typeof document !== 'undefined' ? document.body : null;
    const prevHtmlBehavior = htmlEl ? htmlEl.style.scrollBehavior : '';
    const prevBodyBehavior = bodyEl ? bodyEl.style.scrollBehavior : '';
    if (htmlEl) htmlEl.style.scrollBehavior = 'auto';
    if (bodyEl) bodyEl.style.scrollBehavior = 'auto';

    lastTimeRef.current = performance.now();
    accumulatedScrollRef.current = 0;

    const scrollStep = (now: number) => {
      if (!isAutoScrollingRef.current) return;

      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Base speed: 40px per second at 1.0x multiplier
      if (deltaMs > 0 && deltaMs < 200) {
        const movePx = (40 * scrollSpeedRef.current * deltaMs) / 1000;
        accumulatedScrollRef.current += movePx;

        // Perform integer scroll whenever accumulated subpixels reach >= 1px
        if (accumulatedScrollRef.current >= 1) {
          const step = Math.floor(accumulatedScrollRef.current);
          accumulatedScrollRef.current -= step;

          const target = getScrollTarget(sheetContainerRef.current);

          if (target === window) {
            const scrollingEl = document.scrollingElement || document.documentElement || document.body;
            const currentY = window.scrollY || window.pageYOffset || scrollingEl?.scrollTop || 0;
            const totalHeight = Math.max(
              document.body?.scrollHeight || 0,
              document.documentElement?.scrollHeight || 0,
              scrollingEl?.scrollHeight || 0
            );
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
            const maxScroll = totalHeight - viewportHeight;

            // Stop auto-scroll when reaching the very bottom of the document
            if (maxScroll > 20 && currentY >= maxScroll - 4) {
              setIsAutoScrolling(false);
              return;
            }

            // Scroll window with instant behavior
            window.scrollBy({ top: step, left: 0, behavior: 'instant' as ScrollBehavior });

            // Direct fallback: if window scroll position did not advance, increment scrollingElement
            const updatedY = window.scrollY || window.pageYOffset || scrollingEl?.scrollTop || 0;
            if (updatedY === currentY && scrollingEl) {
              scrollingEl.scrollTop = currentY + step;
            }
          } else {
            const el = target as HTMLElement;
            const maxScroll = el.scrollHeight - el.clientHeight;
            if (maxScroll > 20 && el.scrollTop >= maxScroll - 4) {
              setIsAutoScrolling(false);
              return;
            }
            el.scrollTop += step;
          }
        }
      }

      rafRef.current = requestAnimationFrame(scrollStep);
    };

    rafRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      accumulatedScrollRef.current = 0;
      if (htmlEl) htmlEl.style.scrollBehavior = prevHtmlBehavior;
      if (bodyEl) bodyEl.style.scrollBehavior = prevBodyBehavior;
    };
  }, [isAutoScrolling]);

  // Helper: Detect if a line is a pure Chord line (e.g. "G   C   D   Em")
  function isChordLine(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('[') || trimmed.startsWith('{')) return false;

    const tokens = trimmed.split(/\s+/);
    if (!tokens.length) return false;

    // Strict chord token matching: chords must start with uppercase [A-G] note
    const chordPattern = /^[A-G][#b]?(m|min|maj|dim|aug|sus|add)?[0-9]*(?:(\/|\/b|\/#)[A-G][#b]?)?$/;

    let validCount = 0;
    tokens.forEach((t) => {
      const clean = t.replace(/^[()[\].,;:]+|[()[\].,;:]+$/g, '');
      if (!clean) return;
      if (getChordShape(clean) || chordPattern.test(clean)) {
        validCount++;
      }
    });

    return validCount / tokens.length >= 0.65;
  }

  // Handle clicking a chord in the sheet
  const handleChordClick = (chordName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverPos({
      x: Math.min(rect.left, window.innerWidth - 180),
      y: rect.bottom + window.scrollY + 6,
    });
    setInspectedChord(chordName);
  };

  // Close popover when clicking anywhere else
  useEffect(() => {
    const handleClickOutside = () => {
      setInspectedChord(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  /**
   * Render a line of ChordPro formatted text:
   * e.g. "{comment: Verse 1}", "[C#m] [A] [E] [B] (x2)", or "My [E]hope is built in [G#m]You Lord"
   * Displays guitar chords ON TOP of their corresponding lyrics, not beside.
   */
  const renderChordProLine = (line: string, lineIndex: number) => {
    const parsed = parseChordProLine(line);

    if (parsed.type === 'empty') {
      return <div key={lineIndex} className="h-4" />;
    }

    if (parsed.type === 'end_directive') {
      return null;
    }

    // Section Headers: {comment: Intro}, [Verse 1], Chorus, etc.
    if (parsed.type === 'section') {
      return (
        <div
          key={lineIndex}
          className="pt-5 pb-2 font-black text-xs uppercase tracking-wider text-[#243c81] flex items-center gap-2 select-none"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-2xs"></span>
          <span>{parsed.title}</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      );
    }

    // Pure Chord Progressions: e.g. "[C#m] [A] [E] [B] (x2)"
    if (parsed.type === 'chord_progression') {
      return (
        <div
          key={lineIndex}
          className={`py-2 flex flex-wrap items-center gap-2.5 ${
            textAlign === 'center'
              ? 'justify-center'
              : textAlign === 'right'
              ? 'justify-end'
              : 'justify-start'
          }`}
          style={{ fontSize }}
        >
          {parsed.items.map((item, i) => {
            if (item.isChord) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => handleChordClick(item.value, e)}
                  className="font-mono font-black text-blue-700 bg-blue-50/90 hover:bg-amber-100 hover:text-amber-900 border border-blue-200/80 hover:border-amber-400 px-2.5 py-1 rounded-lg cursor-pointer select-none transition-all shadow-2xs hover:scale-105 active:scale-95 inline-flex items-center text-[0.88em]"
                  title={`Click to view ${item.value} guitar chord diagram`}
                >
                  {item.value}
                </button>
              );
            }
            return (
              <span key={i} className="font-sans font-bold text-slate-500 text-xs px-1">
                {item.value}
              </span>
            );
          })}
        </div>
      );
    }

    // Pure Lyrics or comments
    if (parsed.type === 'lyrics_only') {
      return (
        <div
          key={lineIndex}
          className={`leading-relaxed text-slate-800 font-sans py-0.5 ${
            textAlign === 'center'
              ? 'text-center'
              : textAlign === 'right'
              ? 'text-right'
              : 'text-left'
          }`}
          style={{ fontSize }}
        >
          {parsed.text}
        </div>
      );
    }

    // Chords and Lyrics: guitar chords placed directly ON TOP of the lyrics
    return (
      <div
        key={lineIndex}
        className={`flex flex-wrap items-end py-1 font-sans ${
          textAlign === 'center'
            ? 'justify-center text-center'
            : textAlign === 'right'
            ? 'justify-end text-right'
            : 'justify-start text-left'
        }`}
        style={{ fontSize }}
      >
        {parsed.words.map((word, wIdx) => {
          if (word.isSpace) {
            return (
              <span
                key={wIdx}
                className="inline-block whitespace-pre select-text"
                style={{ width: '0.35em' }}
              >
                {' '}
              </span>
            );
          }

          return (
            <span key={wIdx} className="inline-flex flex-nowrap items-end select-text">
              {word.segments.map((seg, sIdx) => (
                <span key={sIdx} className="inline-flex flex-col items-start">
                  {seg.chord ? (
                    <span
                      onClick={(e) => handleChordClick(seg.chord!, e)}
                      className="font-mono font-black text-blue-700 bg-blue-50/90 hover:bg-amber-100 hover:text-amber-900 border border-blue-200/80 hover:border-amber-400 px-1.5 py-0.5 rounded text-[0.82em] leading-none mb-1 cursor-pointer select-none transition-all shadow-2xs hover:scale-105 active:scale-95 inline-flex items-center"
                      title={`Click to view ${seg.chord} guitar chord diagram`}
                    >
                      {seg.chord}
                    </span>
                  ) : (
                    <span
                      className="h-[1.4em] mb-1 block select-none pointer-events-none"
                      aria-hidden="true"
                    >
                      {'\u00A0'}
                    </span>
                  )}
                  <span className="text-slate-800 font-sans whitespace-pre leading-normal">
                    {seg.text || '\u00A0'}
                  </span>
                </span>
              ))}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={sheetContainerRef}
      className={`flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden ${
        isSheetFullscreen ? 'fixed inset-0 z-50 rounded-none border-none overflow-y-auto' : ''
      } ${className}`}
    >
      {/* =================================================================== */}
      {/* MUSICAL CONTROLS BAR (Hidden in Fullscreen so only lyrics display)  */}
      {/* =================================================================== */}
      {!isSheetFullscreen && (
        <div className="p-3 sm:p-3.5 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 text-xs sticky top-0 z-20 shadow-xs">
          {/* Left: Switch between Lyrics with Chords and Lyrics Only + Transposer */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Switch: Lyrics with Chords vs Lyrics Only */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <Guitar className={`w-3.5 h-3.5 transition-colors ${!showLyricsOnly ? 'text-amber-400' : 'text-slate-400'}`} />
              <span
                onClick={() => setShowLyricsOnly(false)}
                className={`cursor-pointer font-bold transition-colors ${!showLyricsOnly ? 'text-amber-300 font-black' : 'text-slate-400 hover:text-white'}`}
              >
                With Chords
              </span>
              <label htmlFor={switchId} className="inline-flex items-center cursor-pointer mx-0.5" title="Switch between Lyrics with Chords and Lyrics Only">
                <span className="sr-only">Switch to Lyrics Only</span>
                <input
                  id={switchId}
                  type="checkbox"
                  {...({ switch: '' } as any)}
                  checked={showLyricsOnly}
                  onChange={(e) => setShowLyricsOnly(e.target.checked)}
                  style={{ accentColor: '#fbbf24', margin: 0, cursor: 'pointer' }}
                  className="w-8 h-4 rounded-full cursor-pointer accent-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-2"
                />
              </label>
              <span
                onClick={() => setShowLyricsOnly(true)}
                className={`cursor-pointer font-bold transition-colors ${showLyricsOnly ? 'text-amber-300 font-black' : 'text-slate-400 hover:text-white'}`}
              >
                Lyrics Only
              </span>
              <FileText className={`w-3.5 h-3.5 transition-colors ${showLyricsOnly ? 'text-amber-400' : 'text-slate-400'}`} />
            </div>

            {!showLyricsOnly && (
              <>
                <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setTransposeOffset((p) => p - 1)}
                    className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 text-white font-black flex items-center justify-center transition-all active:scale-90"
                    title="Transpose down 1 semitone (-1)"
                  >
                    -1
                  </button>

                  <div className="px-3 text-center min-w-[90px]">
                    <span className="text-[10px] text-amber-300 font-bold uppercase block leading-none">
                      Key
                    </span>
                    <span className="font-extrabold text-sm text-white">
                      {currentKey}
                      {transposeOffset !== 0 && (
                        <span className="text-[10px] text-blue-200 ml-1">
                          ({transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset})
                        </span>
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTransposeOffset((p) => p + 1)}
                    className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 text-white font-black flex items-center justify-center transition-all active:scale-90"
                    title="Transpose up 1 semitone (+1)"
                  >
                    +1
                  </button>
                </div>

                {transposeOffset !== 0 && (
                  <button
                    type="button"
                    onClick={() => setTransposeOffset(0)}
                    className="text-[10px] font-bold text-slate-300 hover:text-white underline px-1"
                    title="Reset to original key"
                  >
                    Reset
                  </button>
                )}
              </>
            )}
          </div>

          {/* Middle: Capo Selector (Only in Chords mode) */}
          {!showLyricsOnly && (
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-slate-300 uppercase">Capo:</span>
              <select
                value={capoFret}
                onChange={(e) => setCapoFret(Number(e.target.value))}
                className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
              >
                <option value={0} className="text-slate-900 bg-white">No Capo</option>
                <option value={1} className="text-slate-900 bg-white">Capo 1st Fret</option>
                <option value={2} className="text-slate-900 bg-white">Capo 2nd Fret</option>
                <option value={3} className="text-slate-900 bg-white">Capo 3rd Fret</option>
                <option value={4} className="text-slate-900 bg-white">Capo 4th Fret</option>
                <option value={5} className="text-slate-900 bg-white">Capo 5th Fret</option>
                <option value={6} className="text-slate-900 bg-white">Capo 6th Fret</option>
                <option value={7} className="text-slate-900 bg-white">Capo 7th Fret</option>
              </select>
            </div>
          )}

          {/* Right: Hands-free Auto-Scroll & Font Size Controls */}
          <div className="flex items-center gap-2">
            {/* Text Alignment Selector */}
            <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setTextAlign('left')}
                className={`p-1.5 rounded-lg transition-all ${
                  textAlign === 'left' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTextAlign('center')}
                className={`p-1.5 rounded-lg transition-all ${
                  textAlign === 'center' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTextAlign('right')}
                className={`p-1.5 rounded-lg transition-all ${
                  textAlign === 'right' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Font Resizer */}
            <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setFontSize((p) => Math.max(p - 1, 12))}
                className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white"
                title="Decrease Font Size"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] font-bold text-white">{fontSize}px</span>
              <button
                type="button"
                onClick={() => setFontSize((p) => Math.min(p + 1, 28))}
                className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white"
                title="Increase Font Size"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auto Scroll Button */}
            <div className="flex items-center gap-1 bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl font-black text-xs shadow-md">
              <button
                type="button"
                onClick={() => setIsAutoScrolling((p) => !p)}
                className="flex items-center gap-1.5 active:scale-95"
                title="Hands-free auto-scrolling for guitarists"
              >
                {isAutoScrolling ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Scroll</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Auto-Scroll</span>
                  </>
                )}
              </button>

              {isAutoScrolling && (
                <select
                  value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(Number(e.target.value))}
                  className="bg-black/10 rounded-md font-bold text-[10px] ml-1 px-1 py-0.5 focus:outline-hidden cursor-pointer"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1.0x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2.0x</option>
                </select>
              )}
            </div>

            {/* Fullscreen Pure Display Button */}
            <button
              type="button"
              onClick={toggleSheetFullscreen}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all"
              title="Fullscreen Lyrics Display"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* QUICK CHORD BAR (All chords in this song with preview diagrams)     */}
      {/* =================================================================== */}
      {!isSheetFullscreen && !showLyricsOnly && uniqueChords.length > 0 && (
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-black uppercase text-slate-400 shrink-0 flex items-center gap-1">
            <Music className="w-3 h-3 text-[#243c81]" />
            <span>Chords Used ({uniqueChords.length}):</span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {uniqueChords.map((chord) => (
              <button
                key={chord}
                type="button"
                onClick={(e) => handleChordClick(chord, e)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-black font-mono text-[#243c81] hover:border-amber-500 hover:bg-amber-50 hover:text-amber-900 transition-all shadow-2xs active:scale-95 flex items-center gap-1"
                title={`Click to view ${chord} guitar chord diagram`}
              >
                <span>{chord}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SONG SHEET BODY: CHORDS & LYRICS OR LYRICS ONLY                    */}
      {/* =================================================================== */}
      <div className={`p-6 sm:p-8 bg-white overflow-x-auto min-h-[400px] flex-1 ${
        textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left'
      }`}>
        {showLyricsOnly ? (
          effectiveLyricsOnlyContent.split('\n').map((line, idx) => renderChordProLine(line.replace(/\[[A-G][#b]?[^\]]*\]/g, ''), idx))
        ) : (
          transposedContent.split('\n').map((line, idx) => renderChordProLine(line, idx))
        )}
      </div>

      {/* =================================================================== */}
      {/* FLOATING GUITAR CHORD POPOVER (Diagram Box on click)                 */}
      {/* =================================================================== */}
      {inspectedChord && popoverPos && (
        <div
          style={{
            position: 'absolute',
            left: popoverPos.x,
            top: popoverPos.y,
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
          className="animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="relative">
            <GuitarChordDiagram chord={inspectedChord} size="md" />
            <button
              type="button"
              onClick={() => setInspectedChord(null)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-rose-600 shadow-md text-xs font-bold"
              title="Close Diagram"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING HANDS-FREE AUTO-SCROLL PILL (Optimized for Mobile/Tablet) */}
      {/* =================================================================== */}
      {isAutoScrolling && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex items-center gap-1.5 p-1.5 sm:p-2 rounded-2xl bg-slate-950/95 text-white shadow-2xl border border-amber-400/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 select-none">
          <button
            type="button"
            onClick={() => setIsAutoScrolling(false)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs active:scale-95 transition-all shadow-sm cursor-pointer"
            title="Pause Hands-Free Scroll"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Pause</span>
          </button>

          <div className="flex items-center bg-white/10 rounded-xl px-2 py-1 text-xs">
            <span className="text-[10px] text-amber-300 font-bold mr-1 hidden sm:inline">Speed:</span>
            <select
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
              aria-label="Scroll speed"
            >
              <option value={0.5} className="text-slate-900 bg-white">0.5x Slow</option>
              <option value={0.75} className="text-slate-900 bg-white">0.75x</option>
              <option value={1} className="text-slate-900 bg-white">1.0x Normal</option>
              <option value={1.25} className="text-slate-900 bg-white">1.25x</option>
              <option value={1.5} className="text-slate-900 bg-white">1.5x Fast</option>
              <option value={2} className="text-slate-900 bg-white">2.0x Fast</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              const target = getScrollTarget(sheetContainerRef.current);
              if (target === window) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                (target as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
            title="Scroll back to top"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
