import React from 'react';

export default function Hero() {
  return (
    <section className="relative w-full h-[600px] flex items-center overflow-hidden bg-slate-950 text-white">
      {/* Background Image (Uploaded Hero Collage Image) */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url('/images/hero-bg.png')` }}
      />

      {/* Dark Gradient Overlay for Contrast & Aesthetics */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40" />

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-16">
        <div className="max-w-3xl space-y-5">
          
          {/* Header Tagline with Horizontal Line (Matching Uploaded Image 2) */}
          <div className="flex items-center gap-4">
            <span className="font-serif italic text-white text-xl sm:text-2xl font-bold tracking-wide shrink-0">
              Who We Are
            </span>
            <div className="h-[2px] bg-white/70 flex-1 max-w-[200px]" />
          </div>

          {/* Main Title (Matching Uploaded Image 2) */}
          <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl lg:text-[46px] text-white tracking-tight leading-[1.12] drop-shadow-md">
            A Private International Association of the Faithful of Pontifical Right
          </h1>

          {/* Subtitle / Description (Matching Uploaded Image 2) */}
          <p className="text-xs sm:text-sm md:text-base text-slate-200 font-medium leading-relaxed max-w-2xl text-shadow-sm">
            CFC is made up of families who have taken up Christ&apos;s exhortation to be leaven and light to the world, particularly in the area of strengthening family life. It is committed to the spread of the Good News and the Church&apos;s evangelizing work and has trained and deployed lay missionaries to many countries in the world.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="#family-ministries"
              className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95"
            >
              Explore Family Ministries
            </a>
            <a
              href="#only-by-grace"
              className="px-6 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all active:scale-95"
            >
              Watch Video Reflections
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
