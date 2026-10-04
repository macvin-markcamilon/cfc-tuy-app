'use client';

import React, { useState } from 'react';
import TuyGoogleMap from '@/components/map/TuyGoogleMap';
import { HOUSEHOLD_GROUPS, TUY_BARANGAYS } from '@/lib/data/mock-data';
import { MapPin, Search, Calendar, Phone, Users, Compass, ExternalLink } from 'lucide-react';
import { MinistryType } from '@/types';

export default function MapPage() {
  const [selectedBarangay, setSelectedBarangay] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMinistry, setActiveMinistry] = useState<MinistryType | 'ALL'>('ALL');

  const filteredHouseholds = HOUSEHOLD_GROUPS.filter((hh) => {
    const matchesBarangay = selectedBarangay === 'ALL' || hh.barangay.toLowerCase().includes(selectedBarangay.toLowerCase());
    const matchesMinistry = activeMinistry === 'ALL' || hh.ministry === activeMinistry;
    const matchesSearch =
      hh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hh.leaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hh.barangay.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesBarangay && matchesMinistry && matchesSearch;
  });

  return (
    <div className="py-8 sm:py-12 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#243c81] text-xs font-bold mb-3">
            <Compass className="w-3.5 h-3.5 text-[#243c81]" />
            <span>Tuy Chapter Geographic Directory</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Tuy Barangay Households Map
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Find your nearest Couples for Christ household or cell group in Tuy, Batangas. Connect with local leaders and join in regular prayer, worship, and sisterly/brotherly fellowship.
          </p>
        </div>

        {/* The Google Maps Container */}
        <div className="mb-12">
          <TuyGoogleMap height="h-[480px] sm:h-[620px]" showFilters={true} initialMinistry={activeMinistry} />
        </div>

        {/* Directory & Search Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Household Directory ({filteredHouseholds.length} Groups)
              </h2>
              <p className="text-xs text-slate-500">
                Filter by barangay or search by leader name
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search leader or group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Barangay Dropdown */}
              <select
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Tuy Barangays</option>
                {TUY_BARANGAYS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Households Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHouseholds.map((hh) => (
              <div
                key={hh.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#243c81]/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#243c81] border border-blue-200">
                      {hh.ministry}
                    </span>
                    <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Brgy. {hh.barangay}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">
                    {hh.name}
                  </h3>

                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <Users className="w-3.5 h-3.5 text-[#243c81] shrink-0 mt-0.5" />
                      <span>
                        Leader: <strong className="text-slate-900">{hh.leaderName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{hh.meetingSchedule} ({hh.meetingDay})</span>
                    </div>

                    {hh.leaderContact && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{hh.leaderContact}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {hh.membersCount} member couples/brethren
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${hh.coordinates ? `${hh.coordinates[1]},${hh.coordinates[0]}` : '14.0228,120.7289'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#243c81] hover:text-[#1a2d63] transition-colors"
                  >
                    <span>Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filteredHouseholds.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">
              No households match your current search in Tuy. Try selecting &quot;All Tuy Barangays&quot;.
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
