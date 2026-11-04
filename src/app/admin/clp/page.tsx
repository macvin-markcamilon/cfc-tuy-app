'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpenCheck,
  Plus,
  Users,
  Calendar,
  MapPin,
  Clock,
  UserCheck,
  CheckCircle2,
  Search,
  Check,
  X,
  Trash2,
  AlertCircle,
  Sparkles,
  BarChart3,
  Filter,
  ArrowUpDown,
  Lock,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Layers,
  Map,
} from 'lucide-react';
import { CLPProgram, CLPCouple, CLPTalk } from '@/types';
import {
  fetchCLPPrograms,
  saveCLPProgram,
  deleteCLPProgram,
  fetchCLPCouples,
  fetchCLPTalks,
  populateStandardTalksForCLP,
  generateUUID,
} from '@/lib/data/clp-service';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

const STANDARD_CHAPTERS = [
  'Tuy Chapter',
  'Balayan Chapter',
  'Calaca Chapter',
  'Nasugbu Chapter',
  'Lian Chapter',
  'Calatagan Chapter',
  'Lemery Chapter',
];

export default function CLPOverviewPage() {
  const router = useRouter();
  const { user: currentUser, isAdmin, isMember } = useCurrentUser();

  // Data State
  const [programs, setPrograms] = useState<CLPProgram[]>([]);
  const [couples, setCouples] = useState<CLPCouple[]>([]);
  const [talks, setTalks] = useState<CLPTalk[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [chapterFilter, setChapterFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'batch' | 'chapter' | 'couples'>('newest');

  // Add CLP Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<CLPProgram | null>(null);
  const [formName, setFormName] = useState('');
  const [formBatchNumber, setFormBatchNumber] = useState('');
  const [formChapterSelection, setFormChapterSelection] = useState('Tuy Chapter');
  const [formCustomChapter, setFormCustomChapter] = useState('');
  const [formVenue, setFormVenue] = useState('Saint Vincent Ferrer Parish Hall | Tuy, Batangas');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<'Upcoming' | 'Ongoing' | 'Completed'>('Upcoming');
  const [formTeamLeader, setFormTeamLeader] = useState('Bro. Mark & Sis. Grace Camilon');
  const [autoPopulateTalks, setAutoPopulateTalks] = useState(true);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [loadedProgs, loadedCouples, loadedTalks] = await Promise.all([
        fetchCLPPrograms(),
        fetchCLPCouples(),
        fetchCLPTalks(),
      ]);
      setPrograms(loadedProgs);
      setCouples(loadedCouples);
      setTalks(loadedTalks);
    } catch (err) {
      console.error('Failed to load CLP overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    setEditingProgram(null);
    setFormName(`CFC Tuy CLP Batch ${programs.length + 1}`);
    setFormBatchNumber(`Batch ${programs.length + 1}`);
    setFormChapterSelection('Tuy Chapter');
    setFormCustomChapter('');
    setFormVenue('Saint Vincent Ferrer Parish Hall | Tuy, Batangas');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    
    // Default 8-week program end date
    const d = new Date();
    d.setDate(d.getDate() + 56);
    setFormEndDate(d.toISOString().split('T')[0]);
    
    setFormStatus('Upcoming');
    setFormTeamLeader('Bro. Mark & Sis. Grace Camilon');
    setAutoPopulateTalks(true);
    setModalError(null);
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (p: CLPProgram, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProgram(p);
    setFormName(p.name);
    setFormBatchNumber(p.batchNumber || '');
    
    const chapterVal = p.chapter || 'Tuy Chapter';
    if (STANDARD_CHAPTERS.includes(chapterVal)) {
      setFormChapterSelection(chapterVal);
      setFormCustomChapter('');
    } else {
      setFormChapterSelection('Other');
      setFormCustomChapter(chapterVal);
    }

    setFormVenue(p.venue);
    setFormStartDate(p.startDate);
    setFormEndDate(p.endDate);
    setFormStatus(p.status || 'Upcoming');
    setFormTeamLeader(p.teamLeader || 'Bro. Mark & Sis. Grace Camilon');
    setAutoPopulateTalks(false);
    setModalError(null);
    setShowAddModal(true);
  };

  // Save Program (Create or Update)
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formStartDate || !formEndDate) {
      setModalError('Please fill in program name, start date, and end date.');
      return;
    }

    const finalChapter =
      formChapterSelection === 'Other'
        ? formCustomChapter.trim() || 'Other Chapter'
        : formChapterSelection;

    setModalSubmitting(true);
    setModalError(null);

    try {
      const progId = editingProgram ? editingProgram.id : generateUUID();
      const payload: CLPProgram = {
        id: progId,
        name: formName.trim(),
        batchNumber: formBatchNumber.trim() || `Batch ${programs.length + 1}`,
        chapter: finalChapter,
        venue: formVenue.trim(),
        startDate: formStartDate,
        endDate: formEndDate,
        status: formStatus,
        teamLeader: formTeamLeader.trim() || 'Bro. Mark & Sis. Grace Camilon',
        couplesCount: editingProgram ? editingProgram.couplesCount : 0,
        talksCount: autoPopulateTalks ? 8 : editingProgram?.talksCount || 0,
      };

      const saved = await saveCLPProgram(payload);

      // Auto-populate 8 revised CFC talks if newly created and requested
      if (!editingProgram && autoPopulateTalks) {
        try {
          await populateStandardTalksForCLP(saved.id, saved.startDate, saved.venue);
        } catch (talkErr) {
          console.warn('Notice creating standard talks:', talkErr);
        }
      }

      setShowAddModal(false);
      showToast(
        editingProgram
          ? `✓ Program "${saved.name}" updated successfully!`
          : `✓ Program "${saved.name}" (${saved.chapter}) created successfully!`
      );
      loadData();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save CLP program.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete Program
  const handleDeleteProgram = async (p: CLPProgram, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${p.name}"? This will delete all its registered couples and scheduled talks.`)) {
      return;
    }

    try {
      await deleteCLPProgram(p.id);
      showToast(`Program "${p.name}" deleted.`);
      loadData();
    } catch (err: any) {
      alert(`Failed to delete program: ${err?.message || 'Unknown error'}`);
    }
  };

  // Unique chapters present in current data + standard chapters
  const availableChapters = useMemo(() => {
    const set = new Set<string>(STANDARD_CHAPTERS);
    programs.forEach((p) => {
      if (p.chapter) set.add(p.chapter);
    });
    return Array.from(set);
  }, [programs]);

  // Filtered & Sorted Programs
  const filteredPrograms = useMemo(() => {
    return programs
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.batchNumber && p.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.chapter && p.chapter.toLowerCase().includes(searchQuery.toLowerCase())) ||
          p.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.teamLeader.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesChapter =
          chapterFilter === 'ALL' || (p.chapter || 'Tuy Chapter') === chapterFilter;

        const matchesStatus =
          statusFilter === 'ALL' || p.status === statusFilter;

        return matchesSearch && matchesChapter && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        }
        if (sortBy === 'batch') {
          return (a.batchNumber || a.name).localeCompare(b.batchNumber || b.name, undefined, {
            numeric: true,
          });
        }
        if (sortBy === 'chapter') {
          return (a.chapter || 'Tuy').localeCompare(b.chapter || 'Tuy');
        }
        if (sortBy === 'couples') {
          const countA = couples.filter((c) => c.clpId === a.id).length;
          const countB = couples.filter((c) => c.clpId === b.id).length;
          return countB - countA;
        }
        return 0;
      });
  }, [programs, couples, searchQuery, chapterFilter, statusFilter, sortBy]);

  // Overall Statistics
  const totalCouplesCount = couples.length;
  const ongoingBatchesCount = programs.filter((p) => p.status === 'Ongoing').length;
  const upcomingBatchesCount = programs.filter((p) => p.status === 'Upcoming').length;
  const completedBatchesCount = programs.filter((p) => p.status === 'Completed').length;

  return (
    <div className="space-y-6 pb-14 min-w-0 w-full max-w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom duration-300 font-bold text-sm">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#243c81] via-[#1c3066] to-[#14234d] p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-white/10">
              Christian Life Program (CLP)
            </span>
            <span className="text-white/60 text-xs">CFC Batangas Area 4</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">CLP Batches &amp; Programs</h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Select any CLP batch below to manage invited couples, take weekly talk attendance, generate demographic reports, and organize discussion circles.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={handleOpenAddModal}
            className="relative z-10 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#243c81] font-black text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New CLP</span>
          </button>
        ) : (
          <div className="relative z-10 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 text-white text-xs font-bold border border-white/20 shrink-0">
            <Lock className="w-4 h-4 text-amber-300" />
            <span>Member Mode (View Only)</span>
          </div>
        )}
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Batches</p>
            <BookOpenCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{programs.length}</p>
          <p className="text-xs text-slate-400 mt-1">Across all chapters</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Ongoing Batches</p>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{ongoingBatchesCount}</p>
          <p className="text-xs text-emerald-600/80 mt-1">Currently meeting</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Upcoming Batches</p>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{upcomingBatchesCount}</p>
          <p className="text-xs text-amber-600/80 mt-1">Registration in progress</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#243c81]">Invited Couples</p>
            <Users className="w-4 h-4 text-[#243c81]" />
          </div>
          <p className="text-2xl font-black text-[#243c81] mt-1">{totalCouplesCount}</p>
          <p className="text-xs text-slate-400 mt-1">Total across all batches</p>
        </div>
      </div>

      {/* Filter, Search & Sort Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search batch name, chapter, venue, team leader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 lg:pb-0 flex-wrap sm:flex-nowrap">
          {/* Chapter Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold">Chapter:</span>
          </div>
          <select
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] shrink-0"
          >
            <option value="ALL">All Chapters</option>
            {availableChapters.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 ml-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] shrink-0"
          >
            <option value="ALL">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 ml-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold">Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] shrink-0"
          >
            <option value="newest">Start Date (Newest first)</option>
            <option value="oldest">Start Date (Oldest first)</option>
            <option value="batch">Batch Number / Name</option>
            <option value="chapter">Chapter Name (A to Z)</option>
            <option value="couples">Most Couples Enrolled</option>
          </select>
        </div>
      </div>

      {/* CLP Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-500">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Loading CLP batches...</p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
          <BookOpenCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-base">No CLP batches match your search criteria</p>
          <p className="text-xs text-slate-400 mt-1">Try clearing your filters or add a new CLP batch.</p>
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#243c81] text-white text-xs font-bold hover:bg-[#1a2c60]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New CLP Batch</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPrograms.map((p) => {
            const batchCouples = couples.filter((c) => c.clpId === p.id);
            const batchTalks = talks.filter((t) => t.clpId === p.id);
            const couplesCount = batchCouples.length;
            const talksCount = batchTalks.length > 0 ? batchTalks.length : p.talksCount || 8;

            const isOngoing = p.status === 'Ongoing';
            const isCompleted = p.status === 'Completed';

            return (
              <div
                key={p.id}
                onClick={() => router.push(`/admin/clp/${p.id}`)}
                className="group bg-white rounded-3xl border border-slate-200/90 hover:border-blue-400 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden relative"
              >
                {/* Top Colored Accent Bar */}
                <div
                  className={`h-2 w-full ${
                    isOngoing
                      ? 'bg-emerald-500'
                      : isCompleted
                      ? 'bg-slate-400'
                      : 'bg-amber-400'
                  }`}
                />

                <div className="p-5 sm:p-6 space-y-4 flex-1">
                  {/* Badges: Chapter + Status + Batch Tag */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200/80">
                      {p.chapter || 'Tuy Chapter'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                          isOngoing
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isCompleted
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {p.status}
                      </span>
                      {p.batchNumber && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {p.batchNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Batch Title */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-[#243c81] transition-colors leading-snug">
                      {p.name}
                    </h3>
                  </div>

                  {/* Details List */}
                  <div className="space-y-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{p.venue}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">
                        {p.startDate} to {p.endDate}
                      </span>
                    </div>

                    {p.teamLeader && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-500 truncate">
                          Leader: <strong className="text-slate-700 font-semibold">{p.teamLeader}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metric Stat Chips */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Invited Couples</p>
                      <p className="text-lg font-black text-[#243c81] mt-0.5">{couplesCount}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">CLP Talks</p>
                      <p className="text-lg font-black text-amber-900 mt-0.5">{talksCount}</p>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 mt-auto flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#243c81] group-hover:text-blue-700 group-hover:translate-x-1 transition-all">
                    <span>Manage CLP Batch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEditModal(p, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        title="Edit Batch Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProgram(p, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit CLP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#243c81] flex items-center justify-center">
                  <BookOpenCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900">
                    {editingProgram ? 'Edit CLP Batch' : 'Create New Christian Life Program'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingProgram
                      ? 'Modify batch venue, chapter, or date schedule'
                      : 'Set up a new CLP batch and schedule standard talks'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold text-base"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProgram} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  CLP Program Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CFC Tuy CLP Batch 5"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Batch Tag / Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Batch 5"
                    value={formBatchNumber}
                    onChange={(e) => setFormBatchNumber(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Chapter <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formChapterSelection}
                    onChange={(e) => setFormChapterSelection(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                  >
                    {STANDARD_CHAPTERS.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}
                      </option>
                    ))}
                    <option value="Other">Other / Custom Chapter...</option>
                  </select>
                </div>
              </div>

              {formChapterSelection === 'Other' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-[11px] font-bold text-amber-800 mb-1">
                    Specify Custom Chapter Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Batangas City Chapter"
                    value={formCustomChapter}
                    onChange={(e) => setFormCustomChapter(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-300 bg-amber-50/70 text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Venue Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saint Vincent Ferrer Parish Hall | Tuy, Batangas"
                  value={formVenue}
                  onChange={(e) => setFormVenue(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#243c81]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#243c81]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Program Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-[#243c81]"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Team Leader
                  </label>
                  <input
                    type="text"
                    value={formTeamLeader}
                    onChange={(e) => setFormTeamLeader(e.target.value)}
                    placeholder="Bro. Mark & Sis. Grace Camilon"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#243c81]"
                  />
                </div>
              </div>

              {!editingProgram && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="autoTalks"
                    checked={autoPopulateTalks}
                    onChange={(e) => setAutoPopulateTalks(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="autoTalks" className="text-xs text-slate-800 font-bold cursor-pointer">
                    Auto-create the 8 Revised CFC CLP Talks weekly
                    <span className="block text-[11px] text-slate-600 font-normal mt-0.5">
                      Generates Module 1 (The Basic Truths about Christianity) and Module 2 (The Christian Life) talk schedules.
                    </span>
                  </label>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  disabled={modalSubmitting}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {modalSubmitting ? 'Saving...' : editingProgram ? 'Save Changes' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
