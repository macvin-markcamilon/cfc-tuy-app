'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Filter,
  Trash2,
  Edit2,
  X,
  Check,
  Mail,
  Phone,
  MapPin,
  Lock,
  Sparkles,
  AlertCircle,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { UserProfile, UserRole, MinistryType } from '@/types';
import { fetchUsers, saveUser, deleteUser } from '@/lib/data/user-service';
import { TUY_BARANGAYS } from '@/lib/data/mock-data';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [ministryFilter, setMinistryFilter] = useState<string>('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formFullName, setFormFullName] = useState('');
  const [formSpouseName, setFormSpouseName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBarangay, setFormBarangay] = useState('Poblacion 1');
  const [formMinistry, setFormMinistry] = useState<MinistryType>('CFC');
  const [formRole, setFormRole] = useState<UserRole>('household_head');
  const [formClpBatch, setFormClpBatch] = useState('Batch 31');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormFullName('');
    setFormSpouseName('');
    setFormEmail('');
    setFormPassword('');
    setFormPhone('');
    setFormBarangay('Poblacion 1');
    setFormMinistry('CFC');
    setFormRole('household_head');
    setFormClpBatch('Batch 31');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setFormFullName(u.fullName);
    setFormSpouseName(u.spouseName || '');
    setFormEmail(u.email);
    setFormPassword(''); // leave blank if unchanged
    setFormPhone(u.phoneNumber || '');
    setFormBarangay(u.barangay || 'Poblacion 1');
    setFormMinistry(u.ministry || 'CFC');
    setFormRole(u.role || 'member');
    setFormClpBatch(u.clpBatch || '');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim()) {
      setFormError('Please enter full name.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!editingUser && (!formPassword || formPassword.length < 6)) {
      setFormError('Temporary password must be at least 6 characters.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const saved = await saveUser({
        id: editingUser?.id,
        fullName: formFullName.trim(),
        spouseName: formSpouseName.trim() || undefined,
        email: formEmail.trim().toLowerCase(),
        phoneNumber: formPhone.trim() || undefined,
        barangay: formBarangay,
        ministry: formMinistry,
        role: formRole,
        clpBatch: formClpBatch.trim() || undefined,
        password: formPassword ? formPassword.trim() : undefined,
      });

      setShowAddModal(false);
      showToast(
        editingUser
          ? `✓ User "${saved.fullName}" updated successfully!`
          : `✓ New user "${saved.fullName}" added successfully!`
      );
      loadUsers();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save user.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (u.email === 'markcamilon@gmail.com') {
      alert('The primary chapter administrator account cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to remove user "${u.fullName}" (${u.email})?`)) {
      try {
        await deleteUser(u.id);
        showToast(`User "${u.fullName}" removed.`);
        loadUsers();
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.spouseName && u.spouseName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.barangay.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchMinistry = ministryFilter === 'all' || u.ministry === ministryFilter;

      return matchSearch && matchRole && matchMinistry;
    });
  }, [users, searchQuery, roleFilter, ministryFilter]);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            Admin
          </span>
        );
      case 'chapter_servant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
            Chapter Servant
          </span>
        );
      case 'unit_leader':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
            Unit Leader
          </span>
        );
      case 'household_head':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            Household Head
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            Member
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .replace(/^(Bro\.|Sis\.)\s*/i, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#243c81] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-300 font-bold text-sm">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#243c81] to-[#182859] p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-white/10">
              Access & Leadership
            </span>
            <span className="text-white/60 text-xs">CFC Tuy Chapter</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">User Management</h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
            Authorize and manage chapter servants, household heads, unit leaders, and administrative accounts for Couples for Christ Tuy.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#243c81] font-black text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Users</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Admins</p>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {users.filter((u) => u.role === 'admin').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Chapter / Unit</p>
          <p className="text-2xl font-black text-purple-700 mt-1">
            {users.filter((u) => u.role === 'chapter_servant' || u.role === 'unit_leader').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Household Heads</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {users.filter((u) => u.role === 'household_head').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, barangay..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="chapter_servant">Chapter Servant</option>
            <option value="unit_leader">Unit Leader</option>
            <option value="household_head">Household Head</option>
            <option value="member">Member</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 ml-1">
            <span>Ministry:</span>
          </div>
          <select
            value={ministryFilter}
            onChange={(e) => setMinistryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
          >
            <option value="all">All Ministries</option>
            <option value="CFC">CFC</option>
            <option value="SFC">SFC</option>
            <option value="YFC">YFC</option>
            <option value="KFC">KFC</option>
            <option value="HOLD">HOLD</option>
            <option value="SOLD">SOLD</option>
          </select>
        </div>
      </div>

      {/* Users List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading chapter users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No users found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((u) => {
              const initials = getInitials(u.fullName);
              const isAdmin = u.role === 'admin';

              return (
                <div
                  key={u.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* User Avatar */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        isAdmin
                          ? 'bg-amber-400 text-[#243c81] ring-2 ring-amber-300'
                          : 'bg-[#243c81] text-white'
                      }`}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm sm:text-base text-slate-900">
                          {u.fullName}
                        </span>
                        {u.spouseName && (
                          <span className="text-xs text-slate-500 font-medium">
                            & {u.spouseName}
                          </span>
                        )}
                        {getRoleBadge(u.role)}
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                          {u.ministry}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {u.email}
                        </span>
                        {u.phoneNumber && (
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {u.phoneNumber}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          Brgy. {u.barangay}
                        </span>
                        {u.clpBatch && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            • {u.clpBatch}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="p-2 rounded-xl text-slate-600 hover:text-[#243c81] hover:bg-blue-50 transition-colors border border-slate-200"
                      title="Edit User"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {u.email !== 'markcamilon@gmail.com' && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-slate-200"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#243c81] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingUser ? 'Edit User Profile' : 'Add New User'}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    {editingUser
                      ? `Updating account details for ${editingUser.fullName}`
                      : 'Provide login and leadership credentials for Tuy Chapter'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-5 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bro. Ronald Bautista"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Spouse Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sis. Karen Bautista"
                    value={formSpouseName}
                    onChange={(e) => setFormSpouseName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@cfctuy.org"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {editingUser ? 'New Password (leave empty to keep)' : 'Temporary Password *'}
                  </label>
                  <input
                    type="password"
                    placeholder={editingUser ? '••••••••' : 'Min. 6 characters'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0917-123-4567"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Barangay (Tuy) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formBarangay}
                    onChange={(e) => setFormBarangay(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] bg-white text-slate-900"
                  >
                    {TUY_BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ministry Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] bg-white text-slate-900 font-semibold"
                  >
                    <option value="admin">Admin</option>
                    <option value="chapter_servant">Chapter Servant</option>
                    <option value="unit_leader">Unit Leader</option>
                    <option value="household_head">Household Head</option>
                    <option value="member">Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Family Ministry <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formMinistry}
                    onChange={(e) => setFormMinistry(e.target.value as MinistryType)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] bg-white text-slate-900"
                  >
                    <option value="CFC">CFC (Couples)</option>
                    <option value="SFC">SFC (Singles)</option>
                    <option value="YFC">YFC (Youth)</option>
                    <option value="KFC">KFC (Kids)</option>
                    <option value="HOLD">HOLD (Handmaids)</option>
                    <option value="SOLD">SOLD (Servants)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CLP Batch
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Batch 31"
                    value={formClpBatch}
                    onChange={(e) => setFormClpBatch(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {formSubmitting
                    ? 'Saving...'
                    : editingUser
                    ? 'Save Changes'
                    : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
