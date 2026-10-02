import React from 'react';
import PrayerWallSection from '@/components/home/PrayerWallSection';
import { HeartHandshake, Shield, Sparkles } from 'lucide-react';

export default function PrayerWallPage() {
  return (
    <div className="py-8 sm:py-12 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Spiritual Solidarity & Intercession</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Couples For Christ Tuy Prayer Wall
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            As brothers and sisters in Christ, we bear each other&apos;s burdens. Post your intentions for health, marriage healing, exams, peace, or thanksgiving. Every week, all Tuy households pray collectively for these petitions.
          </p>
        </div>

        {/* Embedded Interactive Wall */}
        <div className="rounded-3xl overflow-hidden shadow-sm">
          <PrayerWallSection />
        </div>

      </div>
    </div>
  );
}
