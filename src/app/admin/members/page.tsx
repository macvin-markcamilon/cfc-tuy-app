'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchHouseholdGroups } from '@/lib/data/groups-service';
import { HouseholdGroup } from '@/types';
import { Users, Plus, Layers, MapPin, Phone, ArrowRight, ShieldCheck } from 'lucide-react';

export default function MembersAdminPage() {
  const [householdGroups, setHouseholdGroups] = useState<HouseholdGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      try {
        const data = await fetchHouseholdGroups();
        setHouseholdGroups(data);
      } catch (err) {
        console.error('Failed to load household groups:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGroups();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#243c81]">
            Pastoral Records
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Tuy Members &amp; Household Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Active brethren across all 6 family ministries in Tuy, Batangas.
          </p>
        </div>

        <Link
          href="/admin/groups"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-xs transition-all self-start sm:self-auto"
        >
          <Layers className="w-4 h-4 text-amber-300" />
          <span>Manage Groups &amp; Households</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
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

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-[#243c81] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium">Loading household units...</p>
          </div>
        ) : householdGroups.length > 0 ? (
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
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click &quot;Manage Groups &amp; Households&quot; above to create and configure your official households.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
