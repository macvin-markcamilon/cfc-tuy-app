import React from 'react';
import Hero from '@/components/home/Hero';
import GlobalCommunitySection from '@/components/home/GlobalCommunitySection';
import OnlyByGraceReflections from '@/components/home/OnlyByGraceReflections';
import SongsCarousel from '@/components/home/SongsCarousel';
import MinistriesGrid from '@/components/home/MinistriesGrid';
import FacebookSection from '@/components/home/FacebookSection';

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* 1. Hero Section (600px height) */}
      <Hero />

      {/* 2. United Global Community Section */}
      <GlobalCommunitySection />

      {/* 3. Only by Grace Reflection Section (Latest 3 YouTube videos) */}
      <OnlyByGraceReflections />

      {/* 4. Worship & Praise Songs */}
      <SongsCarousel />

      {/* 5. Family Ministries (Official CFC Ministries) */}
      <MinistriesGrid />

      {/* 6. Facebook Community Section (below Family Ministries) */}
      <FacebookSection />
    </div>
  );
}
