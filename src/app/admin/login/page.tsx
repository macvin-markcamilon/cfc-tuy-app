'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple authentication check with demo support
    setTimeout(() => {
      if (email.trim() && password.trim()) {
        // Set authenticated token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('cfc_tuy_admin_auth', 'true');
          localStorage.setItem('cfc_tuy_admin_user', email);
        }
        router.push('/admin/clp');
      } else {
        setError('Please provide a valid email and password.');
        setLoading(false);
      }
    }, 600);
  };

  const handleDemoLogin = () => {
    setEmail('servant@cfctuy.com');
    setPassword('cfctuy2026');
    setLoading(true);

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cfc_tuy_admin_auth', 'true');
        localStorage.setItem('cfc_tuy_admin_user', 'servant@cfctuy.com');
      }
      router.push('/admin/clp');
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 to-amber-500/10 blur-3xl pointer-events-none rounded-full" />
      
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition-all backdrop-blur-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to CFC Tuy</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-amber-400 font-black text-white text-2xl shadow-xl mb-3">
            CFC
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Servants & Admin Portal
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Couples for Christ • Tuy Chapter Leadership Console
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
          
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Servant Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="servant@cfctuy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                <span>Keep me signed in</span>
              </label>
              <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                Forgot password?
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to Admin Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold block text-center mb-2">
              For Chapter Leaders & Testing:
            </span>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>1-Click Servant Demo Sign-in</span>
            </button>
          </div>

        </div>

        {/* Parish Note */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Under San Nicolas de Tolentino Parish • Tuy, Batangas
        </p>

      </div>
    </div>
  );
}
