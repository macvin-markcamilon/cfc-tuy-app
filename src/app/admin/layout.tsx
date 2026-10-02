'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Music,
  Users,
  BookOpenCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('markcamilon@gmail.com');

  // If on login page, just render children without sidebar
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cfc_tuy_admin_user');
      if (stored) {
        setUserEmail(stored);
      } else {
        localStorage.setItem('cfc_tuy_admin_user', 'markcamilon@gmail.com');
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cfc_tuy_admin_auth');
      localStorage.removeItem('cfc_tuy_admin_user');
    }
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      description: 'Overview & Analytics',
    },
    {
      name: 'CLP (Christian Life Program)',
      href: '/admin/clp',
      icon: BookOpenCheck,
      description: 'Programs, Couples & Talks',
    },
    {
      name: 'Members Directory',
      href: '/admin/members',
      icon: Users,
      description: 'Households & Pastoral Records',
    },
    {
      name: 'Worship Songs',
      href: '/admin/songs',
      icon: Music,
      description: 'Lyrics, Chords & Repertoire',
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#FFFFFF] text-slate-900">
      
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Navigation with Brand Color #243c81 */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#243c81] text-white border-r border-[#1a2c60] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 shadow-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Logo & Chapter Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <Link href="/admin" className="flex flex-col gap-2 w-full">
              {/* Image 1: White Horizontal Couples For Christ Logo */}
              <div className="relative w-full max-w-[210px] h-12">
                <Image
                  src="/images/cfc-logo-white-banner.png"
                  alt="Couples For Christ Logo"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-white/15 px-2 py-0.5 rounded-md border border-white/10">
                  Tuy Chapter • Admin Console
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/70 hover:text-white p-1"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="p-4 space-y-1.5">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider px-3 mb-2 block">
              Menu Navigation
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-white/20 text-white shadow-md border border-white/20'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-amber-300' : 'text-white/70'}`} />
                    <div>
                      <span className="block leading-snug">{item.name}</span>
                      <span
                        className={`text-[10px] font-normal block ${
                          isActive ? 'text-blue-100' : 'text-white/60'
                        }`}
                      >
                        {item.description}
                      </span>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-amber-300" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Profile & Actions */}
        <div className="p-4 border-t border-white/10 space-y-3">
          
          {/* Main Admin user badge */}
          <div className="p-3 rounded-2xl bg-white/10 border border-white/15 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-[#243c81] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-white block truncate">
                  Bro. Mark Camilon
                </span>
                <span className="text-[9px] font-extrabold uppercase bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded">
                  Admin
                </span>
              </div>
              <span className="text-[11px] text-white/70 block truncate">
                {userEmail}
              </span>
            </div>
          </div>

          {/* Quick Exit to Public Website */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
            <span>Go to Public Website</span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/20 text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport with Background #FFFFFF */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen bg-[#FFFFFF]">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6 text-[#243c81]" />
            </button>

            <div>
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline-block">
                Couples for Christ • Tuy Chapter Main Admin Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#243c81] text-xs font-bold border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Tuy Chapter Active • Main Admin
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#FFFFFF]">{children}</main>

      </div>

    </div>
  );
}
