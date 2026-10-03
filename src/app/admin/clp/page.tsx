'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TUY_BARANGAYS } from '@/lib/data/mock-data';
import { CLPProgram, CLPCouple, CLPTalk, CLPAttendance, SavedCLPGrouping } from '@/types';
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
  fetchCLPGroupings,
  saveCLPGrouping,
  deleteCLPGrouping,
  generateUUID,
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
  Map as MapIcon,
  Award,
  TrendingUp,
  UserPlus,
  Filter,
  Brain,
  Download,
  Loader2,
  RefreshCw,
  Upload,
  FileDown,
  AlertTriangle,
  CheckCheck,
  LayoutGrid,
  List,
  IdCard,
  ArrowLeft,
  ArrowRight,
  Save,
  Edit3,
  SlidersHorizontal,
  FolderOpen,
  ArrowRightLeft,
  Phone,
  PlusCircle,
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

  // Active Tab: 'couples' | 'talks' | 'report' | 'ai-groups'
  const [activeTab, setActiveTab] = useState<'couples' | 'talks' | 'report' | 'ai-groups'>('couples');

  // Grouping Sub-Tab & Attendance-based Grouping State (Req 3, 4, 5)
  const [groupingSubTab, setGroupingSubTab] = useState<'active' | 'saved'>('active');
  const [groupingSource, setGroupingSource] = useState<'all' | 'talk'>('all');
  const [groupingTalkId, setGroupingTalkId] = useState<string>('');
  const [attendanceRequirement, setAttendanceRequirement] = useState<'either' | 'both'>('either');
  const [savedGroupings, setSavedGroupings] = useState<SavedCLPGrouping[]>([]);
  const [activeSavedGroupingId, setActiveSavedGroupingId] = useState<string | null>(null);
  const [groupingTitleInput, setGroupingTitleInput] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingGrouping, setIsSavingGrouping] = useState(false);

  // AI Grouping Generator State
  const [aiGroupPrompt, setAiGroupPrompt] = useState('');
  const [isAiGrouping, setIsAiGrouping] = useState(false);
  const [aiGroupError, setAiGroupError] = useState<string | null>(null);
  const [aiGroupingResult, setAiGroupingResult] = useState<null | {
    id?: string;
    title?: string;
    talkId?: string;
    talkTitle?: string;
    filterType?: 'all' | 'attended' | 'talk';
    groups: {
      groupNumber: number;
      groupName: string;
      rationale?: string;
      facilitator?: string;
      couples: {
        id: string;
        name: string;
        barangay: string;
        husbandOccupation?: string;
        wifeOccupation?: string;
        address?: string;
        weddingAnniversary?: string;
      }[];
    }[];
    summary?: string;
    prompt?: string;
    generatedAt: string;
  }>(null);

  // Modals
  const [showAddClpModal, setShowAddClpModal] = useState(false);
  const [showAddCoupleModal, setShowAddCoupleModal] = useState(false);
  const [addCoupleMobileTab, setAddCoupleMobileTab] = useState<'form' | 'map'>('form');
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

  // In-App Google Maps Modal State (for viewing single or all couples)
  const [showCouplesMapModal, setShowCouplesMapModal] = useState(false);
  const [mapModalFocusedCoupleId, setMapModalFocusedCoupleId] = useState<string | null>(null);
  const [mapModalTitle, setMapModalTitle] = useState('All Invited Couples Tuy Map');

  // Bulk Upload State
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [bulkUploadPreview, setBulkUploadPreview] = useState<Partial<CLPCouple>[]>([]);
  const [bulkUploadErrors, setBulkUploadErrors] = useState<string[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState<{ success: number; failed: number } | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Talk for Attendance View & Maximized Attendance Sheet
  const [selectedTalkId, setSelectedTalkId] = useState<string>('');
  const [openedAttendanceTalkId, setOpenedAttendanceTalkId] = useState<string | null>(null);

  // Attendance Sheet Filter & Search States
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const [attendanceFilterStatus, setAttendanceFilterStatus] = useState<'all' | 'present' | 'absent' | 'partial'>('all');
  const [attendanceFilterBarangay, setAttendanceFilterBarangay] = useState('ALL');

  // Search & Filter
  const [searchCoupleQuery, setSearchCoupleQuery] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('ALL');
  const [reportFilterStatus, setReportFilterStatus] = useState<'ALL' | 'Graduation' | 'Returnee' | 'At-Risk'>('ALL');

  // View Mode: 'grid' | 'list'
  const [coupleViewMode, setCoupleViewMode] = useState<'grid' | 'list'>('grid');

  // Form states - New CLP
  const [newClpName, setNewClpName] = useState('');
  const [newClpVenue, setNewClpVenue] = useState('Saint Vincent Ferrer Parish Social Hall, Tuy');
  const [newClpStartDate, setNewClpStartDate] = useState('');
  const [newClpEndDate, setNewClpEndDate] = useState('');
  const [newClpBatchNumber, setNewClpBatchNumber] = useState('');
  const [autoPopulateTalks, setAutoPopulateTalks] = useState(true);
  const [isCreatingClp, setIsCreatingClp] = useState(false);
  const [createClpError, setCreateClpError] = useState<string | null>(null);

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

  // Load saved groupings whenever currentClp changes
  useEffect(() => {
    if (currentClp?.id) {
      fetchCLPGroupings(currentClp.id).then((list) => {
        setSavedGroupings(list);
      });
    }
  }, [currentClp?.id]);

  // Set default groupingTalkId when talks are available
  useEffect(() => {
    if (currentTalks.length > 0 && !groupingTalkId) {
      setGroupingTalkId(currentTalks[0].id);
    }
  }, [currentTalks, groupingTalkId]);

  // Attended couples calculation for grouping by talk (Req 4)
  const talkAttendanceForGrouping = useMemo(() => {
    if (!groupingTalkId) return [];
    return attendance.filter((a) => a.talkId === groupingTalkId);
  }, [attendance, groupingTalkId]);

  const attendedCouplesForTalk = useMemo(() => {
    if (!groupingTalkId) return [];
    const presentCoupleIds = new Set(
      talkAttendanceForGrouping
        .filter((a) =>
          attendanceRequirement === 'both'
            ? Boolean(a.husbandPresent && a.wifePresent)
            : Boolean(a.husbandPresent || a.wifePresent)
        )
        .map((a) => a.coupleId)
    );
    return currentCouples.filter((c) => presentCoupleIds.has(c.id));
  }, [currentCouples, talkAttendanceForGrouping, groupingTalkId, attendanceRequirement]);

  const targetCouplesForGrouping = useMemo(() => {
    if (groupingSource === 'talk') {
      return attendedCouplesForTalk;
    }
    return currentCouples;
  }, [groupingSource, attendedCouplesForTalk, currentCouples]);

  // Active talk for attendance
  const activeTalk = useMemo(() => {
    return currentTalks.find((t) => t.id === selectedTalkId) || currentTalks[0] || null;
  }, [currentTalks, selectedTalkId]);

  const activeOpenedTalk = useMemo(() => {
    if (!openedAttendanceTalkId) return null;
    return currentTalks.find((t) => t.id === openedAttendanceTalkId) || null;
  }, [currentTalks, openedAttendanceTalkId]);

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

    setIsCreatingClp(true);
    setCreateClpError(null);

    const progId = generateUUID();
    const newProg: CLPProgram = {
      id: progId,
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
    } catch (err: any) {
      console.error('Error creating CLP:', err);
      const msg = err?.message || 'Error creating program. Please try again.';
      setCreateClpError(msg);
      triggerToast(msg);
    } finally {
      setIsCreatingClp(false);
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
      id: generateUUID(),
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
  // Handlers: Bulk Upload Invitees (CSV)
  // -------------------------------------------------------------------------

  /** Generates and triggers download of the invitee CSV template */
  const handleDownloadTemplate = () => {
    const headers = [
      'husband_first_name',
      'husband_last_name',
      'husband_birthday',
      'husband_occupation',
      'husband_contact',
      'husband_email',
      'wife_first_name',
      'wife_last_name',
      'wife_birthday',
      'wife_occupation',
      'wife_contact',
      'wife_email',
      'wedding_anniversary',
      'address',
      'barangay',
    ];
    const exampleRow = [
      'Juan',
      'dela Cruz',
      '1985-06-15',
      'Engineer',
      '09171234567',
      'juan@email.com',
      'Maria',
      'dela Cruz',
      '1988-03-22',
      'Teacher',
      '09187654321',
      'maria@email.com',
      '2010-09-18',
      'Brgy. Rizal (Pob.), Tuy, Batangas',
      'Rizal (Pob.)',
    ];
    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clp_invitees_template.csv';
    link.click();
    URL.revokeObjectURL(url);
    triggerToast('Template downloaded!');
  };

  /** Parses the selected CSV file and populates the preview */
  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkUploadFile(file);
    setBulkUploadResult(null);
    setBulkUploadErrors([]);
    setBulkUploadPreview([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        setBulkUploadErrors(['CSV file must have a header row and at least one data row.']);
        return;
      }

      const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

      const expectedHeaders = [
        'husband_first_name', 'husband_last_name', 'wife_first_name', 'wife_last_name',
        'address', 'barangay',
      ];
      const missingHeaders = expectedHeaders.filter((h) => !rawHeaders.includes(h));
      if (missingHeaders.length > 0) {
        setBulkUploadErrors([`Missing required columns: ${missingHeaders.join(', ')}`]);
        return;
      }

      const parsed: Partial<CLPCouple>[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle comma-separated values (basic CSV parse; no embedded commas in fields)
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        rawHeaders.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        const husbFirst = row['husband_first_name'];
        const husbLast = row['husband_last_name'];
        const wifeFirst = row['wife_first_name'];
        const wifeLast = row['wife_last_name'];
        const address = row['address'];
        const barangay = row['barangay'];

        if (!husbFirst || !husbLast || !wifeFirst || !wifeLast) {
          errors.push(`Row ${i}: Missing required name fields.`);
          continue;
        }
        if (!address || !barangay) {
          errors.push(`Row ${i}: Missing address or barangay.`);
          continue;
        }

        parsed.push({
          husbandFirstName: husbFirst,
          husbandLastName: husbLast,
          husbandBirthday: row['husband_birthday'] || '',
          husbandOccupation: row['husband_occupation'] || '',
          husbandContact: row['husband_contact'] || '',
          husbandEmail: row['husband_email'] || '',
          wifeFirstName: wifeFirst,
          wifeLastName: wifeLast,
          wifeBirthday: row['wife_birthday'] || '',
          wifeOccupation: row['wife_occupation'] || '',
          wifeContact: row['wife_contact'] || '',
          wifeEmail: row['wife_email'] || '',
          weddingAnniversary: row['wedding_anniversary'] || '',
          address,
          barangay,
          coordinates: [120.7289, 14.0228] as [number, number],
          status: 'Active' as const,
        });
      }

      setBulkUploadPreview(parsed);
      setBulkUploadErrors(errors);
    };
    reader.readAsText(file);
  };

  /** Saves all previewed couples to the current CLP */
  const handleBulkUploadSubmit = async () => {
    if (!currentClp || bulkUploadPreview.length === 0) return;
    setIsBulkUploading(true);
    let success = 0;
    let failed = 0;

    for (const partial of bulkUploadPreview) {
      try {
        const newCouple: CLPCouple = {
          id: generateUUID(),
          clpId: currentClp.id,
          husbandFirstName: partial.husbandFirstName || '',
          husbandLastName: partial.husbandLastName || '',
          husbandBirthday: partial.husbandBirthday || '',
          husbandOccupation: partial.husbandOccupation || '',
          husbandContact: partial.husbandContact || '',
          husbandEmail: partial.husbandEmail || '',
          wifeFirstName: partial.wifeFirstName || '',
          wifeLastName: partial.wifeLastName || '',
          wifeBirthday: partial.wifeBirthday || '',
          wifeOccupation: partial.wifeOccupation || '',
          wifeContact: partial.wifeContact || '',
          wifeEmail: partial.wifeEmail || '',
          weddingAnniversary: partial.weddingAnniversary || '',
          address: partial.address || '',
          barangay: partial.barangay || '',
          coordinates: partial.coordinates || [120.7289, 14.0228],
          status: 'Active',
        };
        const saved = await saveCLPCouple(newCouple);
        setCouples((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
        success++;
      } catch {
        failed++;
      }
    }

    setIsBulkUploading(false);
    setBulkUploadResult({ success, failed });
    setBulkUploadPreview([]);
    setBulkUploadFile(null);
    triggerToast(`Bulk upload complete: ${success} added, ${failed} failed.`);
  };

  // -------------------------------------------------------------------------
  // Handlers: Talks Management (Create, Edit, Auto-Populate)
  // -------------------------------------------------------------------------
  const handleCreateTalk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClp || !talkTitle) return;

    const newTalk: CLPTalk = {
      id: generateUUID(),
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

  // Computations for active opened talk attendance sheet
  const openedTalkAttendance = useMemo(() => {
    if (!activeOpenedTalk) return [];
    return attendance.filter((a) => a.talkId === activeOpenedTalk.id);
  }, [attendance, activeOpenedTalk]);

  const openedTalkPresentHusbands = useMemo(() => {
    return openedTalkAttendance.filter((a) => a.husbandPresent).length;
  }, [openedTalkAttendance]);

  const openedTalkPresentWives = useMemo(() => {
    return openedTalkAttendance.filter((a) => a.wifePresent).length;
  }, [openedTalkAttendance]);

  const openedTalkTotalPresentIndividuals = openedTalkPresentHusbands + openedTalkPresentWives;
  const openedTalkTotalPossibleIndividuals = totalInvitedCouples * 2;
  const openedTalkAttendancePercentage =
    openedTalkTotalPossibleIndividuals > 0
      ? Math.round((openedTalkTotalPresentIndividuals / openedTalkTotalPossibleIndividuals) * 100)
      : 0;

  const openedTalkBothPresentCouples = useMemo(() => {
    return currentCouples.filter((c) => {
      const att = openedTalkAttendance.find((a) => a.coupleId === c.id);
      return Boolean(att?.husbandPresent && att?.wifePresent);
    }).length;
  }, [currentCouples, openedTalkAttendance]);

  // Filtered couples in attendance sheet
  const attendanceCouples = useMemo(() => {
    if (!activeOpenedTalk) return [];
    return currentCouples.filter((c) => {
      const matchesSearch =
        attendanceSearchQuery.trim() === '' ||
        c.husbandFirstName.toLowerCase().includes(attendanceSearchQuery.toLowerCase()) ||
        c.husbandLastName.toLowerCase().includes(attendanceSearchQuery.toLowerCase()) ||
        c.wifeFirstName.toLowerCase().includes(attendanceSearchQuery.toLowerCase()) ||
        c.wifeLastName.toLowerCase().includes(attendanceSearchQuery.toLowerCase()) ||
        c.barangay.toLowerCase().includes(attendanceSearchQuery.toLowerCase());

      const matchesBarangay =
        attendanceFilterBarangay === 'ALL' || c.barangay === attendanceFilterBarangay;

      const att = openedTalkAttendance.find((a) => a.coupleId === c.id);
      const hp = Boolean(att?.husbandPresent);
      const wp = Boolean(att?.wifePresent);

      let matchesStatus = true;
      if (attendanceFilterStatus === 'present') {
        matchesStatus = hp && wp;
      } else if (attendanceFilterStatus === 'absent') {
        matchesStatus = !hp && !wp;
      } else if (attendanceFilterStatus === 'partial') {
        matchesStatus = (hp && !wp) || (!hp && wp);
      }

      return matchesSearch && matchesBarangay && matchesStatus;
    });
  }, [currentCouples, openedTalkAttendance, activeOpenedTalk, attendanceSearchQuery, attendanceFilterBarangay, attendanceFilterStatus]);

  // Mark all filtered couples present
  const handleMarkFilteredPresent = async (talkId: string) => {
    if (!attendanceCouples.length) return;
    const newRecords: CLPAttendance[] = [];
    const updatedMap = new Map(attendance.map((a) => [`${a.talkId}-${a.coupleId}`, a]));

    for (const c of attendanceCouples) {
      const key = `${talkId}-${c.id}`;
      const existing = updatedMap.get(key);
      const updated: CLPAttendance = {
        id: existing?.id || `att-${talkId}-${c.id}`,
        talkId,
        coupleId: c.id,
        husbandPresent: true,
        wifePresent: true,
        remarks: existing?.remarks || '',
      };
      updatedMap.set(key, updated);
      newRecords.push(updated);
    }

    setAttendance(Array.from(updatedMap.values()));
    triggerToast(`Marked ${attendanceCouples.length} couples present!`);

    for (const rec of newRecords) {
      try {
        await saveCLPAttendance(rec);
      } catch (err) {
        console.error('Error batch saving attendance:', err);
      }
    }
  };

  // Clear attendance for all filtered couples
  const handleClearFilteredAttendance = async (talkId: string) => {
    if (!attendanceCouples.length) return;
    const newRecords: CLPAttendance[] = [];
    const updatedMap = new Map(attendance.map((a) => [`${a.talkId}-${a.coupleId}`, a]));

    for (const c of attendanceCouples) {
      const key = `${talkId}-${c.id}`;
      const existing = updatedMap.get(key);
      const updated: CLPAttendance = {
        id: existing?.id || `att-${talkId}-${c.id}`,
        talkId,
        coupleId: c.id,
        husbandPresent: false,
        wifePresent: false,
        remarks: existing?.remarks || '',
      };
      updatedMap.set(key, updated);
      newRecords.push(updated);
    }

    setAttendance(Array.from(updatedMap.values()));
    triggerToast(`Cleared attendance for ${attendanceCouples.length} couples.`);

    for (const rec of newRecords) {
      try {
        await saveCLPAttendance(rec);
      } catch (err) {
        console.error('Error saving attendance:', err);
      }
    }
  };

  // Update remarks
  const handleUpdateRemarks = async (talkId: string, coupleId: string, remarks: string) => {
    const existing = attendance.find((a) => a.talkId === talkId && a.coupleId === coupleId);
    const updatedRecord: CLPAttendance = existing
      ? { ...existing, remarks }
      : {
          id: `att-${talkId}-${coupleId}`,
          talkId,
          coupleId,
          husbandPresent: false,
          wifePresent: false,
          remarks,
        };

    setAttendance((prev) => {
      const filtered = prev.filter((a) => !(a.talkId === talkId && a.coupleId === coupleId));
      return [...filtered, updatedRecord];
    });

    try {
      await saveCLPAttendance(updatedRecord);
    } catch (err) {
      console.error('Error saving remarks:', err);
    }
  };

  // Print individual talk attendance sheet
  const handlePrintTalkAttendance = (talk: CLPTalk) => {
    if (!currentCouples.length) {
      triggerToast('No invited couples to print attendance sheet for.');
      return;
    }

    const logoUrl = `${window.location.origin}/images/cfc_logo_only_blue.png`;
    const genDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const talkAtt = attendance.filter((a) => a.talkId === talk.id);

    const rowsHtml = currentCouples
      .map((c, idx) => {
        const att = talkAtt.find((a) => a.coupleId === c.id);
        const hp = att?.husbandPresent ? '✓ PRESENT' : '[   ]';
        const wp = att?.wifePresent ? '✓ PRESENT' : '[   ]';

        return `
          <tr>
            <td style="text-align:center;font-weight:bold;color:#64748b;">${idx + 1}</td>
            <td style="font-weight:bold;">
              ${c.husbandLastName}, ${c.husbandFirstName} & ${c.wifeFirstName}
            </td>
            <td>Brgy. ${c.barangay}</td>
            <td style="text-align:center;font-weight:bold;${att?.husbandPresent ? 'color:#1e3a8a;' : 'color:#94a3b8;'}">${hp}</td>
            <td style="text-align:center;font-weight:bold;${att?.wifePresent ? 'color:#be123c;' : 'color:#94a3b8;'}">${wp}</td>
            <td style="color:#64748b;font-size:11px;">${att?.remarks || ''}</td>
          </tr>
        `;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Attendance Sheet – Talk ${talk.talkNumber}: ${talk.title}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 20px; }
    .no-print { display: flex; justify-content: space-between; align-items: center; background: #1e3a8a; color: #fff; padding: 10px 16px; border-radius: 8px; margin-bottom: 20px; }
    .btn { background: #fff; color: #1e3a8a; border: none; padding: 6px 14px; font-weight: 700; border-radius: 6px; cursor: pointer; }
    .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px; }
    .header img { width: 50px; height: 50px; }
    .header h1 { font-size: 16px; font-weight: 900; color: #1e3a8a; }
    .header h2 { font-size: 13px; font-weight: 700; color: #334155; }
    .header p { font-size: 11px; color: #64748b; }
    .meta { margin-left: auto; text-align: right; font-size: 11px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f1f5f9; padding: 8px; border-bottom: 2px solid #94a3b8; text-align: left; font-size: 10.5px; text-transform: uppercase; }
    td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <span>Talk #${talk.talkNumber}: ${talk.title} • Attendance Sheet</span>
    <button class="btn" onclick="window.print()">🖨 Print / Save PDF</button>
  </div>
  <div class="header">
    <img src="${logoUrl}" alt="CFC" />
    <div>
      <h1>Couples for Christ • Tuy Chapter</h1>
      <h2>Talk #${talk.talkNumber}: ${talk.title} (${talk.moduleName || 'CLP Curriculum'})</h2>
      <p>Speaker: ${talk.speaker} • Venue: ${talk.venue} • Date: ${talk.date || 'TBD'} ${talk.time || ''}</p>
    </div>
    <div class="meta">
      <div>Total Couples: ${currentCouples.length}</div>
      <div>Date: ${genDate}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:5%;text-align:center;">#</th>
        <th style="width:35%;">Invited Couple</th>
        <th style="width:18%;">Barangay</th>
        <th style="width:14%;text-align:center;">Husband</th>
        <th style="width:14%;text-align:center;">Wife</th>
        <th style="width:14%;">Remarks / Signature</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    } else {
      triggerToast('Pop-up blocked. Please allow pop-ups and try again.');
    }
  };

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

  // ---------------------------------------------------------------------------
  // AI Grouping Handlers & Editing (Gemini API + Persistence + Re-arranging)
  // ---------------------------------------------------------------------------
  const handleAIGrouping = async () => {
    if (!currentClp || currentCouples.length === 0) {
      triggerToast('No couples to group. Please add invitees first.');
      return;
    }

    if (groupingSource === 'talk' && targetCouplesForGrouping.length === 0) {
      const selectedTalkObj = currentTalks.find((t) => t.id === groupingTalkId);
      triggerToast(
        `No couples have been marked present for ${
          selectedTalkObj ? `Talk ${selectedTalkObj.talkNumber}` : 'the selected talk'
        }. Please record attendance or switch to All Registered Couples.`
      );
      return;
    }

    if (!aiGroupPrompt.trim()) {
      triggerToast('Please enter a grouping instruction.');
      return;
    }

    setIsAiGrouping(true);
    setAiGroupError(null);
    setAiGroupingResult(null);

    try {
      const couplesPayload = targetCouplesForGrouping.map((c) => ({
        id: c.id,
        name: `Bro. ${c.husbandFirstName} & Sis. ${c.wifeFirstName} ${c.husbandLastName}`,
        barangay: c.barangay,
        husbandOccupation: c.husbandOccupation || '',
        wifeOccupation: c.wifeOccupation || '',
        address: c.address,
        weddingAnniversary: c.weddingAnniversary || '',
      }));

      const selectedTalkObj = currentTalks.find((t) => t.id === groupingTalkId);
      const talkTitle =
        groupingSource === 'talk' && selectedTalkObj
          ? `Talk ${selectedTalkObj.talkNumber}: ${selectedTalkObj.title}`
          : undefined;

      const response = await fetch('/api/ai-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couples: couplesPayload,
          userPrompt: aiGroupPrompt,
          programName: currentClp.name + (talkTitle ? ` (${talkTitle})` : ''),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI grouping failed. Please try again.');

      const autoTitle = talkTitle
        ? `${currentClp.name} - ${talkTitle} Discussion Groups`
        : `${currentClp.name} - Holy Spirit Groupings`;

      setGroupingTitleInput(autoTitle);
      setActiveSavedGroupingId(null);
      setIsEditMode(false);

      const newGroupingResult = {
        id: generateUUID(),
        title: autoTitle,
        talkId: groupingSource === 'talk' ? groupingTalkId : undefined,
        talkTitle,
        filterType: groupingSource,
        groups: data.groups.map((g: any, idx: number) => ({
          groupNumber: g.groupNumber || idx + 1,
          groupName: g.groupName || `Group ${idx + 1}`,
          rationale: g.rationale || '',
          facilitator: g.facilitator || '',
          couples: g.couples || [],
        })),
        summary: data.summary,
        prompt: aiGroupPrompt,
        generatedAt: new Date().toISOString(),
      };

      setAiGroupingResult(newGroupingResult);
      triggerToast(`✨ Created ${data.groups.length} groups from ${targetCouplesForGrouping.length} couples!`);
    } catch (err: any) {
      setAiGroupError(err?.message || 'An error occurred during AI grouping.');
    } finally {
      setIsAiGrouping(false);
    }
  };

  // Save grouping to Supabase & LocalStorage (Req 3)
  const handleSaveCurrentGrouping = async () => {
    if (!aiGroupingResult || !currentClp) return;
    setIsSavingGrouping(true);
    try {
      const finalTitle =
        groupingTitleInput.trim() || aiGroupingResult.title || `${currentClp.name} Groupings`;

      const toSave: SavedCLPGrouping = {
        id: activeSavedGroupingId || aiGroupingResult.id || generateUUID(),
        clpId: currentClp.id,
        title: finalTitle,
        talkId: aiGroupingResult.talkId,
        talkTitle: aiGroupingResult.talkTitle,
        prompt: aiGroupingResult.prompt,
        summary: aiGroupingResult.summary,
        filterType: aiGroupingResult.filterType || groupingSource,
        groups: aiGroupingResult.groups.map((g) => ({
          groupNumber: g.groupNumber,
          groupName: g.groupName,
          rationale: g.rationale,
          facilitator: g.facilitator,
          couples: g.couples.map((c) => ({
            id: c.id,
            name: c.name,
            barangay: c.barangay,
            husbandOccupation: c.husbandOccupation,
            wifeOccupation: c.wifeOccupation,
            address: c.address,
            weddingAnniversary: c.weddingAnniversary,
          })),
        })),
        createdAt: aiGroupingResult.generatedAt || new Date().toISOString(),
      };

      const saved = await saveCLPGrouping(toSave);
      setActiveSavedGroupingId(saved.id);
      setGroupingTitleInput(saved.title);
      triggerToast(`✓ Grouping "${saved.title}" saved successfully!`);

      const updated = await fetchCLPGroupings(currentClp.id);
      setSavedGroupings(updated);
    } catch (err: any) {
      triggerToast('Error saving grouping: ' + (err?.message || 'Please try again'));
    } finally {
      setIsSavingGrouping(false);
    }
  };

  // Load a previously saved grouping (Req 3)
  const handleLoadSavedGrouping = (saved: SavedCLPGrouping) => {
    setActiveSavedGroupingId(saved.id);
    setGroupingTitleInput(saved.title);
    setAiGroupPrompt(saved.prompt || '');
    setAiGroupingResult({
      id: saved.id,
      title: saved.title,
      talkId: saved.talkId,
      talkTitle: saved.talkTitle,
      filterType: saved.filterType,
      groups: saved.groups,
      summary: saved.summary || '',
      prompt: saved.prompt || '',
      generatedAt: saved.createdAt,
    });
    setGroupingSubTab('active');
    setIsEditMode(false);
    triggerToast(`Loaded grouping "${saved.title}"`);
  };

  // Delete a saved grouping (Req 3)
  const handleDeleteSavedGrouping = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete saved grouping "${title}"?`)) {
      await deleteCLPGrouping(id);
      if (activeSavedGroupingId === id) {
        setActiveSavedGroupingId(null);
      }
      if (currentClp) {
        const updated = await fetchCLPGroupings(currentClp.id);
        setSavedGroupings(updated);
      }
      triggerToast(`Deleted grouping "${title}"`);
    }
  };

  // Edit Grouping Operations (Req 5)
  const handleUpdateGroupName = (groupIndex: number, newName: string) => {
    if (!aiGroupingResult) return;
    const nextGroups = [...aiGroupingResult.groups];
    nextGroups[groupIndex] = { ...nextGroups[groupIndex], groupName: newName };
    setAiGroupingResult({ ...aiGroupingResult, groups: nextGroups });
  };

  const handleUpdateGroupFacilitator = (groupIndex: number, facilitator: string) => {
    if (!aiGroupingResult) return;
    const nextGroups = [...aiGroupingResult.groups];
    nextGroups[groupIndex] = { ...nextGroups[groupIndex], facilitator };
    setAiGroupingResult({ ...aiGroupingResult, groups: nextGroups });
  };

  const handleMoveCouple = (fromGroupIndex: number, targetGroupIndex: number, coupleId: string) => {
    if (!aiGroupingResult || fromGroupIndex === targetGroupIndex) return;
    const nextGroups = [...aiGroupingResult.groups];
    const coupleToMove = nextGroups[fromGroupIndex].couples.find((c) => c.id === coupleId);
    if (!coupleToMove) return;

    nextGroups[fromGroupIndex] = {
      ...nextGroups[fromGroupIndex],
      couples: nextGroups[fromGroupIndex].couples.filter((c) => c.id !== coupleId),
    };
    nextGroups[targetGroupIndex] = {
      ...nextGroups[targetGroupIndex],
      couples: [...nextGroups[targetGroupIndex].couples, coupleToMove],
    };

    setAiGroupingResult({ ...aiGroupingResult, groups: nextGroups });
    triggerToast(`Moved ${coupleToMove.name} to Group ${nextGroups[targetGroupIndex].groupNumber}`);
  };

  const handleRemoveCoupleFromGroup = (groupIndex: number, coupleId: string) => {
    if (!aiGroupingResult) return;
    const nextGroups = [...aiGroupingResult.groups];
    const coupleToRemove = nextGroups[groupIndex].couples.find((c) => c.id === coupleId);
    nextGroups[groupIndex] = {
      ...nextGroups[groupIndex],
      couples: nextGroups[groupIndex].couples.filter((c) => c.id !== coupleId),
    };
    setAiGroupingResult({ ...aiGroupingResult, groups: nextGroups });
    if (coupleToRemove) {
      triggerToast(`Removed ${coupleToRemove.name} from Group ${nextGroups[groupIndex].groupNumber}`);
    }
  };

  const handleAddNewGroup = () => {
    if (!aiGroupingResult) return;
    const nextNumber = aiGroupingResult.groups.length + 1;
    const newGroup = {
      groupNumber: nextNumber,
      groupName: `Group ${nextNumber}`,
      rationale: 'Discussion Circle',
      facilitator: '',
      couples: [],
    };
    setAiGroupingResult({
      ...aiGroupingResult,
      groups: [...aiGroupingResult.groups, newGroup],
    });
    triggerToast(`Added Group ${nextNumber}`);
  };

  const handleDeleteGroup = (groupIndex: number) => {
    if (!aiGroupingResult) return;
    if (aiGroupingResult.groups.length <= 1) {
      triggerToast('You must have at least one group.');
      return;
    }
    const groupToDelete = aiGroupingResult.groups[groupIndex];
    const remainingGroups = aiGroupingResult.groups.filter((_, idx) => idx !== groupIndex);
    if (groupToDelete.couples.length > 0 && remainingGroups.length > 0) {
      remainingGroups[0].couples = [...remainingGroups[0].couples, ...groupToDelete.couples];
    }
    const renumbered = remainingGroups.map((g, idx) => ({
      ...g,
      groupNumber: idx + 1,
    }));
    setAiGroupingResult({ ...aiGroupingResult, groups: renumbered });
    triggerToast(`Deleted Group ${groupToDelete.groupNumber}`);
  };

  const handleDownloadAIGroupsHTML = () => {
    if (!aiGroupingResult || !currentClp) return;
    const groupColors = ['#243c81', '#7c3aed', '#0f766e', '#b45309', '#be123c', '#0369a1'];
    const totalCouplesCount = aiGroupingResult.groups.reduce((acc, g) => acc + g.couples.length, 0);
    const groupingTitle = groupingTitleInput.trim() || aiGroupingResult.title || 'Discussion Groupings';

    const printContent = `<!DOCTYPE html>
<html>
<head>
  <title>${groupingTitle} – ${currentClp.name}</title>
  <meta charset="utf-8"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;padding:28px;color:#1e293b;font-size:13px;background:#fff}
    h1{font-size:22px;font-weight:900;color:#243c81;margin-bottom:4px}
    .badge{display:inline-block;font-size:10px;font-weight:700;background:#eff6ff;color:#243c81;border:1px solid #bfdbfe;border-radius:20px;padding:2px 10px;margin-bottom:12px}
    .meta{background:#f8fafc;border-left:4px solid #243c81;padding:12px 16px;border-radius:8px;margin-bottom:20px}
    .meta-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em}
    .meta-prompt{font-size:13px;font-style:italic;color:#1e293b;margin:4px 0}
    .meta-summary{font-size:11px;color:#64748b}
    .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
    .group{border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;page-break-inside:avoid}
    .gh{padding:12px 16px;color:#fff;display:flex;justify-content:space-between;align-items:center}
    .gn{font-size:14px;font-weight:900}
    .gc{font-size:11px;background:rgba(255,255,255,.2);padding:2px 9px;border-radius:20px}
    .fac{background:#f1f5f9;padding:6px 16px;font-size:11px;font-weight:700;color:#1e293b;border-bottom:1px solid #e2e8f0}
    .gr{background:#f8fafc;padding:8px 16px;font-size:11px;color:#475569;border-bottom:1px solid #e2e8f0;font-style:italic}
    .cr{display:flex;align-items:center;padding:8px 16px;border-bottom:1px solid #f8fafc}
    .cr:last-child{border-bottom:none}
    .cn-num{width:22px;height:22px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#475569;margin-right:10px;flex-shrink:0;text-align:center;line-height:22px}
    .cn{font-size:12px;font-weight:700;flex:1}
    .cb{font-size:10px;color:#64748b;margin-left:8px}
    .footer{margin-top:24px;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}
    @media print{body{padding:12px}.grid{grid-template-columns:repeat(2,1fr)}}
  </style>
</head>
<body>
  <h1>${groupingTitle}</h1>
  <span class="badge">${currentClp.name} ${aiGroupingResult.talkTitle ? `• ${aiGroupingResult.talkTitle}` : ''} • ${totalCouplesCount} Couples</span>
  ${
    aiGroupingResult.prompt
      ? `<div class="meta">
          <div class="meta-label">Grouping Instruction / Pastoral Focus</div>
          <div class="meta-prompt">"${aiGroupingResult.prompt}"</div>
          ${aiGroupingResult.summary ? `<div class="meta-summary">${aiGroupingResult.summary}</div>` : ''}
        </div>`
      : ''
  }
  <div class="grid">
    ${aiGroupingResult.groups
      .map(
        (g, gi) => `
    <div class="group">
      <div class="gh" style="background:${groupColors[gi % groupColors.length]}">
        <span class="gn">Group ${g.groupNumber}: ${g.groupName}</span>
        <span class="gc">${g.couples.length} couples</span>
      </div>
      ${g.facilitator ? `<div class="fac">Facilitator / Servant: ${g.facilitator}</div>` : ''}
      ${g.rationale ? `<div class="gr">${g.rationale}</div>` : ''}
      ${g.couples
        .map(
          (c, ci) => `
      <div class="cr">
        <div class="cn-num">${ci + 1}</div>
        <span class="cn">${c.name}</span>
        <span class="cb">Brgy. ${c.barangay}</span>
      </div>`
        )
        .join('')}
    </div>`
      )
      .join('')}
  </div>
  <div class="footer">Generated by CFC Tuy Chapter Admin Portal • ${new Date().toLocaleString('en-PH')}</div>
</body>
</html>`;

    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${groupingTitle.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Downloaded! Open the file in browser and press Ctrl+P to save as PDF.');
  };

  // ---------------------------------------------------------------------------
  // Print Name IDs (A4 sheet, 90×60 mm per card, one card per individual)
  // ---------------------------------------------------------------------------
  const handlePrintIDs = () => {
    if (!currentCouples.length || !currentClp) {
      triggerToast('No invitees to print IDs for.');
      return;
    }

    const logoUrl = `${window.location.origin}/images/cfc_logo_only_blue.png`;
    const totalCards = currentCouples.length * 2;

    // Build one card per individual (husband, then wife)
    const cardsHtml = currentCouples
      .flatMap((c) => [
        // Husband card
        `<div class="id-card">
          <div class="id-inner">
            <div class="last-name fit-text">${(c.husbandLastName || '').toUpperCase()}</div>
            <div class="first-name fit-text">${(c.husbandFirstName || '').toUpperCase()}</div>
            <div class="spouse fit-text">${(c.wifeFirstName || '').toUpperCase()}</div>
            <img class="logo" src="${logoUrl}" alt="CFC" />
          </div>
        </div>`,
        // Wife card — spouse line shows husband's first name only
        `<div class="id-card">
          <div class="id-inner">
            <div class="last-name fit-text">${(c.husbandLastName || '').toUpperCase()}</div>
            <div class="first-name fit-text">${(c.wifeFirstName || '').toUpperCase()}</div>
            <div class="spouse fit-text">${(c.husbandFirstName || '').toUpperCase()}</div>
            <img class="logo" src="${logoUrl}" alt="CFC" />
          </div>
        </div>`,
      ])
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Name IDs – ${currentClp.name}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #fff; font-family: Arial, Helvetica, sans-serif; }
    .sheet {
      display: flex;
      flex-wrap: wrap;
      gap: 4mm;
      width: 190mm;
    }
    .id-card {
      width: 90mm;
      height: 60mm;
      border: 2px solid #1e3a8a;
      border-radius: 3mm;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .id-inner {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3mm 5mm;
      gap: 1.5mm;
    }
    .last-name {
      font-size: 13pt;
      font-weight: 700;
      color: #111;
      letter-spacing: 0.04em;
      text-align: center;
      line-height: 1.1;
      white-space: nowrap;
      max-width: 80mm;
    }
    .first-name {
      font-size: 20pt;
      font-weight: 900;
      color: #000;
      letter-spacing: 0.02em;
      text-align: center;
      line-height: 1;
      white-space: nowrap;
      max-width: 80mm;
    }
    .spouse {
      font-size: 9pt;
      font-weight: 700;
      color: #334155;
      text-align: center;
      letter-spacing: 0.03em;
      line-height: 1.2;
      white-space: nowrap;
      max-width: 80mm;
    }
    .logo {
      width: 13mm;
      height: auto;
      margin-top: 2mm;
      object-fit: contain;
    }
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="padding:12px 16px;background:#1e3a8a;color:#fff;font-family:Arial;font-size:13px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
    <span><strong>${currentClp.name}</strong> — Name IDs (90×60 mm) · ${totalCards} cards (${currentCouples.length} couples)</span>
    <button onclick="window.print()" style="background:#fff;color:#1e3a8a;border:none;padding:6px 16px;border-radius:6px;font-weight:700;cursor:pointer;font-size:13px">🖨 Print / Save as PDF</button>
  </div>
  <div class="sheet">${cardsHtml}</div>
  <script>
    (function() {
      var PT_TO_PX = 96 / 72; // 1pt ≈ 1.333px at 96 dpi

      // Dynamic sizing table: [maxLen, firstNamePt, otherPt (-5)]
      function calcPt(len, offset) {
        var pt;
        if      (len <= 5)  pt = 50;
        else if (len <= 8)  pt = 38;
        else if (len <= 11) pt = 30;
        else                pt = 24;
        return pt - (offset || 0);
      }

      // Step 1: Set initial font sizes based on name length
      document.querySelectorAll('.first-name').forEach(function(el) {
        var len = (el.textContent || '').trim().length;
        el.style.fontSize = calcPt(len, 0) + 'pt';
      });
      document.querySelectorAll('.last-name').forEach(function(el) {
        var len = (el.textContent || '').trim().length;
        el.style.fontSize = calcPt(len, 10) + 'pt';
      });
      document.querySelectorAll('.spouse').forEach(function(el) {
        var len = (el.textContent || '').trim().length;
        el.style.fontSize = calcPt(len, 10) + 'pt';
      });

      // Step 2: Shrink every .fit-text until it no longer overflows its card width
      document.querySelectorAll('.fit-text').forEach(function(el) {
        var MIN_PT = 6;
        var STEP   = 0.5;
        var parent = el.parentElement;
        var fs = parseFloat(getComputedStyle(el).fontSize) / PT_TO_PX;
        while (el.scrollWidth > parent.clientWidth * 0.96 && fs > MIN_PT) {
          fs -= STEP;
          el.style.fontSize = fs + 'pt';
        }
      });
    })();
  </script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) {
      triggerToast('Pop-up blocked. Please allow pop-ups and try again.');
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  // ---------------------------------------------------------------------------
  // Helper: Compute Age from Birthday String
  // ---------------------------------------------------------------------------
  const computeAge = (birthdateStr?: string): string => {
    if (!birthdateStr || typeof birthdateStr !== 'string') return '—';
    const clean = birthdateStr.trim();
    if (!clean) return '—';

    let birth: Date;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
      const parts = clean.split('/').map(Number);
      birth = new Date(parts[2], parts[0] - 1, parts[1]);
    } else {
      birth = new Date(clean);
    }

    if (isNaN(birth.getTime())) return '—';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 && age < 130 ? String(age) : '—';
  };

  // ---------------------------------------------------------------------------
  // Download Invitee Couples List (CSV)
  // Fields: Husband Name, Age, Wife's Name, Age, Address
  // ---------------------------------------------------------------------------
  const handleDownloadCouplesList = () => {
    const targetCouples =
      searchCoupleQuery.trim() || filterBarangay !== 'ALL'
        ? filteredCouples
        : currentCouples;

    if (!targetCouples.length || !currentClp) {
      triggerToast('No invitee couples to download.');
      return;
    }

    const headers = [
      '#',
      'Husband Name',
      'Husband Age',
      "Wife's Name",
      "Wife's Age",
      'Address',
      'Barangay',
      'Status',
    ];

    const escapeCSV = (val: string | number) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = targetCouples.map((c, index) => {
      const hName = `${c.husbandFirstName || ''} ${c.husbandLastName || ''}`.trim();
      const hAge = computeAge(c.husbandBirthday);
      const wName = `${c.wifeFirstName || ''} ${c.wifeLastName || ''}`.trim();
      const wAge = computeAge(c.wifeBirthday);
      const address = c.address || `Brgy. ${c.barangay}, Tuy, Batangas`;
      const barangay = c.barangay || '';
      const status = c.status || 'Active';

      return [
        index + 1,
        escapeCSV(hName),
        escapeCSV(hAge),
        escapeCSV(wName),
        escapeCSV(wAge),
        escapeCSV(address),
        escapeCSV(barangay),
        escapeCSV(status),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const clpNameSanitized = currentClp.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `CFC_Tuy_${clpNameSanitized}_Invitees_List.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Downloaded CSV for ${targetCouples.length} couples!`);
  };

  // ---------------------------------------------------------------------------
  // Print Invitee Couples List
  // Fields: Husband Name, Age, Wife's Name, Age, Address
  // ---------------------------------------------------------------------------
  const handlePrintCouplesList = () => {
    const targetCouples =
      searchCoupleQuery.trim() || filterBarangay !== 'ALL'
        ? filteredCouples
        : currentCouples;

    if (!targetCouples.length || !currentClp) {
      triggerToast('No invitee couples to print.');
      return;
    }

    const logoUrl = `${window.location.origin}/images/cfc_logo_only_blue.png`;
    const genDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const rowsHtml = targetCouples
      .map((c, idx) => {
        const hName = `${c.husbandFirstName || ''} ${c.husbandLastName || ''}`.trim();
        const hAge = computeAge(c.husbandBirthday);
        const wName = `${c.wifeFirstName || ''} ${c.wifeLastName || ''}`.trim();
        const wAge = computeAge(c.wifeBirthday);
        const address = c.address || `Brgy. ${c.barangay}, Tuy, Batangas`;

        return `
          <tr>
            <td class="text-center font-bold text-muted">${idx + 1}</td>
            <td class="font-bold text-dark">
              <span class="prefix">Bro.</span> ${hName}
            </td>
            <td class="text-center font-semibold text-accent">${hAge}</td>
            <td class="font-bold text-dark">
              <span class="prefix">Sis.</span> ${wName}
            </td>
            <td class="text-center font-semibold text-accent">${wAge}</td>
            <td class="text-address">${address}</td>
          </tr>
        `;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invitee Couples Directory – ${currentClp.name}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 12mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: #1e3a8a;
      color: #fff;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .no-print-bar .title {
      font-size: 13.5px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .no-print-bar .actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn {
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .btn-print { background: #fff; color: #1e3a8a; }
    .btn-close { background: rgba(255,255,255,0.2); color: #fff; }

    .page-wrap {
      max-width: 1120px;
      margin: 20px auto;
      background: #fff;
      padding: 28px 36px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    /* Official Document Header */
    .doc-header {
      display: flex;
      align-items: center;
      gap: 18px;
      padding-bottom: 16px;
      border-bottom: 2.5px solid #1e3a8a;
      margin-bottom: 16px;
    }
    .doc-header img {
      width: 58px;
      height: 58px;
      object-fit: contain;
    }
    .doc-header-text h1 {
      font-size: 18px;
      font-weight: 900;
      color: #1e3a8a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .doc-header-text h2 {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      margin-top: 2px;
    }
    .doc-header-text p {
      font-size: 11px;
      color: #64748b;
      margin-top: 1px;
    }
    .doc-header-meta {
      margin-left: auto;
      text-align: right;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #eff6ff;
      color: #1e3a8a;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 700;
    }
    .gen-date {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }

    /* Table Styling */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      line-height: 1.35;
    }
    thead {
      display: table-header-group;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10.5px;
      letter-spacing: 0.5px;
      padding: 9px 10px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #94a3b8;
      text-align: left;
    }
    th.text-center { text-align: center; }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .text-center { text-align: center; }
    .text-dark { color: #0f172a; }
    .text-muted { color: #64748b; }
    .text-accent { color: #1e3a8a; font-weight: 700; }
    .text-address { color: #334155; font-size: 11.5px; }
    .prefix { color: #64748b; font-weight: 600; font-size: 10px; margin-right: 2px; }

    /* Signatures Footer */
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 36px;
      padding-top: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .sig-box {
      width: 28%;
      text-align: center;
    }
    .sig-line {
      border-top: 1px solid #94a3b8;
      margin-top: 32px;
      padding-top: 4px;
      font-weight: 700;
      font-size: 11px;
      color: #1e293b;
    }
    .sig-role {
      font-size: 10px;
      color: #64748b;
    }

    .doc-footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }

    @media print {
      body { background: #fff; }
      .no-print-bar { display: none !important; }
      .page-wrap {
        max-width: 100%;
        margin: 0;
        padding: 0;
        border-radius: 0;
        box-shadow: none;
      }
      tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div class="title">
      <span>📄 ${currentClp.name} — Invitee Couples Roster (${targetCouples.length} couples)</span>
    </div>
    <div class="actions">
      <button class="btn btn-print" onclick="window.print()">🖨 Print / Save as PDF</button>
      <button class="btn btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="page-wrap">
    <div class="doc-header">
      <img src="${logoUrl}" alt="CFC Tuy" />
      <div class="doc-header-text">
        <h1>Couples for Christ • Municipality of Tuy</h1>
        <h2>${currentClp.name} — Invitee Couples Directory</h2>
        <p>Saint Vincent Ferrer Parish • Venue: ${currentClp.venue}</p>
      </div>
      <div class="doc-header-meta">
        <span class="badge">${targetCouples.length} Invitee Couples</span>
        <div class="gen-date">Generated: ${genDate}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 5%;" class="text-center">#</th>
          <th style="width: 25%;">Husband Name</th>
          <th style="width: 7%;" class="text-center">Age</th>
          <th style="width: 25%;">Wife's Name</th>
          <th style="width: 7%;" class="text-center">Age</th>
          <th style="width: 31%;">Address</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-line">Prepared By</div>
        <div class="sig-role">CLP Secretariat</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">${currentClp.teamLeader || 'CLP Team Leader'}</div>
        <div class="sig-role">CLP Team Leader</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">Chapter Servant</div>
        <div class="sig-role">CFC Tuy Chapter Head</div>
      </div>
    </div>

    <div class="doc-footer">
      Couples for Christ Tuy Chapter • "Building the Church of the Home and Building the Church of the Poor"
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) {
      triggerToast('Pop-up blocked. Please allow pop-ups and try again.');
      return;
    }
    win.document.write(html);
    win.document.close();
  };

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
              onClick={() => {
                setActiveTab('talks');
                setOpenedAttendanceTalkId(null);
              }}
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

            <button
              onClick={() => setActiveTab('ai-groups')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'ai-groups'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-md shadow-violet-200'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Groupings with the Guide of the Holy Spirit</span>
              <span className="hidden sm:inline text-[9px] font-black uppercase bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-md border border-violet-200">
                NEW
              </span>
            </button>
          </div>


          {/* ========================================================================= */}
          {/* TAB 1: INVITED COUPLES DIRECTORY                                           */}
          {/* ========================================================================= */}
          {activeTab === 'couples' && (
            <div className="space-y-6">
              {/* Search, Filter, and Action Bar */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
                {/* Search & Filter Group */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 min-w-0">
                  <div className="relative flex-1 min-w-[200px]">
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
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-600 shrink-0"
                  >
                    <option value="ALL">All Tuy Barangays</option>
                    {TUY_BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>

                  {/* Grid / List Toggle */}
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCoupleViewMode('grid')}
                      title="Grid view"
                      className={`p-1.5 rounded-lg transition-all ${
                        coupleViewMode === 'grid'
                          ? 'bg-white shadow-xs text-[#243c81]'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoupleViewMode('list')}
                      title="List view"
                      className={`p-1.5 rounded-lg transition-all ${
                        coupleViewMode === 'list'
                          ? 'bg-white shadow-xs text-[#243c81]'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Unified Action Buttons Group */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start xl:justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMapModalFocusedCoupleId(null);
                      setMapModalTitle(`All Invited Couples • ${currentClp.name}`);
                      setShowCouplesMapModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#243c81] font-bold text-xs shadow-xs transition-all active:scale-95 whitespace-nowrap"
                  >
                    <MapIcon className="w-3.5 h-3.5 text-blue-700" />
                    <span>View All on Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCouplesList}
                    title="Download invitee couples list as CSV (Husband Name, Age, Wife's Name, Age, Address)"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-[#243c81] font-bold text-xs shadow-xs transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download List</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintCouplesList}
                    title="Print official list of invitee couples (Husband Name, Age, Wife's Name, Age, Address)"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shadow-xs transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print List</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    title="Download CSV template for bulk upload"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs shadow-xs transition-all active:scale-95 whitespace-nowrap"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBulkUploadFile(null);
                      setBulkUploadPreview([]);
                      setBulkUploadErrors([]);
                      setBulkUploadResult(null);
                      setShowBulkUploadModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-violet-300 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs shadow-xs transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Bulk Upload</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintIDs}
                    title="Print name IDs (90×60 mm) on A4 paper"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs shadow-xs transition-all active:scale-95 whitespace-nowrap"
                  >
                    <IdCard className="w-3.5 h-3.5" />
                    <span>Print IDs</span>
                  </button>

                  <button
                    onClick={() => setShowAddCoupleModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs shadow-xs transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Couple</span>
                  </button>
                </div>
              </div>

              {/* Couples View: Grid or List */}
              {coupleViewMode === 'grid' ? (
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
                                  • Age: <strong className="text-slate-900 font-semibold">{computeAge(couple.husbandBirthday)}</strong>
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
                                  • Age: <strong className="text-slate-900 font-semibold">{computeAge(couple.wifeBirthday)}</strong>
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

                      {/* Bottom Card Footer: GPS and In-App Google Maps View Button */}
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
              ) : (
                /* ---- LIST VIEW ---- */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* List Header */}
                  <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <span>Couple</span>
                    <span>Husband</span>
                    <span>Wife</span>
                    <span>Barangay</span>
                    <span>Actions</span>
                  </div>
                  {/* List Rows */}
                  <div className="divide-y divide-slate-100">
                    {filteredCouples.map((couple, idx) => (
                      <div
                        key={couple.id}
                        className={`grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-3 px-4 py-3 items-center hover:bg-slate-50 transition-colors ${
                          idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                        }`}
                      >
                        {/* Col 1: Name + Status + Anniversary */}
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm text-slate-900 truncate">
                            Bro. {couple.husbandFirstName} &amp; Sis. {couple.wifeFirstName}{' '}
                            {couple.husbandLastName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              couple.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : couple.status === 'Graduated'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {couple.status}
                            </span>
                            {couple.weddingAnniversary && (
                              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-0.5">
                                <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                                {couple.weddingAnniversary}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Col 2: Husband info */}
                        <div className="min-w-0 text-xs text-slate-600 space-y-0.5">
                          <p className="font-semibold text-slate-800 truncate flex items-center gap-1.5">
                            <span>{couple.husbandFirstName} {couple.husbandLastName}</span>
                            {couple.husbandBirthday && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200 shrink-0">
                                Age {computeAge(couple.husbandBirthday)}
                              </span>
                            )}
                          </p>
                          {couple.husbandOccupation && (
                            <p className="truncate text-slate-500">{couple.husbandOccupation}</p>
                          )}
                          {couple.husbandContact && (
                            <p className="truncate text-slate-500">📞 {couple.husbandContact}</p>
                          )}
                        </div>

                        {/* Col 3: Wife info */}
                        <div className="min-w-0 text-xs text-slate-600 space-y-0.5">
                          <p className="font-semibold text-rose-700 truncate flex items-center gap-1.5">
                            <span>{couple.wifeFirstName} {couple.husbandLastName}</span>
                            {couple.wifeBirthday && (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200 shrink-0">
                                Age {computeAge(couple.wifeBirthday)}
                              </span>
                            )}
                          </p>
                          {couple.wifeOccupation && (
                            <p className="truncate text-slate-500">{couple.wifeOccupation}</p>
                          )}
                          {couple.wifeContact && (
                            <p className="truncate text-slate-500">📞 {couple.wifeContact}</p>
                          )}
                        </div>

                        {/* Col 4: Barangay + Address */}
                        <div className="min-w-0 text-xs">
                          <p className="font-bold text-[#243c81] truncate">Brgy. {couple.barangay}</p>
                          <p className="text-slate-400 truncate text-[11px] mt-0.5">{couple.address}</p>
                        </div>

                        {/* Col 5: Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setMapModalFocusedCoupleId(couple.id);
                              setMapModalTitle(`Bro. ${couple.husbandFirstName} & Sis. ${couple.wifeFirstName}'s Tuy Location`);
                              setShowCouplesMapModal(true);
                            }}
                            title="View on map"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <MapPin className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditCouple(couple)}
                            title="Edit couple"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteCouple(
                                couple.id,
                                `Bro. ${couple.husbandFirstName} & Sis. ${couple.wifeFirstName} ${couple.husbandLastName}`
                              )
                            }
                            title="Remove couple"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
              ) : !openedAttendanceTalkId ? (
                /* ========================================================================= */
                /* TALKS GRID VIEW                                                           */
                /* ========================================================================= */
                <div className="space-y-6">
                  {/* Header bar */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="p-2 rounded-xl bg-blue-100 text-[#243c81]">
                          <Calendar className="w-5 h-5" />
                        </span>
                        <h3 className="text-xl font-black text-slate-900">
                          CLP Talks Curriculum
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {currentTalks.length} Talks
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs sm:text-sm">
                        Click any talk card below to open its Attendance Sheet and track attendee participation.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {currentTalks.length < 8 && (
                        <button
                          type="button"
                          onClick={handlePopulateStandardTalks}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
                        >
                          <Sparkles className="w-4 h-4 text-emerald-200" />
                          <span>Auto-populate 8 Talks</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowAddTalkModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#243c81] hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Talk</span>
                      </button>
                    </div>
                  </div>

                  {/* Responsive Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {currentTalks.map((talk) => {
                      const talkAtt = attendance.filter((a) => a.talkId === talk.id);
                      const countPresentIndividuals = talkAtt.reduce(
                        (acc, a) => acc + (a.husbandPresent ? 1 : 0) + (a.wifePresent ? 1 : 0),
                        0
                      );
                      const bothPresentCouples = currentCouples.filter((c) => {
                        const a = talkAtt.find((att) => att.coupleId === c.id);
                        return Boolean(a?.husbandPresent && a?.wifePresent);
                      }).length;
                      const totalPossibleIndividuals = currentCouples.length * 2;
                      const pct =
                        totalPossibleIndividuals > 0
                          ? Math.round((countPresentIndividuals / totalPossibleIndividuals) * 100)
                          : 0;

                      return (
                        <div
                          key={talk.id}
                          onClick={() => {
                            setSelectedTalkId(talk.id);
                            setOpenedAttendanceTalkId(talk.id);
                          }}
                          className="group relative bg-white border border-slate-200 hover:border-[#243c81] rounded-3xl p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
                        >
                          <div>
                            {/* Top row: badge & action icons */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-50 text-[#243c81] border border-blue-200">
                                Talk #{talk.talkNumber}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title="Print Attendance Sheet"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrintTalkAttendance(talk);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#243c81] hover:bg-blue-50 transition-colors"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Edit Talk Details"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditTalk(talk);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Talk Title & Module */}
                            <h4 className="font-black text-slate-900 group-hover:text-[#243c81] text-base leading-snug mb-1 transition-colors line-clamp-2">
                              {talk.title}
                            </h4>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
                              {talk.moduleName || 'CLP Curriculum'}
                            </div>

                            {/* Meta Info */}
                            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                              <div className="flex items-start gap-2">
                                <Users className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                                <span className="truncate font-medium">
                                  {talk.speaker || 'Speaker: To be assigned'}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                                <span className="truncate">
                                  {talk.venue || 'Parish Hall, Tuy'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span>{talk.date || 'Date: TBA'}</span>
                                {talk.time && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>{talk.time}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Attendance summary footer */}
                          <div className="mt-5 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-slate-500 font-semibold">Attendance</span>
                              <span className="font-black text-[#243c81]">
                                {countPresentIndividuals} / {totalPossibleIndividuals} ({pct}%)
                              </span>
                            </div>

                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-slate-500 font-medium">
                                {bothPresentCouples} couples present
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#243c81] group-hover:translate-x-1 transition-transform">
                                <span>Open Sheet</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ========================================================================= */
                /* MAXIMIZED ATTENDANCE SHEET PAGE                                           */
                /* ========================================================================= */
                activeOpenedTalk && (
                  <div className="space-y-6">
                    {/* Navigation & Header Banner */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setOpenedAttendanceTalkId(null)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors self-start"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back to Talks</span>
                        </button>

                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-[#243c81]">
                              Talk #{activeOpenedTalk.talkNumber} • Attendance Sheet
                            </span>
                            <span className="text-xs text-slate-500 font-bold">
                              {activeOpenedTalk.moduleName || 'CLP Curriculum'}
                            </span>
                          </div>
                          <h2 className="text-2xl font-black text-slate-900">
                            {activeOpenedTalk.title}
                          </h2>
                          <div className="flex items-center gap-4 text-xs text-slate-600 mt-1 flex-wrap">
                            <span>
                              <strong>Speaker:</strong> {activeOpenedTalk.speaker || 'To be assigned'}
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Venue:</strong> {activeOpenedTalk.venue || 'Parish Hall, Tuy'}
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Date:</strong> {activeOpenedTalk.date || 'TBA'}
                              {activeOpenedTalk.time && ` (${activeOpenedTalk.time})`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handlePrintTalkAttendance(activeOpenedTalk)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all"
                        >
                          <Printer className="w-4 h-4 text-slate-500" />
                          <span>Print Sheet</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditTalk(activeOpenedTalk)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#243c81] hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Edit Talk</span>
                        </button>
                      </div>
                    </div>

                    {/* Summary Stat Cards across the full width */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                          Overall Attendance
                        </div>
                        <div className="text-2xl font-black text-blue-950">
                          {openedTalkTotalPresentIndividuals} / {openedTalkTotalPossibleIndividuals}
                          <span className="text-sm font-bold text-blue-600 ml-1.5">
                            ({openedTalkAttendancePercentage}%)
                          </span>
                        </div>
                        <div className="text-[11px] text-blue-600/80 mt-1">Individual attendees</div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50/60 to-cyan-50/60 border border-blue-100 rounded-2xl p-4">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                          Husbands Present
                        </div>
                        <div className="text-2xl font-black text-blue-900">
                          {openedTalkPresentHusbands} / {totalInvitedCouples}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {totalInvitedCouples > 0
                            ? Math.round((openedTalkPresentHusbands / totalInvitedCouples) * 100)
                            : 0}
                          % of husbands
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-rose-50/60 to-pink-50/60 border border-rose-100 rounded-2xl p-4">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-1">
                          Wives Present
                        </div>
                        <div className="text-2xl font-black text-rose-900">
                          {openedTalkPresentWives} / {totalInvitedCouples}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {totalInvitedCouples > 0
                            ? Math.round((openedTalkPresentWives / totalInvitedCouples) * 100)
                            : 0}
                          % of wives
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/60 border border-emerald-100 rounded-2xl p-4">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                          Both Present (Couples)
                        </div>
                        <div className="text-2xl font-black text-emerald-950">
                          {openedTalkBothPresentCouples} / {totalInvitedCouples}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">Full couple participation</div>
                      </div>
                    </div>

                    {/* Attendance Controls Bar (Search, Status Filter, Barangay Filter, Quick Actions) */}
                    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Search & Filters */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search couple or barangay..."
                            value={attendanceSearchQuery}
                            onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500"
                          />
                        </div>

                        {/* Barangay select */}
                        <div className="min-w-[160px]">
                          <select
                            value={attendanceFilterBarangay}
                            onChange={(e) => setAttendanceFilterBarangay(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:border-blue-500"
                          >
                            <option value="ALL">All Barangays ({currentCouples.length})</option>
                            {TUY_BARANGAYS.map((brgy) => {
                              const count = currentCouples.filter((c) => c.barangay === brgy).length;
                              return (
                                <option key={brgy} value={brgy}>
                                  {brgy} ({count})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Status Filter Buttons */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                          {(
                            [
                              { key: 'all', label: 'All' },
                              { key: 'present', label: 'Both Present' },
                              { key: 'partial', label: 'Partial' },
                              { key: 'absent', label: 'Absent' },
                            ] as const
                          ).map((filter) => (
                            <button
                              key={filter.key}
                              type="button"
                              onClick={() => setAttendanceFilterStatus(filter.key)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                attendanceFilterStatus === filter.key
                                  ? 'bg-white text-slate-900 shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {filter.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Batch Actions */}
                      <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMarkFilteredPresent(activeOpenedTalk.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors"
                          title="Mark all currently filtered couples as present"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark All Present</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleClearFilteredAttendance(activeOpenedTalk.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
                          title="Reset attendance for all currently filtered couples"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Clear Filtered</span>
                        </button>
                      </div>
                    </div>

                    {/* Maximized Attendance Table */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                              <th className="py-3.5 px-4 w-12 text-center">#</th>
                              <th className="py-3.5 px-4">Invited Couple</th>
                              <th className="py-3.5 px-4">Barangay</th>
                              <th className="py-3.5 px-4 text-center">Husband Status</th>
                              <th className="py-3.5 px-4 text-center">Wife Status</th>
                              <th className="py-3.5 px-4 text-center">Couple Status</th>
                              <th className="py-3.5 px-4">Remarks / Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {attendanceCouples.map((c, idx) => {
                              const att = openedTalkAttendance.find((a) => a.coupleId === c.id);
                              const hp = Boolean(att?.husbandPresent);
                              const wp = Boolean(att?.wifePresent);
                              const both = hp && wp;
                              const partial = (hp && !wp) || (!hp && wp);

                              return (
                                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-3 px-4 text-center text-xs font-bold text-slate-400">
                                    {idx + 1}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                      {c.husbandLastName}, {c.husbandFirstName} &amp; {c.wifeFirstName}
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                                      {c.husbandContact && (
                                        <span className="inline-flex items-center gap-1">
                                          <Phone className="w-3 h-3 text-blue-500" />
                                          <span>H: {c.husbandContact}</span>
                                        </span>
                                      )}
                                      {c.wifeContact && (
                                        <span className="inline-flex items-center gap-1">
                                          <Phone className="w-3 h-3 text-rose-500" />
                                          <span>W: {c.wifeContact}</span>
                                        </span>
                                      )}
                                      {!c.husbandContact && !c.wifeContact && (
                                        <span>No contact numbers recorded</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-xs font-medium text-slate-600">
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                      {c.barangay}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => toggleAttendance(activeOpenedTalk.id, c.id, 'husband')}
                                      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all w-28 ${
                                        hp
                                          ? 'bg-[#243c81] text-white shadow-xs'
                                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                      }`}
                                    >
                                      {hp ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                      <span>{hp ? 'Present' : 'Absent'}</span>
                                    </button>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => toggleAttendance(activeOpenedTalk.id, c.id, 'wife')}
                                      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all w-28 ${
                                        wp
                                          ? 'bg-rose-600 text-white shadow-xs'
                                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                      }`}
                                    >
                                      {wp ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                      <span>{wp ? 'Present' : 'Absent'}</span>
                                    </button>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {both ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                        <Check className="w-3 h-3" /> Both Present
                                      </span>
                                    ) : partial ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                        Partial
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">
                                        Absent
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="text"
                                      defaultValue={att?.remarks || ''}
                                      placeholder="Add remarks..."
                                      onBlur={(e) => handleUpdateRemarks(activeOpenedTalk.id, c.id, e.target.value)}
                                      className="w-full px-2.5 py-1 text-xs bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-400 rounded-lg transition-all"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {attendanceCouples.length === 0 && (
                        <div className="p-12 text-center text-slate-500 text-xs sm:text-sm">
                          {currentCouples.length === 0
                            ? 'No invited couples to take attendance for yet. Add couples in the "Invited Couples" tab.'
                            : 'No couples match your current search or filter criteria.'}
                        </div>
                      )}
                    </div>
                  </div>
                )
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

          {/* ========================================================================= */}
          {/* TAB 4: AI & SAVED GROUPINGS (HOLY SPIRIT CLP CIRCLES)                     */}
          {/* ========================================================================= */}
          {activeTab === 'ai-groups' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-br from-violet-600 via-purple-700 to-[#243c81] p-6 sm:p-7 rounded-3xl shadow-xl shadow-purple-900/10 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shrink-0">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black">Groupings with the Guide of the Holy Spirit</h2>
                        <span className="text-[10px] font-black uppercase bg-amber-400 text-[#243c81] px-2 py-0.5 rounded-full shadow-xs">
                          AI &amp; Pastoral Tool
                        </span>
                      </div>
                      <p className="text-violet-200 text-xs mt-1">
                        {currentClp.name} • Generate, filter by talk attendance, edit, and save discussion groups
                      </p>
                    </div>
                  </div>

                  {/* Sub-tab Navigation */}
                  <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/25 border border-white/10 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setGroupingSubTab('active')}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        groupingSubTab === 'active'
                          ? 'bg-white text-violet-900 shadow-sm'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Generator &amp; Editor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupingSubTab('saved')}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        groupingSubTab === 'saved'
                          ? 'bg-white text-violet-900 shadow-sm'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
                      <span>Saved Groupings</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-violet-100 text-violet-800 text-[10px] font-black">
                        {savedGroupings.filter((g) => g.clpId === currentClp.id).length}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* =================================================================== */}
              {/* SUBTAB 1: SAVED GROUPINGS HISTORY & REPOSITORY (Req 3)               */}
              {/* =================================================================== */}
              {groupingSubTab === 'saved' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Saved Groupings for {currentClp.name}</h3>
                      <p className="text-xs text-slate-500">
                        Select any saved grouping to load, view, edit members, print, or download.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGroupingSubTab('active')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Generate New Grouping</span>
                    </button>
                  </div>

                  {savedGroupings.filter((g) => g.clpId === currentClp.id).length === 0 ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center space-y-3">
                      <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
                      <h4 className="font-bold text-slate-800">No Saved Groupings Yet</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        You can generate groupings with the Holy Spirit guide or filter by attendees of a specific talk, then click &quot;Save Grouping&quot; to keep them here.
                      </p>
                      <button
                        type="button"
                        onClick={() => setGroupingSubTab('active')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Go to Grouping Generator</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {savedGroupings
                        .filter((g) => g.clpId === currentClp.id)
                        .map((saved) => {
                          const totalCouples = saved.groups.reduce((acc, grp) => acc + grp.couples.length, 0);
                          const isCurrentlyActive = activeSavedGroupingId === saved.id;

                          return (
                            <div
                              key={saved.id}
                              className={`bg-white rounded-2xl border p-5 space-y-4 shadow-xs hover:shadow-md transition-all ${
                                isCurrentlyActive ? 'border-violet-500 ring-2 ring-violet-200' : 'border-slate-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-black text-slate-900 text-sm">{saved.title}</h4>
                                    {isCurrentlyActive && (
                                      <span className="text-[9px] font-black uppercase bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">
                                        Loaded
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Saved {new Date(saved.createdAt).toLocaleString('en-PH')}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleLoadSavedGrouping(saved)}
                                    className="px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs border border-violet-200 transition-colors"
                                  >
                                    Load / Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSavedGrouping(saved.id, saved.title)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                                    title="Delete grouping"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Badges */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                                  {saved.groups.length} Groups
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                  {totalCouples} Couples
                                </span>
                                {saved.talkTitle && (
                                  <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold truncate max-w-[220px]">
                                    {saved.talkTitle}
                                  </span>
                                )}
                              </div>

                              {saved.summary && (
                                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2 italic">
                                  &quot;{saved.summary}&quot;
                                </p>
                              )}

                              {/* Group chips */}
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {saved.groups.map((grp) => (
                                  <span
                                    key={grp.groupNumber}
                                    className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                                  >
                                    {grp.groupName}: <strong className="text-slate-900">{grp.couples.length}</strong>
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* =================================================================== */}
              {/* SUBTAB 2: ACTIVE GENERATOR & EDITING WORKSPACE                       */}
              {/* =================================================================== */}
              {groupingSubTab === 'active' && (
                <div className="space-y-6">
                  {/* Configuration & Filter Card (Req 4: Group only attended couples per talk) */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider text-slate-400 mb-1">
                        Step 1: Select Participants to Group
                      </h3>
                      <p className="text-xs text-slate-500 mb-3">
                        Choose whether to group all invited couples or only couples who attended a specific CLP talk.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option 1: All Registered Couples */}
                        <label
                          className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                            groupingSource === 'all'
                              ? 'border-violet-500 bg-violet-50/50 shadow-xs ring-1 ring-violet-400'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="groupingSource"
                            checked={groupingSource === 'all'}
                            onChange={() => setGroupingSource('all')}
                            className="mt-0.5 text-violet-600 focus:ring-violet-500"
                          />
                          <div>
                            <span className="font-black text-sm text-slate-900 block">
                              All Registered Couples
                            </span>
                            <span className="text-xs text-slate-500 mt-0.5 block">
                              Group all {currentCouples.length} registered couples in {currentClp.name}
                            </span>
                          </div>
                        </label>

                        {/* Option 2: Attended Couples per Talk */}
                        <label
                          className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                            groupingSource === 'talk'
                              ? 'border-violet-500 bg-violet-50/50 shadow-xs ring-1 ring-violet-400'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="groupingSource"
                            checked={groupingSource === 'talk'}
                            onChange={() => setGroupingSource('talk')}
                            className="mt-0.5 text-violet-600 focus:ring-violet-500"
                          />
                          <div>
                            <span className="font-black text-sm text-slate-900 block flex items-center gap-1.5">
                              <span>Only Attended Couples per Talk</span>
                              <span className="text-[10px] font-black uppercase bg-violet-600 text-white px-1.5 py-0.2 rounded">
                                Filter
                              </span>
                            </span>
                            <span className="text-xs text-slate-500 mt-0.5 block">
                              Form discussion circles strictly from attendees present at a specific talk
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* If Attendance Filter Selected, show Talk Dropdown and Criteria */}
                      {groupingSource === 'talk' && (
                        <div className="mt-4 p-4 rounded-2xl bg-violet-50/70 border border-violet-200 animate-in fade-in space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Select CLP Talk
                              </label>
                              <select
                                value={groupingTalkId}
                                onChange={(e) => setGroupingTalkId(e.target.value)}
                                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-violet-500"
                              >
                                {currentTalks.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    Talk {t.talkNumber}: {t.title} {t.date ? `(${t.date})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Attendance Criteria
                              </label>
                              <select
                                value={attendanceRequirement}
                                onChange={(e) => setAttendanceRequirement(e.target.value as any)}
                                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-violet-500"
                              >
                                <option value="either">At least 1 spouse present (Husband OR Wife)</option>
                                <option value="both">Both spouses present (Husband AND Wife)</option>
                              </select>
                            </div>
                          </div>

                          {/* Live Attendance Counter Feedback */}
                          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                            {attendedCouplesForTalk.length > 0 ? (
                              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span>
                                  {attendedCouplesForTalk.length} of {currentCouples.length} couples attended this talk and will be grouped.
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-amber-800 font-medium">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>
                                  No couples marked present for this talk yet.
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('talks')}
                                  className="underline font-bold text-amber-900 hover:text-amber-700"
                                >
                                  Go mark attendance in Talks tab &rarr;
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Prompt Input */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-sm font-black text-slate-900 mb-1">
                        Step 2: Grouping Instruction / Holy Spirit Guidance
                      </label>
                      <p className="text-xs text-slate-500 mb-3">
                        Describe how you want the AI to group the {targetCouplesForGrouping.length} participants (e.g. by barangay, occupation, diversity, or group count).
                      </p>
                      <textarea
                        value={aiGroupPrompt}
                        onChange={(e) => setAiGroupPrompt(e.target.value)}
                        rows={3}
                        placeholder='e.g. "Create 4 balanced discussion groups mixing different barangays for diversity and mutual encouragement" or "Group by barangay proximity so couples can travel together"'
                        className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-300 resize-none font-medium placeholder:text-slate-400 placeholder:font-normal"
                      />

                      {/* Prompt Suggestions */}
                      <div className="mt-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Quick Suggestions</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            'Group by barangay proximity',
                            'Group by occupation similarity',
                            'Mix all barangays for diversity',
                            'Create 3 balanced discussion circles',
                            'Create 4 balanced discussion circles',
                            'Separate by wedding anniversary',
                          ].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setAiGroupPrompt(s)}
                              className="px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold hover:bg-violet-100 transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <button
                      type="button"
                      onClick={handleAIGrouping}
                      disabled={isAiGrouping || targetCouplesForGrouping.length === 0}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-bold text-sm shadow-md shadow-violet-200 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      {isAiGrouping ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating groupings...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>
                            Generate Groupings ({targetCouplesForGrouping.length} couples)
                          </span>
                        </>
                      )}
                    </button>

                    {/* Error */}
                    {aiGroupError && (
                      <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Grouping Failed</p>
                          <p className="text-xs mt-0.5 text-red-600">{aiGroupError}</p>
                        </div>
                      </div>
                    )}

                    {/* Loading State */}
                    {isAiGrouping && (
                      <div className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-200 rounded-2xl">
                        <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                          <Brain className="w-4 h-4 text-violet-600 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-violet-900">
                            Generating prayerful groupings for {targetCouplesForGrouping.length} couples...
                          </p>
                          <p className="text-xs text-violet-600">
                            Placing couples according to the Holy Spirit&apos;s guidance and pastoral care
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Results & Interactive Group Editor (Req 3 & 5) */}
                  {aiGroupingResult && (
                    <div className="space-y-4">
                      {/* Control & Save Action Bar */}
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Editable Title */}
                          <div className="flex-1 min-w-0">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Grouping Title
                            </label>
                            <input
                              type="text"
                              value={groupingTitleInput}
                              onChange={(e) => setGroupingTitleInput(e.target.value)}
                              className="w-full text-base sm:text-lg font-black text-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500 bg-slate-50/50"
                              placeholder="Enter grouping title..."
                            />
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                              <span>{aiGroupingResult.groups.length} groups</span>
                              <span>•</span>
                              <span>
                                {aiGroupingResult.groups.reduce((acc, g) => acc + g.couples.length, 0)} couples
                              </span>
                              {aiGroupingResult.talkTitle && (
                                <>
                                  <span>•</span>
                                  <span className="font-bold text-violet-700">{aiGroupingResult.talkTitle}</span>
                                </>
                              )}
                            </p>
                          </div>

                          {/* Toolbar Actions */}
                          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                            {/* Edit Mode Toggle */}
                            <button
                              type="button"
                              onClick={() => setIsEditMode(!isEditMode)}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                                isEditMode
                                  ? 'bg-amber-400 text-[#243c81] border-amber-300 shadow-xs ring-2 ring-amber-300'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{isEditMode ? 'Exit Edit Mode' : 'Edit Groupings'}</span>
                            </button>

                            {/* Save Grouping Button (Req 3) */}
                            <button
                              type="button"
                              onClick={handleSaveCurrentGrouping}
                              disabled={isSavingGrouping}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{isSavingGrouping ? 'Saving...' : 'Save Grouping'}</span>
                            </button>

                            {/* Download HTML/PDF */}
                            <button
                              type="button"
                              onClick={handleDownloadAIGroupsHTML}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 text-xs font-bold transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Download</span>
                            </button>

                            {/* Print */}
                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Print</span>
                            </button>
                          </div>
                        </div>

                        {/* Edit Mode Notice Banner */}
                        {isEditMode && (
                          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 font-medium animate-in fade-in">
                            <div className="flex items-center gap-2">
                              <SlidersHorizontal className="w-4 h-4 text-amber-700 shrink-0" />
                              <span>
                                <strong>Edit Mode Active:</strong> You can edit group names, assign facilitators/servants, move couples between groups via dropdown, or add extra groups.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddNewGroup}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 shrink-0"
                            >
                              <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
                              <span>Add New Group</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* AI Summary */}
                      {aiGroupingResult.summary && (
                        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
                          <p className="text-xs font-black uppercase tracking-widest text-violet-400 mb-1">AI Pastoral Summary</p>
                          <p className="text-sm text-violet-900 font-medium">{aiGroupingResult.summary}</p>
                        </div>
                      )}

                      {/* Group Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                        {aiGroupingResult.groups.map((group, gi) => {
                          const colorSets = [
                            { bg: 'bg-[#243c81]', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', num: 'bg-blue-100 text-blue-700' },
                            { bg: 'bg-violet-600', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', num: 'bg-violet-100 text-violet-700' },
                            { bg: 'bg-teal-700', light: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', num: 'bg-teal-100 text-teal-700' },
                            { bg: 'bg-amber-600', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', num: 'bg-amber-100 text-amber-700' },
                            { bg: 'bg-rose-600', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', num: 'bg-rose-100 text-rose-700' },
                            { bg: 'bg-sky-600', light: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800', num: 'bg-sky-100 text-sky-700' },
                          ];
                          const colors = colorSets[gi % colorSets.length];

                          return (
                            <div key={group.groupNumber} className={`rounded-3xl border ${colors.border} overflow-hidden shadow-xs bg-white`}>
                              {/* Group Header */}
                              <div className={`${colors.bg} px-5 py-4 text-white`}>
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                                      Group {group.groupNumber}
                                    </p>
                                    {isEditMode ? (
                                      <input
                                        type="text"
                                        value={group.groupName}
                                        onChange={(e) => handleUpdateGroupName(gi, e.target.value)}
                                        className="w-full bg-white/20 text-white font-black text-base px-2.5 py-1 rounded-lg border border-white/30 focus:outline-hidden focus:bg-white/30"
                                        placeholder="Group Name"
                                      />
                                    ) : (
                                      <h4 className="text-base font-black truncate">{group.groupName}</h4>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                                      {group.couples.length} couples
                                    </span>
                                    {isEditMode && aiGroupingResult.groups.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteGroup(gi)}
                                        className="p-1 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-white transition-colors"
                                        title="Delete this group"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Facilitator / Discussion Leader Row */}
                                <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase text-white/70 shrink-0">
                                    Leader / Servant:
                                  </span>
                                  {isEditMode ? (
                                    <input
                                      type="text"
                                      value={group.facilitator || ''}
                                      onChange={(e) => handleUpdateGroupFacilitator(gi, e.target.value)}
                                      placeholder="e.g. Bro. Joel & Sis. Mary"
                                      className="flex-1 bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded border border-white/30 focus:outline-hidden focus:bg-white/30 placeholder:text-white/50"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-amber-200 truncate">
                                      {group.facilitator || 'To be assigned'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Rationale */}
                              {group.rationale && (
                                <div className={`${colors.light} px-5 py-2.5 border-b ${colors.border}`}>
                                  <p className={`text-[11px] font-medium ${colors.text} italic`}>{group.rationale}</p>
                                </div>
                              )}

                              {/* Couple List */}
                              <div className="divide-y divide-slate-100">
                                {group.couples.length === 0 ? (
                                  <div className="p-6 text-center text-xs text-slate-400 italic">
                                    No couples in this group. Move couples here from other groups.
                                  </div>
                                ) : (
                                  group.couples.map((couple, ci) => (
                                    <div
                                      key={couple.id}
                                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
                                    >
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className={`w-6 h-6 rounded-full ${colors.num} text-[11px] font-black flex items-center justify-center shrink-0`}>
                                          {ci + 1}
                                        </span>
                                        <div className="min-w-0">
                                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                            {couple.name}
                                          </p>
                                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                            <span>Brgy. {couple.barangay}</span>
                                            {couple.husbandOccupation && (
                                              <span>• {couple.husbandOccupation}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Edit Mode: Move dropdown and Remove button (Req 5) */}
                                      {isEditMode && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1 text-slate-600">
                                            <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                                            <select
                                              value={gi}
                                              onChange={(e) =>
                                                handleMoveCouple(gi, Number(e.target.value), couple.id)
                                              }
                                              className="bg-transparent text-[11px] font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                                              title="Move to another group"
                                            >
                                              {aiGroupingResult.groups.map((targetGrp, targetIdx) => (
                                                <option key={targetGrp.groupNumber} value={targetIdx}>
                                                  Grp {targetGrp.groupNumber}
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => handleRemoveCoupleFromGroup(gi, couple.id)}
                                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                            title="Remove couple from group"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Print/Download/Save Action Row */}
                      <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                        <p className="text-xs text-slate-500 font-medium">
                          Created {new Date(aiGroupingResult.generatedAt).toLocaleString('en-PH')} • {aiGroupingResult.groups.length} groups • {aiGroupingResult.groups.reduce((acc, g) => acc + g.couples.length, 0)} couples
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSaveCurrentGrouping}
                            disabled={isSavingGrouping}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save Grouping</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadAIGroupsHTML}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-violet-300 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition-all"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download HTML</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
                          >
                            <Printer className="w-4 h-4" />
                            <span>Print</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
            {createClpError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{createClpError}</span>
              </div>
            )}

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
                  disabled={isCreatingClp}
                  onClick={() => setShowAddClpModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClp}
                  className="px-5 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreatingClp ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Program...</span>
                    </>
                  ) : (
                    <span>Save &amp; Create Program</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK UPLOAD INVITEES (CSV)                                          */}
      {/* ========================================================================= */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-violet-50 border border-violet-200">
                  <Upload className="w-5 h-5 text-violet-600" />
                </span>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Bulk Upload Invitees</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Import multiple invitee couples at once via CSV
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkUploadModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Download Template hint */}
            <div className="mb-5 p-4 rounded-2xl bg-violet-50 border border-violet-200 flex items-start gap-3">
              <FileDown className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
              <div className="text-sm text-violet-800">
                <p className="font-bold">Don&apos;t have a template yet?</p>
                <p className="text-xs mt-0.5 text-violet-600">
                  Download the CSV template first, fill in your invitees, then upload it here.
                  Required columns:{' '}
                  <span className="font-mono font-bold">
                    husband_first_name, husband_last_name, wife_first_name, wife_last_name, address, barangay
                  </span>
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-700 font-bold text-xs transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Download Template CSV
                </button>
              </div>
            </div>

            {/* Step 2: File Upload */}
            <div className="mb-5">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Select CSV File
              </label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-violet-300 rounded-2xl bg-violet-50 hover:bg-violet-100 cursor-pointer transition-colors group">
                <Upload className="w-7 h-7 text-violet-400 group-hover:text-violet-600 mb-1 transition-colors" />
                <span className="text-sm font-bold text-violet-600 group-hover:text-violet-700">
                  {bulkUploadFile ? bulkUploadFile.name : 'Click to choose a CSV file'}
                </span>
                <span className="text-xs text-slate-400 mt-0.5">
                  {bulkUploadFile ? `${(bulkUploadFile.size / 1024).toFixed(1)} KB` : 'Only .csv files accepted'}
                </span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleBulkFileChange}
                />
              </label>
            </div>

            {/* Errors */}
            {bulkUploadErrors.length > 0 && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="font-bold text-sm text-red-700">
                    {bulkUploadErrors.length} issue{bulkUploadErrors.length !== 1 ? 's' : ''} found
                  </span>
                </div>
                <ul className="space-y-0.5 max-h-24 overflow-y-auto">
                  {bulkUploadErrors.map((err, i) => (
                    <li key={i} className="text-xs text-red-600 font-mono">
                      • {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            {bulkUploadPreview.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Preview — {bulkUploadPreview.length} couple{bulkUploadPreview.length !== 1 ? 's' : ''} ready to import
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-56">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-bold text-slate-600">#</th>
                        <th className="text-left px-3 py-2 font-bold text-slate-600">Husband</th>
                        <th className="text-left px-3 py-2 font-bold text-slate-600">Wife</th>
                        <th className="text-left px-3 py-2 font-bold text-slate-600">Barangay</th>
                        <th className="text-left px-3 py-2 font-bold text-slate-600">Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkUploadPreview.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800">
                            Bro. {c.husbandFirstName} {c.husbandLastName}
                          </td>
                          <td className="px-3 py-2 font-semibold text-rose-700">
                            Sis. {c.wifeFirstName} {c.wifeLastName}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{c.barangay}</td>
                          <td className="px-3 py-2 text-slate-500 truncate max-w-[140px]">{c.address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Result after upload */}
            {bulkUploadResult && (
              <div className={`mb-4 p-4 rounded-2xl border flex items-start gap-3 ${
                bulkUploadResult.failed === 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <CheckCheck className={`w-5 h-5 shrink-0 mt-0.5 ${
                  bulkUploadResult.failed === 0 ? 'text-emerald-500' : 'text-amber-500'
                }`} />
                <div>
                  <p className="font-bold text-sm text-slate-800">Upload Complete</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    <span className="text-emerald-600 font-bold">{bulkUploadResult.success} added successfully</span>
                    {bulkUploadResult.failed > 0 && (
                      <span className="text-red-600 font-bold ml-2">• {bulkUploadResult.failed} failed</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBulkUploadModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                {bulkUploadResult ? 'Close' : 'Cancel'}
              </button>
              {bulkUploadPreview.length > 0 && !bulkUploadResult && (
                <button
                  type="button"
                  onClick={handleBulkUploadSubmit}
                  disabled={isBulkUploading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold text-sm shadow-xs transition-all active:scale-95"
                >
                  {isBulkUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Import {bulkUploadPreview.length} Couples</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL SCREEN PAGE: REGISTER INVITEE COUPLE (WITH REALTIME TUY MAP)          */}
      {/* ========================================================================= */}
      {showAddCoupleModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 animate-in fade-in duration-200">
          {/* Top Navigation Bar */}
          <div className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shadow-xs shrink-0 z-20">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setShowAddCoupleModal(false)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all active:scale-95 shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Back to CLP</span>
              </button>

              <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-slate-900 text-sm sm:text-base truncate">
                    Register Invitee Couple
                  </h2>
                  <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#243c81] border border-blue-200 text-[11px] font-black uppercase tracking-wider">
                    {currentClp?.name || 'CLP'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                  Enter couple details on the left, click the map on the right to pinpoint address.
                </p>
              </div>
            </div>

            {/* Mobile Tab Switcher (Visible only below lg) */}
            <div className="flex lg:hidden items-center bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setAddCoupleMobileTab('form')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  addCoupleMobileTab === 'form'
                    ? 'bg-white text-[#243c81] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Couple Info
              </button>
              <button
                type="button"
                onClick={() => setAddCoupleMobileTab('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  addCoupleMobileTab === 'map'
                    ? 'bg-white text-[#243c81] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tuy Map
              </button>
            </div>

            {/* Top Bar Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Brgy. {coupleBarangay}</span>
                <span className="text-slate-400 font-mono text-[10px]">
                  ({coupleCoords[1].toFixed(4)}, {coupleCoords[0].toFixed(4)})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCoupleModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCouple}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Save Invitee Couple</span>
              </button>
            </div>
          </div>

          {/* Main Full-Screen Split Workspace */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            {/* ── LEFT COLUMN: Couple Information Form ── */}
            <div
              className={`w-full lg:w-[480px] xl:w-[540px] 2xl:w-[600px] shrink-0 h-full overflow-y-auto bg-white border-r border-slate-200 p-5 sm:p-6 ${
                addCoupleMobileTab === 'form' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
              }`}
            >
              <form onSubmit={handleCreateCouple} className="flex flex-col flex-1 space-y-5">
                {/* Husband Section */}
                <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#243c81] flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#243c81]" />
                      <span>Husband Information</span>
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      Brother
                    </span>
                  </div>

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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs outline-hidden"
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs outline-hidden"
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. dennis@gmail.com"
                        value={husbandEmail}
                        onChange={(e) => setHusbandEmail(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Wife Section */}
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-rose-700" />
                      <span>Wife Information</span>
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
                      Sister
                    </span>
                  </div>

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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 outline-hidden font-medium"
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 outline-hidden font-medium"
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs outline-hidden"
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs outline-hidden"
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. karen@gmail.com"
                        value={wifeEmail}
                        onChange={(e) => setWifeEmail(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Wedding & Address Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 shadow-2xs">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Wedding Anniversary &amp; Pinned Home Location</span>
                  </span>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Wedding Anniversary Date
                    </label>
                    <input
                      type="date"
                      value={weddingAnniv}
                      onChange={(e) => setWeddingAnniv(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs max-w-[220px] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Pinned Tuy Location
                    </label>
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{coupleAddress}</span>
                        <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                          Brgy. {coupleBarangay} • {coupleCoords[1].toFixed(4)}, {coupleCoords[0].toFixed(4)}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                        <MapPin className="w-3 h-3" /> Pinned
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#243c81] shrink-0" />
                      <span>Click anywhere on the map to update the pinpoint in real-time.</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Full Address (Auto-syncs with Map Pin)
                    </label>
                    <input
                      type="text"
                      required
                      value={coupleAddress}
                      onChange={(e) => setCoupleAddress(e.target.value)}
                      placeholder="e.g. Brgy. Rizal (Pob.), Tuy, Batangas"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
                    />
                  </div>
                </div>

                {/* Form Footer Action Buttons */}
                <div className="pt-3 pb-2 flex justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddCoupleModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    Save Invitee Couple
                  </button>
                </div>
              </form>
            </div>

            {/* ── RIGHT COLUMN: Interactive Tuy Map Picker (Maximizes Screen) ── */}
            <div
              className={`flex-1 h-full flex flex-col bg-slate-100 overflow-hidden ${
                addCoupleMobileTab === 'map' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shadow-2xs shrink-0">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#243c81]" />
                  <span className="text-xs font-bold text-slate-800">
                    Pin Home Location in Tuy, Batangas
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    • Click anywhere on the map or drag the pin to pinpoint home location
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#243c81] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    Brgy. {coupleBarangay}
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full h-full overflow-hidden">
                <TuyMapPicker
                  isEmbedded={true}
                  initialCoordinates={coupleCoords}
                  initialAddress={coupleAddress}
                  initialBarangay={coupleBarangay}
                  onChange={(data) => {
                    setCoupleAddress(data.address);
                    setCoupleBarangay(data.barangay);
                    setCoupleCoords(data.coordinates);
                  }}
                  onSelectLocation={(data) => {
                    setCoupleAddress(data.address);
                    setCoupleBarangay(data.barangay);
                    setCoupleCoords(data.coordinates);
                    triggerToast(`Applied address: ${data.address}`);
                  }}
                  onClose={() => {}}
                />
              </div>
            </div>
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
      {/* MODAL 6: IN-APP GOOGLE MAPS VIEWER FOR SINGLE OR ALL INVITED COUPLES      */}
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
