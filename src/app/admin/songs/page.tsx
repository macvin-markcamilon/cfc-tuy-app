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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Music & Praise Ministry
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            CFC Tuy Worship Songs Repertoire
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Praise & Worship songs, chords, lyrics, and assemblies line-up.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Worship Song</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sampleSongs.map((song, i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                  {song.category}
                </span>
                <span className="text-xs text-amber-500 font-bold font-mono">
                  Key: {song.key}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {song.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {song.artist} • Tempo: {song.tempo}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Praise Assembly Ready</span>
              <button
                type="button"
                className="text-purple-600 font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>View Lyrics & Chords →</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
