'use client';

import React from 'react';
import { HOUSEHOLD_GROUPS } from '@/lib/data/mock-data';
import { Users, Plus, Search, MapPin, Phone, ShieldCheck } from 'lucide-react';

export default function MembersAdminPage() {
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

        <button
          type="button"
          onClick={() => alert('Household management feature ready for production data entry.')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#243c81] hover:bg-[#1a2c60] text-white font-bold text-xs sm:text-sm shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Member / Household</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
        <h3 className="font-black text-base text-slate-900 mb-4">
          Household Units in Tuy ({HOUSEHOLD_GROUPS.length} Units)
        </h3>

        {HOUSEHOLD_GROUPS.length > 0 ? (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {HOUSEHOLD_GROUPS.map((hh) => (
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
                    <td className="py-3.5 px-3 text-slate-600">{hh.meetingDay}</td>
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
              Sample data has been removed. Click &quot;Add Member / Household&quot; above to register your official households.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
