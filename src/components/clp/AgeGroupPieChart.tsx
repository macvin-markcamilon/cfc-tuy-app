'use client';

import React, { useState, useMemo } from 'react';
import { CLPCouple } from '@/types';
import {
  REPORT_AGE_BRACKETS,
  computeAgeNumber,
  getCoupleAgeBracketKey,
  AgeBracketInfo,
} from '@/lib/reports/reportHelpers';
import { PieChart, Users, Heart, User, Filter, Info, Sparkles } from 'lucide-react';

interface AgeGroupPieChartProps {
  couples: CLPCouple[];
  title?: string;
  subtitle?: string;
  className?: string;
  showFilters?: boolean;
  compact?: boolean;
}

export function AgeGroupPieChart({
  couples,
  title = 'Age Group Distribution Analytics',
  subtitle = 'Demographic breakdown of CLP participants across age brackets',
  className = '',
  showFilters = true,
  compact = false,
}: AgeGroupPieChartProps) {
  const [filterRole, setFilterRole] = useState<'ALL' | 'HUSBANDS' | 'WIVES'>('ALL');
  const [hoveredBracketKey, setHoveredBracketKey] = useState<string | null>(null);

  // Compute demographic stats based on current filter role
  const demographicStats = useMemo(() => {
    const counts: Record<string, { count: number; husbands: number; wives: number }> = {};
    
    REPORT_AGE_BRACKETS.forEach((b) => {
      counts[b.key] = { count: 0, husbands: 0, wives: 0 };
    });

    let totalHusbands = 0;
    let totalWives = 0;
    let sumHusbandAge = 0;
    let husbandAgeCount = 0;
    let sumWifeAge = 0;
    let wifeAgeCount = 0;

    couples.forEach((c) => {
      const hAge = computeAgeNumber(c.husbandBirthday);
      const wAge = computeAgeNumber(c.wifeBirthday);

      const hKey = getCoupleAgeBracketKey(c.husbandBirthday);
      const wKey = getCoupleAgeBracketKey(c.wifeBirthday);

      if (counts[hKey]) counts[hKey].husbands++;
      if (counts[wKey]) counts[wKey].wives++;

      if (hAge !== null) {
        sumHusbandAge += hAge;
        husbandAgeCount++;
      }
      if (wAge !== null) {
        sumWifeAge += wAge;
        wifeAgeCount++;
      }

      totalHusbands++;
      totalWives++;
    });

    // Determine target total based on filter role
    let totalTarget = 0;
    REPORT_AGE_BRACKETS.forEach((b) => {
      if (filterRole === 'ALL') {
        counts[b.key].count = counts[b.key].husbands + counts[b.key].wives;
        totalTarget += counts[b.key].count;
      } else if (filterRole === 'HUSBANDS') {
        counts[b.key].count = counts[b.key].husbands;
        totalTarget += counts[b.key].count;
      } else {
        counts[b.key].count = counts[b.key].wives;
        totalTarget += counts[b.key].count;
      }
    });

    const avgHusbandAge = husbandAgeCount > 0 ? Math.round(sumHusbandAge / husbandAgeCount) : null;
    const avgWifeAge = wifeAgeCount > 0 ? Math.round(sumWifeAge / wifeAgeCount) : null;
    const totalAges = sumHusbandAge + sumWifeAge;
    const totalAgeCount = husbandAgeCount + wifeAgeCount;
    const avgOverallAge = totalAgeCount > 0 ? Math.round(totalAges / totalAgeCount) : null;

    // Find dominant age bracket
    let dominantBracketKey = 'unknown';
    let maxCount = -1;
    REPORT_AGE_BRACKETS.forEach((b) => {
      if (counts[b.key].count > maxCount && b.key !== 'unknown') {
        maxCount = counts[b.key].count;
        dominantBracketKey = b.key;
      }
    });
    const dominantBracket = REPORT_AGE_BRACKETS.find((b) => b.key === dominantBracketKey);

    return {
      counts,
      totalTarget,
      avgHusbandAge,
      avgWifeAge,
      avgOverallAge,
      dominantBracket,
    };
  }, [couples, filterRole]);

  // Compute SVG Slices math
  const slices = useMemo(() => {
    const { counts, totalTarget } = demographicStats;
    let currentAngle = 0;

    if (totalTarget === 0) return [];

    return REPORT_AGE_BRACKETS.map((b) => {
      const item = counts[b.key];
      const count = item ? item.count : 0;
      const pct = totalTarget > 0 ? (count / totalTarget) * 100 : 0;
      const angle = (pct / 100) * 360;

      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      return {
        bracket: b,
        count,
        pct: Math.round(pct * 10) / 10,
        startAngle,
        endAngle,
        angle,
      };
    }).filter((s) => s.count > 0);
  }, [demographicStats]);

  // Helper to generate SVG Donut Slice Path
  const getSlicePath = (
    cx: number,
    cy: number,
    rOuter: number,
    rInner: number,
    startAngle: number,
    endAngle: number,
    isExpanded: boolean
  ) => {
    const angleDiff = Math.min(endAngle - startAngle, 359.999);
    
    // Slight expansion if hovered
    const offsetRadius = isExpanded ? 6 : 0;
    const effectiveOuter = rOuter + offsetRadius;
    const effectiveInner = rInner;

    // Mid angle for displacement direction if hovered
    const midAngle = startAngle + angleDiff / 2;
    const midRad = (midAngle - 90) * (Math.PI / 180);
    const shiftX = isExpanded ? Math.cos(midRad) * 4 : 0;
    const shiftY = isExpanded ? Math.sin(midRad) * 4 : 0;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (startAngle + angleDiff - 90) * (Math.PI / 180);

    const x1 = cx + shiftX + effectiveOuter * Math.cos(startRad);
    const y1 = cy + shiftY + effectiveOuter * Math.sin(startRad);
    const x2 = cx + shiftX + effectiveOuter * Math.cos(endRad);
    const y2 = cy + shiftY + effectiveOuter * Math.sin(endRad);

    const x3 = cx + shiftX + effectiveInner * Math.cos(endRad);
    const y3 = cy + shiftY + effectiveInner * Math.sin(endRad);
    const x4 = cx + shiftX + effectiveInner * Math.cos(startRad);
    const y4 = cy + shiftY + effectiveInner * Math.sin(startRad);

    const largeArcFlag = angleDiff > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${effectiveOuter} ${effectiveOuter} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${effectiveInner} ${effectiveInner} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  const hoveredSlice = slices.find((s) => s.bracket.key === hoveredBracketKey);

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <PieChart className="w-5 h-5" />
            </span>
            <h3 className="font-black text-slate-900 text-base">{title}</h3>
          </div>
          {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
        </div>

        {/* Filter Pills */}
        {showFilters && (
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200/80 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterRole('ALL')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                filterRole === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>All ({demographicStats.totalTarget})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterRole('HUSBANDS')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                filterRole === 'HUSBANDS'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Husbands</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterRole('WIVES')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                filterRole === 'WIVES'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Wives</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        {demographicStats.totalTarget === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs sm:text-sm font-medium">
            No age demographic data available for current selection.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* SVG Pie/Donut Visualizer */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full transform -rotate-90 drop-shadow-sm transition-all duration-300"
                >
                  {/* Background track circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="82"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="32"
                  />

                  {/* Render Donut Slices */}
                  {slices.map((slice) => {
                    const isHovered = hoveredBracketKey === slice.bracket.key;
                    const slicePath = getSlicePath(
                      100,
                      100,
                      86,
                      56,
                      slice.startAngle,
                      slice.endAngle,
                      isHovered
                    );

                    return (
                      <path
                        key={slice.bracket.key}
                        d={slicePath}
                        fill={slice.bracket.accentColor}
                        className="transition-all duration-200 cursor-pointer hover:opacity-90 hover:brightness-110"
                        onMouseEnter={() => setHoveredBracketKey(slice.bracket.key)}
                        onMouseLeave={() => setHoveredBracketKey(null)}
                        style={{
                          transformOrigin: '100px 100px',
                          filter: isHovered
                            ? `drop-shadow(0 4px 12px ${slice.bracket.accentColor}40)`
                            : 'none',
                        }}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Readout */}
                <div
                  className="absolute inset-0 m-auto w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white shadow-inner flex flex-col items-center justify-center text-center p-2 border border-slate-100 pointer-events-none transition-all duration-200"
                >
                  {hoveredSlice ? (
                    <div className="animate-in fade-in zoom-in-90 duration-150">
                      <span className="text-[10px] font-black uppercase tracking-wider block text-slate-400">
                        {hoveredSlice.bracket.label}
                      </span>
                      <span
                        className="text-xl sm:text-2xl font-black block leading-tight"
                        style={{ color: hoveredSlice.bracket.accentColor }}
                      >
                        {hoveredSlice.count}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 block">
                        {hoveredSlice.pct}% of total
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider block text-slate-400">
                        Total {filterRole === 'ALL' ? 'People' : filterRole === 'HUSBANDS' ? 'Husbands' : 'Wives'}
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 block leading-tight">
                        {demographicStats.totalTarget}
                      </span>
                      {demographicStats.avgOverallAge && (
                        <span className="text-[10px] font-bold text-indigo-600 block mt-0.5">
                          Avg: {demographicStats.avgOverallAge} yrs old
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Instructions hint */}
              <div className="mt-3 text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Hover over chart slices or legend for detailed metrics</span>
              </div>
            </div>

            {/* Detailed Legend & Breakdown */}
            <div className="lg:col-span-6 space-y-2.5">
              {REPORT_AGE_BRACKETS.map((bracket) => {
                const item = demographicStats.counts[bracket.key];
                const count = item ? item.count : 0;
                const pct =
                  demographicStats.totalTarget > 0
                    ? Math.round((count / demographicStats.totalTarget) * 100)
                    : 0;
                const isHovered = hoveredBracketKey === bracket.key;

                return (
                  <div
                    key={bracket.key}
                    onMouseEnter={() => setHoveredBracketKey(bracket.key)}
                    onMouseLeave={() => setHoveredBracketKey(null)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isHovered
                        ? 'bg-slate-50 border-blue-300 shadow-xs translate-x-1'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: bracket.accentColor }}
                        />
                        <div>
                          <span className="text-xs font-black text-slate-900">
                            {bracket.label}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5 font-medium">
                            ({bracket.sublabel})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          {count} {filterRole === 'ALL' ? 'people' : 'persons'}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${bracket.badgeBg} ${bracket.badgeText} ${bracket.badgeBorder} border`}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: bracket.accentColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Stats Row */}
        {!compact && (
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                Avg. Husband Age
              </span>
              <span className="text-lg font-black text-blue-950">
                {demographicStats.avgHusbandAge ? `${demographicStats.avgHusbandAge} yrs` : 'N/A'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                Avg. Wife Age
              </span>
              <span className="text-lg font-black text-rose-950">
                {demographicStats.avgWifeAge ? `${demographicStats.avgWifeAge} yrs` : 'N/A'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block">
                Overall Avg. Age
              </span>
              <span className="text-lg font-black text-purple-950">
                {demographicStats.avgOverallAge ? `${demographicStats.avgOverallAge} yrs` : 'N/A'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Dominant Age Group
              </span>
              <span className="text-sm font-black text-emerald-950 truncate block mt-0.5">
                {demographicStats.dominantBracket ? demographicStats.dominantBracket.label : 'N/A'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
