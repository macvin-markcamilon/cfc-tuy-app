'use client';

import React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Phone, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Hide public footer on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-[#181818] text-slate-300 text-xs sm:text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-8 lg:gap-8 items-start">
          
          {/* Column 1: Logo & Tagline & Address (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center p-1.5 border border-white/20">
                <Image
                  src="/images/cfc_logo_only_blue.png"
                  alt="Couples for Christ Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain brightness-200"
                />
              </div>
              <div>
                <span className="font-serif italic text-white font-extrabold text-base block">
                  Couples for Christ
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                  Tuy Chapter • Batangas
                </span>
              </div>
            </div>

            <div className="space-y-1 text-slate-300 font-medium text-xs leading-relaxed">
              <p>Building the Church of the Home.</p>
              <p>Building the Church of the Poor.</p>
            </div>

            <div className="space-y-2 text-xs text-slate-300 font-normal">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href="tel:+63287094867" className="hover:text-white transition-colors">+63 2 87094867</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href="tel:+639209545031" className="hover:text-white transition-colors">+63 920 954 5031</a>
              </div>
              <div className="flex items-start gap-2 pt-1 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>156 20th Ave., Brgy. Mangga, Cubao, Quezon City 1109, Philippines.</span>
              </div>
            </div>
          </div>

          {/* Column 2: About & Programs (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h4 className="font-serif italic font-extrabold text-white text-base mb-3">
                About
              </h4>
              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li>
                  <a href="https://couplesforchristglobal.org/who-we-are/#mission-vision" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Vision
                  </a>
                </li>
                <li>
                  <a href="https://couplesforchristglobal.org/who-we-are/#mission-vision" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Mission
                  </a>
                </li>
                <li>
                  <a href="https://couplesforchristglobal.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    CFC Members Portal
                  </a>
                </li>
                <li>
                  <a href="https://couplesforchristglobal.org/event-calendar/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Events
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif italic font-extrabold text-white text-base mb-2">
                Programs
              </h4>
              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li>
                  <a href="https://couplesforchristglobal.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Family is a Gift
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Related Companies (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-serif italic font-extrabold text-white text-base mb-3">
              Related Companies
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
              <li>
                <a href="https://couplesforchristglobal.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Missio Amare
                </a>
              </li>
              <li>
                <a href="https://couplesforchristglobal.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  ANCOP
                </a>
              </li>
              <li>
                <a href="https://couplesforchristglobal.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Ablaze
                </a>
              </li>
              <li>
                <a href="https://couplesforchristglobal.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  GCare
                </a>
              </li>
              <li>
                <a href="https://couplesforchristglobal.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  CFC Institute
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Ministries (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-serif italic font-extrabold text-white text-base mb-3">
              Ministries
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
              <li>
                <a href="https://couplesforchristglobal.org/cfc-kids-for-christ/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  CFC Kids for Christ
                </a>
              </li>
              <li>
                <a href="https://couplesforchristglobal.org/cfc-youth-for-christ/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  CFC Youth for Christ
                </a>
              </li>
              <li>
                <a href="https://couplesforchristglobal.org/cfc-singles-for-christ/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  CFC Singles for Christ
                </a>
              </li>
              <li>
                <a href="https://couplesforchristglobal.org/cfc-handmaids-of-the-lord/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  CFC Handmaids of the Lord
                </a>
              </li>
              <li>
                <a href="https://couplesforchristglobal.org/cfc-servants-of-the-lord/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  CFC Servants of the Lord
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} Couples for Christ Global. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>Official Portal: <a href="https://couplesforchristglobal.org" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">couplesforchristglobal.org</a></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Tuy Chapter <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Saint Vincent Ferrer Parish
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
