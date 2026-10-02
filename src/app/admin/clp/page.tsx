'use client';

import React, { useState, useEffect } from 'react';
import { TUY_BARANGAYS } from '@/lib/data/mock-data';
import { CLPProgram, CLPCouple, CLPTalk, CLPAttendance } from '@/types';
import TuyMapPicker from '@/components/map/TuyMapPicker';
import {
  fetchCLPPrograms,
  saveCLPProgram,
  deleteCLPProgram,
  fetchCLPCouples,
  saveCLPCouple,
  deleteCLPCouple,
  fetchCLPTalks,
  saveCLPTalk,
  populateStandardTalksForCLP,
  fetchCLPAttendance,
  saveCLPAttendance,
} from '@/lib/data/clp-service';
import {
  BookOpenCheck,
  Plus,
  Users,
  Calendar,
  MapPin,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Briefcase,
  Cake,
  Heart,
  Search,
  Check,
  X,
  Compass,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  Trash2,
  AlertCircle,
  Sparkles,
  Mail,
} from 'lucide-react';

export default function CLPAdminPage() {
  // Programs State
  const [programs, setPrograms] = useState<CLPProgram[]>([]);
  const [selectedClpId, setSelectedClpId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Couples State
  const [couples, setCouples] = useState<CLPCouple[]>([]);

  // Talks State
  const [talks, setTalks] = useState<CLPTalk[]>([]);

  // Attendance State
  const [attendance, setAttendance] = useState<CLPAttendance[]>([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'couples' | 'talks'>('couples');

  // Modals
  const [showAddClpModal, setShowAddClpModal] = useState(false);
  const [showAddCoupleModal, setShowAddCoupleModal] = useState(false);
  const [showAddTalkModal, setShowAddTalkModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Talk for Attendance Drawer/View
  const [selectedTalkId, setSelectedTalkId] = useState<string>('');

  // Search & Filter
  const [searchCoupleQuery, setSearchCoupleQuery] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('ALL');

  // Form states - New CLP
  const [newClpName, setNewClpName] = useState('');
  const [newClpVenue, setNewClpVenue] = useState('Saint Vincent Ferrer Parish Social Hall, Tuy');
  const [newClpStartDate, setNewClpStartDate] = useState('');
  const [newClpEndDate, setNewClpEndDate] = useState('');
  const [newClpBatchNumber, setNewClpBatchNumber] = useState('');
  const [autoPopulateTalks, setAutoPopulateTalks] = useState(true);

  // Form states - New Couple
  const [husbandFirst, setHusbandFirst] = useState('');
  const [husbandLast, setHusbandLast] = useState('');
  const [husbandBday, setHusbandBday] = useState('');
  const [husbandJob, setHusbandJob] = useState('');
  const [husbandPhone, setHusbandPhone] = useState('');
  const [husbandEmail, setHusbandEmail] = useState('');

  const [wifeFirst, setWifeFirst] = useState('');
  const [wifeLast, setWifeLast] = useState('');
  const [wifeBday, setWifeBday] = useState('');
  const [wifeJob, setWifeJob] = useState('');
  const [wifePhone, setWifePhone] = useState('');
  const [wifeEmail, setWifeEmail] = useState('');

  const [weddingAnniv, setWeddingAnniv] = useState('');
  const [coupleAddress, setCoupleAddress] = useState('Brgy. Poblacion 1, Tuy, Batangas');
  const [coupleBarangay, setCoupleBarangay] = useState('Poblacion 1');
  const [coupleCoords, setCoupleCoords] = useState<[number, number]>([120.7289, 14.0228]);

  // Form states - New Talk
  const [talkNumber, setTalkNumber] = useState(1);
  const [talkTitle, setTalkTitle] = useState('');
  const [talkSpeaker, setTalkSpeaker] = useState('');
  const [talkVenue, setTalkVenue] = useState('Saint Vincent Ferrer Parish Social Hall, Tuy');
  const [talkDate, setTalkDate] = useState('');
  const [talkTime, setTalkTime] = useState('6:30 PM - 9:00 PM');

  // Show Toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Initial Load from Service (Supabase + LocalStorage)
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const [loadedProgs, loadedCouples, loadedTalks, loadedAttendance] = await Promise.all([
          fetchCLPPrograms(),
          fetchCLPCouples(),
          fetchCLPTalks(),
          fetchCLPAttendance(),
        ]);

        setPrograms(loadedProgs);
        setCouples(loadedCouples);
        setTalks(loadedTalks);
        setAttendance(loadedAttendance);

        if (loadedProgs.length > 0) {
          setSelectedClpId(loadedProgs[0].id);
        }
      } catch (err) {
        console.error('Error loading CLP data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Update selected talk when selected CLP or talks change
  useEffect(() => {
    if (selectedClpId) {
      const clpTalks = talks
        .filter((t) => t.clpId === selectedClpId)
        .sort((a, b) => a.talkNumber - b.talkNumber);
      if (clpTalks.length > 0 && !clpTalks.some((t) => t.id === selectedTalkId)) {
        setSelectedTalkId(clpTalks[0].id);
      }
    }
  }, [selectedClpId, talks, selectedTalkId]);

  // Active CLP
  const currentClp = programs.find((p) => p.id === selectedClpId) || programs[0] || null;

  // Filtered Couples for current CLP
  const currentCouples = currentClp ? couples.filter((c) => c.clpId === currentClp.id) : [];
  const filteredCouples = currentCouples.filter((c) => {
    const matchesSearch =
      `${c.husbandFirstName} ${c.husbandLastName} ${c.wifeFirstName} ${c.wifeLastName} ${c.address}`
        .toLowerCase()
        .includes(searchCoupleQuery.toLowerCase());
    const matchesBrgy = filterBarangay === 'ALL' || c.barangay === filterBarangay;
    return matchesSearch && matchesBrgy;
  });

  // Filtered Talks for current CLP
  const currentTalks = currentClp
    ? talks.filter((t) => t.clpId === currentClp.id).sort((a, b) => a.talkNumber - b.talkNumber)
    : [];

  const activeTalk = currentTalks.find((t) => t.id === selectedTalkId) || currentTalks[0] || null;

  // -------------------------------------------------------------------------
  // Handlers: CLP Creation & Deletion
  // -------------------------------------------------------------------------
  const handleCreateCLP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClpName || !newClpStartDate || !newClpEndDate) return;

    const newProg: CLPProgram = {
      id: `clp-${Date.now()}`,
      name: newClpName,
      venue: newClpVenue,
      startDate: newClpStartDate,
      endDate: newClpEndDate,
      status: 'Upcoming',
      batchNumber: newClpBatchNumber || `Batch ${programs.length + 1}`,
      teamLeader: 'Bro. Mark & Sis. Grace Camilon',
      couplesCount: 0,
      talksCount: autoPopulateTalks ? 8 : 0,
    };

    try {
      const saved = await saveCLPProgram(newProg);
      const updated = [saved, ...programs.filter((p) => p.id !== saved.id)];
      setPrograms(updated);
      setSelectedClpId(saved.id);

      // Auto-populate 8 revised CFC CLP Talks if selected
      if (autoPopulateTalks) {
        const createdTalks = await populateStandardTalksForCLP(saved.id, saved.startDate, saved.venue);
        setTalks((prev) => [...prev, ...createdTalks]);
        if (createdTalks.length > 0) {
          setSelectedTalkId(createdTalks[0].id);
        }
      }

      setShowAddClpModal(false);
      setNewClpName('');
      setNewClpStartDate('');
      setNewClpEndDate('');
      setNewClpBatchNumber('');

      triggerToast(`Program "${saved.name}" has been created and saved!`);
    } catch (err) {
      console.error('Error creating CLP:', err);
      triggerToast('Error saving CLP program. Saved to local storage.');
    }
  };

  const handleDeleteCLP = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This will also remove its couples and attendance records.`)) {
      try {
        await deleteCLPProgram(id);
        const updated = programs.filter((p) => p.id !== id);
        setPrograms(updated);
        setCouples((prev) => prev.filter((c) => c.clpId !== id));
        setTalks((prev) => prev.filter((t) => t.clpId !== id));
        if (updated.length > 0) {
          setSelectedClpId(updated[0].id);
        } else {
          setSelectedClpId('');
        }
        triggerToast(`Program "${name}" deleted.`);
      } catch (err) {
        console.error('Error deleting CLP:', err);
      }
    }
  };

  // -------------------------------------------------------------------------
  // Handlers: Couple / Invitee Creation & Deletion
  // -------------------------------------------------------------------------
  const handleCreateCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClp) {
      alert('Please create or select a Christian Life Program batch first.');
      return;
    }
    if (!husbandFirst || !husbandLast || !wifeFirst || !wifeLast) return;

    const newCouple: CLPCouple = {
      id: `couple-${Date.now()}`,
      clpId: currentClp.id,
      husbandFirstName: husbandFirst,
      husbandLastName: husbandLast,
      husbandBirthday: husbandBday,
      husbandOccupation: husbandJob,
      husbandContact: husbandPhone,
      husbandEmail: husbandEmail.trim(),
      wifeFirstName: wifeFirst,
      wifeLastName: wifeLast,
      wifeBirthday: wifeBday,
      wifeOccupation: wifeJob,
      wifeContact: wifePhone,
      wifeEmail: wifeEmail.trim(),
      weddingAnniversary: weddingAnniv,
      address: coupleAddress,
      barangay: coupleBarangay,
      coordinates: coupleCoords,
      status: 'Active',
    };

    try {
      const saved = await saveCLPCouple(newCouple);
      setCouples((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
      setShowAddCoupleModal(false);

      // Reset form
      setHusbandFirst('');
      setHusbandLast('');
      setHusbandBday('');
      setHusbandJob('');
      setHusbandPhone('');
      setHusbandEmail('');
      setWifeFirst('');
      setWifeLast('');
      setWifeBday('');
      setWifeJob('');
      setWifePhone('');
      setWifeEmail('');
      setWeddingAnniv('');

      triggerToast(`Couple Bro. ${saved.husbandFirstName} & Sis. ${saved.wifeFirstName} ${saved.husbandLastName} saved!`);
    } catch (err) {
      console.error('Error saving couple:', err);
      triggerToast('Error saving couple. Saved to local storage.');
    }
  };

  const handleDeleteCouple = async (id: string, coupleName: string) => {
    if (confirm(`Remove ${coupleName} from this CLP?`)) {
      try {
        await deleteCLPCouple(id);
        setCouples((prev) => prev.filter((c) => c.id !== id));
        triggerToast(`${coupleName} removed.`);
      } catch (err) {
        console.error('Error deleting couple:', err);
      }
    }
  };

  // -------------------------------------------------------------------------
  // Handlers: Talks Creation & Attendance
  // -------------------------------------------------------------------------
  const handleCreateTalk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClp || !talkTitle || !talkSpeaker) return;

    const newTalk: CLPTalk = {
      id: `talk-${currentClp.id}-${Date.now()}`,
      clpId: currentClp.id,
      talkNumber: Number(talkNumber),
      title: talkTitle,
      speaker: talkSpeaker,
      venue: talkVenue,
      date: talkDate || new Date().toISOString().split('T')[0],
      time: talkTime,
      moduleName: `Talk ${talkNumber}`,
    };

    try {
      const saved = await saveCLPTalk(newTalk);
      setTalks((prev) => [...prev.filter((t) => t.id !== saved.id), saved]);
      setSelectedTalkId(saved.id);
      setShowAddTalkModal(false);
      setTalkTitle('');
      setTalkSpeaker('');
      triggerToast(`Talk "${saved.title}" saved.`);
    } catch (err) {
      console.error('Error saving talk:', err);
    }
  };

  const handlePopulateStandardTalks = async () => {
    if (!currentClp) return;
    try {
      const createdTalks = await populateStandardTalksForCLP(
        currentClp.id,
        currentClp.startDate,
        currentClp.venue
      );
      setTalks((prev) => [...prev, ...createdTalks]);
      if (createdTalks.length > 0) {
        setSelectedTalkId(createdTalks[0].id);
      }
      triggerToast('8 revised CFC CLP Talks populated successfully!');
    } catch (err) {
      console.error('Error populating talks:', err);
    }
  };

  // Toggle Attendance
  const toggleAttendance = async (talkId: string, coupleId: string, spouse: 'husband' | 'wife') => {
    const existing = attendance.find((a) => a.talkId === talkId && a.coupleId === coupleId);

    const updatedRecord: CLPAttendance = existing
      ? {
          ...existing,
          husbandPresent: spouse === 'husband' ? !existing.husbandPresent : existing.husbandPresent,
          wifePresent: spouse === 'wife' ? !existing.wifePresent : existing.wifePresent,
        }
      : {
          id: `att-${talkId}-${coupleId}`,
          talkId,
          coupleId,
          husbandPresent: spouse === 'husband',
          wifePresent: spouse === 'wife',
          remarks: '',
        };

    setAttendance((prev) => {
      const filtered = prev.filter((a) => !(a.talkId === talkId && a.coupleId === coupleId));
      return [...filtered, updatedRecord];
    });

    try {
      await saveCLPAttendance(updatedRecord);
    } catch (err) {
      console.error('Error saving attendance:', err);
    }
  };

  // Calculate Attendance Stats for Active Talk
  const totalEnrolledCouples = currentCouples.length;
  const activeTalkAttendance = activeTalk ? attendance.filter((a) => a.talkId === activeTalk.id) : [];
  const presentHusbands = activeTalkAttendance.filter((a) => a.husbandPresent).length;
  const presentWives = activeTalkAttendance.filter((a) => a.wifePresent).length;
  const totalPresentIndividuals = presentHusbands + presentWives;
  const totalPossibleIndividuals = totalEnrolledCouples * 2;
  const attendancePercentage =
    totalPossibleIndividuals > 0
      ? Math.round((totalPresentIndividuals / totalPossibleIndividuals) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* CLP Header & Selector Bar - High Contrast Light Design */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-[#243c81] border border-blue-200/80">
              <BookOpenCheck className="w-6 h-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentClp ? currentClp.name : 'Christian Life Program (CLP)'}
                </h1>
                {currentClp && (
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-extrabold border ${
                      currentClp.status === 'Ongoing'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {currentClp.status}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                {currentClp ? (
                  <>
                    Venue: <strong className="text-slate-900">{currentClp.venue}</strong> •{' '}
                    <span>{currentClp.startDate} to {currentClp.endDate}</span>
                  </>
                ) : (
                  'No Christian Life Program batch created yet.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CLP Batch Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {programs.length > 0 && (
            <div className="relative">
              <select
                value={selectedClpId}
                onChange={(e) => setSelectedClpId(e.target.value)}
                className="pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 cursor-pointer shadow-2xs"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <button
            onClick={() => setShowAddClpModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New CLP</span>
          </button>

          {currentClp && (
            <button
              onClick={() => handleDeleteCLP(currentClp.id, currentClp.name)}
              title="Delete this CLP program"
              className="p-2.5 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* When no CLP exists at all */}
      {programs.length === 0 && !loading && (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#243c81] mx-auto flex items-center justify-center">
            <BookOpenCheck className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-black text-slate-900">
              Welcome to Production CLP Management
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              All sample data has been removed. You can now start fresh by adding your actual
              Christian Life Program batch, enrolled couples, and session attendance.
            </p>
          </div>
          <button
            onClick={() => setShowAddClpModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First CLP Batch</span>
          </button>
        </div>
      )}

      {/* Tabs Navigation: Couples vs Talks & Attendance */}
      {programs.length > 0 && (
        <>
          <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('couples')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'couples'
                  ? 'bg-[#243c81] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Enrolled Couples ({currentCouples.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('talks')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'talks'
                  ? 'bg-[#243c81] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>CLP Talks & Attendance ({currentTalks.length})</span>
            </button>
          </div>

          {/* TAB 1: COUPLES DIRECTORY */}
          {activeTab === 'couples' && (
            <div className="space-y-6">
              {/* Action & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 max-w-xl">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search couple by name or Tuy address..."
                      value={searchCoupleQuery}
                      onChange={(e) => setSearchCoupleQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder:text-slate-400 shadow-2xs font-medium"
                    />
                  </div>

                  <select
                    value={filterBarangay}
                    onChange={(e) => setFilterBarangay(e.target.value)}
                    className="px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">All Barangays</option>
                    {TUY_BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowAddCoupleModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 whitespace-nowrap self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Couple with Map Picker</span>
                </button>
              </div>

              {/* Couples Cards Grid - High Contrast Crisp White Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCouples.map((couple) => (
                  <div
                    key={couple.id}
                    className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {couple.status}
                        </span>
                        <span className="text-xs font-bold text-[#243c81] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          Brgy. {couple.barangay}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
                          Bro. {couple.husbandFirstName} & Sis. {couple.wifeFirstName}{' '}
                          {couple.husbandLastName}
                        </h3>

                        <button
                          onClick={() =>
                            handleDeleteCouple(
                              couple.id,
                              `Bro. ${couple.husbandFirstName} & Sis. ${couple.wifeFirstName} ${couple.husbandLastName}`
                            )
                          }
                          title="Remove couple"
                          className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-all shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Anniversary */}
                      {couple.weddingAnniversary && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 font-bold px-2.5 py-0.5 rounded-md mt-2">
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                          <span>Married: {couple.weddingAnniversary}</span>
                        </div>
                      )}

                      {/* Details section - High contrast readable text */}
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="font-bold text-slate-900">
                            Husband:{' '}
                            <span className="font-medium text-slate-800">
                              {couple.husbandFirstName}
                            </span>
                            {couple.husbandBirthday && (
                              <span className="text-slate-600 font-normal">
                                {' '}
                                • Bday: {couple.husbandBirthday}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 mt-0.5">
                            Occ: <strong className="text-slate-700">{couple.husbandOccupation || 'N/A'}</strong>
                            {couple.husbandContact && (
                              <span className="text-slate-600"> • 📞 {couple.husbandContact}</span>
                            )}
                          </div>
                          {couple.husbandEmail && (
                            <div className="text-slate-600 flex items-center gap-1.5 mt-1 font-medium">
                              <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate">{couple.husbandEmail}</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="font-bold text-slate-900">
                            Wife:{' '}
                            <span className="font-medium text-slate-800">
                              {couple.wifeFirstName}
                            </span>
                            {couple.wifeBirthday && (
                              <span className="text-slate-600 font-normal">
                                {' '}
                                • Bday: {couple.wifeBirthday}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 mt-0.5">
                            Occ: <strong className="text-slate-700">{couple.wifeOccupation || 'N/A'}</strong>
                            {couple.wifeContact && (
                              <span className="text-slate-600"> • 📞 {couple.wifeContact}</span>
                            )}
                          </div>
                          {couple.wifeEmail && (
                            <div className="text-slate-600 flex items-center gap-1.5 mt-1 font-medium">
                              <Mail className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span className="truncate">{couple.wifeEmail}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 flex items-start gap-1.5 text-xs text-slate-700">
                          <Compass className="w-4 h-4 text-[#243c81] shrink-0 mt-0.5" />
                          <span className="font-medium">{couple.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono text-[11px]">
                        GPS: {couple.coordinates[1].toFixed(4)}, {couple.coordinates[0].toFixed(4)}
                      </span>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${couple.coordinates[1]},${couple.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#243c81] hover:text-blue-700 font-bold hover:underline"
                      >
                        View on Map →
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCouples.length === 0 && (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm space-y-3">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-800 text-base">
                    No couples enrolled yet in this CLP.
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click &quot;Add Couple with Map Picker&quot; above to start registering production invitees.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TALKS & ATTENDANCE */}
          {activeTab === 'talks' && (
            <div className="space-y-6">
              {currentTalks.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4">
                  <Calendar className="w-10 h-10 text-blue-600 mx-auto" />
                  <div>
                    <h3 className="font-black text-lg text-slate-900">
                      No talks registered for this CLP yet
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                      You can instantly populate the 8 revised CFC Christian Life Program curriculum
                      talks or manually add custom sessions.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={handlePopulateStandardTalks}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-xs"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Auto-populate 8 Revised CFC Talks</span>
                    </button>
                    <button
                      onClick={() => setShowAddTalkModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Custom Talk</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Talks List */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                        CLP Talks Curriculum ({currentTalks.length})
                      </h3>
                      <button
                        onClick={() => setShowAddTalkModal(true)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#243c81] hover:text-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Talk</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                      {currentTalks.map((talk) => {
                        const isSelected = talk.id === selectedTalkId;
                        const talkAtt = attendance.filter((a) => a.talkId === talk.id);
                        const countPresent = talkAtt.reduce(
                          (acc, a) => acc + (a.husbandPresent ? 1 : 0) + (a.wifePresent ? 1 : 0),
                          0
                        );

                        return (
                          <div
                            key={talk.id}
                            onClick={() => setSelectedTalkId(talk.id)}
                            className={`p-4 rounded-xl cursor-pointer transition-all border ${
                              isSelected
                                ? 'bg-[#243c81] text-white border-[#1a2c60] shadow-md'
                                : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span
                                className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-blue-50 text-[#243c81] border border-blue-200'
                                }`}
                              >
                                Talk #{talk.talkNumber}
                              </span>
                              <span
                                className={`text-[11px] font-medium ${
                                  isSelected ? 'text-blue-100' : 'text-slate-500'
                                }`}
                              >
                                {talk.date || 'TBD'}
                              </span>
                            </div>

                            <h4 className="font-extrabold text-sm line-clamp-1">{talk.title}</h4>

                            <p
                              className={`text-xs mt-0.5 line-clamp-1 font-medium ${
                                isSelected ? 'text-blue-100' : 'text-slate-600'
                              }`}
                            >
                              Speaker: {talk.speaker}
                            </p>

                            <div className="mt-2.5 pt-2 border-t border-slate-100/30 flex items-center justify-between text-[11px]">
                              <span className={isSelected ? 'text-blue-200' : 'text-slate-500 font-medium'}>
                                Attendance:
                              </span>
                              <span
                                className={`font-black ${
                                  isSelected ? 'text-amber-300' : 'text-emerald-700'
                                }`}
                              >
                                {countPresent} attendees
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Attendance Tracker for Selected Talk */}
                  <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
                    {activeTalk ? (
                      <>
                        {/* Talk Header Details */}
                        <div className="border-b border-slate-200 pb-5 mb-6">
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              Talk {activeTalk.talkNumber} • Attendance Sheet
                            </span>
                            <span className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#243c81]" />
                              {activeTalk.date} ({activeTalk.time})
                            </span>
                          </div>

                          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                            {activeTalk.title}
                          </h2>

                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-700">
                            <div>
                              <strong className="text-slate-900">Speaker:</strong> {activeTalk.speaker}
                            </div>
                            <div>
                              <strong className="text-slate-900">Venue:</strong> {activeTalk.venue}
                            </div>
                          </div>

                          {/* Attendance KPI banner - High Contrast */}
                          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider">
                                Overall Attendance
                              </span>
                              <span className="text-2xl font-black text-slate-900">
                                {totalPresentIndividuals} / {totalPossibleIndividuals} ({attendancePercentage}%)
                              </span>
                            </div>

                            <div className="flex items-center gap-6 text-xs">
                              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="text-slate-500 font-bold block">Husbands Present</span>
                                <span className="font-black text-[#243c81] text-base">
                                  {presentHusbands} / {totalEnrolledCouples}
                                </span>
                              </div>
                              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="text-slate-500 font-bold block">Wives Present</span>
                                <span className="font-black text-rose-700 text-base">
                                  {presentWives} / {totalEnrolledCouples}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Attendance Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs sm:text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-700 text-xs uppercase font-extrabold bg-slate-50">
                                <th className="py-3 px-3">Enrolled Couple</th>
                                <th className="py-3 px-3">Barangay</th>
                                <th className="py-3 px-3 text-center">Husband Status</th>
                                <th className="py-3 px-3 text-center">Wife Status</th>
                                <th className="py-3 px-3">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {currentCouples.map((couple) => {
                                const attRecord = attendance.find(
                                  (a) => a.talkId === activeTalk.id && a.coupleId === couple.id
                                );
                                const husbandPresent = Boolean(attRecord?.husbandPresent);
                                const wifePresent = Boolean(attRecord?.wifePresent);

                                return (
                                  <tr key={couple.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3.5 px-3">
                                      <span className="font-bold text-slate-900 block">
                                        {couple.husbandLastName}, {couple.husbandFirstName} &amp;{' '}
                                        {couple.wifeFirstName}
                                      </span>
                                    </td>

                                    <td className="py-3.5 px-3 text-slate-700 font-medium">
                                      {couple.barangay}
                                    </td>

                                    {/* Husband Checkbox / Status */}
                                    <td className="py-3.5 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => toggleAttendance(activeTalk.id, couple.id, 'husband')}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                                          husbandPresent
                                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 hover:bg-emerald-200'
                                            : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                                        }`}
                                      >
                                        {husbandPresent ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                                        ) : (
                                          <X className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                        <span>{husbandPresent ? 'Present' : 'Absent'}</span>
                                      </button>
                                    </td>

                                    {/* Wife Checkbox / Status */}
                                    <td className="py-3.5 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => toggleAttendance(activeTalk.id, couple.id, 'wife')}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                                          wifePresent
                                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 hover:bg-emerald-200'
                                            : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                                        }`}
                                      >
                                        {wifePresent ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                                        ) : (
                                          <X className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                        <span>{wifePresent ? 'Present' : 'Absent'}</span>
                                      </button>
                                    </td>

                                    <td className="py-3.5 px-3 text-xs text-slate-600 font-medium italic">
                                      {attRecord?.remarks || '—'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {currentCouples.length === 0 && (
                            <div className="py-10 text-center text-slate-500 text-xs">
                              No enrolled couples to take attendance for yet. Add couples in the &quot;Enrolled Couples&quot; tab.
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="p-12 text-center text-slate-500">
                        Select a talk from the left to view and record attendance.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW CLP                                                     */}
      {/* ========================================================================= */}
      {showAddClpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-black text-lg text-slate-900">
                Create New Christian Life Program (CLP)
              </h3>
              <button
                onClick={() => setShowAddClpModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCLP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  CLP Name / Batch *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CFC Tuy CLP Batch 29 - 2026"
                  value={newClpName}
                  onChange={(e) => setNewClpName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Batch Tag / Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Batch 29"
                  value={newClpBatchNumber}
                  onChange={(e) => setNewClpBatchNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Venue in Tuy *
                </label>
                <input
                  type="text"
                  required
                  value={newClpVenue}
                  onChange={(e) => setNewClpVenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newClpStartDate}
                    onChange={(e) => setNewClpStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newClpEndDate}
                    onChange={(e) => setNewClpEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="autoTalks"
                  checked={autoPopulateTalks}
                  onChange={(e) => setAutoPopulateTalks(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="autoTalks" className="text-xs text-slate-800 font-bold cursor-pointer">
                  Auto-create the 8 Revised CFC CLP Talks scheduled weekly
                  <span className="block text-[11px] text-slate-600 font-normal mt-0.5">
                    Generates the official 8 talk revised syllabus across Modules 1 and 2 with automatic Saturday dates.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddClpModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
                >
                  Save &amp; Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD COUPLE WITH MAP PICKER                                      */}
      {/* ========================================================================= */}
      {showAddCoupleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  Register Invitee Couple ({currentClp?.name || 'Production CLP'})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Save husband and wife personal details and pinpoint their home location in Tuy.
                </p>
              </div>
              <button
                onClick={() => setShowAddCoupleModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCouple} className="space-y-5">
              {/* Husband Section */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-[#243c81] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>Husband Details</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dennis"
                      value={husbandFirst}
                      onChange={(e) => setHusbandFirst(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bautista"
                      value={husbandLast}
                      onChange={(e) => setHusbandLast(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Birthday
                    </label>
                    <input
                      type="date"
                      value={husbandBday}
                      onChange={(e) => setHusbandBday(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Civil Engineer"
                      value={husbandJob}
                      onChange={(e) => setHusbandJob(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+63 917..."
                      value={husbandPhone}
                      onChange={(e) => setHusbandPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. dennis.bautista@gmail.com"
                      value={husbandEmail}
                      onChange={(e) => setHusbandEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Wife Section */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>Wife Details</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Karen"
                      value={wifeFirst}
                      onChange={(e) => setWifeFirst(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bautista"
                      value={wifeLast}
                      onChange={(e) => setWifeLast(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Birthday
                    </label>
                    <input
                      type="date"
                      value={wifeBday}
                      onChange={(e) => setWifeBday(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Public School Teacher"
                      value={wifeJob}
                      onChange={(e) => setWifeJob(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+63 917..."
                      value={wifePhone}
                      onChange={(e) => setWifePhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. karen.bautista@gmail.com"
                      value={wifeEmail}
                      onChange={(e) => setWifeEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-rose-600"
                    />
                  </div>
                </div>
              </div>

              {/* Marriage & Address from Map Picker */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Wedding Anniversary &amp; Pinned Home Address</span>
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Wedding Anniversary Date
                  </label>
                  <input
                    type="date"
                    value={weddingAnniv}
                    onChange={(e) => setWeddingAnniv(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs max-w-xs font-medium"
                  />
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-800">
                      Address &amp; Tuy Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#243c81] hover:underline"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>{showMapPicker ? 'Close Map Picker' : 'Pick on Map Picker'}</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{coupleAddress}</span>
                      <span className="text-[11px] text-slate-600 font-mono mt-0.5 block">
                        Brgy. {coupleBarangay} • Coordinates: {coupleCoords[1].toFixed(4)},{' '}
                        {coupleCoords[0].toFixed(4)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#243c81] border border-blue-200 font-bold text-xs hover:bg-blue-100"
                    >
                      Change Pin
                    </button>
                  </div>

                  <div className="mt-2.5">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Full Address (Auto-populated from map pin)
                    </label>
                    <input
                      type="text"
                      required
                      value={coupleAddress}
                      onChange={(e) => setCoupleAddress(e.target.value)}
                      placeholder="e.g. Brgy. Poblacion 1, Tuy, Batangas"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>
                </div>

                {/* Embedded Map Picker if opened */}
                {showMapPicker && (
                  <div className="mt-3 pt-2">
                    <TuyMapPicker
                      initialCoordinates={coupleCoords}
                      initialAddress={coupleAddress}
                      initialBarangay={coupleBarangay}
                      onSelectLocation={(data) => {
                        setCoupleAddress(data.address);
                        setCoupleBarangay(data.barangay);
                        setCoupleCoords(data.coordinates);
                        setShowMapPicker(false);
                      }}
                      onClose={() => setShowMapPicker(false)}
                    />
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCoupleModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
                >
                  Save Couple to CLP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD TALK                                                        */}
      {/* ========================================================================= */}
      {showAddTalkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-black text-lg text-slate-900">
                Add Talk to {currentClp?.name}
              </h3>
              <button
                onClick={() => setShowAddTalkModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTalk} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Talk Number *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={talkNumber}
                    onChange={(e) => setTalkNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Talk Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. God's Love"
                    value={talkTitle}
                    onChange={(e) => setTalkTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Speaker *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bro. Mark Ronnel Camilon"
                  value={talkSpeaker}
                  onChange={(e) => setTalkSpeaker(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Venue *
                </label>
                <input
                  type="text"
                  required
                  value={talkVenue}
                  onChange={(e) => setTalkVenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={talkDate}
                    onChange={(e) => setTalkDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={talkTime}
                    onChange={(e) => setTalkTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddTalkModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-md"
                >
                  Save Talk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
