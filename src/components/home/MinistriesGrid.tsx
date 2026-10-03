import React from 'react';
import Link from 'next/link';
import { MINISTRIES_DATA } from '@/lib/data/mock-data';
import { ArrowRight, UserCheck, Calendar, Clock } from 'lucide-react';

export default function MinistriesGrid() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#243c81]">
            A Place for Every Member of the Family
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            The Family Ministries of CFC Tuy
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            From young children to grandparents, Couples for Christ nurtures every stage of life in the Catholic faith.
          </p>
        </div>

        {/* 6 Ministries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MINISTRIES_DATA.map((ministry) => (
            <div
              key={ministry.code}
              className="flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 hover:shadow-lg hover:border-[#243c81]/60 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${ministry.colorScheme.badgeBg} ${ministry.colorScheme.badgeText}`}>
                    {ministry.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {ministry.targetAudience}
                  </span>
                </div>

                {/* Ministry Title & Tagline */}
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#243c81] transition-colors">
                  {ministry.name}
                </h3>
                <p className="text-xs font-medium text-amber-600 italic mt-1">
                  &quot;{ministry.tagline}&quot;
                </p>

                {/* Description */}
                <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {ministry.description}
                </p>

                {/* Schedules & Coordinator */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#243c81] shrink-0 mt-0.5" />
                    <span>{ministry.meetingInfo}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium text-slate-700">{ministry.coordinator}</span>
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <div className="mt-6 pt-2">
                <Link
                  href={`/ministries#${ministry.code.toLowerCase()}`}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#243c81] hover:text-[#1a2d63] group-hover:translate-x-1 transition-all"
                >
                  <span>Learn more about {ministry.code}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
