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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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

      const savedCollapsed = localStorage.getItem('cfc_admin_sidebar_collapsed');
      if (savedCollapsed !== null) {
        setIsCollapsed(savedCollapsed === 'true');
      }
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('cfc_admin_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

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
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Navigation with Brand Color #243c81 */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#243c81] text-white border-r border-[#1a2c60] flex flex-col justify-between transition-all duration-300 ease-in-out shadow-xl ${
          // Mobile state
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop collapsed vs expanded width
          isCollapsed ? 'w-72 lg:w-[72px]' : 'w-72 lg:w-64'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Brand Logo & Chapter Header */}
          <div
            className={`border-b border-white/10 flex items-center transition-all duration-300 ${
              isCollapsed ? 'p-3 justify-center' : 'p-4 justify-between'
            }`}
          >
            {isCollapsed ? (
              // Collapsed Header (Icon-only on desktop)
              <div className="hidden lg:flex flex-col items-center gap-2.5 w-full">
                <Link
                  href="/admin"
                  title="Couples for Christ - Tuy Chapter Admin"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center p-1.5 border border-white/20 transition-all shadow-xs"
                >
                  <Image
                    src="/images/cfc_logo_only_blue.png"
                    alt="CFC Logo"
                    width={26}
                    height={26}
                    className="object-contain brightness-0 invert"
                  />
                </Link>
                <button
                  onClick={toggleCollapse}
                  className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4 text-amber-300" />
                </button>
              </div>
            ) : (
              // Expanded Header
              <div className="flex items-center justify-between w-full">
                <Link href="/admin" className="flex flex-col gap-1.5 overflow-hidden">
                  <div className="relative w-40 h-9">
                    <Image
                      src="/images/cfc-logo-white-banner.png"
                      alt="Couples For Christ Logo"
                      fill
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-white/15 px-2 py-0.5 rounded-md border border-white/10 truncate">
                      Tuy Chapter • Admin
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-1">
                  {/* Desktop Collapse Toggle */}
                  <button
                    onClick={toggleCollapse}
                    className="hidden lg:flex text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-xl transition-colors"
                    title="Compress & collapse sidebar"
                    aria-label="Compress & collapse sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>

                  {/* Mobile Close Button */}
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden text-white/70 hover:text-white p-1 rounded-lg"
                    aria-label="Close sidebar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Header fallback when collapsed is active on desktop */}
            {isCollapsed && (
              <div className="flex lg:hidden items-center justify-between w-full">
                <Link href="/admin" className="flex flex-col gap-1.5 overflow-hidden">
                  <div className="relative w-40 h-9">
                    <Image
                      src="/images/cfc-logo-white-banner.png"
                      alt="Couples For Christ Logo"
                      fill
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-white/15 px-2 py-0.5 rounded-md border border-white/10 w-fit">
                    Tuy Chapter • Admin
                  </span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-white/70 hover:text-white p-1 rounded-lg"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className={`space-y-1.5 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-3'}`}>
            {!isCollapsed && (
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider px-3 mb-1.5 block">
                Menu Navigation
              </span>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname?.startsWith(item.href);

              return (
                <div key={item.name} className="relative group">
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center rounded-xl text-xs font-bold transition-all ${
                      isCollapsed
                        ? 'justify-center w-11 h-11 mx-auto p-0'
                        : 'justify-between px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-white/20 text-white shadow-md border border-white/25'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'truncate'}`}>
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-amber-300' : 'text-white/70'
                        }`}
                      />
                      {!isCollapsed && (
                        <div className="truncate">
                          <span className="block leading-snug truncate">{item.name}</span>
                          <span
                            className={`text-[10px] font-normal block truncate ${
                              isActive ? 'text-blue-100' : 'text-white/60'
                            }`}
                          >
                            {item.description}
                          </span>
                        </div>
                      )}
                    </div>

                    {!isCollapsed && isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    )}

                    {/* Active bar indicator for collapsed state */}
                    {isCollapsed && isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-amber-400 rounded-r-full shadow-xs" />
                    )}
                  </Link>

                  {/* Floating Tooltip in Collapsed Mode */}
                  {isCollapsed && (
                    <div className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3.5 flex-col z-50 bg-slate-900 text-white px-3 py-2 rounded-xl shadow-2xl border border-slate-700 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{item.name}</span>
                        {isActive && (
                          <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {item.description}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Profile & Actions */}
        <div
          className={`border-t border-white/10 transition-all duration-300 ${
            isCollapsed ? 'p-2 space-y-2' : 'p-3.5 space-y-2.5'
          }`}
        >
          {isCollapsed ? (
            // Collapsed Bottom Actions (Icon badges with tooltips)
            <div className="hidden lg:flex flex-col items-center gap-2">
              {/* Admin Avatar Tooltip */}
              <div className="relative group">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#243c81] flex items-center justify-center font-bold text-sm shadow-xs cursor-pointer hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="absolute left-full bottom-0 ml-3.5 hidden group-hover:flex flex-col z-50 bg-slate-900 text-white px-3 py-2 rounded-xl shadow-2xl border border-slate-700 pointer-events-none whitespace-nowrap animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">Bro. Mark Camilon</span>
                    <span className="text-[9px] font-black uppercase bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded">
                      Admin
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{userEmail}</span>
                </div>
              </div>

              {/* Public Website */}
              <div className="relative group">
                <Link
                  href="/"
                  title="Go to Public Website"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/10 hover:scale-105"
                >
                  <ExternalLink className="w-4 h-4 text-amber-300" />
                </Link>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 hidden group-hover:block z-50 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-xl shadow-2xl border border-slate-700 pointer-events-none whitespace-nowrap">
                  Go to Public Website
                </div>
              </div>

              {/* Sign Out */}
              <div className="relative group">
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="w-10 h-10 rounded-xl bg-red-500/20 hover:bg-red-500/35 text-red-200 border border-red-400/20 flex items-center justify-center transition-all hover:scale-105"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 hidden group-hover:block z-50 bg-slate-900 text-red-300 text-xs px-2.5 py-1.5 rounded-xl shadow-2xl border border-slate-700 pointer-events-none whitespace-nowrap font-bold">
                  Sign Out
                </div>
              </div>
            </div>
          ) : (
            // Expanded Bottom Section
            <>
              {/* Main Admin user badge */}
              <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-[#243c81] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white block truncate">
                      Bro. Mark Camilon
                    </span>
                    <span className="text-[8px] font-black uppercase bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded">
                      Admin
                    </span>
                  </div>
                  <span className="text-[10px] text-white/70 block truncate">
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
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/20 text-xs font-bold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          )}

          {/* Mobile Fallback for Bottom Actions when collapsed state is active on desktop */}
          {isCollapsed && (
            <div className="flex lg:hidden flex-col space-y-2">
              <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-[#243c81] flex items-center justify-center font-bold text-xs shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white block truncate">
                      Bro. Mark Camilon
                    </span>
                    <span className="text-[8px] font-black uppercase bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded">
                      Admin
                    </span>
                  </div>
                  <span className="text-[10px] text-white/70 block truncate">
                    {userEmail}
                  </span>
                </div>
              </div>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                <span>Go to Public Website</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/20 text-xs font-bold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Viewport - Smoothly adjusts left padding based on collapsed state */}
      <div
        className={`flex-1 flex flex-col min-h-screen bg-slate-50 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Open Toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6 text-[#243c81]" />
            </button>

            {/* Desktop Quick Collapse/Expand Toggle Button in Header */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-[#243c81] hover:bg-blue-50 border border-slate-200 transition-colors"
              title={isCollapsed ? 'Expand sidebar menu' : 'Compress & collapse sidebar menu'}
              aria-label={isCollapsed ? 'Expand sidebar menu' : 'Compress & collapse sidebar menu'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-[#243c81]" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-[#243c81]" />
              )}
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
