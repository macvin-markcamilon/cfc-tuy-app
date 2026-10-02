'use client';

import React, { useState } from 'react';
import { PRAYER_REQUESTS_DATA } from '@/lib/data/mock-data';
import { PrayerRequest } from '@/types';
import { Heart, Plus, Send, CheckCircle2, MessageSquareHeart } from 'lucide-react';

export default function PrayerWallSection() {
  const [requests, setRequests] = useState<PrayerRequest[]>(PRAYER_REQUESTS_DATA);
  const [showForm, setShowForm] = useState(false);
  const [prayedIds, setPrayedIds] = useState<Record<string, boolean>>({});

  // Form fields
  const [authorName, setAuthorName] = useState('');
  const [barangay, setBarangay] = useState('Poblacion 1');
  const [category, setCategory] = useState<PrayerRequest['category']>('Health & Healing');
  const [intention, setIntention] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handlePray = (id: string) => {
    if (prayedIds[id]) return; // already clicked

    setPrayedIds((prev) => ({ ...prev, [id]: true }));
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, prayerCount: req.prayerCount + 1 } : req
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !intention.trim()) return;

    const newRequest: PrayerRequest = {
      id: `pr-${Date.now()}`,
      authorName: authorName.trim(),
      barangay: `Brgy. ${barangay}`,
      intention: intention.trim(),
      category,
      createdAt: 'Just now',
      prayerCount: 1,
    };

    setRequests([newRequest, ...requests]);
    setPrayedIds((prev) => ({ ...prev, [newRequest.id]: true }));
    setAuthorName('');
    setIntention('');
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
    }, 2000);
  };

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <MessageSquareHeart className="w-4 h-4" />
              <span>Intercessory Prayer Ministry</span>
            </div>
            <h2 className="mt-1 text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Tuy Community Prayer Wall
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              &quot;For where two or three are gathered together in my name, there am I in the midst of them.&quot; (Matthew 18:20)
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Close Form' : 'Submit Prayer Intention'}</span>
          </button>
        </div>

        {/* Modal/Accordion for Prayer Submission */}
        {showForm && (
          <div className="mb-10 p-6 sm:p-8 rounded-3xl glass-panel border border-blue-200 dark:border-slate-700 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Offer a Prayer Intention
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Your intention will be lifted up by CFC Tuy households during our weekly prayer assemblies.
            </p>

            {submitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Prayer Intention Received!</p>
                  <p className="text-xs">Your intention is now on the community wall. God bless you.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Your Name or Family
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bro. Juan & Family"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Barangay in Tuy
                    </label>
                    <select
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Poblacion 1">Brgy. Poblacion 1</option>
                      <option value="Poblacion 2">Brgy. Poblacion 2</option>
                      <option value="Putol">Brgy. Putol</option>
                      <option value="Luntal">Brgy. Luntal</option>
                      <option value="Obispo">Brgy. Obispo</option>
                      <option value="Malibu">Brgy. Malibu</option>
                      <option value="Guinhawa">Brgy. Guinhawa</option>
                      <option value="Rillo">Brgy. Rillo</option>
                      <option value="Other">Other Tuy Barangay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as PrayerRequest['category'])}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Health & Healing">Health & Healing</option>
                      <option value="Family & Marriage">Family & Marriage</option>
                      <option value="Thanksgiving">Thanksgiving</option>
                      <option value="Spiritual Growth">Spiritual Growth</option>
                      <option value="Special Intentions">Special Intentions</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Prayer Request or Intention
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Write your intention here..."
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>Post Intention</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Requests Cards Grid */}
        {requests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((item) => {
              const hasPrayed = prayedIds[item.id];

              return (
                <div
                  key={item.id}
                  className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.createdAt}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 font-medium leading-relaxed italic">
                      &quot;{item.intention}&quot;
                    </p>

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.authorName} {item.barangay ? `(${item.barangay})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      <strong className="text-blue-600 dark:text-blue-400">{item.prayerCount}</strong> brethren prayed
                    </span>

                    <button
                      onClick={() => handlePray(item.id)}
                      disabled={hasPrayed}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        hasPrayed
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900 cursor-default'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-600 shadow-xs active:scale-95'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasPrayed ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                      <span>{hasPrayed ? 'Prayed with You' : 'I Prayed / Amen'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            <MessageSquareHeart className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="font-bold text-slate-800 dark:text-slate-200 text-base">
              No prayer requests posted yet.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Be the first to submit a prayer intention for your family, health, or community.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
