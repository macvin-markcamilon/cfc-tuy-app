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
  Map,
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

  // AI Grouping State
  const [aiGroupPrompt, setAiGroupPrompt] = useState('');
  const [isAiGrouping, setIsAiGrouping] = useState(false);
  const [aiGroupError, setAiGroupError] = useState<string | null>(null);
  const [aiGroupingResult, setAiGroupingResult] = useState<null | {
    groups: {
      groupNumber: number;
      groupName: string;
      rationale: string;
      couples: {
        id: string;
        name: string;
        barangay: string;
        husbandOccupation: string;
        wifeOccupation: string;
        address: string;
      }[];
    }[];
    summary: string;
    prompt: string;
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

  // Selected Talk for Attendance View
  const [selectedTalkId, setSelectedTalkId] = useState<string>('');

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
  // AI Grouping Handler (Gemini API)
  // ---------------------------------------------------------------------------
  const handleAIGrouping = async () => {
    if (!currentClp || currentCouples.length === 0) {
      triggerToast('No couples to group. Please add invitees first.');
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
      const couplesPayload = currentCouples.map((c) => ({
        id: c.id,
        name: `Bro. ${c.husbandFirstName} & Sis. ${c.wifeFirstName} ${c.husbandLastName}`,
        barangay: c.barangay,
        husbandOccupation: c.husbandOccupation || '',
        wifeOccupation: c.wifeOccupation || '',
        address: c.address,
        weddingAnniversary: c.weddingAnniversary || '',
      }));
      const response = await fetch('/api/ai-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couples: couplesPayload, userPrompt: aiGroupPrompt, programName: currentClp.name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI grouping failed. Please try again.');
      setAiGroupingResult(data);
      triggerToast(`✨ Created ${data.groups.length} groups successfully!`);
    } catch (err: any) {
      setAiGroupError(err?.message || 'An error occurred during AI grouping.');
    } finally {
      setIsAiGrouping(false);
    }
  };

  const handleDownloadAIGroupsHTML = () => {
    if (!aiGroupingResult || !currentClp) return;
    const groupColors = ['#243c81', '#7c3aed', '#0f766e', '#b45309', '#be123c', '#0369a1'];
    const printContent = `<!DOCTYPE html>
<html>
<head>
  <title>Holy Spirit Groupings – ${currentClp.name}</title>
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
  <h1>Groupings with the Guide of the Holy Spirit</h1>
  <span class="badge">${currentClp.name}</span>
  <div class="meta">
    <div class="meta-label">Grouping Instruction</div>
    <div class="meta-prompt">"${aiGroupingResult.prompt}"</div>
    <div class="meta-summary">${aiGroupingResult.summary}</div>
  </div>
  <div class="grid">
    ${aiGroupingResult.groups.map((g, gi) => `
    <div class="group">
      <div class="gh" style="background:${groupColors[gi % groupColors.length]}">
        <span class="gn">Group ${g.groupNumber}: ${g.groupName}</span>
        <span class="gc">${g.couples.length} couples</span>
      </div>
      <div class="gr">${g.rationale}</div>
      ${g.couples.map((c, ci) => `
      <div class="cr">
        <div class="cn-num">${ci + 1}</div>
        <span class="cn">${c.name}</span>
        <span class="cb">Brgy. ${c.barangay}</span>
      </div>`).join('')}
    </div>`).join('')}
  </div>
  <div class="footer">Generated by CFC Tuy Chapter Admin Portal • ${new Date().toLocaleString('en-PH')}</div>
</body>
</html>`;
    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HolySpirit-Groupings-${currentClp.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
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
                    <Map className="w-3.5 h-3.5 text-blue-700" />
                    <span>View All on Map</span>
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
                          <p className="font-semibold text-slate-800 truncate">{couple.husbandFirstName} {couple.husbandLastName}</p>
                          {couple.husbandOccupation && (
                            <p className="truncate text-slate-500">{couple.husbandOccupation}</p>
                          )}
                          {couple.husbandContact && (
                            <p className="truncate text-slate-500">📞 {couple.husbandContact}</p>
                          )}
                        </div>

                        {/* Col 3: Wife info */}
                        <div className="min-w-0 text-xs text-slate-600 space-y-0.5">
                          <p className="font-semibold text-rose-700 truncate">{couple.wifeFirstName} {couple.husbandLastName}</p>
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

          {/* ========================================================================= */}
          {/* TAB 4: AI GROUP BY GEMINI                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'ai-groups' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-6 rounded-3xl shadow-lg shadow-violet-200 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black">Groupings with the Guide of the Holy Spirit</h2>
                      <p className="text-violet-200 text-xs mt-0.5">
                        {currentCouples.length} couples in {currentClp.name} • AI-assisted pastoral grouping tool
                      </p>
                    </div>
                  </div>
                  {aiGroupingResult && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadAIGroupsHTML}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-violet-700 hover:bg-violet-50 text-xs font-bold transition-all shadow-sm"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt Input Section */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-1">
                    Grouping Instruction
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Describe how you want the AI to group the invitees. Be specific — the more context you give, the better the groups.
                  </p>
                  <textarea
                    value={aiGroupPrompt}
                    onChange={(e) => setAiGroupPrompt(e.target.value)}
                    rows={3}
                    placeholder='e.g. "Group couples by barangay so they can support each other geographically" or "Group by occupation similarity for mutual encouragement" or "Create 4 balanced groups mixing different barangays for diversity"'
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-300 resize-none font-medium placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                {/* Prompt Suggestions */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Quick Suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Group by barangay proximity',
                      'Group by occupation similarity',
                      'Mix all barangays for diversity',
                      'Create 3 balanced groups',
                      'Separate by anniversary year',
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

                <button
                  type="button"
                  onClick={handleAIGrouping}
                  disabled={isAiGrouping || currentCouples.length === 0}
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
                      <span>Generate Groupings</span>
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
                      <p className="text-sm font-bold text-violet-900">Generating prayerful groupings for {currentCouples.length} couples...</p>
                      <p className="text-xs text-violet-600">Placing couples according to the Holy Spirit's guidance</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Results */}
              {aiGroupingResult && (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {aiGroupingResult.groups.length} groupings created from {currentCouples.length} couples
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 italic">"{aiGroupingResult.prompt}"</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setAiGroupingResult(null); setAiGroupPrompt(''); }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Regroup</span>
                    </button>
                  </div>

                  {/* AI Summary */}
                  {aiGroupingResult.summary && (
                    <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-violet-400 mb-1">AI Summary</p>
                      <p className="text-sm text-violet-900 font-medium">{aiGroupingResult.summary}</p>
                    </div>
                  )}

                  {/* Group Cards */}
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
                        <div key={group.groupNumber} className={`rounded-2xl border ${colors.border} overflow-hidden shadow-xs`}>
                          {/* Group Header */}
                          <div className={`${colors.bg} px-5 py-4 flex items-center justify-between`}>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Group {group.groupNumber}</p>
                              <h3 className="text-base font-black text-white">{group.groupName}</h3>
                            </div>
                            <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                              {group.couples.length} couples
                            </span>
                          </div>

                          {/* Rationale */}
                          <div className={`${colors.light} px-5 py-3 border-b ${colors.border}`}>
                            <p className={`text-[11px] font-medium ${colors.text} italic`}>{group.rationale}</p>
                          </div>

                          {/* Couple List */}
                          <div className="bg-white divide-y divide-slate-100">
                            {group.couples.map((couple, ci) => (
                              <div key={couple.id} className="flex items-center gap-3 px-5 py-3">
                                <span className={`w-6 h-6 rounded-full ${colors.num} text-[11px] font-black flex items-center justify-center shrink-0`}>
                                  {ci + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-900 truncate">{couple.name}</p>
                                  <p className="text-[11px] text-slate-500">Brgy. {couple.barangay}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Print/Download Action Row */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 font-medium">
                      Generated {new Date(aiGroupingResult.generatedAt).toLocaleString('en-PH')} • {aiGroupingResult.groups.length} groups • {currentCouples.length} couples
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadAIGroupsHTML}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-violet-300 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Groupings</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white text-xs font-bold transition-all shadow-sm"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Groupings</span>
                      </button>
                    </div>
                  </div>
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
                    • Click anywhere on the map or choose a barangay below to pinpoint
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
