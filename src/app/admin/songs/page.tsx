'use client';

import React from 'react';
import { Music, Plus, Search, Play, BookOpen, Star } from 'lucide-react';

export default function SongsAdminPage() {
  const sampleSongs = [
    { title: 'The Light of Christ', artist: 'CFC Music Ministry', key: 'G Major', category: 'Praise & Worship', tempo: 'Upbeat' },
    { title: 'Ablaze for Jesus', artist: 'Youth for Christ', key: 'D Major', category: 'Fast Praise', tempo: 'Dynamic' },
    { title: 'You Are Near', artist: 'Dan Schutte', key: 'C Major', category: 'Slow Worship', tempo: 'Reflective' },
    { title: 'God is Enough', artist: 'Couples for Christ', key: 'E Major', category: 'Assembly Theme', tempo: 'Moderate' },
    { title: 'I Offer My Life', artist: 'Don Moen', key: 'F Major', category: 'Offertory / Reflection', tempo: 'Gentle' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#243c81]">
            Music &amp; Praise Ministry
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            CFC Tuy Worship Songs Repertoire
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Praise &amp; Worship songs, chords, lyrics, and assemblies line-up.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Worship song management ready.')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Worship Song</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sampleSongs.map((song, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                  {song.category}
                </span>
                <span className="text-xs text-amber-700 font-bold font-mono">
                  Key: {song.key}
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900">
                {song.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {song.artist} • Tempo: {song.tempo}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Lyrics &amp; Chords</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-bold text-[#243c81] hover:underline"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>View Sheet</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
