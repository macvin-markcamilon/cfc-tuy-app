'use client';

import React, { useState } from 'react';
import { CHAPTER_EVENTS } from '@/lib/data/mock-data';
import { Calendar, Clock, MapPin, CheckCircle2, Send, BookOpen, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function EventsPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  // CLP Registration state
  const [regHusband, setRegHusband] = useState('');
  const [regWife, setRegWife] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regBarangay, setRegBarangay] = useState('Poblacion 1');
  const [regEmail, setRegEmail] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const filteredEvents = CHAPTER_EVENTS.filter((evt) => {
    if (selectedFilter === 'ALL') return true;
    return evt.category === selectedFilter || evt.ministry === selectedFilter;
  });

  const handleCLPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regHusband.trim() || !regContact.trim()) return;

    setIsRegistered(true);
  };

  return (
    <div className="py-8 sm:py-12 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold mb-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>Chapter Activities & Calendar</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Events & Gatherings in Tuy
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Join our monthly general assemblies, youth camps, and register for the next Christian Life Program (CLP).
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {['ALL', 'Assembly', 'CLP', 'Fellowship', 'Conference'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                selectedFilter === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'ALL' ? 'All Events' : cat}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredEvents.map((evt) => {
              const dateObj = new Date(evt.date);
              const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
              const dayStr = dateObj.toLocaleDateString('en-US', { day: 'numeric' });
              const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

              return (
                <div
                  key={evt.id}
                  id={evt.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-blue-700 to-indigo-800 text-white shadow-md">
                          <span className="text-[10px] uppercase font-bold tracking-wider">{monthStr}</span>
                          <span className="text-xl font-black leading-none">{dayStr}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 font-medium block">{weekday}</span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{evt.category}</span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                        {evt.ministry}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      {evt.title}
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{evt.time}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span>{evt.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-700 hover:text-white dark:text-slate-300 dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>View Venue & Map Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 mb-16 shadow-xs">
            <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              No events scheduled in this category
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Production events calendar will be updated as chapter assemblies and activities are finalized.
            </p>
          </div>
        )}

        {/* CLP Registration Section */}
        <div id="clp" className="scroll-mt-24 rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-10 lg:p-12 shadow-2xl border border-blue-800/60">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
                <BookOpen className="w-4 h-4" />
                <span>Christian Life Program (CLP) - Tuy Chapter</span>
              </div>
              
              <h2 className="text-2xl sm:text-4xl font-black">
                Register Your Family for the Next CLP Cycle
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Take the step towards strengthening your family and marital foundation. Register online below or coordinate with our Tuy secretariat. Participation is completely free.
              </p>

              <div className="p-4 rounded-2xl bg-white/10 border border-white/10 space-y-2 text-xs text-slate-200">
                <p className="font-semibold text-amber-300">What to expect:</p>
                <p>• 8 weekly sessions on Catholic Christian marriage and life</p>
                <p>• Inspiring testimonies from Tuy couples</p>
                <p>• Brotherhood and sisterhood group discussions</p>
                <p>• Family fellowship and delicious snacks included</p>
              </div>
            </div>

            {/* Registration Form */}
            <div id="clp-register" className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 text-slate-900 dark:text-white shadow-xl">
              {isRegistered ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                  <h3 className="text-xl font-bold">Registration Received!</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    Welcome Bro. {regHusband} {regWife ? `& Sis. ${regWife}` : ''}! Our Tuy CLP Secretariat will contact you via {regContact} regarding orientation details.
                  </p>
                  <button
                    onClick={() => setIsRegistered(false)}
                    className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                  >
                    Register Another Participant
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCLPSubmit} className="space-y-4">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    CLP Online Sign-up
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Husband / Male Candidate Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Juan Dela Cruz"
                      value={regHusband}
                      onChange={(e) => setRegHusband(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Wife Name (if married couple)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Maria Dela Cruz"
                      value={regWife}
                      onChange={(e) => setRegWife(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Contact / Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+63 917..."
                        value={regContact}
                        onChange={(e) => setRegContact(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Tuy Barangay
                      </label>
                      <select
                        value={regBarangay}
                        onChange={(e) => setRegBarangay(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Poblacion 1">Brgy. Poblacion 1</option>
                        <option value="Poblacion 2">Brgy. Poblacion 2</option>
                        <option value="Putol">Brgy. Putol</option>
                        <option value="Luntal">Brgy. Luntal</option>
                        <option value="Malibu">Brgy. Malibu</option>
                        <option value="Obispo">Brgy. Obispo</option>
                        <option value="Guinhawa">Brgy. Guinhawa</option>
                        <option value="Other">Other Barangay</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="juan@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit CLP Application</span>
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
