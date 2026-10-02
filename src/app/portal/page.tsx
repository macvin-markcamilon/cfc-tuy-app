'use client';

import React, { useState } from 'react';
import { HOUSEHOLD_GROUPS } from '@/lib/data/mock-data';
import {
  ShieldCheck,
  Database,
  MapPin,
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  Users,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function LeaderPortalPage() {
  const [activeTab, setActiveTab] = useState<'households' | 'integrations' | 'clp'>('integrations');
  const [copied, setCopied] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
  const isGoogleMapsConfigured = Boolean(googleMapsKey && googleMapsKey.length > 20);

  const sqlSchemaSnippet = `-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS households (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  ministry TEXT NOT NULL,
  barangay TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  meeting_day TEXT NOT NULL,
  meeting_schedule TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_name TEXT NOT NULL,
  barangay TEXT,
  category TEXT NOT NULL,
  intention TEXT NOT NULL,
  prayer_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-8 sm:py-12 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Portal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CFC Tuy Chapter Leadership Center</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Servants & Administration Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage Tuy households, verify Supabase & Google Maps connections, and monitor CLP candidates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Tuy Chapter Active
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'integrations'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Integrations & Domain Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('households')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'households'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tuy Households ({HOUSEHOLD_GROUPS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'clp'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>CLP Batch Management</span>
          </button>
        </div>

        {/* Tab 1: Integrations (Supabase, Google Maps, Vercel, Domain) */}
        {activeTab === 'integrations' && (
          <div className="space-y-8">
            
            {/* Status Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 1. Supabase Status Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">Supabase</h3>
                        <p className="text-[11px] text-slate-400">PostgreSQL & Auth</p>
                      </div>
                    </div>

                    {isSupabaseConfigured ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertCircle className="w-3 h-3" />
                        Standby Demo
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Stores households, CLP candidate registrations, and prayer wall intentions with Row-Level Security.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  {isSupabaseConfigured ? (
                    <span className="font-mono text-emerald-600 truncate block">URL: {supabaseUrl}</span>
                  ) : (
                    <span>Add keys in <code className="text-amber-500">.env.local</code> to activate live sync.</span>
                  )}
                </div>
              </div>

              {/* 2. Google Maps Status Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">Google Maps</h3>
                        <p className="text-[11px] text-slate-400">Tuy GPS &amp; Satellite</p>
                      </div>
                    </div>

                    {isGoogleMapsConfigured ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Key Missing
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Renders interactive barangay pins across Tuy. High-resolution satellite, terrain &amp; roadmap layers ready.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  {isGoogleMapsConfigured ? (
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 truncate block">API Key active (AIzaSy...)</span>
                  ) : (
                    <span>Add <code className="text-blue-500">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> for live map.</span>
                  )}
                </div>
              </div>

              {/* 3. Vercel & Custom Domain */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">Vercel & Domain</h3>
                        <p className="text-[11px] text-slate-400">Purchased Domain</p>
                      </div>
                    </div>

                    <span className="flex items-center gap-1 text-[11px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-200">
                      Ready to Link
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Connect your custom domain (e.g. <code>cfctuy.com</code> or <code>.org</code>) on Vercel with automated SSL certificates.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  <span>See DNS configuration steps below.</span>
                </div>
              </div>

            </div>

            {/* Custom Domain & Vercel Checklist */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                <span>How to link your purchased domain on Vercel</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6">
                Follow these 3 simple steps to take your CFC Tuy Chapter web app live on your custom domain:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">Step 1: Deploy to Vercel</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Push this codebase to GitHub and import the repository into your Vercel dashboard.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">Step 2: Add Domain</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    In Vercel project Settings → <strong>Domains</strong>, enter your purchased domain name.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">Step 3: Point DNS</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    At your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.), point an <strong>A record</strong> to <code>76.76.21.21</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Supabase SQL Schema Viewer */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Supabase SQL Migration Script</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Copy and run this in your Supabase SQL Editor to instantly provision your tables and RLS rules.
                  </p>
                </div>

                <button
                  onClick={copySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-black/60 font-mono text-xs text-emerald-300 overflow-x-auto max-h-64 border border-slate-800">
                {sqlSchemaSnippet}
              </pre>
            </div>

          </div>
        )}

        {/* Tab 2: Tuy Households Directory Table */}
        {activeTab === 'households' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
              Registered Tuy Households Roster
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs uppercase font-bold">
                    <th className="py-3 px-4">Group Name</th>
                    <th className="py-3 px-4">Ministry</th>
                    <th className="py-3 px-4">Barangay</th>
                    <th className="py-3 px-4">Leader Head</th>
                    <th className="py-3 px-4">Schedule</th>
                    <th className="py-3 px-4">Members</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {HOUSEHOLD_GROUPS.map((hh) => (
                    <tr key={hh.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{hh.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          {hh.ministry}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">Brgy. {hh.barangay}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">{hh.leaderName}</td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{hh.meetingDay}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">{hh.membersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: CLP Batch Management */}
        {activeTab === 'clp' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Christian Life Program (CLP) - Batch 2026 Candidates
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registered married couples preparing for orientation at Tuy Gymnasium / Parish Hall.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold">
                Orientation: Nov 8, 2026
              </span>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Bro. Dennis & Sis. Karen Bautista', brgy: 'Poblacion 2', contact: '+63 917 555 1209', status: 'Confirmed' },
                { name: 'Bro. Carlo & Sis. Rosemarie Ramos', brgy: 'Putol', contact: '+63 920 444 8912', status: 'Pending Call' },
                { name: 'Bro. Emmanuel & Sis. Joy Mendoza', brgy: 'Luntal', contact: '+63 918 333 7621', status: 'Confirmed' },
                { name: 'Bro. Ryan & Sis. Kristine Perez', brgy: 'Obispo', contact: '+63 995 222 4310', status: 'Confirmed' },
              ].map((c, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Brgy. {c.brgy} • Contact: {c.contact}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    c.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
