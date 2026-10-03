'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Lock,
  Check,
  Save,
  AlertCircle,
  Building,
  Calendar,
  Sparkles,
  KeyRound,
  HeartHandshake,
} from 'lucide-react';
import { UserProfile, UserRole, MinistryType } from '@/types';
import {
  getCurrentUserProfile,
  updateCurrentUserProfile,
  updateUserPassword,
} from '@/lib/data/user-service';
import { TUY_BARANGAYS } from '@/lib/data/mock-data';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [barangay, setBarangay] = useState('Poblacion 1');
  const [ministry, setMinistry] = useState<MinistryType>('CFC');
  const [clpBatch, setClpBatch] = useState('Batch 28');

  // Password Fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Feedback State
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getCurrentUserProfile();
      setProfile(data);
      setFullName(data.fullName);
      setSpouseName(data.spouseName || '');
      setEmail(data.email);
      setPhoneNumber(data.phoneNumber || '');
      setBarangay(data.barangay || 'Poblacion 1');
      setMinistry(data.ministry || 'CFC');
      setClpBatch(data.clpBatch || 'Batch 28');
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    setSavingProfile(true);

    try {
      const updated = await updateCurrentUserProfile({
        fullName: fullName.trim(),
        spouseName: spouseName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        barangay,
        ministry,
        clpBatch: clpBatch.trim() || undefined,
      });

      setProfile(updated);
      setProfileSuccess('Your profile details have been saved successfully.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please verify.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await updateUserPassword(newPassword);
      if (res.success) {
        setPasswordSuccess('Your password has been updated securely.');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 4000);
      } else {
        setPasswordError(res.message);
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
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

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-br from-[#243c81] via-[#1a2c60] to-[#101c42] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-3xl bg-amber-400 text-[#243c81] flex items-center justify-center font-black text-2xl shadow-xl ring-4 ring-white/20 shrink-0">
            {profile ? getInitials(profile.fullName) : 'MC'}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black">{profile?.fullName}</h1>
              {profile?.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Main Chapter Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-white/20 text-white border border-white/30">
                  {profile?.role.replace('_', ' ')}
                </span>
              )}
            </div>

            {profile?.spouseName && (
              <p className="text-sm text-blue-200 flex items-center justify-center sm:justify-start gap-1.5">
                <HeartHandshake className="w-4 h-4 text-rose-300" />
                <span>Spouse: {profile.spouseName}</span>
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-blue-200/80 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-300" />
                {profile?.email}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-300" />
                Tuy, Batangas ({profile?.barangay})
              </span>
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-blue-300" />
                {profile?.ministry} Ministry
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Edit Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#243c81] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Personal Information</h2>
                <p className="text-xs text-slate-500">Update your contact information and chapter roles</p>
              </div>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Spouse Name
                  </label>
                  <input
                    type="text"
                    value={spouseName}
                    onChange={(e) => setSpouseName(e.target.value)}
                    placeholder="Sis. Grace Camilon"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                    title="Email is your primary login identifier"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Managed via chapter administration</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / Contact Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0917-123-4567"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Home Barangay
                  </label>
                  <select
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] bg-white text-slate-900"
                  >
                    {TUY_BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ministry
                  </label>
                  <select
                    value={ministry}
                    onChange={(e) => setMinistry(e.target.value as MinistryType)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] bg-white text-slate-900"
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
                    value={clpBatch}
                    onChange={(e) => setClpBatch(e.target.value)}
                    placeholder="Batch 28"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81] bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Security & Account Info */}
        <div className="space-y-6">
          {/* Security & Password */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Change Password</h3>
                <p className="text-[11px] text-slate-500">Update your login security credentials</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-3.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#243c81]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                {passwordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Chapter Metadata Card */}
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 text-xs space-y-2.5">
            <p className="font-black text-slate-800 uppercase tracking-wider text-[10px]">
              Chapter Information
            </p>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Chapter:</span>
                <span className="font-bold text-slate-900">Tuy, Batangas</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Parish:</span>
                <span className="font-bold text-slate-900">St. Vincent Ferrer</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Province:</span>
                <span className="font-bold text-slate-900">Batangas (Area 4)</span>
              </div>
              <div className="flex justify-between py-1">
                <span>System Role:</span>
                <span className="font-bold text-emerald-700 capitalize">
                  {profile?.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
