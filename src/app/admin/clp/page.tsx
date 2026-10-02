'use client';

import React, { useState, useEffect } from 'react';
import {
  MOCK_CLP_PROGRAMS,
  MOCK_CLP_COUPLES,
  MOCK_CLP_TALKS,
  MOCK_CLP_ATTENDANCE,
  TUY_BARANGAYS,
} from '@/lib/data/mock-data';
import { CLPProgram, CLPCouple, CLPTalk, CLPAttendance } from '@/types';
import TuyMapPicker from '@/components/map/TuyMapPicker';
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
} from 'lucide-react';

export default function CLPAdminPage() {
  // Programs State
  const [programs, setPrograms] = useState<CLPProgram[]>(MOCK_CLP_PROGRAMS);
  const [selectedClpId, setSelectedClpId] = useState<string>(MOCK_CLP_PROGRAMS[0].id);

  // Couples State
  const [couples, setCouples] = useState<CLPCouple[]>(MOCK_CLP_COUPLES);

  // Talks State
  const [talks, setTalks] = useState<CLPTalk[]>(MOCK_CLP_TALKS);

  // Attendance State
  const [attendance, setAttendance] = useState<CLPAttendance[]>(MOCK_CLP_ATTENDANCE);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'couples' | 'talks'>('couples');

  // Modals
  const [showAddClpModal, setShowAddClpModal] = useState(false);
  const [showAddCoupleModal, setShowAddCoupleModal] = useState(false);
  const [showAddTalkModal, setShowAddTalkModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Selected Talk for Attendance Drawer/View
  const [selectedTalkId, setSelectedTalkId] = useState<string>('talk-1');

  // Search & Filter
  const [searchCoupleQuery, setSearchCoupleQuery] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('ALL');

  // Form states - New CLP
  const [newClpName, setNewClpName] = useState('');
  const [newClpVenue, setNewClpVenue] = useState('San Nicolas de Tolentino Parish Hall, Tuy');
  const [newClpStartDate, setNewClpStartDate] = useState('');
  const [newClpEndDate, setNewClpEndDate] = useState('');
  const [newClpBatchNumber, setNewClpBatchNumber] = useState('');

  // Form states - New Couple
  const [husbandFirst, setHusbandFirst] = useState('');
  const [husbandLast, setHusbandLast] = useState('');
  const [husbandBday, setHusbandBday] = useState('');
  const [husbandJob, setHusbandJob] = useState('');
  const [husbandPhone, setHusbandPhone] = useState('');

  const [wifeFirst, setWifeFirst] = useState('');
  const [wifeLast, setWifeLast] = useState('');
  const [wifeBday, setWifeBday] = useState('');
  const [wifeJob, setWifeJob] = useState('');
  const [wifePhone, setWifePhone] = useState('');

  const [weddingAnniv, setWeddingAnniv] = useState('');
  const [coupleAddress, setCoupleAddress] = useState('Brgy. Poblacion 1, Tuy, Batangas');
  const [coupleBarangay, setCoupleBarangay] = useState('Poblacion 1');
  const [coupleCoords, setCoupleCoords] = useState<[number, number]>([120.7289, 14.0228]);

  // Form states - New Talk
  const [talkNumber, setTalkNumber] = useState(1);
  const [talkTitle, setTalkTitle] = useState('');
  const [talkSpeaker, setTalkSpeaker] = useState('');
  const [talkVenue, setTalkVenue] = useState('San Nicolas de Tolentino Parish Social Hall, Tuy');
  const [talkDate, setTalkDate] = useState('');
  const [talkTime, setTalkTime] = useState('6:30 PM - 9:00 PM');

  // Get active CLP object
  const currentClp = programs.find((p) => p.id === selectedClpId) || programs[0];

  // Filtered Couples
  const currentCouples = couples.filter((c) => c.clpId === currentClp.id);
  const filteredCouples = currentCouples.filter((c) => {
    const matchesSearch =
      `${c.husbandFirstName} ${c.husbandLastName} ${c.wifeFirstName} ${c.wifeLastName} ${c.address}`
        .toLowerCase()
        .includes(searchCoupleQuery.toLowerCase());
    const matchesBrgy = filterBarangay === 'ALL' || c.barangay === filterBarangay;
    return matchesSearch && matchesBrgy;
  });

  // Filtered Talks for Current CLP
  const currentTalks = talks
    .filter((t) => t.clpId === currentClp.id)
    .sort((a, b) => a.talkNumber - b.talkNumber);

  const activeTalk = currentTalks.find((t) => t.id === selectedTalkId) || currentTalks[0];

  // Handle Add New CLP
  const handleCreateCLP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClpName || !newClpStartDate || !newClpEndDate) return;

    const newProg: CLPProgram = {
      id: `clp-${Date.now()}`,
      name: newClpName,
      venue: newClpVenue,
      startDate: newClpStartDate,
      endDate: newClpEndDate,
      status: 'Upcoming',
      batchNumber: newClpBatchNumber || `Batch ${programs.length + 29}`,
      teamLeader: 'Bro. Mark & Sis. Grace Camilon',
      couplesCount: 0,
      talksCount: 12,
    };

    setPrograms([newProg, ...programs]);
    setSelectedClpId(newProg.id);
    setShowAddClpModal(false);
    setNewClpName('');
    setNewClpStartDate('');
    setNewClpEndDate('');
  };

  // Handle Add New Couple
  const handleCreateCouple = (e: React.FormEvent) => {
    e.preventDefault();
    if (!husbandFirst || !husbandLast || !wifeFirst || !wifeLast) return;

    const newCouple: CLPCouple = {
      id: `couple-${Date.now()}`,
      clpId: currentClp.id,
      husbandFirstName: husbandFirst,
      husbandLastName: husbandLast,
      husbandBirthday: husbandBday,
      husbandOccupation: husbandJob,
      husbandContact: husbandPhone,
      wifeFirstName: wifeFirst,
      wifeLastName: wifeLast,
      wifeBirthday: wifeBday,
      wifeOccupation: wifeJob,
      wifeContact: wifePhone,
      weddingAnniversary: weddingAnniv,
      address: coupleAddress,
      barangay: coupleBarangay,
      coordinates: coupleCoords,
      status: 'Active',
    };

    setCouples([newCouple, ...couples]);
    setShowAddCoupleModal(false);

    // Reset form
    setHusbandFirst('');
    setHusbandLast('');
    setHusbandBday('');
    setHusbandJob('');
    setHusbandPhone('');
    setWifeFirst('');
    setWifeLast('');
    setWifeBday('');
    setWifeJob('');
    setWifePhone('');
    setWeddingAnniv('');
  };

  // Handle Add New Talk
  const handleCreateTalk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!talkTitle || !talkSpeaker) return;

    const newTalk: CLPTalk = {
      id: `talk-${Date.now()}`,
      clpId: currentClp.id,
      talkNumber: Number(talkNumber),
      title: talkTitle,
      speaker: talkSpeaker,
      venue: talkVenue,
      date: talkDate || new Date().toISOString().split('T')[0],
      time: talkTime,
      moduleName: `Talk ${talkNumber}`,
    };

    setTalks([...talks, newTalk]);
    setSelectedTalkId(newTalk.id);
    setShowAddTalkModal(false);
    setTalkTitle('');
    setTalkSpeaker('');
  };

  // Toggle Attendance
  const toggleAttendance = (talkId: string, coupleId: string, spouse: 'husband' | 'wife') => {
    setAttendance((prev) => {
      const existing = prev.find((a) => a.talkId === talkId && a.coupleId === coupleId);

      if (existing) {
        return prev.map((a) =>
          a.talkId === talkId && a.coupleId === coupleId
            ? {
                ...a,
                husbandPresent: spouse === 'husband' ? !a.husbandPresent : a.husbandPresent,
                wifePresent: spouse === 'wife' ? !a.wifePresent : a.wifePresent,
              }
            : a
        );
      } else {
        // Create new attendance record
        const newRecord: CLPAttendance = {
          id: `att-${Date.now()}`,
          talkId,
          coupleId,
          husbandPresent: spouse === 'husband',
          wifePresent: spouse === 'wife',
        };
        return [...prev, newRecord];
      }
    });
  };

  // Calculate Attendance Stats for Active Talk
  const totalEnrolledCouples = currentCouples.length;
  const activeTalkAttendance = attendance.filter((a) => a.talkId === activeTalk?.id);
  const presentHusbands = activeTalkAttendance.filter((a) => a.husbandPresent).length;
  const presentWives = activeTalkAttendance.filter((a) => a.wifePresent).length;
  const totalPresentIndividuals = presentHusbands + presentWives;
  const totalPossibleIndividuals = totalEnrolledCouples * 2;
  const attendancePercentage = totalPossibleIndividuals > 0
    ? Math.round((totalPresentIndividuals / totalPossibleIndividuals) * 100)
    : 0;

  return (
    <div className="space-y-8">
      
      {/* CLP Header & Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <BookOpenCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Christian Life Program (CLP)
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  currentClp.status === 'Ongoing'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                }`}>
                  {currentClp.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Venue: <strong>{currentClp.venue}</strong> • {currentClp.startDate} to {currentClp.endDate}
              </p>
            </div>
          </div>
        </div>

        {/* CLP Batch Selector & Add CLP Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={selectedClpId}
              onChange={(e) => setSelectedClpId(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-800 dark:text-white appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowAddClpModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New CLP</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation: Couples vs Talks & Attendance */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('couples')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'couples'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Enrolled Couples ({currentCouples.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('talks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'talks'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
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
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filterBarangay}
                onChange={(e) => setFilterBarangay(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
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
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Couple with Map Picker</span>
            </button>
          </div>

          {/* Couples Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCouples.map((couple) => (
              <div
                key={couple.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      {couple.status}
                    </span>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Brgy. {couple.barangay}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    Bro. {couple.husbandFirstName} &amp; Sis. {couple.wifeFirstName} {couple.husbandLastName}
                  </h3>

                  {/* Anniversary */}
                  {couple.weddingAnniversary && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      <span>Married: {couple.weddingAnniversary}</span>
                    </div>
                  )}

                  {/* Details section */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <strong className="text-slate-900 dark:text-white">Husband:</strong> {couple.husbandFirstName}
                      {couple.husbandBirthday && ` • Bday: ${couple.husbandBirthday}`}
                      <br />
                      <span className="text-slate-500">Occ: {couple.husbandOccupation || 'N/A'}</span>
                    </div>

                    <div>
                      <strong className="text-slate-900 dark:text-white">Wife:</strong> {couple.wifeFirstName}
                      {couple.wifeBirthday && ` • Bday: ${couple.wifeBirthday}`}
                      <br />
                      <span className="text-slate-500">Occ: {couple.wifeOccupation || 'N/A'}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>{couple.address}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">
                    GPS: {couple.coordinates[1].toFixed(4)}, {couple.coordinates[0].toFixed(4)}
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${couple.coordinates[1]},${couple.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-bold hover:underline"
                  >
                    View on Map →
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filteredCouples.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
              No couples found in this CLP. Click &quot;Add Couple with Map Picker&quot; to enroll a couple.
            </div>
          )}

        </div>
      )}

      {/* TAB 2: TALKS & ATTENDANCE */}
      {activeTab === 'talks' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Talks List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  CLP Talks Curriculum ({currentTalks.length})
                </h3>
                <button
                  onClick={() => setShowAddTalkModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Talk</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
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
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        }`}>
                          Talk #{talk.talkNumber}
                        </span>
                        <span className={`text-[11px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {talk.date}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm line-clamp-1">{talk.title}</h4>
                      
                      <p className={`text-xs mt-0.5 line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        Speaker: {talk.speaker}
                      </p>

                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                        <span className={isSelected ? 'text-blue-200' : 'text-slate-400'}>
                          Attendance:
                        </span>
                        <span className={`font-bold ${isSelected ? 'text-amber-300' : 'text-emerald-600'}`}>
                          {countPresent} attendees
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Attendance Tracker for Selected Talk */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              
              {activeTalk ? (
                <>
                  {/* Talk Header Details */}
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        Talk {activeTalk.talkNumber} • Attendance Sheet
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {activeTalk.date} ({activeTalk.time})
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {activeTalk.title}
                    </h2>

                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        <strong>Speaker:</strong> {activeTalk.speaker}
                      </div>
                      <div>
                        <strong>Venue:</strong> {activeTalk.venue}
                      </div>
                    </div>

                    {/* Attendance KPI banner */}
                    <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">Overall Attendance</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          {totalPresentIndividuals} / {totalPossibleIndividuals} ({attendancePercentage}%)
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-xs">
                        <div>
                          <span className="text-slate-400 block">Husbands Present</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                            {presentHusbands} / {totalEnrolledCouples}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Wives Present</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
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
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs uppercase font-bold">
                          <th className="py-3 px-3">Enrolled Couple</th>
                          <th className="py-3 px-3">Barangay</th>
                          <th className="py-3 px-3 text-center">Husband Status</th>
                          <th className="py-3 px-3 text-center">Wife Status</th>
                          <th className="py-3 px-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {currentCouples.map((couple) => {
                          const attRecord = attendance.find(
                            (a) => a.talkId === activeTalk.id && a.coupleId === couple.id
                          );
                          const husbandPresent = Boolean(attRecord?.husbandPresent);
                          const wifePresent = Boolean(attRecord?.wifePresent);

                          return (
                            <tr key={couple.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-3.5 px-3">
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {couple.husbandLastName}, {couple.husbandFirstName} &amp; {couple.wifeFirstName}
                                </span>
                              </td>

                              <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                                {couple.barangay}
                              </td>

                              {/* Husband Checkbox / Status */}
                              <td className="py-3.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleAttendance(activeTalk.id, couple.id, 'husband')}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    husbandPresent
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300'
                                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200'
                                  }`}
                                >
                                  {husbandPresent ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                  <span>{husbandPresent ? 'Present' : 'Absent'}</span>
                                </button>
                              </td>

                              {/* Wife Checkbox / Status */}
                              <td className="py-3.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleAttendance(activeTalk.id, couple.id, 'wife')}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    wifePresent
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300'
                                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200'
                                  }`}
                                >
                                  {wifePresent ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                  <span>{wifePresent ? 'Present' : 'Absent'}</span>
                                </button>
                              </td>

                              <td className="py-3.5 px-3 text-xs text-slate-500 dark:text-slate-400 italic">
                                {attRecord?.remarks || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  Select a talk from the left to view and record attendance.
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW CLP                                                     */}
      {/* ========================================================================= */}
      {showAddClpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                Create New Christian Life Program (CLP)
              </h3>
              <button
                onClick={() => setShowAddClpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCLP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  CLP Name / Batch *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CFC Tuy CLP Batch 31 - 2027"
                  value={newClpName}
                  onChange={(e) => setNewClpName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Venue in Tuy *
                </label>
                <input
                  type="text"
                  required
                  value={newClpVenue}
                  onChange={(e) => setNewClpVenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newClpStartDate}
                    onChange={(e) => setNewClpStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newClpEndDate}
                    onChange={(e) => setNewClpEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClpModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md"
                >
                  Create Program
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  Add Couple Information ({currentClp.name})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Register husband and wife details with pinned home address in Tuy.
                </p>
              </div>
              <button
                onClick={() => setShowAddCoupleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCouple} className="space-y-5">
              
              {/* Husband Section */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>Husband Details</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dennis"
                      value={husbandFirst}
                      onChange={(e) => setHusbandFirst(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bautista"
                      value={husbandLast}
                      onChange={(e) => setHusbandLast(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Birthday
                    </label>
                    <input
                      type="date"
                      value={husbandBday}
                      onChange={(e) => setHusbandBday(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Engineer"
                      value={husbandJob}
                      onChange={(e) => setHusbandJob(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+63 917..."
                      value={husbandPhone}
                      onChange={(e) => setHusbandPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Wife Section */}
              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>Wife Details</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Karen"
                      value={wifeFirst}
                      onChange={(e) => setWifeFirst(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bautista"
                      value={wifeLast}
                      onChange={(e) => setWifeLast(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Birthday
                    </label>
                    <input
                      type="date"
                      value={wifeBday}
                      onChange={(e) => setWifeBday(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Teacher"
                      value={wifeJob}
                      onChange={(e) => setWifeJob(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+63 917..."
                      value={wifePhone}
                      onChange={(e) => setWifePhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Marriage & Address from Map Picker */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Wedding Anniversary &amp; Pinned Home Address</span>
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Wedding Anniversary Date
                  </label>
                  <input
                    type="date"
                    value={weddingAnniv}
                    onChange={(e) => setWeddingAnniv(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs max-w-xs"
                  />
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Address &amp; Tuy Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>{showMapPicker ? 'Close Map Picker' : 'Pick on Map Picker'}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {coupleAddress}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Brgy. {coupleBarangay} • Coordinates: {coupleCoords[1].toFixed(4)}, {coupleCoords[0].toFixed(4)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold text-xs"
                    >
                      Change
                    </button>
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
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCoupleModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                Add Talk to {currentClp.name}
              </h3>
              <button
                onClick={() => setShowAddTalkModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTalk} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Talk Number *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={talkNumber}
                    onChange={(e) => setTalkNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Talk Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. God's Love"
                    value={talkTitle}
                    onChange={(e) => setTalkTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Speaker *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bro. Mark Ronnel Camilon"
                  value={talkSpeaker}
                  onChange={(e) => setTalkSpeaker(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Venue *
                </label>
                <input
                  type="text"
                  required
                  value={talkVenue}
                  onChange={(e) => setTalkVenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={talkDate}
                    onChange={(e) => setTalkDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={talkTime}
                    onChange={(e) => setTalkTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTalkModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md"
                >
                  Add Talk
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
