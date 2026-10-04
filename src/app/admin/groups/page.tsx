'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  X,
  Check,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building,
  HeartHandshake,
  UserCheck,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  LayoutGrid,
  Table as TableIcon,
  UserPlus,
  BookOpenCheck,
} from 'lucide-react';
import { HouseholdGroup, HouseholdMember, MinistryType, SavedCLPGrouping } from '@/types';
import {
  fetchHouseholdGroups,
  saveHouseholdGroup,
  deleteHouseholdGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  exportGroupsToCSV,
} from '@/lib/data/groups-service';
import { fetchCLPGroupings } from '@/lib/data/clp-service';
import { TUY_BARANGAYS, MINISTRIES_DATA } from '@/lib/data/mock-data';

export default function AdminGroupsPage() {
  const [activeMainTab, setActiveMainTab] = useState<'households' | 'clp_circles'>('households');
  const [groups, setGroups] = useState<HouseholdGroup[]>([]);
  const [clpGroupings, setClpGroupings] = useState<SavedCLPGrouping[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [ministryFilter, setMinistryFilter] = useState<string>('all');
  const [barangayFilter, setBarangayFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<HouseholdGroup | null>(null);

  // Group Form State
  const [formName, setFormName] = useState('');
  const [formMinistry, setFormMinistry] = useState<MinistryType>('CFC');
  const [formBarangay, setFormBarangay] = useState('Rizal (Pob.)');
  const [formMeetingVenue, setFormMeetingVenue] = useState('');
  const [formMeetingSchedule, setFormMeetingSchedule] = useState('Every 2nd & 4th Saturday • 7:30 PM');
  const [formMeetingDay, setFormMeetingDay] = useState('Saturday');
  const [formLeaderName, setFormLeaderName] = useState('');
  const [formLeaderContact, setFormLeaderContact] = useState('');
  const [formCoLeaderName, setFormCoLeaderName] = useState('');
  const [formCoLeaderContact, setFormCoLeaderContact] = useState('');
  const [formUnitLeaderName, setFormUnitLeaderName] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'On-Break' | 'Inactive'>('Active');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Roster / Members Drawer State
  const [activeRosterGroup, setActiveRosterGroup] = useState<HouseholdGroup | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberSpouse, setNewMemberSpouse] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'Leader' | 'Assistant' | 'Member'>('Member');
  const [newMemberContact, setNewMemberContact] = useState('');
  const [newMemberNotes, setNewMemberNotes] = useState('');
  const [rosterError, setRosterError] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [groupToDelete, setGroupToDelete] = useState<HouseholdGroup | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [hGroups, clpGrps] = await Promise.all([
        fetchHouseholdGroups(),
        fetchCLPGroupings(),
      ]);
      setGroups(hGroups);
      setClpGroupings(clpGrps);
    } catch (err) {
      console.error('Failed to load group management data:', err);
      showToast('Could not load group data. Using local cache.');
    } finally {
      setLoading(false);
    }
  };

  // Open Add Group Modal
  const handleOpenAddModal = () => {
    setEditingGroup(null);
    setFormName('');
    setFormMinistry('CFC');
    setFormBarangay('Rizal (Pob.)');
    setFormMeetingVenue('');
    setFormMeetingSchedule('Every 2nd & 4th Saturday • 7:30 PM');
    setFormMeetingDay('Saturday');
    setFormLeaderName('');
    setFormLeaderContact('');
    setFormCoLeaderName('');
    setFormCoLeaderContact('');
    setFormUnitLeaderName('Bro. Mark Camilon');
    setFormStatus('Active');
    setFormNotes('');
    setFormError(null);
    setShowAddEditModal(true);
  };

  // Open Edit Group Modal
  const handleOpenEditModal = (g: HouseholdGroup) => {
    setEditingGroup(g);
    setFormName(g.name);
    setFormMinistry(g.ministry);
    setFormBarangay(g.barangay || 'Rizal (Pob.)');
    setFormMeetingVenue(g.meetingVenue || '');
    setFormMeetingSchedule(g.meetingSchedule || '');
    setFormMeetingDay(g.meetingDay || 'Saturday');
    setFormLeaderName(g.leaderName);
    setFormLeaderContact(g.leaderContact || '');
    setFormCoLeaderName(g.coLeaderName || '');
    setFormCoLeaderContact(g.coLeaderContact || '');
    setFormUnitLeaderName(g.unitLeaderName || '');
    setFormStatus(g.status || 'Active');
    setFormNotes(g.notes || '');
    setFormError(null);
    setShowAddEditModal(true);
  };

  // Save Group (Create / Update)
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Please enter a Group / Household Name.');
      return;
    }
    if (!formLeaderName.trim()) {
      setFormError('Please specify the Household Head / Leader.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const payload: Partial<HouseholdGroup> = {
        id: editingGroup?.id,
        name: formName.trim(),
        ministry: formMinistry,
        barangay: formBarangay,
        meetingVenue: formMeetingVenue.trim(),
        meetingSchedule: formMeetingSchedule.trim(),
        meetingDay: formMeetingDay.trim(),
        leaderName: formLeaderName.trim(),
        leaderContact: formLeaderContact.trim(),
        coLeaderName: formCoLeaderName.trim(),
        coLeaderContact: formCoLeaderContact.trim(),
        unitLeaderName: formUnitLeaderName.trim(),
        status: formStatus,
        notes: formNotes.trim(),
        members: editingGroup?.members || [],
        membersCount: editingGroup?.membersCount || (editingGroup?.members?.length || 0),
      };

      const saved = await saveHouseholdGroup(payload);

      setGroups((prev) => {
        const exists = prev.some((g) => g.id === saved.id);
        if (exists) {
          return prev.map((g) => (g.id === saved.id ? saved : g));
        }
        return [saved, ...prev];
      });

      // Update active roster group if currently open
      if (activeRosterGroup && activeRosterGroup.id === saved.id) {
        setActiveRosterGroup(saved);
      }

      setShowAddEditModal(false);
      showToast(editingGroup ? `Updated group "${saved.name}"` : `Created group "${saved.name}"`);
    } catch (err: any) {
      console.error('Failed to save group:', err);
      setFormError(err?.message || 'Failed to save group. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Group
  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      await deleteHouseholdGroup(groupToDelete.id);
      setGroups((prev) => prev.filter((g) => g.id !== groupToDelete.id));
      if (activeRosterGroup?.id === groupToDelete.id) {
        setActiveRosterGroup(null);
      }
      showToast(`Group "${groupToDelete.name}" deleted.`);
      setGroupToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete group:', err);
      showToast('Could not delete group.');
    }
  };

  // Add Member into Group Roster
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRosterGroup) return;
    if (!newMemberName.trim()) {
      setRosterError('Please enter member name.');
      return;
    }

    try {
      const updated = await addMemberToGroup(activeRosterGroup.id, {
        name: newMemberName.trim(),
        spouseName: newMemberSpouse.trim() || undefined,
        role: newMemberRole,
        contact: newMemberContact.trim() || undefined,
        notes: newMemberNotes.trim() || undefined,
      });

      if (updated) {
        setActiveRosterGroup(updated);
        setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        setNewMemberName('');
        setNewMemberSpouse('');
        setNewMemberContact('');
        setNewMemberNotes('');
        setShowAddMemberForm(false);
        setRosterError(null);
        showToast('Member added to roster.');
      }
    } catch (err) {
      console.error('Error adding member:', err);
      setRosterError('Could not add member.');
    }
  };

  // Remove Member from Group Roster
  const handleRemoveMember = async (memberId: string) => {
    if (!activeRosterGroup) return;
    try {
      const updated = await removeMemberFromGroup(activeRosterGroup.id, memberId);
      if (updated) {
        setActiveRosterGroup(updated);
        setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        showToast('Member removed from roster.');
      }
    } catch (err) {
      console.error('Error removing member:', err);
      showToast('Could not remove member.');
    }
  };

  // Filtered Household Groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchSearch =
        searchQuery === '' ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.leaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.coLeaderName && g.coLeaderName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        g.barangay.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.meetingVenue && g.meetingVenue.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMinistry = ministryFilter === 'all' || g.ministry === ministryFilter;
      const matchBarangay = barangayFilter === 'all' || g.barangay === barangayFilter;
      const matchStatus = statusFilter === 'all' || (g.status || 'Active') === statusFilter;

      return matchSearch && matchMinistry && matchBarangay && matchStatus;
    });
  }, [groups, searchQuery, ministryFilter, barangayFilter, statusFilter]);

  // Aggregate Stats
  const totalGroups = groups.length;
  const activeCount = groups.filter((g) => (g.status || 'Active') === 'Active').length;
  const totalBrethren = groups.reduce((acc, curr) => acc + (curr.membersCount || curr.members?.length || 0), 0);
  const coveredBarangays = new Set(groups.map((g) => g.barangay)).size;

  const ministryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: groups.length };
    MINISTRIES_DATA.forEach((m) => {
      counts[m.code] = groups.filter((g) => g.ministry === m.code).length;
    });
    return counts;
  }, [groups]);

  // Helpers for Ministry badge colors
  const getMinistryBadge = (ministry: MinistryType) => {
    switch (ministry) {
      case 'CFC':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'SFC':
        return 'bg-teal-100 text-teal-900 border-teal-200';
      case 'YFC':
        return 'bg-orange-100 text-orange-900 border-orange-200';
      case 'KFC':
        return 'bg-yellow-100 text-yellow-900 border-yellow-200';
      case 'HOLD':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'SOLD':
        return 'bg-slate-200 text-slate-900 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (status?: 'Active' | 'On-Break' | 'Inactive') => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        );
      case 'On-Break':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            On-Break
          </span>
        );
      case 'Inactive':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#243c81] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-blue-400/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#243c81] via-[#1a2c60] to-slate-900 text-white shadow-xl border border-blue-900/40">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-2 border border-white/15">
            <Layers className="w-3.5 h-3.5" />
            <span>Pastoral Structure &amp; Circles</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Group &amp; Household Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-200 max-w-xl">
            Oversee pastoral cell households across all 6 ministries in Tuy and CLP discussion circles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => exportGroupsToCSV(filteredGroups)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all border border-white/20 shadow-xs"
            title="Download CSV report of current filtered groups"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#243c81] font-black text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Group</span>
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Groups
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#243c81]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 block">
            {totalGroups}
          </span>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            {activeCount} Active Units
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Brethren
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 block">
            {totalBrethren}
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            Across Tuy Households
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tuy Barangays
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 block">
            {coveredBarangays} / 22
          </span>
          <span className="text-[11px] text-purple-600 font-bold mt-1 block">
            Geographic Coverage
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              CLP Circles
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <BookOpenCheck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 block">
            {clpGroupings.length}
          </span>
          <span className="text-[11px] text-amber-700 font-bold mt-1 block">
            Saved CLP Groupings
          </span>
        </div>
      </div>

      {/* Main Tab Toggle: Pastoral Households vs. CLP Discussion Circles */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveMainTab('households')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeMainTab === 'households'
              ? 'bg-white text-[#243c81] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Pastoral Households ({groups.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('clp_circles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeMainTab === 'clp_circles'
              ? 'bg-white text-[#243c81] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpenCheck className="w-4 h-4" />
          <span>CLP Discussion Circles ({clpGroupings.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: PASTORAL HOUSEHOLDS & CELL GROUPS                      */}
      {/* ------------------------------------------------------------- */}
      {activeMainTab === 'households' && (
        <div className="space-y-5">
          {/* Ministry Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setMinistryFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shrink-0 ${
                ministryFilter === 'all'
                  ? 'bg-[#243c81] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Ministries ({ministryCounts.all || 0})
            </button>
            {MINISTRIES_DATA.map((m) => {
              const count = ministryCounts[m.code] || 0;
              return (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => setMinistryFilter(m.code)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shrink-0 ${
                    ministryFilter === m.code
                      ? 'bg-[#243c81] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {m.code} ({count})
                </button>
              );
            })}
          </div>

          {/* Search, Filter Bar & View Toggle */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search group name, leader, co-leader, barangay..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#243c81]/30 focus:border-[#243c81]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Barangay Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={barangayFilter}
                  onChange={(e) => setBarangayFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Barangays</option>
                  {TUY_BARANGAYS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On-Break">On-Break</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#243c81] shadow-xs'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-[#243c81] shadow-xs'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Table List View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Groups Rendering */}
          {loading ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-[#243c81] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-600">Loading Tuy pastoral groups...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#243c81] flex items-center justify-center mx-auto border border-blue-100">
                <Layers className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-black text-slate-900">No matching groups found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {searchQuery || ministryFilter !== 'all' || barangayFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your search query or filter options above.'
                    : 'Start organizing your chapter by creating the first pastoral household group.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Group Now</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGroups.map((g) => (
                <div
                  key={g.id}
                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-[#243c81]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Header: Ministry & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${getMinistryBadge(
                          g.ministry
                        )}`}
                      >
                        {g.ministry} Ministry
                      </span>
                      {getStatusBadge(g.status)}
                    </div>

                    {/* Group Title & Barangay */}
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-[#243c81] transition-colors leading-snug">
                        {g.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Brgy. {g.barangay}</span>
                        {g.meetingVenue && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="truncate max-w-[140px] text-slate-600">{g.meetingVenue}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Leaders Section */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Household Head / Leader
                        </span>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="font-bold text-slate-900 truncate">{g.leaderName}</span>
                          {g.leaderContact && (
                            <a
                              href={`tel:${g.leaderContact}`}
                              className="text-[11px] font-mono text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0"
                            >
                              <Phone className="w-3 h-3" />
                              {g.leaderContact}
                            </a>
                          )}
                        </div>
                      </div>

                      {g.coLeaderName && (
                        <div className="pt-2 border-t border-slate-200/60">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            Assistant / Co-Leader
                          </span>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <span className="font-semibold text-slate-800 truncate">{g.coLeaderName}</span>
                            {g.coLeaderContact && (
                              <span className="text-[11px] font-mono text-slate-500">{g.coLeaderContact}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Schedule & Notes */}
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate font-medium">{g.meetingSchedule || 'Regular Household Gathering'}</span>
                      </div>

                      {g.unitLeaderName && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>Unit Servant: <strong className="text-slate-700">{g.unitLeaderName}</strong></span>
                        </div>
                      )}

                      {g.notes && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-2 pt-1 border-t border-slate-100">
                          &quot;{g.notes}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveRosterGroup(g)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-[#243c81] text-xs font-bold border border-slate-200 shadow-2xs transition-all"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        Roster ({g.members?.length ?? g.membersCount ?? 0})
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(g)}
                        className="p-2 rounded-xl text-slate-600 hover:text-[#243c81] hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                        title="Edit Group"
                        aria-label={`Edit ${g.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setGroupToDelete(g)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-rose-100 transition-all"
                        title="Delete Group"
                        aria-label={`Delete ${g.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm min-w-[850px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-700 text-xs uppercase font-extrabold bg-slate-50">
                      <th className="py-3.5 px-4">Group Name</th>
                      <th className="py-3.5 px-3">Ministry</th>
                      <th className="py-3.5 px-3">Barangay</th>
                      <th className="py-3.5 px-4">Head / Leader</th>
                      <th className="py-3.5 px-3">Schedule</th>
                      <th className="py-3.5 px-3 text-center">Brethren</th>
                      <th className="py-3.5 px-3">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGroups.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block leading-tight">{g.name}</span>
                          {g.meetingVenue && (
                            <span className="text-[11px] text-slate-500 block truncate max-w-xs">{g.meetingVenue}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${getMinistryBadge(g.ministry)}`}>
                            {g.ministry}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-slate-700">{g.barangay}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{g.leaderName}</span>
                          {g.leaderContact && (
                            <span className="text-[11px] font-mono text-slate-500">{g.leaderContact}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 text-xs">{g.meetingSchedule || '—'}</td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setActiveRosterGroup(g)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#243c81] hover:bg-blue-100 transition-colors"
                          >
                            <Users className="w-3 h-3" />
                            <span>{g.members?.length ?? g.membersCount ?? 0}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-3">{getStatusBadge(g.status)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(g)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-[#243c81] hover:bg-slate-100"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setGroupToDelete(g)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: CLP DISCUSSION CIRCLES (SYNCED FROM CLP SERVICE)        */}
      {/* ------------------------------------------------------------- */}
      {activeMainTab === 'clp_circles' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-amber-700" />
                <h3 className="font-black text-sm">Christian Life Program Discussion Circles</h3>
              </div>
              <p className="text-xs text-amber-800">
                During Christian Life Program sessions, invited couples are grouped into discussion circles to discuss reflection questions.
              </p>
            </div>
            <Link
              href="/admin/clp"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#243c81] font-black text-xs shadow-xs transition-all self-start sm:self-auto shrink-0"
            >
              <span>Manage CLP Batches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {clpGroupings.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
                <BookOpenCheck className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-black text-slate-900">No CLP discussion groupings saved yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You can generate intelligent discussion circles for couples attending CLP talks using the CLP Manager.
                </p>
              </div>
              <Link
                href="/admin/clp"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
              >
                <BookOpenCheck className="w-4 h-4" />
                <span>Go to CLP Program &amp; AI Groupings</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {clpGroupings.map((grouping) => (
                <div
                  key={grouping.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                          {grouping.filterType === 'talk' ? 'Talk Grouping' : 'Full Batch Grouping'}
                        </span>
                        {grouping.talkTitle && (
                          <span className="text-xs font-bold text-slate-700">
                            • {grouping.talkTitle}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-1">
                        {grouping.title}
                      </h3>
                      {grouping.summary && (
                        <p className="text-xs text-slate-500 mt-0.5">{grouping.summary}</p>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 font-medium">
                      Created: {new Date(grouping.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Circles in this grouping */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grouping.groups.map((circle) => (
                      <div
                        key={circle.groupNumber}
                        className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#243c81]">
                            {circle.groupName}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            {circle.couples.length} Couple{circle.couples.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        {circle.facilitator && (
                          <div className="text-[11px] text-slate-600">
                            Facilitator: <strong className="text-slate-800">{circle.facilitator}</strong>
                          </div>
                        )}

                        <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                          {circle.couples.map((c) => (
                            <div
                              key={c.id}
                              className="text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-100 flex items-center justify-between"
                            >
                              <span className="font-semibold truncate">{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium ml-2">
                                {c.barangay}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT HOUSEHOLD GROUP                          */}
      {/* ------------------------------------------------------------- */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-xs px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-[#243c81]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    {editingGroup ? 'Edit Household Group' : 'Create New Household Group'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define leadership, schedule, and barangay location in Tuy.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveGroup} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Group Name & Ministry */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Group / Household Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Household 3 - St. Raphael"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#243c81]/30 focus:border-[#243c81]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Ministry <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formMinistry}
                    onChange={(e) => setFormMinistry(e.target.value as MinistryType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#243c81]/30 focus:border-[#243c81]"
                  >
                    <option value="CFC">CFC (Couples for Christ)</option>
                    <option value="SFC">SFC (Singles for Christ)</option>
                    <option value="YFC">YFC (Youth for Christ)</option>
                    <option value="KFC">KFC (Kids for Christ)</option>
                    <option value="HOLD">HOLD (Handmaids of the Lord)</option>
                    <option value="SOLD">SOLD (Servants of the Lord)</option>
                  </select>
                </div>
              </div>

              {/* Barangay & Meeting Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Barangay in Tuy <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formBarangay}
                    onChange={(e) => setFormBarangay(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#243c81]/30 focus:border-[#243c81]"
                  >
                    {TUY_BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Meeting Venue / Location
                  </label>
                  <input
                    type="text"
                    value={formMeetingVenue}
                    onChange={(e) => setFormMeetingVenue(e.target.value)}
                    placeholder="e.g. Leader's Residence / Parish Hall"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#243c81]/30 focus:border-[#243c81]"
                  />
                </div>
              </div>

              {/* Household Head / Leader */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Household Head / Leader <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formLeaderName}
                    onChange={(e) => setFormLeaderName(e.target.value)}
                    placeholder="e.g. Bro. Mark & Sis. Grace Camilon"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#243c81]/30 focus:border-[#243c81]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Leader Contact Number
                  </label>
                  <input
                    type="text"
                    value={formLeaderContact}
                    onChange={(e) => setFormLeaderContact(e.target.value)}
                    placeholder="e.g. 0917-123-4567"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#243c81]/30 focus:border-[#243c81]"
                  />
                </div>
              </div>

              {/* Assistant / Co-Leader */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Assistant / Co-Leader
                  </label>
                  <input
                    type="text"
                    value={formCoLeaderName}
                    onChange={(e) => setFormCoLeaderName(e.target.value)}
                    placeholder="e.g. Bro. Ronald & Sis. Karen Bautista"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#243c81]/30 focus:border-[#243c81]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Co-Leader Contact Number
                  </label>
                  <input
                    type="text"
                    value={formCoLeaderContact}
                    onChange={(e) => setFormCoLeaderContact(e.target.value)}
                    placeholder="e.g. 0918-234-5678"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#243c81]/30 focus:border-[#243c81]"
                  />
                </div>
              </div>

              {/* Schedule, Day & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Meeting Schedule
                  </label>
                  <input
                    type="text"
                    value={formMeetingSchedule}
                    onChange={(e) => setFormMeetingSchedule(e.target.value)}
                    placeholder="e.g. Every 2nd & 4th Saturday • 7:30 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#243c81]/30 focus:border-[#243c81]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Active' | 'On-Break' | 'Inactive')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#243c81]/30 focus:border-[#243c81]"
                  >
                    <option value="Active">Active</option>
                    <option value="On-Break">On-Break</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Unit Leader & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Unit Servant / Overseer
                  </label>
                  <input
                    type="text"
                    value={formUnitLeaderName}
                    onChange={(e) => setFormUnitLeaderName(e.target.value)}
                    placeholder="e.g. Bro. Michael Hernandez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#243c81]/30 focus:border-[#243c81]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Pastoral Notes / Intentions
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Group focusing on scripture and outreach"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#243c81]/30 focus:border-[#243c81]"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {formSubmitting
                    ? 'Saving...'
                    : editingGroup
                    ? 'Update Group'
                    : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DRAWER / MODAL: GROUP ROSTER / MEMBERS MANAGEMENT             */}
      {/* ------------------------------------------------------------- */}
      {activeRosterGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Roster Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#243c81] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {activeRosterGroup.ministry} Household Roster
                </span>
                <h3 className="font-black text-slate-900 text-lg mt-1">
                  {activeRosterGroup.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Brgy. {activeRosterGroup.barangay} • Leader: {activeRosterGroup.leaderName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveRosterGroup(null);
                  setShowAddMemberForm(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Roster Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Members &amp; Brethren ({activeRosterGroup.members?.length || 0})
                </h4>

                <button
                  type="button"
                  onClick={() => setShowAddMemberForm(!showAddMemberForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#243c81] text-white text-xs font-bold hover:bg-[#1a2c60] transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{showAddMemberForm ? 'Hide Form' : 'Add Member'}</span>
                </button>
              </div>

              {/* Add Member Subform */}
              {showAddMemberForm && (
                <form
                  onSubmit={handleAddMember}
                  className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3 animate-in fade-in"
                >
                  <h5 className="font-bold text-xs text-[#243c81]">Add Brethren to this Household</h5>

                  {rosterError && (
                    <div className="text-xs text-rose-600 font-semibold">{rosterError}</div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                        Member Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="e.g. Bro. Joel De Castro"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#243c81]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                        Spouse Name (if couple)
                      </label>
                      <input
                        type="text"
                        value={newMemberSpouse}
                        onChange={(e) => setNewMemberSpouse(e.target.value)}
                        placeholder="e.g. Sis. Mary Ann De Castro"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#243c81]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                        Role
                      </label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as 'Leader' | 'Assistant' | 'Member')}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#243c81]"
                      >
                        <option value="Leader">Leader</option>
                        <option value="Assistant">Assistant / Co-Leader</option>
                        <option value="Member">Member</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        value={newMemberContact}
                        onChange={(e) => setNewMemberContact(e.target.value)}
                        placeholder="e.g. 0917-000-0000"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#243c81]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddMemberForm(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#243c81] text-white text-xs font-bold hover:bg-[#1a2c60]"
                    >
                      Save to Roster
                    </button>
                  </div>
                </form>
              )}

              {/* Members List */}
              {activeRosterGroup.members && activeRosterGroup.members.length > 0 ? (
                <div className="space-y-2">
                  {activeRosterGroup.members.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {m.name} {m.spouseName ? `& ${m.spouseName}` : ''}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-md text-[10px] font-extrabold ${
                              m.role === 'Leader'
                                ? 'bg-amber-100 text-amber-900'
                                : m.role === 'Assistant'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {m.role || 'Member'}
                          </span>
                        </div>
                        {m.contact && (
                          <div className="text-[11px] font-mono text-slate-500">{m.contact}</div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                        title="Remove member from this group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <Users className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">No individual members registered in roster yet.</p>
                  <p className="text-[11px] text-slate-400">
                    Click &quot;Add Member&quot; above to list brethren in this household unit.
                  </p>
                </div>
              )}
            </div>

            {/* Roster Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Total Brethren: <strong className="text-slate-800">{activeRosterGroup.members?.length || 0}</strong>
              </span>

              <button
                type="button"
                onClick={() => {
                  setActiveRosterGroup(null);
                  setShowAddMemberForm(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELETE GROUP CONFIRMATION                              */}
      {/* ------------------------------------------------------------- */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-lg">
                Delete Household Group?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <strong className="text-slate-800">&quot;{groupToDelete.name}&quot;</strong>? This action will remove the group and its roster entries.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
