import React from 'react';
import Hero from '@/components/home/Hero';
import SongsCarousel from '@/components/home/SongsCarousel';
import MinistriesGrid from '@/components/home/MinistriesGrid';
import EventsPreview from '@/components/home/EventsPreview';
import CLPCallout from '@/components/home/CLPCallout';
import PrayerWallSection from '@/components/home/PrayerWallSection';

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <Hero />

      {/* Worship Songs Carousel from Database */}
      <SongsCarousel />

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
