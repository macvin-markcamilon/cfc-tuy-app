'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, Home, Music } from 'lucide-react';

export default function SongbookError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Songbook error caught:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center mb-4 shadow-xl">
        <Music className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-black mb-2 tracking-tight">Songbook Temporary Error</h1>
      <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
        {error?.message || 'An unexpected error occurred while interacting with the songbook.'}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-2xl bg-[#243c81] hover:bg-blue-800 text-white font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry</span>
        </button>
        <Link
          href="/songbook"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition-all"
        >
          <span>Refresh Page</span>
        </Link>
      </div>
    </div>
  );
}
