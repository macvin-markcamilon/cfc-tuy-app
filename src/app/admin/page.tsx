'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpenCheck,
  Users,
  Music,
  MapPin,
  Calendar,
  ArrowRight,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
} from 'lucide-react';
import {
  fetchCLPPrograms,
  fetchCLPCouples,
  fetchCLPTalks,
} from '@/lib/data/clp-service';
import { CLPProgram, CLPCouple, CLPTalk } from '@/types';

export default function AdminDashboardPage() {
  const [programs, setPrograms] = useState<CLPProgram[]>([]);
  const [couples, setCouples] = useState<CLPCouple[]>([]);
  const [talks, setTalks] = useState<CLPTalk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [progs, coupls, tlks] = await Promise.all([
          fetchCLPPrograms(),
          fetchCLPCouples(),
          fetchCLPTalks(),
        ]);
        setPrograms(progs);
        setCouples(coupls);
        setTalks(tlks);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeCLP = programs[0] || null;
  const activeCouples = activeCLP ? couples.filter((c) => c.clpId === activeCLP.id) : couples;
  const activeTalks = activeCLP ? talks.filter((t) => t.clpId === activeCLP.id) : talks;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#243c81] via-[#1a2c60] to-slate-900 text-white shadow-xl border border-blue-800/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-3 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tuy Chapter Leadership Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, Bro. Mark!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-200 max-w-xl">
            {activeCLP ? (
              <>
                Active CLP: <strong className="text-white font-bold">{activeCLP.name}</strong> is currently registered with {activeCouples.length} invited couples.
              </>
            ) : (
              'All sample data has been cleared. Ready to add and manage your production CLP batches.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/clp"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#243c81] font-black text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <BookOpenCheck className="w-4 h-4" />
            <span>{activeCLP ? 'Open CLP Manager' : 'Create New CLP Batch'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards - High Contrast Crisp White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Invited CLP Couples
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#243c81] border border-blue-200">
              <BookOpenCheck className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-black text-slate-900 mt-2 block">
            {couples.length} Couples
          </span>
          <span className="text-xs text-emerald-700 font-bold mt-1 block">
            {programs.length} Active CLP Batch{programs.length === 1 ? '' : 'es'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              CLP Talks Prepared
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-black text-slate-900 mt-2 block">
            {talks.length} Talks
          </span>
          <span className="text-xs text-blue-700 font-bold mt-1 block">
            Curriculum Schedulers
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Tuy Barangays
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-black text-slate-900 mt-2 block">
            22 Barangays
          </span>
          <span className="text-xs text-slate-600 font-semibold mt-1 block">
            Tuy, Batangas Jurisdiction
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Family Ministries
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-black text-slate-900 mt-2 block">
            6 Ministries
          </span>
          <span className="text-xs text-purple-700 font-bold mt-1 block">
            CFC, SFC, YFC, KFC, HOLD, SOLD
          </span>
        </div>
      </div>

      {/* CLP Current Cycle Overview Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        {activeCLP ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#243c81]">
                  Active Christian Life Program
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {activeCLP.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                  Venue: <strong>{activeCLP.venue}</strong> • Timeline: {activeCLP.startDate} to {activeCLP.endDate}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <Link
                  href="/admin/clp?fullReport=true"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Total Invitee Full Report &amp; PDF</span>
                </Link>

                <Link
                  href="/admin/clp"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-[#243c81] border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-all"
                >
                  <span>Manage Couples &amp; Attendance</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Quick Couple Preview */}
            {activeCouples.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {activeCouples.slice(0, 3).map((couple) => (
                  <div
                    key={couple.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {couple.status}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600">
                        Brgy. {couple.barangay}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Bro. {couple.husbandFirstName} &amp; Sis. {couple.wifeFirstName} {couple.husbandLastName}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                      {couple.address}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                No invited couples registered yet in this CLP batch. Click &quot;Manage Couples &amp; Attendance&quot; to register couples.
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10 space-y-3">
            <BookOpenCheck className="w-10 h-10 text-[#243c81] mx-auto" />
            <h3 className="text-lg font-black text-slate-900">No CLP Batch Active</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Start by creating your Christian Life Program batch. You will then be able to register invitees and track session attendance.
            </p>
            <div className="pt-2">
              <Link
                href="/admin/clp"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white text-xs font-bold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Production CLP Batch</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
