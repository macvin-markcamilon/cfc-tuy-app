'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { TUY_BARANGAYS } from '@/lib/data/mock-data';
import { fetchHouseholdGroups } from '@/lib/data/groups-service';
import {
  fetchDirectoryCouples,
  saveDirectoryCouple,
  deleteDirectoryCouple,
  fileToDataUrl,
} from '@/lib/data/members-service';
import { HouseholdGroup, DirectoryCouple, MinistryType } from '@/types';
import TuyMapPicker from '@/components/map/TuyMapPicker';
import {
  Users,
  Plus,
  Layers,
  MapPin,
  Phone,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  Camera,
  Upload,
  Trash2,
  Edit3,
  Eye,
  LayoutGrid,
  List,
  Map as MapIcon,
  Check,
  X,
  Sparkles,
  Cake,
  Briefcase,
  Heart,
  Mail,
  UserCheck,
  Building2,
  Calendar,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  IdCard,
} from 'lucide-react';
import AnniversaryGreetingCardModal from '@/components/common/AnniversaryGreetingCardModal';
import BirthdayGreetingCardModal from '@/components/common/BirthdayGreetingCardModal';
import BulkUploadMembersModal from '@/components/admin/BulkUploadMembersModal';

export default function MembersAdminPage() {
  // Directory Couples & Household Groups State
  const [couples, setCouples] = useState<DirectoryCouple[]>([]);
  const [householdGroups, setHouseholdGroups] = useState<HouseholdGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Active View & Filters
  const [activeTab, setActiveTab] = useState<'couples' | 'households' | 'map'>('couples');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState<string>('ALL');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('ALL');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'lastName-asc' | 'lastName-desc' | 'barangay-asc'>('lastName-asc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCouple, setSelectedCouple] = useState<DirectoryCouple | null>(null);
  const [editingCoupleId, setEditingCoupleId] = useState<string | null>(null);
  const [cardModalCouple, setCardModalCouple] = useState<DirectoryCouple | null>(null);
  const [birthdayCardCouple, setBirthdayCardCouple] = useState<DirectoryCouple | null>(null);

  // Map Picker Modal inside Add/Edit Form
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showEditMapPicker, setShowEditMapPicker] = useState(false);

  // Toast message & Submitting state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalCouple, setDeleteModalCouple] = useState<DirectoryCouple | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---------------------------------------------------------------------------
  // Add Couple Form States (with Nickname & 3 Photo Uploads!)
  // ---------------------------------------------------------------------------
  const [husbandFirst, setHusbandFirst] = useState('');
  const [husbandLast, setHusbandLast] = useState('');
  const [husbandNickname, setHusbandNickname] = useState('');
  const [husbandPhotoUrl, setHusbandPhotoUrl] = useState('');
  const [husbandBday, setHusbandBday] = useState('');
  const [husbandJob, setHusbandJob] = useState('');
  const [husbandPhone, setHusbandPhone] = useState('');
  const [husbandEmail, setHusbandEmail] = useState('');

  const [wifeFirst, setWifeFirst] = useState('');
  const [wifeLast, setWifeLast] = useState('');
  const [wifeNickname, setWifeNickname] = useState('');
  const [wifePhotoUrl, setWifePhotoUrl] = useState('');
  const [wifeBday, setWifeBday] = useState('');
  const [wifeJob, setWifeJob] = useState('');
  const [wifePhone, setWifePhone] = useState('');
  const [wifeEmail, setWifeEmail] = useState('');

  const [couplePhotoUrl, setCouplePhotoUrl] = useState('');
  const [weddingAnniv, setWeddingAnniv] = useState('');
  const [ministry, setMinistry] = useState<MinistryType>('CFC');
  const [householdGroupId, setHouseholdGroupId] = useState('');
  const [barangay, setBarangay] = useState('Rizal (Pob.)');
  const [address, setAddress] = useState('Brgy. Rizal (Pob.), Tuy, Batangas');
  const [coordinates, setCoordinates] = useState<[number, number]>([120.7289, 14.0228]);
  const [status, setStatus] = useState<DirectoryCouple['status']>('Active');
  const [notes, setNotes] = useState('');

  // ---------------------------------------------------------------------------
  // Edit Couple Form States
  // ---------------------------------------------------------------------------
  const [editHusbandFirst, setEditHusbandFirst] = useState('');
  const [editHusbandLast, setEditHusbandLast] = useState('');
  const [editHusbandNickname, setEditHusbandNickname] = useState('');
  const [editHusbandPhotoUrl, setEditHusbandPhotoUrl] = useState('');
  const [editHusbandBday, setEditHusbandBday] = useState('');
  const [editHusbandJob, setEditHusbandJob] = useState('');
  const [editHusbandPhone, setEditHusbandPhone] = useState('');
  const [editHusbandEmail, setEditHusbandEmail] = useState('');

  const [editWifeFirst, setEditWifeFirst] = useState('');
  const [editWifeLast, setEditWifeLast] = useState('');
  const [editWifeNickname, setEditWifeNickname] = useState('');
  const [editWifePhotoUrl, setEditWifePhotoUrl] = useState('');
  const [editWifeBday, setEditWifeBday] = useState('');
  const [editWifeJob, setEditWifeJob] = useState('');
  const [editWifePhone, setEditWifePhone] = useState('');
  const [editWifeEmail, setEditWifeEmail] = useState('');

  const [editCouplePhotoUrl, setEditCouplePhotoUrl] = useState('');
  const [editWeddingAnniv, setEditWeddingAnniv] = useState('');
  const [editMinistry, setEditMinistry] = useState<MinistryType>('CFC');
  const [editHouseholdGroupId, setEditHouseholdGroupId] = useState('');
  const [editBarangay, setEditBarangay] = useState('Rizal (Pob.)');
  const [editAddress, setEditAddress] = useState('');
  const [editCoordinates, setEditCoordinates] = useState<[number, number]>([120.7289, 14.0228]);
  const [editStatus, setEditStatus] = useState<DirectoryCouple['status']>('Active');
  const [editNotes, setEditNotes] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Load Directory Couples & Household Groups on Mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [couplesData, groupsData] = await Promise.all([
          fetchDirectoryCouples(),
          fetchHouseholdGroups(),
        ]);
        setCouples(couplesData);
        setHouseholdGroups(groupsData);
      } catch (err) {
        console.error('Failed to load directory members:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered & Sorted Directory Couples
  const filteredCouples = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = couples.filter((c) => {
      const matchesSearch =
        !q ||
        c.husbandFirstName.toLowerCase().includes(q) ||
        c.husbandLastName.toLowerCase().includes(q) ||
        (c.husbandNickname && c.husbandNickname.toLowerCase().includes(q)) ||
        c.wifeFirstName.toLowerCase().includes(q) ||
        c.wifeLastName.toLowerCase().includes(q) ||
        (c.wifeNickname && c.wifeNickname.toLowerCase().includes(q)) ||
        c.barangay.toLowerCase().includes(q) ||
        (c.householdGroupName && c.householdGroupName.toLowerCase().includes(q)) ||
        (c.husbandContact && c.husbandContact.includes(q)) ||
        (c.wifeContact && c.wifeContact.includes(q));

      const matchesMinistry = selectedMinistry === 'ALL' || c.ministry === selectedMinistry;
      const matchesBarangay = selectedBarangay === 'ALL' || c.barangay === selectedBarangay;
      const matchesHousehold = selectedHouseholdId === 'ALL' || c.householdGroupId === selectedHouseholdId;
      const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;

      return matchesSearch && matchesMinistry && matchesBarangay && matchesHousehold && matchesStatus;
    });

    return list.sort((a, b) => {
      if (sortBy === 'lastName-asc') {
        const cmp = a.husbandLastName.localeCompare(b.husbandLastName);
        if (cmp !== 0) return cmp;
        return a.husbandFirstName.localeCompare(b.husbandFirstName);
      }
      if (sortBy === 'lastName-desc') {
        const cmp = b.husbandLastName.localeCompare(a.husbandLastName);
        if (cmp !== 0) return cmp;
        return b.husbandFirstName.localeCompare(a.husbandFirstName);
      }
      if (sortBy === 'barangay-asc') {
        return a.barangay.localeCompare(b.barangay);
      }
      return 0;
    });
  }, [couples, searchQuery, selectedMinistry, selectedBarangay, selectedHouseholdId, selectedStatus, sortBy]);

  // Image File Upload Handlers (Husband, Wife, Couple Together)
  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'husband' | 'wife' | 'couple',
    isEdit = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      if (!isEdit) {
        if (target === 'husband') setHusbandPhotoUrl(dataUrl);
        else if (target === 'wife') setWifePhotoUrl(dataUrl);
        else if (target === 'couple') setCouplePhotoUrl(dataUrl);
      } else {
        if (target === 'husband') setEditHusbandPhotoUrl(dataUrl);
        else if (target === 'wife') setEditWifePhotoUrl(dataUrl);
        else if (target === 'couple') setEditCouplePhotoUrl(dataUrl);
      }
      triggerToast('Photo attached successfully!');
    } catch (err) {
      console.error('Failed to read photo:', err);
      alert('Could not read image file. Please upload a valid JPG or PNG.');
    }
  };

  // Submit Handler: Add New Couple
  const handleAddCoupleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!husbandFirst.trim() || !husbandLast.trim() || !wifeFirst.trim() || !wifeLast.trim()) {
      alert('Please fill in both Husband and Wife first and last names.');
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedHhGroup = householdGroups.find((g) => g.id === householdGroupId);

      const newCouple: Partial<DirectoryCouple> = {
        husbandFirstName: husbandFirst.trim(),
        husbandLastName: husbandLast.trim(),
        husbandNickname: husbandNickname.trim(),
        husbandPhotoUrl,
        husbandBirthday: husbandBday,
        husbandOccupation: husbandJob.trim(),
        husbandContact: husbandPhone.trim(),
        husbandEmail: husbandEmail.trim(),

        wifeFirstName: wifeFirst.trim(),
        wifeLastName: wifeLast.trim(),
        wifeNickname: wifeNickname.trim(),
        wifePhotoUrl,
        wifeBirthday: wifeBday,
        wifeOccupation: wifeJob.trim(),
        wifeContact: wifePhone.trim(),
        wifeEmail: wifeEmail.trim(),

        couplePhotoUrl,
        weddingAnniversary: weddingAnniv,
        ministry,
        householdGroupId,
        householdGroupName: selectedHhGroup?.name || '',
        barangay,
        address: address.trim(),
        coordinates,
        status,
        notes: notes.trim(),
      };

      const saved = await saveDirectoryCouple(newCouple);
      setCouples((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
      setShowAddModal(false);

      // Reset form
      setHusbandFirst('');
      setHusbandLast('');
      setHusbandNickname('');
      setHusbandPhotoUrl('');
      setHusbandBday('');
      setHusbandJob('');
      setHusbandPhone('');
      setHusbandEmail('');
      setWifeFirst('');
      setWifeLast('');
      setWifeNickname('');
      setWifePhotoUrl('');
      setWifeBday('');
      setWifeJob('');
      setWifePhone('');
      setWifeEmail('');
      setCouplePhotoUrl('');
      setWeddingAnniv('');
      setNotes('');

      triggerToast(`Bro. ${saved.husbandFirstName} & Sis. ${saved.wifeFirstName} ${saved.husbandLastName} registered to directory!`);
    } catch (err) {
      console.error('Failed to save couple:', err);
      alert('Failed to save couple. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (c: DirectoryCouple) => {
    setEditingCoupleId(c.id);
    setEditHusbandFirst(c.husbandFirstName);
    setEditHusbandLast(c.husbandLastName);
    setEditHusbandNickname(c.husbandNickname || '');
    setEditHusbandPhotoUrl(c.husbandPhotoUrl || '');
    setEditHusbandBday(c.husbandBirthday || '');
    setEditHusbandJob(c.husbandOccupation || '');
    setEditHusbandPhone(c.husbandContact || '');
    setEditHusbandEmail(c.husbandEmail || '');

    setEditWifeFirst(c.wifeFirstName);
    setEditWifeLast(c.wifeLastName);
    setEditWifeNickname(c.wifeNickname || '');
    setEditWifePhotoUrl(c.wifePhotoUrl || '');
    setEditWifeBday(c.wifeBirthday || '');
    setEditWifeJob(c.wifeOccupation || '');
    setEditWifePhone(c.wifeContact || '');
    setEditWifeEmail(c.wifeEmail || '');

    setEditCouplePhotoUrl(c.couplePhotoUrl || '');
    setEditWeddingAnniv(c.weddingAnniversary || '');
    setEditMinistry(c.ministry || 'CFC');
    setEditHouseholdGroupId(c.householdGroupId || '');
    setEditBarangay(c.barangay || 'Rizal (Pob.)');
    setEditAddress(c.address || '');
    setEditCoordinates(c.coordinates || [120.7289, 14.0228]);
    setEditStatus(c.status || 'Active');
    setEditNotes(c.notes || '');

    setShowEditModal(true);
  };

  // Submit Handler: Update Couple
  const handleUpdateCoupleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupleId) return;

    try {
      setIsSubmitting(true);
      const selectedHhGroup = householdGroups.find((g) => g.id === editHouseholdGroupId);

      const updatedCouple: DirectoryCouple = {
        id: editingCoupleId,
        husbandFirstName: editHusbandFirst.trim(),
        husbandLastName: editHusbandLast.trim(),
        husbandNickname: editHusbandNickname.trim(),
        husbandPhotoUrl: editHusbandPhotoUrl,
        husbandBirthday: editHusbandBday,
        husbandOccupation: editHusbandJob.trim(),
        husbandContact: editHusbandPhone.trim(),
        husbandEmail: editHusbandEmail.trim(),

        wifeFirstName: editWifeFirst.trim(),
        wifeLastName: editWifeLast.trim(),
        wifeNickname: editWifeNickname.trim(),
        wifePhotoUrl: editWifePhotoUrl,
        wifeBirthday: editWifeBday,
        wifeOccupation: editWifeJob.trim(),
        wifeContact: editWifePhone.trim(),
        wifeEmail: editWifeEmail.trim(),

        couplePhotoUrl: editCouplePhotoUrl,
        weddingAnniversary: editWeddingAnniv,
        ministry: editMinistry,
        householdGroupId: editHouseholdGroupId,
        householdGroupName: selectedHhGroup?.name || '',
        barangay: editBarangay,
        address: editAddress.trim(),
        coordinates: editCoordinates,
        status: editStatus,
        notes: editNotes.trim(),
      };

      const saved = await saveDirectoryCouple(updatedCouple);
      setCouples((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
      setShowEditModal(false);
      triggerToast(`Updated profile for Bro. ${saved.husbandFirstName} & Sis. ${saved.wifeFirstName}!`);
    } catch (err) {
      console.error('Failed to update couple:', err);
      alert('Failed to update couple.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleDeleteCouple = (couple: DirectoryCouple) => {
    setDeleteModalCouple(couple);
  };

  // Execute Delete from Supabase & Local
  const confirmDeleteCouple = async () => {
    if (!deleteModalCouple) return;
    try {
      setIsDeleting(true);
      await deleteDirectoryCouple(deleteModalCouple.id);
      setCouples((prev) => prev.filter((c) => c.id !== deleteModalCouple.id));
      triggerToast(`Removed ${deleteModalCouple.husbandLastName} couple from directory.`);
      setDeleteModalCouple(null);
    } catch (err) {
      console.error('Failed to delete couple:', err);
      alert('Could not delete couple from directory. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#243c81] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 text-xs font-black flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PAGE HEADER                                                           */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#243c81] text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#243c81]" />
            <span>Pastoral Records &amp; Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tuy Members &amp; Household Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-medium">
            Official roster of active Couples for Christ brethren, household units, nicknames, and photos across all 22 barangays in Tuy, Batangas.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap self-start md:self-auto">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>+ Add Member / Couple</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBulkUploadModal(true)}
            className="px-4.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>Bulk Upload CSV</span>
          </button>

          <Link
            href="/admin/groups"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#243c81] font-bold text-xs sm:text-sm transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>Household Units</span>
          </Link>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* QUICK STATS CARDS                                                     */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#243c81] flex items-center justify-center shrink-0 border border-blue-100 font-black">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Total Brethren</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{couples.length * 2} Members</h3>
            <p className="text-[11px] text-blue-700 font-bold">{couples.length} Registered Couples</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-100 font-black">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Active Households</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{householdGroups.length} Units</h3>
            <p className="text-[11px] text-amber-800 font-bold">Across 6 Ministries</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100 font-black">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Tuy Coverage</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">22 Barangays</h3>
            <p className="text-[11px] text-emerald-800 font-bold">Mapped Pastoral Locations</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center shrink-0 border border-purple-100 font-black">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Active Status</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {couples.filter((c) => c.status === 'Active').length} Active
            </h3>
            <p className="text-[11px] text-purple-800 font-bold">Regular Attendance</p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* NAVIGATION TABS & VIEW SWITCHER                                       */}
      {/* ===================================================================== */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('couples')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'couples'
                ? 'bg-[#243c81] text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members &amp; Couples Directory ({filteredCouples.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('households')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'households'
                ? 'bg-[#243c81] text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Household Units ({householdGroups.length})</span>
          </button>
        </div>

        {/* View Mode Switcher (Grid vs List) */}
        {activeTab === 'couples' && (
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-bold self-start md:self-auto border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-white text-[#243c81] shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Grid Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-white text-[#243c81] shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Table List</span>
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SEARCH & FILTERS TOOLBAR                                             */}
      {/* ===================================================================== */}
      {activeTab === 'couples' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, nickname, barangay, household..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            {/* Ministry Filter */}
            <div>
              <select
                value={selectedMinistry}
                onChange={(e) => setSelectedMinistry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-800 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Ministries</option>
                <option value="CFC">Couples for Christ (CFC)</option>
                <option value="SFC">Singles for Christ (SFC)</option>
                <option value="YFC">Youth for Christ (YFC)</option>
                <option value="KFC">Kids for Christ (KFC)</option>
                <option value="HOLD">Handmaids of the Lord (HOLD)</option>
                <option value="SOLD">Servants of the Lord (SOLD)</option>
              </select>
            </div>

            {/* Barangay Filter */}
            <div>
              <select
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-800 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All 22 Barangays</option>
                {TUY_BARANGAYS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-800 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active Brethren</option>
                <option value="On-Break">On-Break</option>
                <option value="Transferred">Transferred</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: MEMBERS & COUPLES DIRECTORY                                    */}
      {/* ===================================================================== */}
      {activeTab === 'couples' && (
        <>
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold">Loading member directory...</p>
            </div>
          ) : filteredCouples.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No members or couples found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search criteria or click &quot;+ Add Member / Couple&quot; above to register brethren into the directory.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW CARDS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCouples.map((couple) => (
                <div
                  key={couple.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-blue-400 transition-all flex flex-col justify-between group space-y-4"
                >
                  <div>
                    {/* Header Badge Row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-[#243c81] border border-blue-200">
                        {couple.ministry}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          couple.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {couple.status}
                      </span>
                    </div>

                    {/* Photos Display (Couple Picture Together or Dual Husband & Wife Avatars) */}
                    <div className="mb-4">
                      {couple.couplePhotoUrl ? (
                        <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative group/img">
                          <img
                            src={couple.couplePhotoUrl}
                            alt={`${couple.husbandLastName} Couple`}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                            <span className="text-white text-xs font-black drop-shadow-md">
                              {couple.husbandNickname || couple.husbandFirstName} &amp; {couple.wifeNickname || couple.wifeFirstName}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                          {/* Husband Avatar */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-[#243c81] font-black flex items-center justify-center shrink-0 border border-blue-200 overflow-hidden text-xs">
                              {couple.husbandPhotoUrl ? (
                                <img src={couple.husbandPhotoUrl} alt="Husband" className="w-full h-full object-cover" />
                              ) : (
                                <span>{couple.husbandFirstName.charAt(0)}</span>
                              )}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-black text-slate-900 truncate">
                                {couple.husbandFirstName}
                              </p>
                              {couple.husbandNickname && (
                                <p className="text-[10px] font-bold text-amber-800 truncate">
                                  &quot;{couple.husbandNickname}&quot;
                                </p>
                              )}
                            </div>
                          </div>

                          <span className="text-slate-300 font-black text-sm">&amp;</span>

                          {/* Wife Avatar */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 font-black flex items-center justify-center shrink-0 border border-rose-200 overflow-hidden text-xs">
                              {couple.wifePhotoUrl ? (
                                <img src={couple.wifePhotoUrl} alt="Wife" className="w-full h-full object-cover" />
                              ) : (
                                <span>{couple.wifeFirstName.charAt(0)}</span>
                              )}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-black text-slate-900 truncate">
                                {couple.wifeFirstName}
                              </p>
                              {couple.wifeNickname && (
                                <p className="text-[10px] font-bold text-rose-800 truncate">
                                  &quot;{couple.wifeNickname}&quot;
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Couple Family Name & Nicknames */}
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-[#243c81] transition-colors leading-tight">
                      Bro. {couple.husbandFirstName} {couple.husbandNickname ? `"${couple.husbandNickname}"` : ''} &amp; Sis. {couple.wifeFirstName} {couple.wifeNickname ? `"${couple.wifeNickname}"` : ''} {couple.husbandLastName}
                    </h3>

                    {/* Household Unit & Barangay */}
                    <div className="mt-2.5 space-y-1 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                        <Layers className="w-3.5 h-3.5 text-[#243c81] shrink-0" />
                        <span>{couple.householdGroupName || 'Unassigned Household Unit'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{couple.barangay}, Tuy</span>
                      </div>
                      {(couple.husbandContact || couple.wifeContact) && (
                        <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{couple.husbandContact || couple.wifeContact}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCouple(couple);
                          setShowDetailModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-[#243c81] hover:bg-blue-100 font-bold text-xs flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Record</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCardModalCouple(couple)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-100/80 text-amber-900 hover:bg-amber-200 font-bold text-xs flex items-center gap-1 transition-all"
                        title="Generate Greeting Card"
                      >
                        <IdCard className="w-3.5 h-3.5 text-amber-700" />
                        <span>Card</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(couple)}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Edit Couple Profile"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCouple(couple)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove Couple"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLE LIST VIEW */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-black">
                      <th className="py-3 px-4">Couple / Brethren Name</th>
                      <th className="py-3 px-4">Nicknames</th>
                      <th className="py-3 px-4">Ministry</th>
                      <th className="py-3 px-4">Household Unit</th>
                      <th className="py-3 px-4">Barangay</th>
                      <th className="py-3 px-4">Contact #</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredCouples.map((c) => (
                      <tr key={c.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#243c81] font-black flex items-center justify-center shrink-0 border border-blue-200 overflow-hidden text-xs">
                              {c.couplePhotoUrl ? (
                                <img src={c.couplePhotoUrl} alt="Couple" className="w-full h-full object-cover" />
                              ) : (
                                <span>{c.husbandFirstName.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <span>Bro. {c.husbandFirstName} &amp; Sis. {c.wifeFirstName} {c.husbandLastName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-amber-900 font-bold text-xs">
                          {c.husbandNickname || c.wifeNickname ? (
                            <span>&quot;{c.husbandNickname || '—'}&quot; / &quot;{c.wifeNickname || '—'}&quot;</span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#243c81] border border-blue-200">
                            {c.ministry}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {c.householdGroupName || 'Unassigned'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{c.barangay}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">{c.husbandContact || c.wifeContact || '—'}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCouple(c);
                                setShowDetailModal(true);
                              }}
                              className="p-1.5 rounded-lg text-[#243c81] hover:bg-blue-50 font-bold"
                              title="View Record"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCardModalCouple(c)}
                              className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 font-bold"
                              title="Generate Greeting Card"
                            >
                              <IdCard className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(c)}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                              title="Edit Profile"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCouple(c)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: HOUSEHOLD UNITS TABLE                                          */}
      {/* ===================================================================== */}
      {activeTab === 'households' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-base text-slate-900">
              Household Units in Tuy ({householdGroups.length} Units)
            </h3>
            <Link
              href="/admin/groups"
              className="text-xs font-bold text-[#243c81] hover:underline flex items-center gap-1"
            >
              <span>View Full Group Management</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {householdGroups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-700 text-xs uppercase font-extrabold bg-slate-50">
                    <th className="py-3 px-3">Unit / Household Name</th>
                    <th className="py-3 px-3">Ministry</th>
                    <th className="py-3 px-3">Barangay</th>
                    <th className="py-3 px-3">Leader Servant</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Schedule</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {householdGroups.map((hh) => (
                    <tr key={hh.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-3 font-bold text-slate-900">{hh.name}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#243c81] border border-blue-200">
                          {hh.ministry}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 font-medium">{hh.barangay}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">{hh.leaderName}</td>
                      <td className="py-3.5 px-3 text-slate-600 font-mono text-xs">{hh.leaderContact || '—'}</td>
                      <td className="py-3.5 px-3 text-slate-600">{hh.meetingSchedule || hh.meetingDay || '—'}</td>
                      <td className="py-3.5 px-3 text-right">
                        <Link
                          href="/admin/groups"
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#243c81] hover:bg-blue-50 transition-colors"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-800 text-base">
                No household units registered yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: ADD COUPLE / MEMBER FAMILY (WITH NICKNAME & 3 UPLOADS)       */}
      {/* ===================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#243c81] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                    Add Member Family / Couple
                  </h2>
                  <p className="text-xs text-blue-200">
                    Register brethren into the pastoral directory with nicknames and profile photos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleAddCoupleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Couple Picture Together Photo Upload */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-rose-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-blue-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {couplePhotoUrl ? (
                      <img src={couplePhotoUrl} alt="Couple Together" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#243c81] flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500 fill-current" />
                      <span>Couple Picture Together</span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Upload a photo of Husband and Wife together for the directory roster card.
                    </p>
                  </div>
                </div>

                <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs active:scale-95 shrink-0">
                  <Upload className="w-4 h-4" />
                  <span>{couplePhotoUrl ? 'Change Couple Photo' : 'Upload Couple Picture'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'couple')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Husband Details Box */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-[#243c81] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>Husband Information</span>
                  </h4>

                  {/* Husband Photo Upload */}
                  <label className="cursor-pointer px-3 py-1 rounded-lg bg-white border border-blue-300 text-[#243c81] text-xs font-bold flex items-center gap-1.5 hover:bg-blue-50 transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{husbandPhotoUrl ? 'Change Photo' : 'Husband Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'husband')}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={husbandFirst}
                      onChange={(e) => setHusbandFirst(e.target.value)}
                      placeholder="e.g. Mark"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={husbandLast}
                      onChange={(e) => setHusbandLast(e.target.value)}
                      placeholder="e.g. Camilon"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-amber-800 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Nickname / Title</span>
                    </label>
                    <input
                      type="text"
                      value={husbandNickname}
                      onChange={(e) => setHusbandNickname(e.target.value)}
                      placeholder="e.g. Bro. Mark / Tito Lando"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Birthday</label>
                    <input
                      type="date"
                      value={husbandBday}
                      onChange={(e) => setHusbandBday(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      value={husbandJob}
                      onChange={(e) => setHusbandJob(e.target.value)}
                      placeholder="e.g. Engineer"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Mobile Contact</label>
                    <input
                      type="text"
                      value={husbandPhone}
                      onChange={(e) => setHusbandPhone(e.target.value)}
                      placeholder="0917-123-4567"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Wife Details Box */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-rose-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    <span>Wife Information</span>
                  </h4>

                  {/* Wife Photo Upload */}
                  <label className="cursor-pointer px-3 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-50 transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{wifePhotoUrl ? 'Change Photo' : 'Wife Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'wife')}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={wifeFirst}
                      onChange={(e) => setWifeFirst(e.target.value)}
                      placeholder="e.g. Grace"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-bold focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={wifeLast}
                      onChange={(e) => setWifeLast(e.target.value)}
                      placeholder="e.g. Camilon"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-bold focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-amber-800 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Nickname / Title</span>
                    </label>
                    <input
                      type="text"
                      value={wifeNickname}
                      onChange={(e) => setWifeNickname(e.target.value)}
                      placeholder="e.g. Sis. Grace / Tita Charing"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Birthday</label>
                    <input
                      type="date"
                      value={wifeBday}
                      onChange={(e) => setWifeBday(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      value={wifeJob}
                      onChange={(e) => setWifeJob(e.target.value)}
                      placeholder="e.g. Teacher"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Mobile Contact</label>
                    <input
                      type="text"
                      value={wifePhone}
                      onChange={(e) => setWifePhone(e.target.value)}
                      placeholder="0917-987-6543"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Household & Pastoral Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Ministry</label>
                  <select
                    value={ministry}
                    onChange={(e) => setMinistry(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="CFC">Couples for Christ (CFC)</option>
                    <option value="SFC">Singles for Christ (SFC)</option>
                    <option value="YFC">Youth for Christ (YFC)</option>
                    <option value="KFC">Kids for Christ (KFC)</option>
                    <option value="HOLD">Handmaids of the Lord (HOLD)</option>
                    <option value="SOLD">Servants of the Lord (SOLD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Household Unit</label>
                  <select
                    value={householdGroupId}
                    onChange={(e) => setHouseholdGroupId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {householdGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.barangay})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Barangay in Tuy</label>
                  <select
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {TUY_BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Wedding Anniversary</label>
                  <input
                    type="date"
                    value={weddingAnniv}
                    onChange={(e) => setWeddingAnniv(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Map Address & Coordinates */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-700 uppercase">
                    Pastoral Residence Address &amp; Location
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker((prev) => !prev)}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{showMapPicker ? 'Hide Map Picker' : 'Pick Coordinates on Tuy Map'}</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Brgy. Rizal (Pob.), Tuy, Batangas"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-medium"
                />

                {showMapPicker && (
                  <div className="p-2 rounded-2xl bg-white border border-slate-200 space-y-2">
                    <p className="text-[11px] text-slate-500 font-semibold">
                      Click anywhere inside Tuy, Batangas to pin couple residence:
                    </p>
                    <TuyMapPicker
                      initialCoordinates={coordinates}
                      onSelectLocation={(data) => {
                        setCoordinates(data.coordinates);
                        if (data.barangay) setBarangay(data.barangay);
                        if (data.address) setAddress(data.address);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Form Footer Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>{isSubmitting ? 'Saving Couple...' : 'Save Couple to Directory'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: EDIT COUPLE / MEMBER PROFILE                                 */}
      {/* ===================================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
            <div className="p-4 sm:p-5 bg-[#243c81] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                    Edit Brethren Profile: Bro. {editHusbandFirst} &amp; Sis. {editWifeFirst} {editHusbandLast}
                  </h2>
                  <p className="text-xs text-blue-200">
                    Update nicknames, photos, contact numbers, and pastoral assignments.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCoupleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Couple Picture Together Upload */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-rose-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-blue-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {editCouplePhotoUrl ? (
                      <img src={editCouplePhotoUrl} alt="Couple Together" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#243c81] flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500 fill-current" />
                      <span>Couple Picture Together</span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Upload a photo of Husband and Wife together for the roster card.
                    </p>
                  </div>
                </div>

                <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs active:scale-95 shrink-0">
                  <Upload className="w-4 h-4" />
                  <span>{editCouplePhotoUrl ? 'Change Couple Photo' : 'Upload Couple Picture'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'couple', true)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Husband Details */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-[#243c81] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>Husband Information</span>
                  </h4>

                  <label className="cursor-pointer px-3 py-1 rounded-lg bg-white border border-blue-300 text-[#243c81] text-xs font-bold flex items-center gap-1.5 hover:bg-blue-50 transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{editHusbandPhotoUrl ? 'Change Photo' : 'Husband Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'husband', true)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={editHusbandFirst}
                      onChange={(e) => setEditHusbandFirst(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={editHusbandLast}
                      onChange={(e) => setEditHusbandLast(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-amber-800 mb-1">Nickname / Title</label>
                    <input
                      type="text"
                      value={editHusbandNickname}
                      onChange={(e) => setEditHusbandNickname(e.target.value)}
                      placeholder="e.g. Bro. Mark"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Birthday</label>
                    <input
                      type="date"
                      value={editHusbandBday}
                      onChange={(e) => setEditHusbandBday(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      value={editHusbandJob}
                      onChange={(e) => setEditHusbandJob(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Mobile Contact</label>
                    <input
                      type="text"
                      value={editHusbandPhone}
                      onChange={(e) => setEditHusbandPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Wife Details */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-rose-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    <span>Wife Information</span>
                  </h4>

                  <label className="cursor-pointer px-3 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-50 transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{editWifePhotoUrl ? 'Change Photo' : 'Wife Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'wife', true)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={editWifeFirst}
                      onChange={(e) => setEditWifeFirst(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={editWifeLast}
                      onChange={(e) => setEditWifeLast(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-amber-800 mb-1">Nickname / Title</label>
                    <input
                      type="text"
                      value={editWifeNickname}
                      onChange={(e) => setEditWifeNickname(e.target.value)}
                      placeholder="e.g. Sis. Grace"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Birthday</label>
                    <input
                      type="date"
                      value={editWifeBday}
                      onChange={(e) => setEditWifeBday(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      value={editWifeJob}
                      onChange={(e) => setEditWifeJob(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">Mobile Contact</label>
                    <input
                      type="text"
                      value={editWifePhone}
                      onChange={(e) => setEditWifePhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Household, Wedding & Status Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Ministry</label>
                  <select
                    value={editMinistry}
                    onChange={(e) => setEditMinistry(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                  >
                    <option value="CFC">Couples for Christ (CFC)</option>
                    <option value="SFC">Singles for Christ (SFC)</option>
                    <option value="YFC">Youth for Christ (YFC)</option>
                    <option value="KFC">Kids for Christ (KFC)</option>
                    <option value="HOLD">Handmaids of the Lord (HOLD)</option>
                    <option value="SOLD">Servants of the Lord (SOLD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Household Unit</label>
                  <select
                    value={editHouseholdGroupId}
                    onChange={(e) => setEditHouseholdGroupId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                  >
                    <option value="">Unassigned</option>
                    {householdGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.barangay})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Barangay</label>
                  <select
                    value={editBarangay}
                    onChange={(e) => setEditBarangay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                  >
                    {TUY_BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Wedding Anniversary</label>
                  <input
                    type="date"
                    value={editWeddingAnniv}
                    onChange={(e) => setEditWeddingAnniv(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1">Membership Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                  >
                    <option value="Active">Active Brethren</option>
                    <option value="On-Break">On-Break</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#243c81] text-white font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>{isSubmitting ? 'Updating...' : 'Update Pastoral Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: VIEW DETAILED COUPLE RECORD & ID CARD                       */}
      {/* ===================================================================== */}
      {showDetailModal && selectedCouple && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto">
            {/* ID Card Header */}
            <div className="p-5 bg-[#243c81] text-white relative">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>CFC Tuy Pastoral Directory Card</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Bro. {selectedCouple.husbandFirstName} &amp; Sis. {selectedCouple.wifeFirstName} {selectedCouple.husbandLastName}
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                {selectedCouple.householdGroupName || 'Household Unit'} • {selectedCouple.barangay}, Tuy, Batangas
              </p>
            </div>

            {/* ID Card Body */}
            <div className="p-5 sm:p-6 space-y-5 text-slate-800 text-xs sm:text-sm">
              {/* Main Photo Banner */}
              {selectedCouple.couplePhotoUrl ? (
                <div className="w-full h-52 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={selectedCouple.couplePhotoUrl} alt="Couple Together" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#243c81] font-black flex items-center justify-center shrink-0 border border-blue-200 overflow-hidden text-sm">
                      {selectedCouple.husbandPhotoUrl ? (
                        <img src={selectedCouple.husbandPhotoUrl} alt="Husband" className="w-full h-full object-cover" />
                      ) : (
                        <span>{selectedCouple.husbandFirstName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{selectedCouple.husbandFirstName}</p>
                      <p className="text-xs text-amber-800 font-bold">&quot;{selectedCouple.husbandNickname || 'Bro. Mark'}&quot;</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 font-black flex items-center justify-center shrink-0 border border-rose-200 overflow-hidden text-sm">
                      {selectedCouple.wifePhotoUrl ? (
                        <img src={selectedCouple.wifePhotoUrl} alt="Wife" className="w-full h-full object-cover" />
                      ) : (
                        <span>{selectedCouple.wifeFirstName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{selectedCouple.wifeFirstName}</p>
                      <p className="text-xs text-rose-800 font-bold">&quot;{selectedCouple.wifeNickname || 'Sis. Grace'}&quot;</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Husband & Wife Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                  <p className="text-[10px] font-black uppercase text-[#243c81] tracking-wider">Husband Record</p>
                  <p className="font-black text-slate-900">{selectedCouple.husbandFirstName} {selectedCouple.husbandLastName}</p>
                  {selectedCouple.husbandNickname && (
                    <p className="text-xs font-bold text-amber-800">&quot;{selectedCouple.husbandNickname}&quot;</p>
                  )}
                  {selectedCouple.husbandContact && (
                    <p className="text-xs font-mono font-semibold text-slate-700">Phone: {selectedCouple.husbandContact}</p>
                  )}
                  {selectedCouple.husbandOccupation && (
                    <p className="text-xs text-slate-600">Work: {selectedCouple.husbandOccupation}</p>
                  )}
                  {selectedCouple.husbandBirthday && (
                    <div className="pt-1.5 flex items-center justify-between border-t border-blue-200/60 mt-1">
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                        <Cake className="w-3.5 h-3.5 text-amber-600" />
                        <span>{selectedCouple.husbandBirthday}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setBirthdayCardCouple(selectedCouple)}
                        className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold text-[10px] hover:bg-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <IdCard className="w-3 h-3 text-amber-700" />
                        <span>Bday Card</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1">
                  <p className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Wife Record</p>
                  <p className="font-black text-slate-900">{selectedCouple.wifeFirstName} {selectedCouple.wifeLastName}</p>
                  {selectedCouple.wifeNickname && (
                    <p className="text-xs font-bold text-rose-800">&quot;{selectedCouple.wifeNickname}&quot;</p>
                  )}
                  {selectedCouple.wifeContact && (
                    <p className="text-xs font-mono font-semibold text-slate-700">Phone: {selectedCouple.wifeContact}</p>
                  )}
                  {selectedCouple.wifeOccupation && (
                    <p className="text-xs text-slate-600">Work: {selectedCouple.wifeOccupation}</p>
                  )}
                  {selectedCouple.wifeBirthday && (
                    <div className="pt-1.5 flex items-center justify-between border-t border-rose-200/60 mt-1">
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                        <Cake className="w-3.5 h-3.5 text-amber-600" />
                        <span>{selectedCouple.wifeBirthday}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setBirthdayCardCouple(selectedCouple)}
                        className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold text-[10px] hover:bg-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <IdCard className="w-3 h-3 text-amber-700" />
                        <span>Bday Card</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Household & Address Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Ministry:</span>
                  <span className="font-black text-[#243c81]">{selectedCouple.ministry}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Household Group:</span>
                  <span className="font-black text-slate-900">{selectedCouple.householdGroupName || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Barangay:</span>
                  <span className="font-black text-slate-900">{selectedCouple.barangay}, Tuy, Batangas</span>
                </div>
                {selectedCouple.weddingAnniversary && (
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
                    <span className="font-bold flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                      Wedding Anniversary: <span className="font-black">{selectedCouple.weddingAnniversary}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCardModalCouple(selectedCouple)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <IdCard className="w-3.5 h-3.5" />
                      <span>Greeting Card</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Close Record
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBirthdayCardCouple(selectedCouple)}
                  className="px-3 py-2 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Generate Birthday Card"
                >
                  <Cake className="w-3.5 h-3.5" />
                  <span>Birthday Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCardModalCouple(selectedCouple)}
                  className="px-3 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Generate Anniversary Card"
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>Anniv Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenEditModal(selectedCouple);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#243c81] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* BRAND-STYLED DELETE CONFIRMATION MODAL                                */}
      {/* ===================================================================== */}
      {deleteModalCouple && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden transition-all transform scale-100">
            {/* Top Header with CFC Brand Navy */}
            <div className="bg-[#243c81] px-6 py-5 text-white flex items-center justify-between border-b border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-wide text-white">
                    Confirm Record Deletion
                  </h3>
                  <p className="text-[11px] text-blue-200 font-medium">
                    CFC Tuy Pastoral Roster &amp; Directory
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteModalCouple(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#243c81] bg-blue-100/80 px-2.5 py-0.5 rounded-full">
                    {deleteModalCouple.ministry} Couple
                  </span>
                  <span className="text-[11px] text-slate-500 font-bold">
                    {deleteModalCouple.barangay}
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900">
                  Bro. {deleteModalCouple.husbandFirstName} {deleteModalCouple.husbandNickname ? `"${deleteModalCouple.husbandNickname}"` : ''} &amp; Sis. {deleteModalCouple.wifeFirstName} {deleteModalCouple.wifeNickname ? `"${deleteModalCouple.wifeNickname}"` : ''} {deleteModalCouple.husbandLastName}
                </h4>
                {deleteModalCouple.householdGroupName && (
                  <p className="text-xs text-slate-600 font-medium">
                    {deleteModalCouple.householdGroupName}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-1">
                <p className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  Warning: Permanent Removal
                </p>
                <p className="text-[11px] text-rose-700/90 leading-relaxed">
                  This will permanently remove this couple from both the Supabase Cloud database and offline pastoral records.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalCouple(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteCouple}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-900/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Couple Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANNIVERSARY GREETING CARD MODAL */}
      <AnniversaryGreetingCardModal
        isOpen={!!cardModalCouple}
        onClose={() => setCardModalCouple(null)}
        couple={cardModalCouple}
      />

      {/* BIRTHDAY GREETING CARD MODAL */}
      <BirthdayGreetingCardModal
        isOpen={!!birthdayCardCouple}
        onClose={() => setBirthdayCardCouple(null)}
        celebrant={birthdayCardCouple}
      />

      {/* BULK UPLOAD MEMBERS MODAL */}
      <BulkUploadMembersModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        householdGroups={householdGroups}
        onImportSuccess={(newCouples, createdUsersCount) => {
          setCouples((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const fresh = newCouples.filter((nc) => !existingIds.has(nc.id));
            return [...fresh, ...prev];
          });
          triggerToast(
            `Successfully imported ${newCouples.length} member(s)${
              createdUsersCount > 0 ? ` and created ${createdUsersCount} user account(s)` : ''
            }!`
          );
        }}
      />
    </div>
  );
}
