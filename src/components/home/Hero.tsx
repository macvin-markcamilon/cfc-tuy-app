import React from 'react';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-8 pb-14 sm:pt-12 sm:pb-18 lg:pt-16 lg:pb-24 bg-gradient-to-b from-blue-50/50 via-white to-white">
      {/* Decorative background glows */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-blue-400/15 to-amber-300/15 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Left-aligned Text */}
          <div className="lg:col-span-7 text-left flex flex-col items-start">
            {/* CFC Logo (Image 2) */}
            <div className="mb-6">
              <Image
                src="/images/cfc-logo.png"
                alt="Couples For Christ Logo"
                width={280}
                height={66}
                className="h-10 sm:h-12 md:h-14 w-auto object-contain"
                priority
              />
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight sm:leading-[1.15]">
              Families in the Holy Spirit Renewing the Face of{' '}
              <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-500 bg-clip-text text-transparent">
                Tuy, Batangas
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-xl">
              A vibrant community of Catholic couples, youth, and singles united in prayer, pastoral care, and joyful evangelization across all barangays of Tuy.
            </p>
          </div>

          {/* Right Column: Holy Family Watercolor Image (Image 1) */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-200/40 via-blue-200/30 to-indigo-200/30 rounded-full blur-3xl -z-10 scale-95" />
              <Image
                src="/images/holy-family.png"
                alt="Holy Family - Couples for Christ"
                width={560}
                height={400}
                className="w-full h-auto max-h-[380px] lg:max-h-[460px] object-contain drop-shadow-sm hover:scale-[1.02] transition-transform duration-300"
                priority
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
