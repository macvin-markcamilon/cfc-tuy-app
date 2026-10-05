'use client';

import React, { useMemo } from 'react';
import { CLPTalk, CLPCouple, CLPAttendance } from '@/types';
import { TUY_BARANGAYS } from '@/lib/data/mock-data';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Award,
  Users,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface TalkStatisticsChartsProps {
  talks: CLPTalk[];
  couples: CLPCouple[];
  attendance: CLPAttendance[];
  onOpenTalk?: (talkId: string) => void;
  className?: string;
}

export function TalkStatisticsCharts({
  talks,
  couples,
  attendance,
  onOpenTalk,
  className = '',
}: TalkStatisticsChartsProps) {
  const totalInvitedCouples = couples.length;
  const maxPossibleIndividualPerTalk = totalInvitedCouples * 2;

  // 1. Calculate per-talk stats
  const talkStats = useMemo(() => {
    return talks.map((t) => {
      const records = attendance.filter((a) => a.talkId === t.id);
      const hp = records.filter((a) => a.husbandPresent).length;
      const wp = records.filter((a) => a.wifePresent).length;
      const totalAttendees = hp + wp;
      const bothPresentCouples = records.filter((a) => a.husbandPresent && a.wifePresent).length;
      const partialCouples = records.filter(
        (a) => (a.husbandPresent && !a.wifePresent) || (!a.husbandPresent && a.wifePresent)
      ).length;

      const pct =
        maxPossibleIndividualPerTalk > 0
          ? Math.round((totalAttendees / maxPossibleIndividualPerTalk) * 100)
          : 0;

      const husbandPct = totalInvitedCouples > 0 ? Math.round((hp / totalInvitedCouples) * 100) : 0;
      const wifePct = totalInvitedCouples > 0 ? Math.round((wp / totalInvitedCouples) * 100) : 0;

      return {
        talk: t,
        hp,
        wp,
        totalAttendees,
        bothPresentCouples,
        partialCouples,
        pct,
        husbandPct,
        wifePct,
      };
    });
  }, [talks, attendance, totalInvitedCouples, maxPossibleIndividualPerTalk]);

  // Highlights: Peak Talk, Lowest Talk, Average Attendance
  const analyticsHighlights = useMemo(() => {
    if (talkStats.length === 0) return null;

    let peak = talkStats[0];
    let lowest = talkStats[0];
    let sumPct = 0;

    talkStats.forEach((s) => {
      sumPct += s.pct;
      if (s.pct > peak.pct) peak = s;
      if (s.pct < lowest.pct) lowest = s;
    });

    const avgPct = Math.round(sumPct / talkStats.length);

    return { peak, lowest, avgPct };
  }, [talkStats]);

  // 2. Calculate Barangay distribution stats
  const barangayStats = useMemo(() => {
    return TUY_BARANGAYS.map((brgy) => {
      const brgyCouples = couples.filter((c) => c.barangay === brgy);
      const coupleIds = new Set(brgyCouples.map((c) => c.id));

      let totalIndividualPresences = 0;
      let totalPossiblePresences = brgyCouples.length * 2 * talks.length;

      attendance.forEach((a) => {
        if (coupleIds.has(a.coupleId)) {
          if (a.husbandPresent) totalIndividualPresences++;
          if (a.wifePresent) totalIndividualPresences++;
        }
      });

      const avgAttendancePct =
        totalPossiblePresences > 0
          ? Math.round((totalIndividualPresences / totalPossiblePresences) * 100)
          : 0;

      return {
        barangay: brgy,
        invitedCouples: brgyCouples.length,
        invitedIndividuals: brgyCouples.length * 2,
        totalIndividualPresences,
        avgAttendancePct,
      };
    }).sort((a, b) => b.invitedCouples - a.invitedCouples || b.avgAttendancePct - a.avgAttendancePct);
  }, [couples, attendance, talks]);

  // 3. Couple Retention / Consistency Tiers
  const consistencyTiers = useMemo(() => {
    let perfect100 = 0;
    let high75 = 0;
    let mod50 = 0;
    let lowAtRisk = 0;

    couples.forEach((c) => {
      let attendedTalks = 0;
      talks.forEach((t) => {
        const att = attendance.find((a) => a.talkId === t.id && a.coupleId === c.id);
        if (att && (att.husbandPresent || att.wifePresent)) {
          attendedTalks++;
        }
      });

      const pct = talks.length > 0 ? (attendedTalks / talks.length) * 100 : 0;
      if (pct === 100) perfect100++;
      else if (pct >= 75) high75++;
      else if (pct >= 50) mod50++;
      else lowAtRisk++;
    });

    return { perfect100, high75, mod50, lowAtRisk };
  }, [couples, attendance, talks]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* SECTION 1: Talk Progression Bar Chart */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-[#243c81] border border-blue-100">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h3 className="font-black text-slate-900 text-base">
                Talk Attendance Progression Statistics
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Comparative attendance performance and spouse participation per CLP talk session
            </p>
          </div>

          {analyticsHighlights && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-1.5 font-bold text-emerald-800">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>Peak: Talk #{analyticsHighlights.peak.talk.talkNumber} ({analyticsHighlights.peak.pct}%)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs flex items-center gap-1.5 font-bold text-blue-900">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Avg: {analyticsHighlights.avgPct}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Visual Vertical Bar Chart */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-end pt-8 pb-4 border-b border-slate-100 min-h-[260px]">
            {talkStats.map((stat) => {
              const isPeak = analyticsHighlights?.peak.talk.id === stat.talk.id;
              
              return (
                <div
                  key={stat.talk.id}
                  onClick={() => onOpenTalk && onOpenTalk(stat.talk.id)}
                  className={`group relative flex flex-col items-center justify-end h-full p-2.5 rounded-2xl transition-all cursor-pointer ${
                    isPeak
                      ? 'bg-gradient-to-b from-emerald-50/60 to-teal-50/40 border border-emerald-200/80 shadow-xs'
                      : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
                  }`}
                >
                  {/* Top Percentage Badge */}
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full mb-2 shadow-2xs transition-transform group-hover:scale-110 ${
                      stat.pct >= 80
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : stat.pct >= 60
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : stat.pct >= 40
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {stat.pct}%
                  </span>

                  {/* Dual Bar (Husband vs Wife) */}
                  <div className="w-full max-w-[48px] h-36 bg-slate-100 rounded-xl overflow-hidden flex items-end justify-center p-1 gap-1 relative shadow-inner">
                    {/* Husband bar */}
                    <div
                      className="w-1/2 bg-[#243c81] rounded-t-md transition-all duration-700 group-hover:brightness-125"
                      style={{ height: `${Math.max(5, stat.husbandPct)}%` }}
                      title={`Husbands: ${stat.hp}/${totalInvitedCouples} (${stat.husbandPct}%)`}
                    />
                    {/* Wife bar */}
                    <div
                      className="w-1/2 bg-rose-500 rounded-t-md transition-all duration-700 group-hover:brightness-125"
                      style={{ height: `${Math.max(5, stat.wifePct)}%` }}
                      title={`Wives: ${stat.wp}/${totalInvitedCouples} (${stat.wifePct}%)`}
                    />
                  </div>

                  {/* Talk Title & Label */}
                  <div className="mt-3 text-center">
                    <span className="text-[11px] font-black text-slate-900 block group-hover:text-blue-700 transition-colors">
                      Talk #{stat.talk.talkNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium truncate block max-w-[90px]" title={stat.talk.title}>
                      {stat.talk.title}
                    </span>
                  </div>

                  {/* Hover Tooltip Popup */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 absolute bottom-full mb-2 z-30 w-48 bg-slate-900 text-white rounded-2xl p-3 text-[11px] shadow-xl border border-slate-700 font-normal">
                    <div className="font-extrabold text-white text-xs mb-1">
                      Talk #{stat.talk.talkNumber}: {stat.talk.title}
                    </div>
                    <div className="text-slate-300 space-y-0.5">
                      <div>Total: <strong className="text-white">{stat.totalAttendees}</strong> / {maxPossibleIndividualPerTalk} attendees</div>
                      <div className="text-blue-300 font-bold">Husbands: {stat.hp} ({stat.husbandPct}%)</div>
                      <div className="text-rose-300 font-bold">Wives: {stat.wp} ({stat.wifePct}%)</div>
                      <div className="text-emerald-300">Both Present: {stat.bothPresentCouples} couples</div>
                    </div>
                    <div className="mt-2 pt-1 border-t border-slate-700 text-[10px] font-bold text-amber-400 flex items-center justify-between">
                      <span>Click to view sheet</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bar Legend */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#243c81]" />
                <span className="font-bold text-slate-700">Husbands Attendance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-rose-500" />
                <span className="font-bold text-slate-700">Wives Attendance</span>
              </div>
            </div>

            <div className="text-[11px] font-medium text-slate-400">
              * Click any talk bar to open its interactive attendance sheet
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Barangay Attendance Distribution & Couple Retention Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Barangay Distribution */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                <MapPin className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 text-base">Barangay Participation Breakdown</h3>
                <p className="text-xs text-slate-500 font-medium">Invited couples &amp; attendance percentage across Tuy barangays</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {barangayStats.map((item) => (
              <div key={item.barangay} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{item.barangay}</span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                      {item.invitedCouples} couples
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600 text-[11px]">
                      {item.totalIndividualPresences} attendances
                    </span>
                    <span className="font-black text-blue-900">{item.avgAttendancePct}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.avgAttendancePct >= 75
                        ? 'bg-emerald-500'
                        : item.avgAttendancePct >= 50
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.max(4, item.avgAttendancePct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Couple Retention & Consistency Tier Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 text-base">Attendance Consistency</h3>
                <p className="text-xs text-slate-500 font-medium">Couple participation tier breakdown</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* 100% Perfect Attendance */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-950 block">100% Perfect Attendance</span>
                    <span className="text-[11px] text-emerald-700 font-medium block">Attended all completed sessions</span>
                  </div>
                </div>
                <span className="text-2xl font-black text-emerald-950">{consistencyTiers.perfect100}</span>
              </div>

              {/* 75%+ High Retention */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#243c81] text-white flex items-center justify-center font-black">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-blue-950 block">75%+ High Consistency</span>
                    <span className="text-[11px] text-blue-700 font-medium block">Graduation path couples</span>
                  </div>
                </div>
                <span className="text-2xl font-black text-blue-950">{consistencyTiers.high75}</span>
              </div>

              {/* 50-74% Moderate */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-amber-950 block">50–74% Moderate</span>
                    <span className="text-[11px] text-amber-800 font-medium block">Missed 1 to 2 sessions</span>
                  </div>
                </div>
                <span className="text-2xl font-black text-amber-950">{consistencyTiers.mod50}</span>
              </div>

              {/* At Risk */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-rose-950 block">Below 50% / Needs Action</span>
                    <span className="text-[11px] text-rose-700 font-medium block">Requires pastoral check-in</span>
                  </div>
                </div>
                <span className="text-2xl font-black text-rose-950">{consistencyTiers.lowAtRisk}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
