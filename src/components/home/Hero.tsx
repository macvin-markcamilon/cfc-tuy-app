import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Heart, BookOpen, ArrowRight, ShieldCheck, Sparkles, Users } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-32 bg-gradient-to-b from-blue-50/50 via-white to-white">
      
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-400/20 to-amber-300/20 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-12 right-10 w-72 h-72 bg-blue-600/10 blur-2xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          
          {/* Official Blue Logo Image 2 */}
          <div className="flex justify-center mb-6">
            <div className="p-3 sm:p-4 rounded-3xl bg-white shadow-xl border border-slate-100/80 hover:scale-105 transition-transform duration-200">
              <Image
                src="/images/cfc_logo_only_blue.png"
                alt="Couples For Christ Logo"
                width={72}
                height={72}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                priority
              />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#243c81] text-xs sm:text-sm font-bold shadow-xs mb-4">
            <span className="w-2 h-2 rounded-full bg-[#243c81] animate-ping" />
            <span>Couples for Christ • Tuy Chapter, Batangas</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight sm:leading-none">
            Families in the Holy Spirit Renewing the Face of <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-500 bg-clip-text text-transparent">Tuy, Batangas</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-medium">
            A vibrant community of Catholic couples, youth, and singles united in prayer, pastoral care, and joyful evangelization across all barangays of Tuy.
          </p>

          {/* Call-to-action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/events#clp"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <BookOpen className="w-5 h-5 text-amber-300" />
              <span>Join Christian Life Program (CLP)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/map"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm sm:text-base border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Explore Tuy Households Map</span>
            </Link>
          </div>

          {/* Parish Tagline */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Under the pastoral care of Saint Vincent Ferrer Parish • Archdiocese of Lipa</span>
          </div>

        </div>
      </div>
    </section>
  );
}
