'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  // Hide public navbar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const isHome = pathname === '/';

  return (
    <header
      className={`z-50 transition-all duration-300 ${
        isHome
          ? 'absolute top-0 left-0 w-full bg-transparent border-b border-white/10'
          : 'sticky top-0 bg-[#243c81] text-white border-b border-blue-900/40 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16 sm:h-20">
          
          {/* Centered Brand Logo (Uploaded White Logo) */}
          <Link href="/" className="flex items-center group py-2" aria-label="Couples for Christ Tuy Home">
            <div className="h-9 sm:h-12 flex items-center group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/images/cfc-logo-white.png"
                alt="Couples for Christ Logo"
                width={280}
                height={64}
                className="h-9 sm:h-11 w-auto object-contain drop-shadow-md"
                priority
              />
            </div>
          </Link>

        </div>
      </div>
    </header>
  );
}
