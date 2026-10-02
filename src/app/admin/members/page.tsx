import React from 'react';
import { HOUSEHOLD_GROUPS } from '@/lib/data/mock-data';
import { Users, Plus, Search, MapPin, Phone, ShieldCheck } from 'lucide-react';

export default function MembersAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Pastoral Records
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Tuy Members & Household Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active brethren across all 6 family ministries in Tuy, Batangas.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Member / Household</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
          Household Units in Tuy ({HOUSEHOLD_GROUPS.length} Units)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs uppercase font-bold">
                <th className="py-3 px-3">Unit / Household Name</th>
                <th className="py-3 px-3">Ministry</th>
                <th className="py-3 px-3">Barangay</th>
                <th className="py-3 px-3">Leader Servant</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Schedule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {HOUSEHOLD_GROUPS.map((hh) => (
                <tr key={hh.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{hh.name}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      {hh.ministry}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{hh.barangay}</td>
                  <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">{hh.leaderName}</td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-xs">{hh.leaderContact || '—'}</td>
                  <td className="py-3 px-3 text-slate-500">{hh.meetingDay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
