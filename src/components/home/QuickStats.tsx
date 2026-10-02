import React from 'react';
import { Home, Users, HeartHandshake, MapPin } from 'lucide-react';

export default function QuickStats() {
  const stats = [
    {
      label: 'Active Households',
      value: '14+',
      description: 'Weekly & bi-weekly prayer groups in Tuy',
      icon: Home,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400',
    },
    {
      label: 'Family Ministries',
      value: '6',
      description: 'CFC, SFC, YFC, KFC, HOLD, and SOLD',
      icon: Users,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
    },
    {
      label: 'Tuy Barangays Served',
      value: '22',
      description: 'From Poblacion to rural barangays',
      icon: MapPin,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    {
      label: 'CLP Batches Completed',
      value: '28+',
      description: 'Renewing married couples since 1990s',
      icon: HeartHandshake,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400',
    },
  ];

  return (
    <section className="py-6 -mt-6 sm:-mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${stat.color}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {stat.value}
                  </span>
                </div>
              </div>
              <h4 className="mt-2.5 font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                {stat.label}
              </h4>
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
