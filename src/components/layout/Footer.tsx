'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Heart, MapPin, Mail, Phone, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Hide public footer on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Column 1: Chapter Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1 shadow-md">
                <Image
                  src="/images/cfc_logo_only_blue.png"
                  alt="Couples for Christ Logo"
                  width={36}
                  height={36}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-tight block">
                  Couples for Christ
                </span>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                  Tuy Chapter • Batangas
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              &quot;Families in the Holy Spirit Renewing the Face of the Earth.&quot; Dedicated to supporting marriages, families, and youth through Christ-centered fellowship.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Saint Vincent Ferrer Parish, Tuy, Batangas</span>
            </div>
          </div>

          {/* Column 2: Family Ministries */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 text-amber-400">
              Family Ministries
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/ministries#cfc" className="hover:text-amber-300 transition-colors">
                  Couples for Christ (Married)
                </Link>
              </li>
              <li>
                <Link href="/ministries#sfc" className="hover:text-amber-300 transition-colors">
                  Singles for Christ (SFC)
                </Link>
              </li>
              <li>
                <Link href="/ministries#yfc" className="hover:text-amber-300 transition-colors">
                  Youth for Christ (YFC)
                </Link>
              </li>
              <li>
                <Link href="/ministries#kfc" className="hover:text-amber-300 transition-colors">
                  Kids for Christ (KFC)
                </Link>
              </li>
              <li>
                <Link href="/ministries#hold" className="hover:text-amber-300 transition-colors">
                  Handmaids of the Lord (HOLD)
                </Link>
              </li>
              <li>
                <Link href="/ministries#sold" className="hover:text-amber-300 transition-colors">
                  Servants of the Lord (SOLD)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links & Programs */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 text-amber-400">
              Programs & Activities
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/events#clp" className="hover:text-amber-300 transition-colors">
                  Christian Life Program (CLP)
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-amber-300 transition-colors">
                  Tuy Barangay Household Map
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-amber-300 transition-colors">
                  Monthly General Assemblies
                </Link>
              </li>
              <li>
                <Link href="/prayer-requests" className="hover:text-amber-300 transition-colors">
                  Community Prayer Wall
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Leader Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Social */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase text-amber-400">
              Connect With Us
            </h4>
            <p className="text-xs text-slate-400">
              Want to join a household or learn more about Couples for Christ Tuy? Reach out to our chapter servants.
            </p>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+63 917 123 4567 (Tuy Secretariat)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>contact@cfctuy.com</span>
              </div>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Archdiocese of Lipa • Batangas
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Couples for Christ - Tuy Chapter. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Built with love <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for the Tuy Community
            </span>
            <span>•</span>
            <span>Powered by Next.js, Supabase & Google Maps</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
