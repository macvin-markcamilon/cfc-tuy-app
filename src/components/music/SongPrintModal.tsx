'use client';

import React, { useState, useMemo } from 'react';
import { WorshipSong } from '@/lib/data/songs-service';
import {
  transposeChord,
  transposeSongContent,
  getChordShape,
} from '@/lib/music/guitarChords';
import {
  Printer,
  X,
  FileText,
  Guitar,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export type PrintMode = 'chords-and-lyrics' | 'lyrics-only';

interface SongPrintModalProps {
  isOpen: boolean;
  song: WorshipSong | null;
  initialKey?: string;
  onClose: () => void;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function SongPrintModal({
  isOpen,
  song,
  initialKey,
  onClose,
}: SongPrintModalProps) {
  const [printMode, setPrintMode] = useState<PrintMode>('chords-and-lyrics');
  const [transposeOffset, setTransposeOffset] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(14);
  const [columnLayout, setColumnLayout] = useState<'1' | '2'>('1');

  // Effective original key
  const baseKey = initialKey || song?.key || 'G';

  // Transposed key
  const currentKey = useMemo(() => {
    return transposeChord(baseKey, transposeOffset);
  }, [baseKey, transposeOffset]);

  // Transposed full content
  const transposedContent = useMemo(() => {
    if (!song?.lyricsAndChords) return '';
    return transposeSongContent(song.lyricsAndChords, transposeOffset);
  }, [song?.lyricsAndChords, transposeOffset]);

  // Helper: Check if a line is a section tag e.g. [Verse 1], [Chorus]
  const isSectionHeader = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return false;
    const tag = trimmed.slice(1, -1).toLowerCase();
    return [
      'verse',
      'chorus',
      'bridge',
      'intro',
      'outro',
      'refrain',
      'interlude',
      'ending',
      'pre-chorus',
      'coda',
      'tag',
    ].some((keyword) => tag.includes(keyword));
  };

  // Helper: Check if a line consists purely of chord tokens
  const isPureChordLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('[') || trimmed.startsWith('{')) return false;

    const tokens = trimmed.split(/\s+/);
    if (tokens.length === 0) return false;

    let validCount = 0;
    tokens.forEach((token) => {
      const clean = token.replace(/[^A-Ga-g#0-9/]/g, '');
      if (
        getChordShape(clean) ||
        /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13|\/)*$/i.test(clean)
      ) {
        validCount++;
      }
    });

    return validCount / tokens.length >= 0.7;
  };

  // Process lines according to selected Print Mode
  const processedLines = useMemo(() => {
    if (!transposedContent) return [];
    const lines = transposedContent.split('\n');

    if (printMode === 'lyrics-only') {
      return lines
        .map((line) => {
          if (isSectionHeader(line)) return line;
          if (isPureChordLine(line)) return null; // Omit standalone chord lines
          // Remove all [Chord] brackets
          return line.replace(/\[[A-G][#b]?[^\]]*\]/g, '');
        })
        .filter((line): line is string => line !== null);
    }

    // Default: 'chords-and-lyrics'
    return lines;
  }, [transposedContent, printMode]);

  if (!isOpen || !song) return null;

  // Open Ready-to-Print View (Image 2 layout) and trigger print dialog
  const handleOpenPrintWindow = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      window.print();
      return;
    }

    const logoUrl = `${window.location.origin}/images/cfc_logo_only_blue.png`;

    const renderedHtmlLines = processedLines
      .map((line) => {
        const cleanLine = (line || '').replace(/&nbsp;/gi, '').trim();

        if (isSectionHeader(cleanLine)) {
          return `<div class="section-header">${escapeHtml(cleanLine.replace(/^\[|\]$/g, ''))}</div>`;
        }

        if (!cleanLine) {
          return `<div class="line" style="min-height: 1.2em;"></div>`;
        }

        if (printMode === 'lyrics-only') {
          return `<div class="line">${escapeHtml(cleanLine)}</div>`;
        }

        // Chords and lyrics
        const parts = cleanLine.split(/(\[[A-G][#b]?[^\]]*\])/g);
        const lineContent = parts
          .map((part) => {
            if (part.startsWith('[') && part.endsWith(']')) {
              const chord = part.slice(1, -1);
              return `<span class="chord">[${escapeHtml(chord)}]</span>`;
            }
            return escapeHtml(part);
          })
          .join('');

        return `<div class="line">${lineContent}</div>`;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(song.title)} - CFC Song Sheet</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #fff; line-height: 1.5; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px; }
            .header-left { display: flex; align-items: center; gap: 16px; }
            .logo { height: 55px; width: auto; object-fit: contain; }
            .title { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.1; }
            .artist { font-size: 13px; font-weight: 700; color: #334155; margin-top: 4px; }
            .meta { text-align: right; }
            .meta-org { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
            .meta-key { font-size: 14px; font-weight: 900; font-family: monospace; color: #0f172a; margin-top: 2px; }
            .meta-sub { font-size: 11px; color: #475569; }
            .content { font-size: ${fontSize}px !important; }
            .columns-2 { column-count: 2; column-gap: 32px; }
            .section-header { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: #243c81; border-bottom: 1px solid #e2e8f0; margin-top: 16px; margin-bottom: 6px; padding-bottom: 2px; page-break-inside: avoid; }
            .line { margin-bottom: 4px; page-break-inside: avoid; }
            .chord { font-family: monospace; font-weight: 900; color: #243c81; background: #eff6ff; border: 1px solid #dbeafe; padding: 1px 5px; border-radius: 4px; margin: 0 2px; font-size: 0.9em; }
            .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #cbd5e1; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; align-items: center; }
            .no-print { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .btn-print { background: #22c55e; color: #fff; border: none; padding: 8px 18px; font-size: 13px; font-weight: 800; border-radius: 8px; cursor: pointer; }
            .btn-print:hover { background: #16a34a; }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
              .chord { border: none; background: transparent; padding: 0; }
              .content { font-size: ${fontSize}px !important; }
            }
          </style>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </head>
        <body>
          <div class="no-print">
            <span style="font-weight:700;font-size:13px;">🖨️ CFC Song Sheet (${escapeHtml(song.title)})</span>
            <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
          </div>

          <div class="header">
            <div class="header-left">
              <img src="${logoUrl}" alt="CFC Logo" class="logo" />
              <div>
                <h1 class="title">${escapeHtml(song.title)}</h1>
                <div class="artist">${escapeHtml(song.artist || 'Couples for Christ Music Ministry')}${song.ministry ? ` • Ministry: ${escapeHtml(song.ministry)}` : ''}</div>
              </div>
            </div>
            <div class="meta">
              <div class="meta-org">Couples for Christ</div>
              <div class="meta-key">Key of ${currentKey}</div>
              <div class="meta-sub">${song.category ? `${escapeHtml(song.category)}` : ''} ${song.timeSignature ? `• ${escapeHtml(song.timeSignature)}` : ''}</div>
            </div>
          </div>

          <div class="content ${columnLayout === '2' ? 'columns-2' : ''}">
            ${renderedHtmlLines}
          </div>

          <div class="footer">
            <div style="display:flex;align-items:center;gap:6px;">
              <img src="${logoUrl}" alt="CFC" style="height:14px;" />
              <span>Couples for Christ • Music &amp; Praise Ministry</span>
            </div>
            <div>CFC Tuy Chapter Songbook • Printed ${new Date().toLocaleDateString()}</div>
          </div>
        </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      {/* Container Box */}
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden my-auto">
        {/* =================================================================== */}
        {/* MODAL HEADER                                                        */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#243c81] text-amber-300 flex items-center justify-center border border-blue-400/30 shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Print Song Sheet</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Configure layout, key, and chords vs lyrics selection before printing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =================================================================== */}
        {/* CONTROL BAR FOR SELECTION & PRINT CONFIG                            */}
        {/* =================================================================== */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 space-y-4 shrink-0">
          {/* Print Mode Selector: Chords & Lyrics vs Lyrics Only */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Select Content View:
              </span>
              <div className="inline-flex p-1 bg-slate-950 rounded-2xl border border-slate-800 gap-1">
                <button
                  type="button"
                  onClick={() => setPrintMode('chords-and-lyrics')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    printMode === 'chords-and-lyrics'
                      ? 'bg-[#243c81] text-white shadow-md border border-blue-400/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Guitar className="w-3.5 h-3.5 text-amber-300" />
                  <span>Chords &amp; Lyrics</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintMode('lyrics-only')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    printMode === 'lyrics-only'
                      ? 'bg-[#243c81] text-white shadow-md border border-blue-400/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lyrics Only</span>
                </button>
              </div>
            </div>

            {/* Print Action Button */}
            <button
              type="button"
              onClick={handleOpenPrintWindow}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>

          {/* Secondary Controls: Key Transpose, Font Size, Column Layout */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
            {/* Key Transposer */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Key:</span>
              <div className="flex items-center bg-slate-950 rounded-xl p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTransposeOffset((p) => p - 1)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-black flex items-center justify-center transition-all cursor-pointer"
                  title="Transpose Key Down"
                >
                  -1
                </button>
                <div className="px-3 font-mono font-bold text-amber-300 min-w-[70px] text-center">
                  {currentKey}
                  {transposeOffset !== 0 && (
                    <span className="text-[10px] text-slate-400 block font-sans">
                      ({transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setTransposeOffset((p) => p + 1)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-black flex items-center justify-center transition-all cursor-pointer"
                  title="Transpose Key Up"
                >
                  +1
                </button>
              </div>
              {transposeOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setTransposeOffset(0)}
                  className="text-slate-400 hover:text-white underline font-medium text-[11px]"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Font Size & Columns */}
            <div className="flex items-center gap-4">
              {/* Font Size */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold">Font:</span>
                <div className="flex items-center bg-slate-950 rounded-xl p-0.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFontSize((p) => Math.max(p - 1, 11))}
                    className="p-1.5 text-slate-300 hover:text-white"
                    title="Decrease Font Size"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-mono text-[11px] font-bold text-white">{fontSize}px</span>
                  <button
                    type="button"
                    onClick={() => setFontSize((p) => Math.min(p + 2, 22))}
                    className="p-1.5 text-slate-300 hover:text-white"
                    title="Increase Font Size"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Columns Toggle */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold">Columns:</span>
                <div className="flex items-center bg-slate-950 rounded-xl p-0.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setColumnLayout('1')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      columnLayout === '1' ? 'bg-[#243c81] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1 Col
                  </button>
                  <button
                    type="button"
                    onClick={() => setColumnLayout('2')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      columnLayout === '2' ? 'bg-[#243c81] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2 Cols
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* PRINT PREVIEW CONTAINER (SCROLLABLE IN MODAL)                      */}
        {/* =================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/50 flex flex-col items-center">
          {/* THE ACTUAL PRINT SHEET CARD THAT GETS PRINTED ON PAPER */}
          <div
            id="printable-song-sheet"
            className="w-full max-w-3xl bg-white text-slate-950 p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-200 transition-all font-sans my-4 shrink-0"
            style={{ minHeight: '600px' }}
          >
            {/* ------------------------------------------------------------- */}
            {/* PRINT HEADER: CFC LOGO + TITLE + ARTIST                        */}
            {/* ------------------------------------------------------------- */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6 gap-4">
              <div className="flex items-center gap-4">
                {/* CFC Official Logo */}
                <img
                  src="/images/cfc_logo_only_blue.png"
                  alt="Couples for Christ Logo"
                  className="h-14 sm:h-16 w-auto object-contain shrink-0"
                />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                    {song.title}
                  </h1>
                  <p className="text-sm font-bold text-slate-700 mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span>{song.artist || 'Couples for Christ Music Ministry'}</span>
                    {song.ministry && (
                      <span className="text-slate-500 font-semibold">• Ministry: {song.ministry}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Right Side Song Info */}
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-500">
                  Couples for Christ
                </div>
                <div className="text-sm font-extrabold font-mono text-slate-900 mt-0.5">
                  Key of {currentKey}
                </div>
                {song.timeSignature && (
                  <div className="text-xs text-slate-600 font-medium">
                    {song.timeSignature} {song.tempo ? `• ${song.tempo}` : ''}
                  </div>
                )}
                {song.category && (
                  <div className="text-[10px] font-black uppercase text-slate-800 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md mt-1 inline-block">
                    {song.category}
                  </div>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PRINT BODY: PROCESSED LYRICS / CHORDS CONTENT                 */}
            {/* ------------------------------------------------------------- */}
            <div
              id="printable-song-sheet-content"
              className={`space-y-1 ${
                columnLayout === '2' ? 'columns-1 sm:columns-2 gap-8' : ''
              }`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {processedLines.map((line, idx) => {
                const cleanLine = (line || '').replace(/&nbsp;/gi, '');
                const trimmed = cleanLine.trim();

                // Blank line spacing
                if (!trimmed) {
                  return <div key={idx} className="h-4" />;
                }

                // Section Header Formatting (e.g. [Verse 1], [Chorus])
                if (isSectionHeader(trimmed)) {
                  return (
                    <div
                      key={idx}
                      className="pt-4 pb-1.5 font-black text-xs uppercase tracking-wider text-[#243c81] border-b border-slate-200 mb-1 flex items-center justify-between break-inside-avoid"
                    >
                      <span>{trimmed.replace(/^\[|\]$/g, '')}</span>
                      <span className="text-[9px] text-slate-400 font-normal">
                        {printMode === 'lyrics-only' ? 'Lyrics' : 'Chords & Lyrics'}
                      </span>
                    </div>
                  );
                }

                // If mode is 'lyrics-only': Render simple clean text
                if (printMode === 'lyrics-only') {
                  return (
                    <div
                      key={idx}
                      className="leading-relaxed text-slate-900 font-sans py-0.5 break-inside-avoid"
                    >
                      {cleanLine}
                    </div>
                  );
                }

                // Default 'chords-and-lyrics': Render ChordPro brackets inline with bold formatting
                const parts = cleanLine.split(/(\[[A-G][#b]?[^\]]*\])/g);
                if (parts.length === 1 && !cleanLine.includes('[')) {
                  return (
                    <div
                      key={idx}
                      className="leading-relaxed text-slate-900 font-sans py-0.5 break-inside-avoid"
                    >
                      {cleanLine}
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-baseline py-0.5 font-sans leading-relaxed break-inside-avoid"
                  >
                    {parts.map((part, pIdx) => {
                      if (part.startsWith('[') && part.endsWith(']')) {
                        const chord = part.slice(1, -1);
                        return (
                          <span
                            key={pIdx}
                            className="font-mono font-black text-[#243c81] bg-blue-50 border border-blue-200/80 px-1 py-0 rounded text-[0.88em] mx-0.5 select-none print:border-none print:bg-transparent"
                          >
                            [{chord}]
                          </span>
                        );
                      }
                      return (
                        <span key={pIdx} className="text-slate-900 whitespace-pre">
                          {part}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PRINT FOOTER                                                  */}
            {/* ------------------------------------------------------------- */}
            <div className="mt-10 pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <img
                  src="/images/cfc_logo_only_blue.png"
                  alt="CFC Logo"
                  className="h-4 w-auto object-contain opacity-75"
                />
                <span>Couples for Christ • Music &amp; Praise Ministry</span>
              </div>
              <div>CFC Tuy Chapter Songbook</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
