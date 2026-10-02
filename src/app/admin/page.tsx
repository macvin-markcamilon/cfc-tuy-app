import React from 'react';
import Link from 'next/link';
import {
  BookOpenCheck,
  Users,
  Music,
  MapPin,
  Calendar,
  ArrowRight,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MOCK_CLP_PROGRAMS, MOCK_CLP_COUPLES, MOCK_CLP_TALKS } from '@/lib/data/mock-data';

export default function AdminDashboardPage() {
  const activeCLP = MOCK_CLP_PROGRAMS[0];
  const upcomingTalk = MOCK_CLP_TALKS[0];

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-blue-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tuy Chapter Leadership Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, Bro. Mark!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
            Active CLP: <strong className="text-white">{activeCLP.name}</strong> is currently ongoing with 6 registered couples at the Parish Social Hall.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/clp"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <BookOpenCheck className="w-4 h-4" />
            <span>Open CLP Manager</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Enrolled CLP Couples
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <BookOpenCheck className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-black text-slate-900 dark:text-white mt-2 block">
            {MOCK_CLP_COUPLES.length} Couples
          </span>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">
            Batch 29 • 100% Confirmed
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              CLP Talks Prepared
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-black text-slate-900 dark:text-white mt-2 block">
            {MOCK_CLP_TALKS.length} Talks
          </span>
          <span className="text-xs text-blue-600 font-semibold mt-1 block">
            3 Modules Completed
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tuy Households
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-black text-slate-900 dark:text-white mt-2 block">
            8 Units
          </span>
          <span className="text-xs text-slate-500 font-semibold mt-1 block">
            Serving 22 Barangays
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Worship Songs
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Music className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-black text-slate-900 dark:text-white mt-2 block">
            45+ Songs
          </span>
          <span className="text-xs text-purple-600 font-semibold mt-1 block">
            Praise & Worship Ready
          </span>
        </div>

      </div>

      {/* CLP Current Cycle Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Active Christian Life Program
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {activeCLP.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Venue: {activeCLP.venue} • Timeline: {activeCLP.startDate} to {activeCLP.endDate}
            </p>
          </div>

          <Link
            href="/admin/clp"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition-all self-start sm:self-auto"
          >
            <span>Manage Couples & Attendance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quick Couple Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {MOCK_CLP_COUPLES.slice(0, 3).map((couple) => (
            <div
              key={couple.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                  {couple.status}
                </span>
                <span className="text-[11px] text-slate-400">
                  Brgy. {couple.barangay}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Bro. {couple.husbandFirstName} & Sis. {couple.wifeFirstName} {couple.husbandLastName}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                {couple.address}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
