'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TUY_BARANGAYS } from '@/lib/data/mock-data';
import { CLPProgram, CLPCouple, CLPTalk, CLPAttendance } from '@/types';
import TuyMapPicker from '@/components/map/TuyMapPicker';
import CLPCouplesMapModal from '@/components/map/CLPCouplesMapModal';
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
  Pencil,
  BarChart3,
  Printer,
  Copy,
  Map,
  Award,
  TrendingUp,
  UserPlus,
  Filter,
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

  // Active Tab: 'couples' | 'talks' | 'report'
  const [activeTab, setActiveTab] = useState<'couples' | 'talks' | 'report'>('couples');

  // Modals
  const [showAddClpModal, setShowAddClpModal] = useState(false);
  const [showAddCoupleModal, setShowAddCoupleModal] = useState(false);
  const [showAddTalkModal, setShowAddTalkModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Edit Couple Modal State
  const [showEditCoupleModal, setShowEditCoupleModal] = useState(false);
  const [showEditMapPicker, setShowEditMapPicker] = useState(false);
  const [editingCoupleId, setEditingCoupleId] = useState<string | null>(null);
  const [editHusbandFirst, setEditHusbandFirst] = useState('');
  const [editHusbandLast, setEditHusbandLast] = useState('');
  const [editHusbandBday, setEditHusbandBday] = useState('');
  const [editHusbandJob, setEditHusbandJob] = useState('');
  const [editHusbandPhone, setEditHusbandPhone] = useState('');
  const [editHusbandEmail, setEditHusbandEmail] = useState('');
  const [editWifeFirst, setEditWifeFirst] = useState('');
  const [editWifeLast, setEditWifeLast] = useState('');
  const [editWifeBday, setEditWifeBday] = useState('');
  const [editWifeJob, setEditWifeJob] = useState('');
  const [editWifePhone, setEditWifePhone] = useState('');
  const [editWifeEmail, setEditWifeEmail] = useState('');
  const [editWeddingAnniv, setEditWeddingAnniv] = useState('');
  const [editCoupleAddress, setEditCoupleAddress] = useState('');
  const [editCoupleBarangay, setEditCoupleBarangay] = useState('Rizal (Pob.)');
  const [editCoupleCoords, setEditCoupleCoords] = useState<[number, number]>([120.7289, 14.0228]);
  const [editCoupleStatus, setEditCoupleStatus] = useState<'Active' | 'Graduated' | 'Dropped'>('Active');

  // Edit Talk Modal State
  const [showEditTalkModal, setShowEditTalkModal] = useState(false);
  const [editingTalkId, setEditingTalkId] = useState<string | null>(null);
  const [editTalkNumber, setEditTalkNumber] = useState(1);
  const [editTalkTitle, setEditTalkTitle] = useState('');
  const [editTalkSpeaker, setEditTalkSpeaker] = useState('');
  const [editTalkVenue, setEditTalkVenue] = useState('Saint Vincent Ferrer Parish Social Hall, Tuy');
  const [editTalkDate, setEditTalkDate] = useState('');
  const [editTalkTime, setEditTalkTime] = useState('6:30 PM - 9:00 PM');
  const [editTalkModule, setEditTalkModule] = useState('Module 1: Basic Truths');

  // In-App Mapbox Modal State (for viewing single or all couples)
  const [showCouplesMapModal, setShowCouplesMapModal] = useState(false);
  const [mapModalFocusedCoupleId, setMapModalFocusedCoupleId] = useState<string | null>(null);
  const [mapModalTitle, setMapModalTitle] = useState('All Invited Couples Tuy Map');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Talk for Attendance View
  const [selectedTalkId, setSelectedTalkId] = useState<string>('');

  // Search & Filter
  const [searchCoupleQuery, setSearchCoupleQuery] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('ALL');
  const [reportFilterStatus, setReportFilterStatus] = useState<'ALL' | 'Graduation' | 'Returnee' | 'At-Risk'>('ALL');

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
  const [coupleAddress, setCoupleAddress] = useState('Brgy. Rizal (Pob.), Tuy, Batangas');
  const [coupleBarangay, setCoupleBarangay] = useState('Rizal (Pob.)');
  const [coupleCoords, setCoupleCoords] = useState<[number, number]>([120.7289, 14.0228]);

  // Form states - New Talk
  const [talkNumber, setTalkNumber] = useState(1);
  const [talkTitle, setTalkTitle] = useState('');
  const [talkSpeaker, setTalkSpeaker] = useState('');
  const [talkVenue, setTalkVenue] = useState('Saint Vincent Ferrer Parish Social Hall, Tuy');
  const [talkDate, setTalkDate] = useState('');
  const [talkTime, setTalkTime] = useState('6:30 PM - 9:00 PM');

  // Show Toast helper
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
        if (loadedProgs.length > 0) {
          setSelectedClpId(loadedProgs[0].id);
        }

        setCouples(loadedCouples);
        setTalks(loadedTalks);
        setAttendance(loadedAttendance);

        if (loadedTalks.length > 0) {
          setSelectedTalkId(loadedTalks[0].id);
        }
      } catch (err) {
        console.error('Failed to load CLP data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Current selected program
  const currentClp = useMemo(() => {
    return programs.find((p) => p.id === selectedClpId) || programs[0] || null;
  }, [programs, selectedClpId]);

  // Current program's couples
  const currentCouples = useMemo(() => {
    if (!currentClp) return [];
    return couples.filter((c) => c.clpId === currentClp.id);
  }, [couples, currentClp]);

  // Current program's talks
  const currentTalks = useMemo(() => {
    if (!currentClp) return [];
    return talks
      .filter((t) => t.clpId === currentClp.id)
      .sort((a, b) => a.talkNumber - b.talkNumber);
  }, [talks, currentClp]);

  // Active talk for attendance
  const activeTalk = useMemo(() => {
    return currentTalks.find((t) => t.id === selectedTalkId) || currentTalks[0] || null;
  }, [currentTalks, selectedTalkId]);

  // Filtered couples in directory
  const filteredCouples = useMemo(() => {
    return currentCouples.filter((c) => {
      const matchesSearch =
        c.husbandFirstName.toLowerCase().includes(searchCoupleQuery.toLowerCase()) ||
        c.husbandLastName.toLowerCase().includes(searchCoupleQuery.toLowerCase()) ||
        c.wifeFirstName.toLowerCase().includes(searchCoupleQuery.toLowerCase()) ||
        c.wifeLastName.toLowerCase().includes(searchCoupleQuery.toLowerCase()) ||
        c.barangay.toLowerCase().includes(searchCoupleQuery.toLowerCase());

      const matchesBarangay = filterBarangay === 'ALL' || c.barangay === filterBarangay;

      return matchesSearch && matchesBarangay;
    });
  }, [currentCouples, searchCoupleQuery, filterBarangay]);

  // -------------------------------------------------------------------------
  // Handlers: CLP Program Creation & Deletion
  // -------------------------------------------------------------------------
  const handleCreateClp = async (e: React.FormEvent) => {
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

      triggerToast(`Program "${saved.name}" successfully created!`);
    } catch (err) {
      console.error('Error creating CLP:', err);
      triggerToast('Error creating program. Please try again.');
    }
  };

  const handleDeleteClp = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This will remove its invited couples and talk schedules.`)) {
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
  // Handlers: Couple / Invitee Creation, Update & Deletion
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

      triggerToast(`Couple Bro. ${saved.husbandFirstName} & Sis. ${saved.wifeFirstName} ${saved.husbandLastName} registered!`);
    } catch (err) {
      console.error('Error saving couple:', err);
      triggerToast('Error saving couple. Saved to local storage.');
    }
  };

  const handleOpenEditCouple = (c: CLPCouple) => {
    setEditingCoupleId(c.id);
    setEditHusbandFirst(c.husbandFirstName);
    setEditHusbandLast(c.husbandLastName);
    setEditHusbandBday(c.husbandBirthday || '');
    setEditHusbandJob(c.husbandOccupation || '');
    setEditHusbandPhone(c.husbandContact || '');
    setEditHusbandEmail(c.husbandEmail || '');
    setEditWifeFirst(c.wifeFirstName);
    setEditWifeLast(c.wifeLastName);
    setEditWifeBday(c.wifeBirthday || '');
    setEditWifeJob(c.wifeOccupation || '');
    setEditWifePhone(c.wifeContact || '');
    setEditWifeEmail(c.wifeEmail || '');
    setEditWeddingAnniv(c.weddingAnniversary || '');
    setEditCoupleAddress(c.address);
    setEditCoupleBarangay(c.barangay);
    setEditCoupleCoords(c.coordinates || [120.7289, 14.0228]);
    setEditCoupleStatus(c.status || 'Active');
    setShowEditMapPicker(false);
    setShowEditCoupleModal(true);
  };

  const handleUpdateCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupleId || !currentClp) return;

    const updatedCouple: CLPCouple = {
      id: editingCoupleId,
      clpId: currentClp.id,
      husbandFirstName: editHusbandFirst,
      husbandLastName: editHusbandLast,
      husbandBirthday: editHusbandBday,
      husbandOccupation: editHusbandJob,
      husbandContact: editHusbandPhone,
      husbandEmail: editHusbandEmail.trim(),
      wifeFirstName: editWifeFirst,
      wifeLastName: editWifeLast,
      wifeBirthday: editWifeBday,
      wifeOccupation: editWifeJob,
      wifeContact: editWifePhone,
      wifeEmail: editWifeEmail.trim(),
      weddingAnniversary: editWeddingAnniv,
      address: editCoupleAddress,
      barangay: editCoupleBarangay,
      coordinates: editCoupleCoords,
      status: editCoupleStatus,
    };

    try {
      const saved = await saveCLPCouple(updatedCouple);
      setCouples((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
      setShowEditCoupleModal(false);
      triggerToast(`Bro. ${saved.husbandFirstName} & Sis. ${saved.wifeFirstName} ${saved.husbandLastName} updated!`);
    } catch (err) {
      console.error('Error updating couple:', err);
      triggerToast('Error updating couple.');
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
  // Handlers: Talks Management (Create, Edit, Auto-Populate)
  // -------------------------------------------------------------------------
  const handleCreateTalk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClp || !talkTitle) return;

    const newTalk: CLPTalk = {
      id: `talk-${currentClp.id}-${talkNumber}-${Date.now()}`,
      clpId: currentClp.id,
      talkNumber: Number(talkNumber),
      title: talkTitle,
      speaker: talkSpeaker || 'To be assigned',
      venue: talkVenue,
      date: talkDate,
      time: talkTime,
      moduleName: `Module ${Math.ceil(Number(talkNumber) / 4)}`,
    };

    try {
      const saved = await saveCLPTalk(newTalk);
      setTalks((prev) => [...prev, saved]);
      setSelectedTalkId(saved.id);
      setShowAddTalkModal(false);

      setTalkTitle('');
      setTalkSpeaker('');
      setTalkDate('');
      setTalkNumber(currentTalks.length + 2);

      triggerToast(`Talk #${saved.talkNumber} added.`);
    } catch (err) {
      console.error('Error creating talk:', err);
    }
  };

  const handleOpenEditTalk = (talk: CLPTalk) => {
    setEditingTalkId(talk.id);
    setEditTalkNumber(talk.talkNumber);
    setEditTalkTitle(talk.title);
    setEditTalkSpeaker(talk.speaker);
    setEditTalkVenue(talk.venue || 'Saint Vincent Ferrer Parish Social Hall, Tuy');
    setEditTalkDate(talk.date || '');
    setEditTalkTime(talk.time || '6:30 PM - 9:00 PM');
    setEditTalkModule(talk.moduleName || (talk.talkNumber <= 3 ? 'Module 1: Basic Truths' : 'Module 2: Spirit-Filled Life'));
    setShowEditTalkModal(true);
  };

  const handleUpdateTalk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTalkId || !currentClp) return;

    const updatedTalk: CLPTalk = {
      id: editingTalkId,
      clpId: currentClp.id,
      talkNumber: editTalkNumber,
      title: editTalkTitle,
      speaker: editTalkSpeaker,
      venue: editTalkVenue,
      date: editTalkDate,
      time: editTalkTime,
      moduleName: editTalkModule,
    };

    try {
      const saved = await saveCLPTalk(updatedTalk);
      setTalks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      setShowEditTalkModal(false);
      triggerToast(`Talk #${saved.talkNumber} "${saved.title}" updated successfully!`);
    } catch (err) {
      console.error('Error updating talk:', err);
      triggerToast('Error updating talk.');
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

  // Toggle Attendance for Husband or Wife
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

  // -------------------------------------------------------------------------
  // Analytics & Report Computations
  // -------------------------------------------------------------------------
  const totalInvitedCouples = currentCouples.length;
  const activeTalkAttendance = activeTalk ? attendance.filter((a) => a.talkId === activeTalk.id) : [];
  const presentHusbands = activeTalkAttendance.filter((a) => a.husbandPresent).length;
  const presentWives = activeTalkAttendance.filter((a) => a.wifePresent).length;
  const totalPresentIndividuals = presentHusbands + presentWives;
  const totalPossibleIndividuals = totalInvitedCouples * 2;
  const attendancePercentage =
    totalPossibleIndividuals > 0
      ? Math.round((totalPresentIndividuals / totalPossibleIndividuals) * 100)
      : 0;

  // Report calculations across all talks
  const reportAnalytics = useMemo(() => {
    const totalTalks = currentTalks.length;
    let totalHusbandPresences = 0;
    let totalWifePresences = 0;
    let totalPossibleAttendances = totalInvitedCouples * totalTalks;

    // Per-couple breakdown
    const couplesMatrix = currentCouples.map((couple) => {
      let attendedTalksCount = 0;
      let husbandAttendedCount = 0;
      let wifeAttendedCount = 0;
      let missedAnyPreviously = false;
      let isReturnee = false;

      const talkStatuses = currentTalks.map((talk, idx) => {
        const record = attendance.find((a) => a.talkId === talk.id && a.coupleId === couple.id);
        const hp = Boolean(record?.husbandPresent);
        const wp = Boolean(record?.wifePresent);
        const both = hp && wp;
        const any = hp || wp;

        if (hp) husbandAttendedCount++;
        if (wp) wifeAttendedCount++;
        if (any) attendedTalksCount++;

        // Returnee heuristic: missed previous session and attended a subsequent one
        if (!any && idx < currentTalks.length - 1) {
          missedAnyPreviously = true;
        } else if (any && missedAnyPreviously) {
          isReturnee = true;
        }

        return { talkNumber: talk.talkNumber, talkId: talk.id, husbandPresent: hp, wifePresent: wp, both, any };
      });

      totalHusbandPresences += husbandAttendedCount;
      totalWifePresences += wifeAttendedCount;

      const attendancePct = totalTalks > 0 ? Math.round((attendedTalksCount / totalTalks) * 100) : 0;
      const isGraduationReady = totalTalks >= 6 && attendedTalksCount >= Math.min(6, totalTalks);
      const isAtRisk = attendedTalksCount < Math.max(1, Math.floor(totalTalks / 2)) && totalTalks >= 3;

      let statusCategory: 'Graduation' | 'Consistent' | 'Returnee' | 'At-Risk' = 'Consistent';
      if (isGraduationReady) {
        statusCategory = 'Graduation';
      } else if (isReturnee) {
        statusCategory = 'Returnee';
      } else if (isAtRisk || couple.status === 'Dropped') {
        statusCategory = 'At-Risk';
      }

      return {
        couple,
        talkStatuses,
        attendedTalksCount,
        husbandAttendedCount,
        wifeAttendedCount,
        attendancePct,
        isGraduationReady,
        isReturnee,
        statusCategory,
      };
    });

    const overallRate =
      totalPossibleAttendances > 0
        ? Math.round(((totalHusbandPresences + totalWifePresences) / (totalPossibleAttendances * 2)) * 100)
        : 0;

    const husbandRate =
      totalPossibleAttendances > 0 ? Math.round((totalHusbandPresences / totalPossibleAttendances) * 100) : 0;

    const wifeRate =
      totalPossibleAttendances > 0 ? Math.round((totalWifePresences / totalPossibleAttendances) * 100) : 0;

    const graduationCount = couplesMatrix.filter((c) => c.isGraduationReady).length;
    const returneeCount = couplesMatrix.filter((c) => c.isReturnee).length;
    const atRiskCount = couplesMatrix.filter((c) => c.statusCategory === 'At-Risk').length;

    return {
      overallRate,
      husbandRate,
      wifeRate,
      graduationCount,
      returneeCount,
      atRiskCount,
      couplesMatrix,
      totalTalks,
    };
  }, [currentCouples, currentTalks, attendance, totalInvitedCouples]);

  // Copy report summary text
  const handleCopyReportSummary = () => {
    if (!currentClp) return;
    const summary = `CFC TUY CHAPTER - CLP REPORT SUMMARY
Program: ${currentClp.name} (${currentClp.batchNumber})
Venue: ${currentClp.venue}
Dates: ${currentClp.startDate} to ${currentClp.endDate}
Total Invited Couples: ${totalInvitedCouples}
Overall Attendance Rate: ${reportAnalytics.overallRate}%
Husbands Rate: ${reportAnalytics.husbandRate}% | Wives Rate: ${reportAnalytics.wifeRate}%
Graduation Ready Couples: ${reportAnalytics.graduationCount}
Returnees Tracked: ${reportAnalytics.returneeCount}
Needs Follow-up: ${reportAnalytics.atRiskCount}
Generated via Couples for Christ Tuy Chapter Portal`;

    navigator.clipboard.writeText(summary);
    triggerToast('Report summary copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* CLP Header & Selector Bar - High Contrast Crisp Design */}
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
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                {currentClp ? (
                  <>
                    Venue: <strong className="text-slate-800">{currentClp.venue}</strong> • {currentClp.startDate} to {currentClp.endDate}
                  </>
                ) : (
                  'No Christian Life Program batch created yet.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Batch Selector & Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {programs.length > 0 && (
            <div className="relative">
              <select
                value={selectedClpId}
                onChange={(e) => setSelectedClpId(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 pr-9 text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-100 cursor-pointer shadow-2xs focus:ring-2 focus:ring-blue-600"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <button
            onClick={() => setShowAddClpModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New CLP</span>
          </button>

          {currentClp && (
            <button
              onClick={() => handleDeleteClp(currentClp.id, currentClp.name)}
              title="Delete this CLP batch"
              className="p-2.5 rounded-xl border border-slate-300 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation: Invited Couples, Talks & Attendance, CLP Report */}
      {currentClp ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('couples')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'couples'
                  ? 'bg-[#243c81] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Invited Couples ({currentCouples.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('talks')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'talks'
                  ? 'bg-[#243c81] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>CLP Talks &amp; Attendance ({currentTalks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'report'
                  ? 'bg-[#243c81] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span>CLP Report &amp; Analytics</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: INVITED COUPLES DIRECTORY                                           */}
          {/* ========================================================================= */}
          {activeTab === 'couples' && (
            <div className="space-y-6">
              {/* Search, Filter, and Action Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search husband, wife, or barangay..."
                      value={searchCoupleQuery}
                      onChange={(e) => setSearchCoupleQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  <select
                    value={filterBarangay}
                    onChange={(e) => setFilterBarangay(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="ALL">All Tuy Barangays</option>
                    {TUY_BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View on Map All + Add Couple Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMapModalFocusedCoupleId(null);
                      setMapModalTitle(`All Invited Couples • ${currentClp.name}`);
                      setShowCouplesMapModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#243c81] font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
                  >
                    <Map className="w-4 h-4 text-blue-700" />
                    <span>View All Couples on Map</span>
                  </button>

                  <button
                    onClick={() => setShowAddCoupleModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Couple with Map Picker</span>
                  </button>
                </div>
              </div>

              {/* Couples Cards Grid - High Contrast Crisp White Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCouples.map((couple) => (
                  <div
                    key={couple.id}
                    className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
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
                          Bro. {couple.husbandFirstName} &amp; Sis. {couple.wifeFirstName}{' '}
                          {couple.husbandLastName}
                        </h3>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Edit Couple Button */}
                          <button
                            onClick={() => handleOpenEditCouple(couple)}
                            title="Edit couple details"
                            className="text-slate-400 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete Couple Button */}
                          <button
                            onClick={() =>
                              handleDeleteCouple(
                                couple.id,
                                `Bro. ${couple.husbandFirstName} & Sis. ${couple.wifeFirstName} ${couple.husbandLastName}`
                              )
                            }
                            title="Remove couple"
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                        {/* Husband Box */}
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

                        {/* Wife Box */}
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

                    {/* Bottom Card Footer: GPS and In-App Mapbox View Button */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono text-[11px]">
                        GPS: {couple.coordinates[1].toFixed(4)}, {couple.coordinates[0].toFixed(4)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMapModalFocusedCoupleId(couple.id);
                          setMapModalTitle(`Bro. ${couple.husbandFirstName} & Sis. ${couple.wifeFirstName}'s Tuy Location`);
                          setShowCouplesMapModal(true);
                        }}
                        className="text-[#243c81] hover:text-blue-700 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span>View on Map →</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCouples.length === 0 && (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm space-y-3">
                  <Users className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700">
                    No invited couples registered yet in this CLP.
                  </p>
                  <button
                    onClick={() => setShowAddCoupleModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-[#243c81] font-bold text-xs hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register First Invitee Couple</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TALKS & ATTENDANCE                                                 */}
          {/* ========================================================================= */}
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
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[11px] font-medium ${
                                    isSelected ? 'text-blue-100' : 'text-slate-500'
                                  }`}
                                >
                                  {talk.date || 'TBD'}
                                </span>
                                {/* Quick edit talk button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditTalk(talk);
                                  }}
                                  title="Edit talk details"
                                  className={`p-1 rounded-md transition-all ${
                                    isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                                  }`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </div>
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
                              <span className={`font-bold ${isSelected ? 'text-amber-300' : 'text-[#243c81]'}`}>
                                {countPresent} attendees
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Active Talk Details & Attendance Sheet */}
                  <div className="lg:col-span-8 space-y-5">
                    {activeTalk ? (
                      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                        {/* Talk Header with Edit Button */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                Talk {activeTalk.talkNumber} • Attendance Sheet
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                {activeTalk.moduleName}
                              </span>
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                              {activeTalk.title}
                            </h2>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2 font-medium">
                              <span>
                                Speaker: <strong className="text-slate-800">{activeTalk.speaker}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Venue: <strong className="text-slate-800">{activeTalk.venue}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Edit Talk Details Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditTalk(activeTalk)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                            >
                              <Pencil className="w-3.5 h-3.5 text-blue-700" />
                              <span>Edit Talk</span>
                            </button>

                            <div className="text-right text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-1 font-semibold text-slate-800">
                                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                                <span>{activeTalk.date || 'Date TBD'}</span>
                              </div>
                              <span className="text-[11px] block mt-0.5 font-medium">
                                {activeTalk.time || '6:30 PM - 9:00 PM'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Attendance Counter Card */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Overall Attendance
                            </span>
                            <span className="text-xl font-black text-[#243c81]">
                              {totalPresentIndividuals} / {totalPossibleIndividuals} ({attendancePercentage}%)
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Husbands Present
                            </span>
                            <span className="text-lg font-bold text-blue-700">
                              {presentHusbands} / {totalInvitedCouples}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Wives Present
                            </span>
                            <span className="text-lg font-bold text-rose-700">
                              {presentWives} / {totalInvitedCouples}
                            </span>
                          </div>
                        </div>

                        {/* Couples Attendance Checklist Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                                <th className="py-3 px-3">Invited Couple</th>
                                <th className="py-3 px-3">Barangay</th>
                                <th className="py-3 px-3 text-center">Husband Status</th>
                                <th className="py-3 px-3 text-center">Wife Status</th>
                                <th className="py-3 px-3">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {currentCouples.map((c) => {
                                const att = attendance.find(
                                  (a) => a.talkId === activeTalk.id && a.coupleId === c.id
                                );
                                const hp = Boolean(att?.husbandPresent);
                                const wp = Boolean(att?.wifePresent);

                                return (
                                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-3 px-3">
                                      <span className="font-bold text-slate-900 block text-sm">
                                        {c.husbandLastName}, {c.husbandFirstName} &amp; {c.wifeFirstName}
                                      </span>
                                      <span className="text-[11px] text-slate-500">
                                        📞 {c.husbandContact || c.wifeContact || 'No contact'}
                                      </span>
                                    </td>

                                    <td className="py-3 px-3 text-slate-700">{c.barangay}</td>

                                    {/* Husband Checkbox */}
                                    <td className="py-3 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => toggleAttendance(activeTalk.id, c.id, 'husband')}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                          hp
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                      >
                                        {hp ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                        <span>{hp ? 'Present' : 'Absent'}</span>
                                      </button>
                                    </td>

                                    {/* Wife Checkbox */}
                                    <td className="py-3 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => toggleAttendance(activeTalk.id, c.id, 'wife')}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                          wp
                                            ? 'bg-rose-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                      >
                                        {wp ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                        <span>{wp ? 'Present' : 'Absent'}</span>
                                      </button>
                                    </td>

                                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                                      {att?.remarks || '—'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {currentCouples.length === 0 && (
                            <div className="p-8 text-center text-slate-500 text-xs">
                              No invited couples to take attendance for yet. Add couples in the &quot;Invited Couples&quot; tab.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
                        Select a talk on the left to review or take attendance.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CLP REPORT & ANALYTICS                                             */}
          {/* ========================================================================= */}
          {activeTab === 'report' && (
            <div className="space-y-6">
              {/* Report Header Bar */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                      <BarChart3 className="w-5 h-5" />
                    </span>
                    <h2 className="text-xl font-black text-slate-900">
                      CLP Analytics &amp; Pastoral Report
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Comprehensive attendance analysis, returnee tracking, and graduation candidacy for {currentClp.name}.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyReportSummary}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                  >
                    <Copy className="w-4 h-4 text-blue-600" />
                    <span>Copy Summary</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    <span>Print Report</span>
                  </button>
                </div>
              </div>

              {/* 4 Overview Analytics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Invited */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#243c81] flex items-center justify-center shrink-0 border border-blue-100">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Invited Couples
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      {totalInvitedCouples}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      {currentCouples.filter((c) => c.status === 'Active').length} active couples
                    </span>
                  </div>
                </div>

                {/* Overall Attendance Rate */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Overall Attendance
                    </span>
                    <span className="text-2xl font-black text-emerald-700">
                      {reportAnalytics.overallRate}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Across {reportAnalytics.totalTalks} completed talks
                    </span>
                  </div>
                </div>

                {/* Spouse Participation Ratio */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Participation
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-blue-700">H: {reportAnalytics.husbandRate}%</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-bold text-rose-700">W: {reportAnalytics.wifeRate}%</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Husbands vs Wives attendance
                    </span>
                  </div>
                </div>

                {/* Graduation Readiness */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Graduation Candidates
                    </span>
                    <span className="text-2xl font-black text-amber-800">
                      {reportAnalytics.graduationCount}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      {reportAnalytics.returneeCount} returnees tracked
                    </span>
                  </div>
                </div>
              </div>

              {/* Per-Talk Progression Table */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-700" />
                  <span>Talk-by-Talk Attendance Progression</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Talk</th>
                        <th className="py-2.5 px-3">Module</th>
                        <th className="py-2.5 px-3">Speaker &amp; Date</th>
                        <th className="py-2.5 px-3 text-center">Husbands</th>
                        <th className="py-2.5 px-3 text-center">Wives</th>
                        <th className="py-2.5 px-3 text-center">Total Attendees</th>
                        <th className="py-2.5 px-3 text-center">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {currentTalks.map((talk) => {
                        const talkAtt = attendance.filter((a) => a.talkId === talk.id);
                        const hp = talkAtt.filter((a) => a.husbandPresent).length;
                        const wp = talkAtt.filter((a) => a.wifePresent).length;
                        const total = hp + wp;
                        const max = totalInvitedCouples * 2;
                        const pct = max > 0 ? Math.round((total / max) * 100) : 0;

                        return (
                          <tr key={talk.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-extrabold text-slate-900">
                                Talk #{talk.talkNumber}: {talk.title}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600">{talk.moduleName}</td>
                            <td className="py-3 px-3 text-slate-600">
                              <div>{talk.speaker}</div>
                              <span className="text-[11px] text-slate-400">{talk.date || 'TBD'}</span>
                            </td>
                            <td className="py-3 px-3 text-center text-blue-700 font-bold">
                              {hp} / {totalInvitedCouples}
                            </td>
                            <td className="py-3 px-3 text-center text-rose-700 font-bold">
                              {wp} / {totalInvitedCouples}
                            </td>
                            <td className="py-3 px-3 text-center font-extrabold text-[#243c81]">
                              {total}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                                  pct >= 75
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : pct >= 50
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Master Attendance Matrix & Returnee Tracker */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Couple Attendance Matrix &amp; Returnee Tracker</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Tracks every couple across Talks 1 to 8 with returnee identification and graduation readiness.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Filter:</span>
                    <select
                      value={reportFilterStatus}
                      onChange={(e) => setReportFilterStatus(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="Graduation">Graduation Ready (6+ Talks)</option>
                      <option value="Returnee">Returnees (Missed &amp; Returned)</option>
                      <option value="At-Risk">Needs Follow-up / At-Risk</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Invited Couple</th>
                        <th className="py-2.5 px-3">Barangay</th>
                        {currentTalks.map((t) => (
                          <th key={t.id} className="py-2.5 px-2 text-center">
                            T{t.talkNumber}
                          </th>
                        ))}
                        <th className="py-2.5 px-3 text-center">Sessions</th>
                        <th className="py-2.5 px-3 text-center">Candidacy Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {reportAnalytics.couplesMatrix
                        .filter((row) => {
                          if (reportFilterStatus === 'ALL') return true;
                          return row.statusCategory === reportFilterStatus;
                        })
                        .map(({ couple, talkStatuses, attendedTalksCount, attendancePct, statusCategory, isReturnee }) => (
                          <tr key={couple.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-extrabold text-slate-900 block">
                                Bro. {couple.husbandFirstName} &amp; Sis. {couple.wifeFirstName} {couple.husbandLastName}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                📞 {couple.husbandContact || couple.wifeContact || 'N/A'}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-slate-600">{couple.barangay}</td>

                            {/* T1 through T8 status pills */}
                            {talkStatuses.map((t) => (
                              <td key={t.talkId} className="py-3 px-2 text-center">
                                {t.both ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px]" title="Both Husband & Wife Present">
                                    ✓
                                  </span>
                                ) : t.any ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-bold text-[10px]" title="1 Spouse Present">
                                    ½
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-400 text-[10px]" title="Absent">
                                    —
                                  </span>
                                )}
                              </td>
                            ))}

                            {/* Total Talks */}
                            <td className="py-3 px-3 text-center">
                              <span className="font-black text-slate-900">
                                {attendedTalksCount} / {currentTalks.length}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-normal">
                                ({attendancePct}%)
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3 px-3 text-center">
                              {statusCategory === 'Graduation' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Award className="w-3 h-3" />
                                  <span>Graduation Ready</span>
                                </span>
                              )}
                              {statusCategory === 'Returnee' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                  <Sparkles className="w-3 h-3" />
                                  <span>Returnee</span>
                                </span>
                              )}
                              {statusCategory === 'At-Risk' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Needs Follow-up</span>
                                </span>
                              )}
                              {statusCategory === 'Consistent' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-[#243c81] border border-blue-200">
                                  <Check className="w-3 h-3" />
                                  <span>Consistent</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State when no CLP Program exists */
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <BookOpenCheck className="w-12 h-12 text-blue-600 mx-auto" />
          <div>
            <h3 className="text-lg font-black text-slate-900">
              No Christian Life Program Found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by creating your first CLP batch. You can auto-generate all 8 revised talks and pinpoint invited couples in Tuy.
            </p>
          </div>
          <button
            onClick={() => setShowAddClpModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New CLP Batch</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW CLP PROGRAM                                           */}
      {/* ========================================================================= */}
      {showAddClpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-black text-base sm:text-lg text-slate-900">
                Create New Christian Life Program (CLP)
              </h3>
              <button
                onClick={() => setShowAddClpModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClp} className="space-y-4">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  className="px-5 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Save &amp; Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REGISTER INVITEE COUPLE (WITH MAP PICKER)                         */}
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
                      placeholder="e.g. Brgy. Rizal (Pob.), Tuy, Batangas"
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
                  Save Invitee Couple to CLP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT INVITEE COUPLE DETAILS (WITH MAP PICKER)                     */}
      {/* ========================================================================= */}
      {showEditCoupleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  Edit Invitee Couple Information
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update personal details, emails, contact numbers, and pinned location.
                </p>
              </div>
              <button
                onClick={() => setShowEditCoupleModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCouple} className="space-y-5">
              {/* Status Selector */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800">
                  Invitee Couple Membership Status:
                </span>
                <select
                  value={editCoupleStatus}
                  onChange={(e) => setEditCoupleStatus(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-extrabold text-slate-900"
                >
                  <option value="Active">Active Participant</option>
                  <option value="Graduated">Graduated (Completed CLP)</option>
                  <option value="Dropped">Dropped / Inactive</option>
                </select>
              </div>

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
                      value={editHusbandFirst}
                      onChange={(e) => setEditHusbandFirst(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editHusbandLast}
                      onChange={(e) => setEditHusbandLast(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 font-medium"
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
                      value={editHusbandBday}
                      onChange={(e) => setEditHusbandBday(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={editHusbandJob}
                      onChange={(e) => setEditHusbandJob(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium"
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
                      value={editHusbandPhone}
                      onChange={(e) => setEditHusbandPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editHusbandEmail}
                      onChange={(e) => setEditHusbandEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 font-medium"
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
                      value={editWifeFirst}
                      onChange={(e) => setEditWifeFirst(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-rose-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editWifeLast}
                      onChange={(e) => setEditWifeLast(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-rose-600 font-medium"
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
                      value={editWifeBday}
                      onChange={(e) => setEditWifeBday(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={editWifeJob}
                      onChange={(e) => setEditWifeJob(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium"
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
                      value={editWifePhone}
                      onChange={(e) => setEditWifePhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editWifeEmail}
                      onChange={(e) => setEditWifeEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-rose-600 font-medium"
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
                    value={editWeddingAnniv}
                    onChange={(e) => setEditWeddingAnniv(e.target.value)}
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
                      onClick={() => setShowEditMapPicker(!showEditMapPicker)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#243c81] hover:underline"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>{showEditMapPicker ? 'Close Map Picker' : 'Pick on Map Picker'}</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{editCoupleAddress}</span>
                      <span className="text-[11px] text-slate-600 font-mono mt-0.5 block">
                        Brgy. {editCoupleBarangay} • Coordinates: {editCoupleCoords[1].toFixed(4)},{' '}
                        {editCoupleCoords[0].toFixed(4)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowEditMapPicker(true)}
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
                      value={editCoupleAddress}
                      onChange={(e) => setEditCoupleAddress(e.target.value)}
                      placeholder="e.g. Brgy. Rizal (Pob.), Tuy, Batangas"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>
                </div>

                {/* Embedded Map Picker if opened */}
                {showEditMapPicker && (
                  <div className="mt-3 pt-2">
                    <TuyMapPicker
                      initialCoordinates={editCoupleCoords}
                      initialAddress={editCoupleAddress}
                      initialBarangay={editCoupleBarangay}
                      onSelectLocation={(data) => {
                        setEditCoupleAddress(data.address);
                        setEditCoupleBarangay(data.barangay);
                        setEditCoupleCoords(data.coordinates);
                        setShowEditMapPicker(false);
                      }}
                      onClose={() => setShowEditMapPicker(false)}
                    />
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditCoupleModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
                >
                  Update Invitee Couple
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT TALK DETAILS                                                */}
      {/* ========================================================================= */}
      {showEditTalkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  Edit Talk #{editTalkNumber} Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update speaker, talk title, schedule, or venue.
                </p>
              </div>
              <button
                onClick={() => setShowEditTalkModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTalk} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Talk Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTalkTitle}
                  onChange={(e) => setEditTalkTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Speaker Name *
                </label>
                <input
                  type="text"
                  required
                  value={editTalkSpeaker}
                  onChange={(e) => setEditTalkSpeaker(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Module
                </label>
                <input
                  type="text"
                  value={editTalkModule}
                  onChange={(e) => setEditTalkModule(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  value={editTalkVenue}
                  onChange={(e) => setEditTalkVenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editTalkDate}
                    onChange={(e) => setEditTalkDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={editTalkTime}
                    onChange={(e) => setEditTalkTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditTalkModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Save Talk Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD CUSTOM TALK                                                  */}
      {/* ========================================================================= */}
      {showAddTalkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-black text-lg text-slate-900">Add New Talk</h3>
              <button
                onClick={() => setShowAddTalkModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTalk} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Talk #
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={talkNumber}
                    onChange={(e) => setTalkNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Talk Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. God's Love"
                    value={talkTitle}
                    onChange={(e) => setTalkTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Speaker
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bro. Mark Camilon"
                  value={talkSpeaker}
                  onChange={(e) => setTalkSpeaker(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  value={talkVenue}
                  onChange={(e) => setTalkVenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={talkDate}
                    onChange={(e) => setTalkDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddTalkModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Save Talk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: IN-APP MAPBOX VIEWER FOR SINGLE OR ALL INVITED COUPLES           */}
      {/* ========================================================================= */}
      <CLPCouplesMapModal
        isOpen={showCouplesMapModal}
        onClose={() => {
          setShowCouplesMapModal(false);
          setMapModalFocusedCoupleId(null);
        }}
        couples={currentCouples}
        focusedCoupleId={mapModalFocusedCoupleId}
        title={mapModalTitle}
      />
    </div>
  );
}
