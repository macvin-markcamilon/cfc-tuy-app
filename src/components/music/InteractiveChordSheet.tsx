'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  transposeChord,
  transposeSongContent,
  getChordShape,
} from '@/lib/music/guitarChords';
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
} from 'lucide-react';

interface InteractiveChordSheetProps {
  content: string;
  originalKey?: string;
  fontSize?: number;
  className?: string;
}

export default function InteractiveChordSheet({
  content,
  originalKey = 'G',
  fontSize: initialFontSize = 15,
  className = '',
}: InteractiveChordSheetProps) {
  // Transposition & Capo
  const [transposeOffset, setTransposeOffset] = useState<number>(0);
  const [capoFret, setCapoFret] = useState<number>(0);

  // Font size & Alignment
  const [fontSize, setFontSize] = useState<number>(initialFontSize);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // Auto-scroll
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1); // 1 = normal, 2 = fast, 0.5 = slow
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Active Chord Popover
  const [inspectedChord, setInspectedChord] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  // Transposed Content
  const transposedContent = useMemo(() => {
    return transposeSongContent(content, transposeOffset);
  }, [content, transposeOffset]);

  // Current Transposed Key
  const currentKey = useMemo(() => {
    return transposeChord(originalKey, transposeOffset);
  }, [originalKey, transposeOffset]);

  // Extract all unique chords present in the transposed song
  const uniqueChords = useMemo(() => {
    const chordsFound = new Set<string>();

    // 1. Bracket notation [G]
    const bracketMatches = transposedContent.matchAll(/\[([A-G][#b]?[^\]]*)\]/g);
    for (const match of bracketMatches) {
      const c = match[1].trim();
      if (c && !c.toLowerCase().includes('verse') && !c.toLowerCase().includes('chorus') && !c.toLowerCase().includes('bridge') && !c.toLowerCase().includes('intro')) {
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

  // Auto-scroll logic
  useEffect(() => {
    if (isAutoScrolling) {
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy({
          top: scrollSpeed * 1.5,
          behavior: 'smooth',
        });
      }, 50);
    } else if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, scrollSpeed]);

  // Helper: Detect if a line is a pure Chord line (e.g. "G   C   D   Em")
  function isChordLine(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('[') || trimmed.startsWith('{')) return false;

    const tokens = trimmed.split(/\s+/);
    if (!tokens.length) return false;

    // A chord line has mostly recognized chords
    let validCount = 0;
    tokens.forEach((t) => {
      const c = t.replace(/[^A-Ga-g#0-9/]/g, '');
      if (getChordShape(c) || /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13|\/)*$/i.test(c)) {
        validCount++;
      }
    });

    return validCount / tokens.length >= 0.7;
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
   * e.g. "[G]The light of [C]Christ has [D]come into the [G]world"
   */
  const renderChordProLine = (line: string, lineIndex: number) => {
    const trimmed = line.trim();

    // Section Headers: [Verse 1], [Chorus], [Bridge], [Intro]
    if (
      trimmed.startsWith('[') &&
      trimmed.endsWith(']') &&
      (trimmed.toLowerCase().includes('verse') ||
        trimmed.toLowerCase().includes('chorus') ||
        trimmed.toLowerCase().includes('bridge') ||
        trimmed.toLowerCase().includes('intro') ||
        trimmed.toLowerCase().includes('outro') ||
        trimmed.toLowerCase().includes('refrain') ||
        trimmed.toLowerCase().includes('interlude'))
    ) {
      return (
        <div key={lineIndex} className="pt-4 pb-1.5 font-black text-xs uppercase tracking-wider text-[#243c81] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>{trimmed.replace(/^\[|\]$/g, '')}</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      );
    }

    // Split line into chords and lyrics tokens
    const parts = line.split(/(\[[A-G][#b]?[^\]]*\])/g);
    if (parts.length === 1 && !line.includes('[')) {
      // Just lyrics or comments
      return (
        <div key={lineIndex} className="leading-relaxed text-slate-800 font-sans py-0.5" style={{ fontSize }}>
          {line || '\u00A0'}
        </div>
      );
    }

    return (
      <div key={lineIndex} className="flex flex-wrap items-end py-1 font-sans" style={{ fontSize }}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            const chord = part.slice(1, -1);
            return (
              <span
                key={pIdx}
                onClick={(e) => handleChordClick(chord, e)}
                className="font-mono font-black text-blue-700 bg-blue-50/80 hover:bg-amber-100 hover:text-amber-900 border border-blue-200/80 hover:border-amber-400 px-1.5 py-0.2 rounded-md mx-0.5 cursor-pointer select-none transition-all shadow-2xs hover:scale-105 active:scale-95 inline-flex items-center text-[0.88em]"
                title={`Click to view ${chord} guitar chord diagram`}
              >
                {chord}
              </span>
            );
          }
          return (
            <span key={pIdx} className="text-slate-800 whitespace-pre">
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* =================================================================== */}
      {/* MUSICAL CONTROLS BAR (Ultimate Guitar Toolbar)                      */}
      {/* =================================================================== */}
      <div className="p-3.5 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Transposer */}
        <div className="flex items-center gap-2">
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
        </div>

        {/* Middle: Capo Selector */}
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
              onClick={() => setFontSize((p) => Math.min(p + 1, 24))}
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
                className="bg-black/10 rounded-md font-bold text-[10px] ml-1 px-1 py-0.5 focus:outline-hidden"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1.0x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2.0x</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* QUICK CHORD BAR (All chords in this song with preview diagrams)     */}
      {/* =================================================================== */}
      {uniqueChords.length > 0 && (
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
      {/* SONG SHEET BODY: CHORDS & LYRICS                                   */}
      {/* =================================================================== */}
      <div className={`p-6 sm:p-8 bg-white overflow-x-auto min-h-[400px] ${
        textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left'
      }`}>
        {transposedContent.split('\n').map((line, idx) => renderChordProLine(line, idx))}
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
    </div>
  );
}
