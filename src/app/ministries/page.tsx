import React from 'react';
import { MINISTRIES_DATA } from '@/lib/data/mock-data';
import Link from 'next/link';
import { Users, Heart, Clock, UserCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function MinistriesPage() {
  return (
    <div className="py-8 sm:py-12 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>CFC Family Ministries Model</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Nurturing Faith for Every Generation
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Couples for Christ believes that a strong family makes a strong church and nation. Our six family ministries ensure every child, youth, single professional, married couple, and mature parent in Tuy has a spiritual home.
          </p>
        </div>

        {/* Ministries Deep Dive Cards */}
        <div className="space-y-8">
          {MINISTRIES_DATA.map((ministry) => (
            <div
              key={ministry.code}
              id={ministry.code.toLowerCase()}
              className="scroll-mt-24 p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${ministry.colorScheme.badgeBg} ${ministry.colorScheme.badgeText}`}>
                      {ministry.code}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Target: {ministry.targetAudience}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {ministry.name}
                  </h2>

                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 italic">
                    &quot;{ministry.tagline}&quot;
                  </p>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    {ministry.description}
                  </p>

                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold mb-1">
                        <Clock className="w-4 h-4" />
                        <span>Gathering Schedule</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{ministry.meetingInfo}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                        <UserCheck className="w-4 h-4" />
                        <span>Chapter Servant / Lead</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{ministry.coordinator}</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
                    How to Join {ministry.code} Tuy
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Attend our upcoming Tuy Chapter orientation or CLP</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Get assigned to a barangay household group</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Participate in regular praise and worship</span>
                    </li>
                  </ul>

                  <Link
                    href="/events#clp"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <span>Connect with {ministry.code} Tuy</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
