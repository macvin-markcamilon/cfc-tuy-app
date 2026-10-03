'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogIn } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  // Hide public navbar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 glass-nav transition-all duration-200 border-b border-slate-200/60 dark:border-slate-800/60 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo Only */}
          <Link href="/" className="flex items-center group py-2" aria-label="Couples for Christ Tuy Home">
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/images/cfc_logo_only_blue.png"
                alt="Couples for Christ Logo"
                width={56}
                height={56}
                className="w-11 h-11 sm:w-14 sm:h-14 object-contain drop-shadow-xs"
                priority
              />
            </div>
          </Link>

          {/* Login Button Only */}
          <div className="flex items-center">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 active:scale-95"
            >
              <LogIn className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Login</span>
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
