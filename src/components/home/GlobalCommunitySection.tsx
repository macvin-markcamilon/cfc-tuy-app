'use client';

import React from 'react';
import { Globe, Users, Award, ShieldCheck, Heart, Sparkles, Church } from 'lucide-react';

export default function GlobalCommunitySection() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-[#243c81] via-[#1a2c60] to-[#111e42] text-white relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>We are a united global community</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            A Worldwide Mission Rooted in Faith
          </h2>
          <p className="text-sm sm:text-base text-blue-100/80 leading-relaxed font-medium">
            Couples for Christ (CFC) is made up of families who have taken up Christ&apos;s exhortation to be leaven and light to the world, particularly in the area of strengthening family life.
          </p>
        </div>

        {/* 3 Main Counter Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Members Stat */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 text-center space-y-2 hover:bg-white/15 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-300">533,129</div>
            <h4 className="text-base font-extrabold text-white">Active Members</h4>
            <span className="text-xs text-blue-200/70 font-medium block">Across the globe as of 2026</span>
          </div>

          {/* Countries Stat */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 text-center space-y-2 hover:bg-white/15 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center mx-auto shadow-lg">
              <Globe className="w-6 h-6" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-blue-300">141</div>
            <h4 className="text-base font-extrabold text-white">Countries</h4>
            <span className="text-xs text-blue-200/70 font-medium block">of CFC Global Presence</span>
          </div>

          {/* Years Stat */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 text-center space-y-2 hover:bg-white/15 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
              <Award className="w-6 h-6" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-300">45 Years</div>
            <h4 className="text-base font-extrabold text-white">Of Serving God and Family</h4>
            <span className="text-xs text-blue-200/70 font-medium block">Evangelizing world communities</span>
          </div>
        </div>

        {/* Vision, Mission & Vatican Recognition Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Vision & Mission Card */}
          <div className="lg:col-span-7 bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h3 className="text-xl font-black text-white">Our Vision &amp; Mission</h3>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 block mb-1">
                    Vision
                  </span>
                  <p className="text-base font-extrabold text-white">
                    &quot;Families in the Holy Spirit renewing the face of the earth.&quot;
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-300 block mb-1">
                    Mission
                  </span>
                  <p className="text-base font-extrabold text-white">
                    Building the Church of the Home &amp; Building the Church of the Poor
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 text-xs text-blue-200/70 font-medium flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Deploying lay missionaries committed to the Church&apos;s evangelizing work worldwide.</span>
            </div>
          </div>

          {/* Vatican Recognition Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-amber-500/20 via-white/10 to-blue-500/20 backdrop-blur-md border border-amber-400/30 rounded-3xl p-7 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black">
                  <Church className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                    One with the Catholic Church
                  </span>
                  <h3 className="text-lg font-black text-white">CFC Vatican Recognition</h3>
                </div>
              </div>

              <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
                On April 25, 2005, by decree Prot. N. 470/00/S-61B/91, the Pontifical Council for the Laity recognized Couples for Christ as an <strong className="text-amber-300 font-extrabold">International Private Association of the Faithful of Pontifical Right</strong> and permanently approved its statutes.
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pontifical Right Decree</span>
              </span>
              <a
                href="https://couplesforchristglobal.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-black text-white hover:text-amber-300 underline underline-offset-4"
              >
                Official Site ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
