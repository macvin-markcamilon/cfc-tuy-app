'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CLPCouple, CLPProgram } from '@/types';
import { fetchCLPPrograms, fetchCLPCouples } from '@/lib/data/clp-service';
import { TUY_BARANGAYS } from '@/lib/data/mock-data';
import {
  calculateDemographics,
  computeAgeString,
  computeYearsMarried,
  getCoupleAgeBracketKey,
  REPORT_AGE_BRACKETS,
} from '@/lib/reports/reportHelpers';
import { generateComprehensivePdfReport } from '@/lib/reports/generateComprehensivePdfReport';
import TuyParticipantsLeafletMap from '@/components/map/TuyParticipantsLeafletMap';
import {
  ArrowLeft,
  Download,
  Printer,
  Search,
  MapPin,
  Heart,
  Phone,
  Compass,
  ExternalLink,
  Users,
  Map as MapIcon,
  Table as TableIcon,
  BarChart3,
  Calendar,
  Layers,
  Crosshair,
  Filter,
  RotateCcw,
  Sparkles,
  PieChart as PieChartIcon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Navigation,
} from 'lucide-react';

function CLPReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedClpId = searchParams.get('clpId') || '';

  // Data State
  const [programs, setPrograms] = useState<CLPProgram[]>([]);
  const [couples, setCouples] = useState<CLPCouple[]>([]);
  const [selectedClpId, setSelectedClpId] = useState<string>(requestedClpId);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // View Controls
  const [reportViewMode, setReportViewMode] = useState<'split' | 'map' | 'tables' | 'charts'>(
    'split'
  );
  const [tableLayoutMode, setTableLayoutMode] = useState<'separate' | 'unified'>('separate');
  const [selectedCoupleId, setSelectedCoupleId] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgeBracket, setFilterAgeBracket] = useState<string>('ALL');
  const [filterBarangay, setFilterBarangay] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'hAge-asc' | 'hAge-desc' | 'brgy-asc'>('name-asc');

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Initial Fetch
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [progs, allCouples] = await Promise.all([
          fetchCLPPrograms(),
          fetchCLPCouples(),
        ]);

        setPrograms(progs);
        setCouples(allCouples);

        if (requestedClpId) {
          setSelectedClpId(requestedClpId);
        } else if (progs.length > 0) {
          setSelectedClpId(progs[0].id);
        }
      } catch (err) {
        console.error('Failed to load CLP report data:', err);
        triggerToast('Could not load CLP data. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [requestedClpId]);

  // Active Program
  const currentClp = useMemo(() => {
    return programs.find((p) => p.id === selectedClpId) || programs[0] || null;
  }, [programs, selectedClpId]);

  // Program's Couples
  const currentCouples = useMemo(() => {
    if (!currentClp) return [];
    return couples.filter((c) => c.clpId === currentClp.id);
  }, [couples, currentClp]);

  // Demographics calculation
  const demographics = useMemo(() => {
    return calculateDemographics(currentCouples);
  }, [currentCouples]);

  // Filtered and Sorted Couples
  const filteredCouples = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = currentCouples.filter((c) => {
      const matchesSearch =
        !q ||
        c.husbandFirstName.toLowerCase().includes(q) ||
        c.husbandLastName.toLowerCase().includes(q) ||
        c.wifeFirstName.toLowerCase().includes(q) ||
        c.wifeLastName.toLowerCase().includes(q) ||
        c.barangay.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.husbandContact && c.husbandContact.includes(q)) ||
        (c.wifeContact && c.wifeContact.includes(q));

      const matchesBarangay = filterBarangay === 'ALL' || c.barangay === filterBarangay;
      const matchesStatus = filterStatus === 'ALL' || (c.status || 'Active') === filterStatus;

      let matchesAge = true;
      if (filterAgeBracket !== 'ALL') {
        const hB = getCoupleAgeBracketKey(c.husbandBirthday);
        const wB = getCoupleAgeBracketKey(c.wifeBirthday);
        matchesAge = hB === filterAgeBracket || wB === filterAgeBracket;
      }

      return matchesSearch && matchesBarangay && matchesStatus && matchesAge;
    });

    return list.sort((a, b) => {
      if (sortBy === 'name-asc') {
        const cmp = a.husbandLastName.localeCompare(b.husbandLastName);
        return cmp !== 0 ? cmp : a.husbandFirstName.localeCompare(b.husbandFirstName);
      }
      if (sortBy === 'name-desc') {
        const cmp = b.husbandLastName.localeCompare(a.husbandLastName);
        return cmp !== 0 ? cmp : b.husbandFirstName.localeCompare(a.husbandFirstName);
      }
      if (sortBy === 'hAge-asc') {
        const ageA = cAge(a.husbandBirthday) ?? 999;
        const ageB = cAge(b.husbandBirthday) ?? 999;
        return ageA - ageB;
      }
      if (sortBy === 'hAge-desc') {
        const ageA = cAge(a.husbandBirthday) ?? -1;
        const ageB = cAge(b.husbandBirthday) ?? -1;
        return ageB - ageA;
      }
      if (sortBy === 'brgy-asc') {
        return a.barangay.localeCompare(b.barangay);
      }
      return 0;
    });
  }, [currentCouples, searchQuery, filterAgeBracket, filterBarangay, filterStatus, sortBy]);

  // Selected couple
  const selectedCouple = useMemo(() => {
    if (!selectedCoupleId) return filteredCouples[0] || null;
    return filteredCouples.find((c) => c.id === selectedCoupleId) || filteredCouples[0] || null;
  }, [selectedCoupleId, filteredCouples]);

  function cAge(bday?: string): number | null {
    if (!bday) return null;
    const b = new Date(bday);
    if (isNaN(b.getTime())) return null;
    const t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
    return age;
  }

  // Handle PDF Generation
  const handleDownloadPDF = async () => {
    if (!currentClp || !currentCouples.length) {
      triggerToast('No invitee data to generate report.');
      return;
    }
    setIsGeneratingPdf(true);
    try {
      await generateComprehensivePdfReport({
        currentClp,
        couples: currentCouples,
        filteredCouples,
        filterAgeBracket,
        filterBarangay,
        filterStatus,
        onToast: triggerToast,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterAgeBracket('ALL');
    setFilterBarangay('ALL');
    setFilterStatus('ALL');
    setSortBy('name-asc');
  };

  const isAnyFilterActive =
    searchQuery.trim() !== '' ||
    filterAgeBracket !== 'ALL' ||
    filterBarangay !== 'ALL' ||
    filterStatus !== 'ALL' ||
    sortBy !== 'name-asc';

  // Group couples by age bracket for the "Separate Tables" view
  const couplesByAgeBracket = useMemo(() => {
    const groups: Record<string, CLPCouple[]> = {
      '20-30': [],
      '31-40': [],
      '41-50': [],
      '51-60': [],
      '61-plus': [],
      unknown: [],
    };

    filteredCouples.forEach((c) => {
      const hBracket = getCoupleAgeBracketKey(c.husbandBirthday);
      const wBracket = getCoupleAgeBracketKey(c.wifeBirthday);
      const chosen = hBracket !== 'unknown' ? hBracket : wBracket;
      if (groups[chosen]) {
        groups[chosen].push(c);
      } else {
        groups.unknown.push(c);
      }
    });

    return groups;
  }, [filteredCouples]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-600">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-800">Loading Comprehensive Invitee Report...</p>
        <p className="text-xs text-slate-500 mt-1">Gathering demographics, age groups, and map plots...</p>
      </div>
    );
  }

  if (!currentClp) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-amber-100 text-amber-900 rounded-2xl mb-4 font-bold max-w-md">
          No Christian Life Program batch found.
        </div>
        <Link
          href="/admin/clp"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to CLP Admin</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/20 text-xs font-extrabold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOP COMMAND HEADER BAR                                                */}
      {/* ===================================================================== */}
      <header className="bg-[#243c81] text-white border-b-2 border-amber-500 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Back Link & Title */}
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/clp?clpId=${currentClp.id}`}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 shrink-0"
              title="Return to CLP Dashboard"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Back to CLP</span>
            </Link>

            <div className="h-6 w-px bg-white/20 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  Report
                </span>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate max-w-[260px] sm:max-w-md">
                  Total Invitee Comprehensive Report
                </h1>
              </div>
              <p className="text-[11px] text-blue-200 truncate mt-0.5">
                {currentClp.name} • {currentClp.venue || 'Tuy, Batangas'} • {currentCouples.length} Couples ({currentCouples.length * 2} Individuals)
              </p>
            </div>
          </div>

          {/* Right: Batch Switcher & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            {/* Batch Selector */}
            {programs.length > 1 && (
              <div className="relative">
                <select
                  value={selectedClpId}
                  onChange={(e) => setSelectedClpId(e.target.value)}
                  className="bg-white/15 hover:bg-white/20 text-white border border-white/20 rounded-xl px-3 py-1.5 text-xs font-bold appearance-none pr-7 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id} className="text-slate-900 bg-white">
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-white/70 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="bg-black/30 p-1 rounded-xl border border-white/10 flex items-center gap-0.5 text-xs">
              <button
                type="button"
                onClick={() => setReportViewMode('split')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  reportViewMode === 'split'
                    ? 'bg-white text-[#243c81] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
                title="Split Map & Roster View"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Split View</span>
              </button>

              <button
                type="button"
                onClick={() => setReportViewMode('map')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  reportViewMode === 'map'
                    ? 'bg-white text-[#243c81] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
                title="Full-Screen Plotted Map"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Plotted Map</span>
              </button>

              <button
                type="button"
                onClick={() => setReportViewMode('tables')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  reportViewMode === 'tables'
                    ? 'bg-white text-[#243c81] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
                title="Age Bracket Tables"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Tables</span>
              </button>

              <button
                type="button"
                onClick={() => setReportViewMode('charts')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  reportViewMode === 'charts'
                    ? 'bg-white text-[#243c81] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
                title="Graphs & Analytics"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Analytics</span>
              </button>
            </div>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="h-8.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50"
              title="Download Comprehensive PDF (Includes Graphs, Pie Chart, Map & Age Tables)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="h-8.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition-all active:scale-95"
              title="Print Report"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* KPI METRIC STAT CARDS                                                 */}
      {/* ===================================================================== */}
      <section className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shadow-2xs">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Couples */}
          <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Invitees
              </span>
              <span className="text-lg font-black text-slate-900 block leading-tight">
                {demographics.totalCouples} Couples
              </span>
              <span className="text-[10px] text-blue-700 font-semibold">
                {demographics.totalIndividuals} individuals
              </span>
            </div>
          </div>

          {/* Active Status */}
          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Active Rate
              </span>
              <span className="text-lg font-black text-slate-900 block leading-tight">
                {demographics.totalCouples > 0
                  ? Math.round((demographics.activeCouplesCount / demographics.totalCouples) * 100)
                  : 0}
                %
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">
                {demographics.activeCouplesCount} active couples
              </span>
            </div>
          </div>

          {/* Average Age */}
          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Average Age
              </span>
              <span className="text-lg font-black text-slate-900 block leading-tight">
                {demographics.avgOverallAge ? `${demographics.avgOverallAge} yrs` : '—'}
              </span>
              <span className="text-[10px] text-amber-800 font-semibold">
                H: {demographics.avgHusbandAge || '—'} · W: {demographics.avgWifeAge || '—'}
              </span>
            </div>
          </div>

          {/* Tuy Barangays */}
          <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Tuy Barangays
              </span>
              <span className="text-lg font-black text-slate-900 block leading-tight">
                {demographics.sortedBarangays.length} Areas
              </span>
              <span className="text-[10px] text-indigo-700 font-semibold truncate block max-w-[110px]">
                Top: {demographics.sortedBarangays[0]?.name || 'Tuy'}
              </span>
            </div>
          </div>

          {/* Anniversaries */}
          <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Anniversaries
              </span>
              <span className="text-lg font-black text-slate-900 block leading-tight">
                {currentCouples.filter((c) => c.weddingAnniversary).length}
              </span>
              <span className="text-[10px] text-rose-700 font-semibold">Marriages tracked</span>
            </div>
          </div>

          {/* Filter Scope Result */}
          <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shrink-0">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Active Display
              </span>
              <span className="text-lg font-black text-purple-950 block leading-tight">
                {filteredCouples.length} Couples
              </span>
              <span className="text-[10px] text-purple-700 font-semibold">
                {filteredCouples.length * 2} individuals
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* FILTER & AGE BRACKET PILLS BAR                                        */}
      {/* ===================================================================== */}
      <section className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 sticky top-[61px] z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
          {/* Row 1: Age Bracket Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Age Brackets:</span>
            </span>

            {/* All Groups Pill */}
            <button
              type="button"
              onClick={() => setFilterAgeBracket('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                filterAgeBracket === 'ALL'
                  ? 'bg-[#243c81] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>All Age Groups</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                {demographics.totalIndividuals}
              </span>
            </button>

            {/* Bracket Pills */}
            {REPORT_AGE_BRACKETS.map((b) => {
              const stat = demographics.bracketCounts[b.key] || { total: 0 };
              const isSelected = filterAgeBracket === b.key;

              return (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setFilterAgeBracket(b.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : `${b.badgeBg} ${b.badgeText} ${b.badgeBorder} hover:brightness-95`
                  }`}
                >
                  <span>{b.label}</span>
                  <span className="text-[10px] opacity-75 hidden sm:inline">({b.sublabel})</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-black/10'
                    }`}
                  >
                    {stat.total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Row 2: Search Query, Barangay, Status & Sort */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invitee name, phone, barangay, address..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-medium placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Barangay Filter */}
            <select
              value={filterBarangay}
              onChange={(e) => setFilterBarangay(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Barangays ({TUY_BARANGAYS.length})</option>
              {TUY_BARANGAYS.map((brgy) => {
                const count = currentCouples.filter((c) => c.barangay === brgy).length;
                return (
                  <option key={brgy} value={brgy}>
                    Brgy. {brgy} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Graduation">Graduation</option>
              <option value="Returnee">Returnee</option>
              <option value="At-Risk">At-Risk</option>
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 ml-auto"
            >
              <option value="name-asc">Sort: Name (A–Z)</option>
              <option value="name-desc">Sort: Name (Z–A)</option>
              <option value="hAge-asc">Sort: Age (Youngest)</option>
              <option value="hAge-desc">Sort: Age (Eldest)</option>
              <option value="brgy-asc">Sort: Barangay (A–Z)</option>
            </select>

            {/* Reset Filters */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* MAIN VIEW CONTENT CONTAINER                                           */}
      {/* ===================================================================== */}
      <main className="flex-1 flex flex-col overflow-hidden max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* ------------------------------------------------------------------- */}
        {/* VIEW MODE: SPLIT (MAP ON LEFT/TOP, ROSTER ON RIGHT)                */}
        {/* ------------------------------------------------------------------- */}
        {reportViewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
            {/* Left Column: Interactive Leaflet Map (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px] lg:h-auto min-h-[420px]">
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs font-bold shrink-0">
                <span className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <span>Plotted Participant Pins ({filteredCouples.length})</span>
                </span>
                <span className="text-[11px] text-slate-300 font-mono">Tuy, Batangas</span>
              </div>

              {/* Map Canvas */}
              <div className="flex-1 w-full relative">
                <TuyParticipantsLeafletMap
                  couples={filteredCouples}
                  selectedCoupleId={selectedCoupleId}
                  onSelectCouple={(c) => setSelectedCoupleId(c.id)}
                />
              </div>

              {/* Selected Couple Quick Info Card at Map Footer */}
              {selectedCouple && (
                <div className="p-3.5 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 truncate">
                        Bro. {selectedCouple.husbandFirstName} &amp; Sis. {selectedCouple.wifeFirstName} {selectedCouple.husbandLastName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black shrink-0">
                        Brgy. {selectedCouple.barangay}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Husband: {computeAgeString(selectedCouple.husbandBirthday)} yrs · Wife: {computeAgeString(selectedCouple.wifeBirthday)} yrs
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCouple.coordinates ? selectedCouple.coordinates[1] : 0},${selectedCouple.coordinates ? selectedCouple.coordinates[0] : 0}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs shrink-0 flex items-center gap-1"
                  >
                    <span>Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Right Column: Roster Tables with "Separate Tables" toggle (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-blue-600" />
                    <span>Participant Roster Directory</span>
                    <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 text-xs font-black">
                      {filteredCouples.length} couples
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Click any couple row to pinpoint and inspect their location on the map.
                  </p>
                </div>

                {/* Table Layout Toggle */}
                <div className="bg-slate-200 p-0.5 rounded-xl flex items-center text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTableLayoutMode('separate')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      tableLayoutMode === 'separate'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    By Age Bracket
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableLayoutMode('unified')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      tableLayoutMode === 'unified'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Unified List
                  </button>
                </div>
              </div>

              {/* Table Body Area */}
              <div className="flex-1 overflow-y-auto max-h-[640px] p-4">
                {tableLayoutMode === 'separate' ? (
                  /* Separate Tables for each Age Bracket */
                  <div className="space-y-6">
                    {REPORT_AGE_BRACKETS.map((bracket) => {
                      const bracketCouples = couplesByAgeBracket[bracket.key] || [];
                      if (!bracketCouples.length) return null;

                      return (
                        <div
                          key={bracket.key}
                          className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
                        >
                          {/* Bracket Section Header */}
                          <div className={`p-3 border-b flex items-center justify-between ${bracket.badgeBg}`}>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: bracket.accentColor }}
                              />
                              <span className="font-extrabold text-sm text-slate-900">
                                {bracket.label} ({bracket.sublabel})
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                • {bracket.range}
                              </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-lg bg-white/90 text-slate-900 font-black text-xs border border-slate-200">
                              {bracketCouples.length} couples ({bracketCouples.length * 2} individuals)
                            </span>
                          </div>

                          {/* Table for this bracket */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                                <tr>
                                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                                  <th className="py-2.5 px-3">Invitee Couple</th>
                                  <th className="py-2.5 px-3">Husband Details</th>
                                  <th className="py-2.5 px-3">Wife Details</th>
                                  <th className="py-2.5 px-3">Barangay &amp; Address</th>
                                  <th className="py-2.5 px-3 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {bracketCouples.map((c, idx) => {
                                  const isSelected = selectedCouple?.id === c.id;
                                  const hAge = computeAgeString(c.husbandBirthday);
                                  const wAge = computeAgeString(c.wifeBirthday);

                                  return (
                                    <tr
                                      key={c.id}
                                      onClick={() => setSelectedCoupleId(c.id)}
                                      className={`cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'bg-amber-50 hover:bg-amber-100/70 font-semibold'
                                          : 'hover:bg-slate-50'
                                      }`}
                                    >
                                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                                        {idx + 1}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <div className="font-bold text-slate-900">
                                          Bro. {c.husbandFirstName} &amp; Sis. {c.wifeFirstName}
                                        </div>
                                        <div className="text-[11px] text-blue-700 font-semibold">
                                          {c.husbandLastName}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <span className="font-semibold text-slate-800">{c.husbandFirstName}</span>
                                        <div className="text-[11px] text-slate-500">
                                          Age: <strong>{hAge} yrs</strong>
                                        </div>
                                        {c.husbandContact && (
                                          <div className="text-[11px] text-slate-500 font-mono">
                                            📞 {c.husbandContact}
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <span className="font-semibold text-slate-800">{c.wifeFirstName}</span>
                                        <div className="text-[11px] text-slate-500">
                                          Age: <strong>{wAge} yrs</strong>
                                        </div>
                                        {c.wifeContact && (
                                          <div className="text-[11px] text-slate-500 font-mono">
                                            📞 {c.wifeContact}
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <span className="font-bold text-slate-800">
                                          Brgy. {c.barangay}
                                        </span>
                                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                          {c.address || 'Tuy, Batangas'}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                          {c.status || 'Active'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Unified Master Table */
                  <div className="rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#243c81] text-white font-bold">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center">#</th>
                          <th className="py-2.5 px-3">Invitee Couple</th>
                          <th className="py-2.5 px-3">Husband Details</th>
                          <th className="py-2.5 px-3">Wife Details</th>
                          <th className="py-2.5 px-3">Anniversary</th>
                          <th className="py-2.5 px-3">Address &amp; Barangay</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCouples.map((c, idx) => {
                          const isSelected = selectedCouple?.id === c.id;
                          const hAge = computeAgeString(c.husbandBirthday);
                          const wAge = computeAgeString(c.wifeBirthday);

                          return (
                            <tr
                              key={c.id}
                              onClick={() => setSelectedCoupleId(c.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-amber-50 hover:bg-amber-100/70 font-semibold' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">
                                  Bro. {c.husbandFirstName} &amp; Sis. {c.wifeFirstName}
                                </div>
                                <div className="text-[11px] text-blue-700 font-semibold">{c.husbandLastName}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div>{c.husbandFirstName}</div>
                                <span className="text-[11px] text-slate-500 font-medium">Age: {hAge} yrs</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div>{c.wifeFirstName}</div>
                                <span className="text-[11px] text-slate-500 font-medium">Age: {wAge} yrs</span>
                              </td>
                              <td className="py-2.5 px-3">
                                {c.weddingAnniversary ? (
                                  <div>
                                    <div className="text-rose-600 font-bold">♥ {c.weddingAnniversary}</div>
                                    <div className="text-[10px] text-slate-400">
                                      {computeYearsMarried(c.weddingAnniversary)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-800">Brgy. {c.barangay}</span>
                                <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                  {c.address || 'Tuy, Batangas'}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {c.status || 'Active'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW MODE: FULL PLOTTED MAP                                         */}
        {/* ------------------------------------------------------------------- */}
        {reportViewMode === 'map' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[720px]">
            <div className="p-4 bg-[#243c81] text-white flex items-center justify-between text-xs font-bold shrink-0">
              <span className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-black">
                  Tuy Municipal Geographic Directory • {filteredCouples.length} Pins Plotted
                </span>
              </span>
              <span className="text-xs text-blue-200">
                Saint Vincent Ferrer Parish • Municipality of Tuy, Batangas
              </span>
            </div>

            <div className="flex-1 w-full relative">
              <TuyParticipantsLeafletMap
                couples={filteredCouples}
                selectedCoupleId={selectedCoupleId}
                onSelectCouple={(c) => setSelectedCoupleId(c.id)}
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW MODE: FULL AGE BRACKET TABLES                                  */}
        {/* ------------------------------------------------------------------- */}
        {reportViewMode === 'tables' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-8">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Invitee Cohort Age Bracket Tables
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Separated tables organized by demographic age cohorts with full contact and location data.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export Tables to PDF</span>
              </button>
            </div>

            {/* Individual Tables per Age Bracket */}
            <div className="space-y-8">
              {REPORT_AGE_BRACKETS.map((bracket) => {
                const bCouples = couplesByAgeBracket[bracket.key] || [];

                return (
                  <div
                    key={bracket.key}
                    className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
                  >
                    {/* Header */}
                    <div className={`p-4 border-b flex items-center justify-between ${bracket.badgeBg}`}>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: bracket.accentColor }}
                        />
                        <h3 className="font-black text-base text-slate-900">
                          {bracket.label} ({bracket.sublabel})
                        </h3>
                        <span className="text-xs text-slate-600 font-medium">
                          • {bracket.range}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-white text-slate-900 font-black text-xs border border-slate-200 shadow-2xs">
                        {bCouples.length} Couples ({bCouples.length * 2} Individuals)
                      </span>
                    </div>

                    {/* Table */}
                    {bCouples.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4 w-10 text-center">#</th>
                              <th className="py-3 px-4">Couple Name</th>
                              <th className="py-3 px-4">Husband (Age &amp; Tel)</th>
                              <th className="py-3 px-4">Wife (Age &amp; Tel)</th>
                              <th className="py-3 px-4">Wedding Anniversary</th>
                              <th className="py-3 px-4">Barangay &amp; Address</th>
                              <th className="py-3 px-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {bCouples.map((c, idx) => (
                              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 text-center font-bold text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-extrabold text-slate-900 text-sm">
                                    Bro. {c.husbandFirstName} &amp; Sis. {c.wifeFirstName}
                                  </div>
                                  <div className="text-xs text-blue-700 font-bold">
                                    {c.husbandLastName}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-slate-800">{c.husbandFirstName}</div>
                                  <div className="text-xs text-slate-600 font-bold">
                                    Age: {computeAgeString(c.husbandBirthday)} yrs
                                  </div>
                                  {c.husbandContact && (
                                    <div className="text-[11px] text-slate-500 font-mono">
                                      📞 {c.husbandContact}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-slate-800">{c.wifeFirstName}</div>
                                  <div className="text-xs text-slate-600 font-bold">
                                    Age: {computeAgeString(c.wifeBirthday)} yrs
                                  </div>
                                  {c.wifeContact && (
                                    <div className="text-[11px] text-slate-500 font-mono">
                                      📞 {c.wifeContact}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {c.weddingAnniversary ? (
                                    <div>
                                      <div className="text-rose-600 font-bold">♥ {c.weddingAnniversary}</div>
                                      <div className="text-[10px] text-slate-400">
                                        {computeYearsMarried(c.weddingAnniversary)}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-bold text-slate-800 text-xs">
                                    Brgy. {c.barangay}
                                  </span>
                                  <div className="text-xs text-slate-500">
                                    {c.address || 'Tuy, Batangas'}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    {c.status || 'Active'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 font-medium">
                        No participants registered under {bracket.label} ({bracket.sublabel}).
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW MODE: GRAPHS & ANALYTICS CHARTS                                */}
        {/* ------------------------------------------------------------------- */}
        {reportViewMode === 'charts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Age Bracket Distribution Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <span>Age Bracket Distribution</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Husband and Wife headcounts across demographic age brackets
                    </p>
                  </div>
                </div>

                <div className="space-y-4 flex-1 flex flex-col justify-around pt-2">
                  {REPORT_AGE_BRACKETS.map((b) => {
                    const stats = demographics.bracketCounts[b.key] || {
                      husbands: 0,
                      wives: 0,
                      total: 0,
                      percentage: 0,
                    };
                    const maxVal = Math.max(
                      ...REPORT_AGE_BRACKETS.map((x) => demographics.bracketCounts[x.key]?.total || 0),
                      1
                    );
                    const pctBar = (stats.total / maxVal) * 100;

                    return (
                      <div key={b.key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            {b.label} <span className="text-slate-400 font-normal">({b.sublabel})</span>
                          </span>
                          <span className="font-black text-slate-900">
                            {stats.total} individuals · {stats.percentage}%
                          </span>
                        </div>
                        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            style={{
                              width: `${pctBar}%`,
                              backgroundColor: b.accentColor,
                            }}
                            className="h-full rounded-full transition-all duration-500"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          <span>Husbands: {stats.husbands}</span>
                          <span>Wives: {stats.wives}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Geographic Representation Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-amber-500" />
                      <span>Tuy Geographic Representation</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Distribution of registered couples by Barangay
                    </p>
                  </div>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
                  {demographics.sortedBarangays.map((bg, idx) => (
                    <div
                      key={bg.name}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-black text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">Brgy. {bg.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {bg.count * 2} total individuals
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-blue-900 text-sm block">
                          {bg.count} couples
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {bg.percentage}% of cohort
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CLPReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600">Loading Report...</p>
          </div>
        </div>
      }
    >
      <CLPReportContent />
    </Suspense>
  );
}
