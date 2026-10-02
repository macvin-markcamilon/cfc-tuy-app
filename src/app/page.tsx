import React from 'react';
import Hero from '@/components/home/Hero';
import QuickStats from '@/components/home/QuickStats';
import TuyMapboxMap from '@/components/map/TuyMapboxMap';
import MinistriesGrid from '@/components/home/MinistriesGrid';
import EventsPreview from '@/components/home/EventsPreview';
import CLPCallout from '@/components/home/CLPCallout';
import PrayerWallSection from '@/components/home/PrayerWallSection';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <Hero />

      {/* Quick Community Stats */}
      <QuickStats />

      {/* Interactive Mapbox Tuy Chapter Map Section */}
      <section className="py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Interactive Mapbox Explorer</span>
            </div>
            <h2 className="mt-1 text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Tuy Barangay Households & Meeting Venues
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Locate active CFC households, cell groups, and parish gathering centers across Tuy, Batangas.
            </p>
          </div>

          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <span>Open Fullscreen Map View</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* The Map Component */}
        <TuyMapboxMap height="h-[500px] sm:h-[600px]" showFilters={true} />
      </section>

      {/* Ministries Overview */}
      <MinistriesGrid />

      {/* Upcoming Events */}
      <EventsPreview />

      {/* Christian Life Program (CLP) Banner */}
      <CLPCallout />

      {/* Prayer Request Wall */}
      <PrayerWallSection />
    </div>
  );
}
