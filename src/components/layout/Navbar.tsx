'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, MapPin, HeartHandshake, Calendar, Users, Shield, Sparkles, BookOpen, LogIn } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide public navbar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const navLinks = [
    { name: 'Home', href: '/', icon: Sparkles },
    { name: 'Tuy Map & Households', href: '/map', icon: MapPin },
    { name: 'Ministries', href: '/ministries', icon: Users },
    { name: 'Events & CLP', href: '/events', icon: Calendar },
    { name: 'Prayer Wall', href: '/prayer-requests', icon: HeartHandshake },
    { name: 'Member Portal', href: '/portal', icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 glass-nav transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-900 via-blue-700 to-amber-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-black text-lg tracking-wider">CFC</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  Couples for Christ
                </span>
                <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                  TUY
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Western Batangas • San Nicolas de Tolentino Parish
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 opacity-80" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action Button & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/events#clp"
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-150 active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>Join Next CLP</span>
            </Link>

            {/* Admin Login Button */}
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Admin Login</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-200/60 dark:bg-blue-900/60 text-blue-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{link.name}</span>
              </Link>
            );
          })}
          
          <div className="pt-2 space-y-2">
            <Link
              href="/events#clp"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-semibold text-sm shadow-md"
            >
              <BookOpen className="w-4 h-4" />
              <span>Join Christian Life Program (CLP)</span>
            </Link>

            <Link
              href="/admin/login"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-xs"
            >
              <LogIn className="w-4 h-4 text-blue-600" />
              <span>Admin Portal Login</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
