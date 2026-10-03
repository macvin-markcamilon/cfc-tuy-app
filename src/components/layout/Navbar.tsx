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
    <header className="sticky top-0 z-50 bg-white transition-all duration-200 border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo Only */}
          <Link href="/" className="flex items-center group py-2" aria-label="Couples for Christ Tuy Home">
            <div className="h-9 sm:h-11 flex items-center group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/images/cfc-logo.png"
                alt="Couples for Christ Logo"
                width={200}
                height={48}
                className="h-8 sm:h-10 w-auto object-contain drop-shadow-xs"
                priority
              />
            </div>
          </Link>

          {/* Login Button Only */}
          <div className="flex items-center">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#243c81] hover:bg-[#1a2d63] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all duration-200 active:scale-95"
            >
              <LogIn className="w-4 h-4 text-white" />
              <span>Login</span>
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
