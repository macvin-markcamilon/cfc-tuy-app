'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Bell,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('servant@cfctuy.com');

  // If on login page, just render children without sidebar
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cfc_tuy_admin_user');
      if (stored) setUserEmail(stored);
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
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand & Chapter Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-amber-500 flex items-center justify-center font-black text-white text-lg shadow-md">
                CFC
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight block">
                  Tuy Chapter
                </span>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="p-4 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
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
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <div>
                      <span className="block leading-snug">{item.name}</span>
                      <span
                        className={`text-[10px] font-normal block ${
                          isActive ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {item.description}
                      </span>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-blue-200" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Profile & Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          
          {/* User badge */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                Bro. Mark Camilon
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {userEmail}
              </span>
            </div>
          </div>

          {/* Quick Exit to Public */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Go to Public Website</span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
                Couples for Christ • Tuy Chapter Administration
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Tuy Chapter Server Online
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

      </div>

    </div>
  );
}
