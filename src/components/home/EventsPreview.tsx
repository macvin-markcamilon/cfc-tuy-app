import React from 'react';
import Link from 'next/link';
import { CHAPTER_EVENTS } from '@/lib/data/mock-data';
import { Calendar, Clock, MapPin, ArrowRight, Sparkles } from 'lucide-react';

export default function EventsPreview() {
  const upcoming = CHAPTER_EVENTS.slice(0, 3);

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Gatherings &amp; Feasts
            </span>
            <h2 className="mt-1 text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Upcoming Events in Tuy
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Join us in our chapter assemblies, fellowships, and Christian Life Programs.
            </p>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <span>View Full Chapter Calendar</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Events Cards */}
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcoming.map((evt) => {
              const dateObj = new Date(evt.date);
              const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
              const dayStr = dateObj.toLocaleDateString('en-US', { day: 'numeric' });

              return (
                <div
                  key={evt.id}
                  className="glass-panel p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-200 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      {/* Date Badge */}
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-blue-700 to-indigo-800 text-white shadow-md">
                        <span className="text-[10px] uppercase font-bold tracking-wider">{monthStr}</span>
                        <span className="text-xl font-black leading-none">{dayStr}</span>
                      </div>

                      {/* Ministry tag */}
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {evt.ministry === 'ALL' ? 'General Chapter' : evt.ministry}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-snug">
                      {evt.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                      {evt.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{evt.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="line-clamp-1">{evt.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-2">
                    <Link
                      href={`/events#${evt.id}`}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-800 hover:text-white dark:text-slate-200 dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Event Details &amp; RSVP</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
            <Calendar className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No upcoming public events scheduled at this moment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Check back regularly for announcements regarding the next Christian Life Program and monthly chapter assemblies in Tuy.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
