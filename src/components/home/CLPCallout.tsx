import React from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle, ArrowRight, HeartHandshake, MapPin } from 'lucide-react';

export default function CLPCallout() {
  const highlights = [
    'Renew your marriage and relationship with God',
    'Open to all Catholic couples & married individuals in Tuy',
    '8 transformative weekly sessions in Tuy Parish / Gymnasium',
    'No fees or charges — come as you are with your spouse',
  ];

  return (
    <section id="clp" className="py-12 sm:py-16 lg:py-24 bg-[#243c81] text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-semibold">
              <BookOpen className="w-4 h-4" />
              <span>Next CLP Batch Opening in Tuy</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Start Your Journey in the <span className="text-amber-400">Christian Life Program</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              The Christian Life Program (CLP) is the main entry point to Couples for Christ. It is an integrated 8-week course leading into a renewed relationship with God, deeper intimacy in marriage, and supportive Christian brotherhood and sisterhood.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {highlights.map((point, index) => (
                <div key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/events#clp-register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm sm:text-base shadow-lg transition-all"
              >
                <span>Register for CLP Tuy</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm sm:text-base transition-all"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Find Venue in Tuy</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl">
                  CLP
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">CFC Tuy Batch 2026</h4>
                  <p className="text-xs text-amber-300">Tuy Municipal Gymnasium / Parish Hall</p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-200 border-t border-white/10 pt-4">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Orientation Date:</span>
                  <span className="font-semibold text-white">November 8, 2026</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Time:</span>
                  <span className="font-semibold text-white">6:30 PM - 9:00 PM</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Target:</span>
                  <span className="font-semibold text-white">Married Couples & Parents</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Cost:</span>
                  <span className="font-bold text-emerald-400">FREE of Charge</span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-blue-950/60 border border-blue-400/20 text-xs text-slate-300 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Childcare and youth assistance provided by YFC & KFC volunteers during sessions!</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
