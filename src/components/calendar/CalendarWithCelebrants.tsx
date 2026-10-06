'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DirectoryCouple, ChapterEvent, MinistryType } from '@/types';
import { fetchDirectoryCouples } from '@/lib/data/members-service';
import { fetchEvents, saveEvent, deleteEvent } from '@/lib/data/events-service';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Cake,
  Heart,
  Sparkles,
  MapPin,
  Clock,
  Plus,
  Search,
  Users,
  PartyPopper,
  Gift,
  Filter,
  Trash2,
  Edit3,
  X,
  Eye,
  Layers,
  ShieldCheck,
  Check,
  Building2,
  Phone,
  ExternalLink,
  IdCard,
} from 'lucide-react';
import AnniversaryGreetingCardModal from '@/components/common/AnniversaryGreetingCardModal';
import BirthdayGreetingCardModal, { BirthdayCelebrantData } from '@/components/common/BirthdayGreetingCardModal';

interface CelebrantBirthday {
  id: string;
  type: 'husband_birthday' | 'wife_birthday';
  personName: string;
  nickname?: string;
  photoUrl?: string;
  birthdayDate: string; // YYYY-MM-DD
  month: number; // 1-12
  day: number; // 1-31
  birthYear?: number;
  couple: DirectoryCouple;
}

interface CelebrantAnniversary {
  id: string;
  husbandName: string;
  wifeName: string;
  husbandNickname?: string;
  wifeNickname?: string;
  couplePhotoUrl?: string;
  husbandPhotoUrl?: string;
  wifePhotoUrl?: string;
  anniversaryDate: string; // YYYY-MM-DD
  month: number; // 1-12
  day: number; // 1-31
  weddingYear?: number;
  couple: DirectoryCouple;
}

interface CalendarWithCelebrantsProps {
  isAdmin?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarWithCelebrants({ isAdmin = false }: CalendarWithCelebrantsProps) {
  // Current view date state (Defaults to October 2026 or current month)
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    // Default to Oct 2026 if current year is 2026, otherwise today
    return new Date(2026, 9, 1);
  });

  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);

  // Loaded Data States
  const [couples, setCouples] = useState<DirectoryCouple[]>([]);
  const [events, setEvents] = useState<ChapterEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Right Side Panel Filter State
  const [panelViewMode, setPanelViewMode] = useState<'month' | 'day'>('month');
  const [celebrantFilter, setCelebrantFilter] = useState<'ALL' | 'BIRTHDAYS' | 'ANNIVERSARIES' | 'EVENTS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Add/Edit Event Modal State (Admin)
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDateStr, setEventDateStr] = useState('2026-10-18');
  const [eventTime, setEventTime] = useState('6:00 PM - 9:00 PM');
  const [eventLocation, setEventLocation] = useState('Tuy, Batangas');
  const [eventMinistry, setEventMinistry] = useState<MinistryType | 'ALL'>('CFC');
  const [eventCategory, setEventCategory] = useState<ChapterEvent['category']>('Assembly');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Selected Couple / Event Detail Modal
  const [detailCouple, setDetailCouple] = useState<DirectoryCouple | null>(null);
  const [detailEvent, setDetailEvent] = useState<ChapterEvent | null>(null);
  const [greetingCardCouple, setGreetingCardCouple] = useState<DirectoryCouple | null>(null);
  const [birthdayCardCelebrant, setBirthdayCardCelebrant] = useState<BirthdayCelebrantData | DirectoryCouple | null>(null);
  const [birthdayCardGender, setBirthdayCardGender] = useState<'husband' | 'wife'>('husband');

  // Fetch Directory Couples & Events on Mount
  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const [couplesData, eventsData] = await Promise.all([
          fetchDirectoryCouples(),
          fetchEvents(),
        ]);
        setCouples(couplesData);
        setEvents(eventsData);
      } catch (err) {
        console.error('Failed to load calendar data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  const viewYear = currentDate.getFullYear();
  const viewMonth = currentDate.getMonth(); // 0-indexed (0 = Jan, 9 = Oct)

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(viewYear, viewMonth - 1, 1));
    setSelectedDayNumber(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(viewYear, viewMonth + 1, 1));
    setSelectedDayNumber(null);
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date(2026, 9, 1));
    setSelectedDayNumber(18);
  };

  // ---------------------------------------------------------------------------
  // PROCESS BIRTHDAYS & ANNIVERSARIES FROM DIRECTORY COUPLES
  // ---------------------------------------------------------------------------
  const { birthdaysList, anniversariesList } = useMemo(() => {
    const bdays: CelebrantBirthday[] = [];
    const annivs: CelebrantAnniversary[] = [];

    couples.forEach((c) => {
      // Husband Birthday
      if (c.husbandBirthday) {
        const parts = c.husbandBirthday.split('-');
        if (parts.length >= 2) {
          const m = parseInt(parts[parts.length === 3 ? 1 : 0], 10);
          const d = parseInt(parts[parts.length === 3 ? 2 : 1], 10);
          const y = parts.length === 3 ? parseInt(parts[0], 10) : undefined;
          if (!isNaN(m) && !isNaN(d)) {
            bdays.push({
              id: `${c.id}-husband-bday`,
              type: 'husband_birthday',
              personName: `Bro. ${c.husbandFirstName} ${c.husbandLastName}`,
              nickname: c.husbandNickname,
              photoUrl: c.husbandPhotoUrl,
              birthdayDate: c.husbandBirthday,
              month: m,
              day: d,
              birthYear: y,
              couple: c,
            });
          }
        }
      }

      // Wife Birthday
      if (c.wifeBirthday) {
        const parts = c.wifeBirthday.split('-');
        if (parts.length >= 2) {
          const m = parseInt(parts[parts.length === 3 ? 1 : 0], 10);
          const d = parseInt(parts[parts.length === 3 ? 2 : 1], 10);
          const y = parts.length === 3 ? parseInt(parts[0], 10) : undefined;
          if (!isNaN(m) && !isNaN(d)) {
            bdays.push({
              id: `${c.id}-wife-bday`,
              type: 'wife_birthday',
              personName: `Sis. ${c.wifeFirstName} ${c.husbandLastName || c.wifeLastName}`,
              nickname: c.wifeNickname,
              photoUrl: c.wifePhotoUrl,
              birthdayDate: c.wifeBirthday,
              month: m,
              day: d,
              birthYear: y,
              couple: c,
            });
          }
        }
      }

      // Wedding Anniversary
      if (c.weddingAnniversary) {
        const parts = c.weddingAnniversary.split('-');
        if (parts.length >= 2) {
          const m = parseInt(parts[parts.length === 3 ? 1 : 0], 10);
          const d = parseInt(parts[parts.length === 3 ? 2 : 1], 10);
          const y = parts.length === 3 ? parseInt(parts[0], 10) : undefined;
          if (!isNaN(m) && !isNaN(d)) {
            annivs.push({
              id: `${c.id}-wedding-anniv`,
              husbandName: c.husbandFirstName,
              wifeName: c.wifeFirstName,
              husbandNickname: c.husbandNickname,
              wifeNickname: c.wifeNickname,
              couplePhotoUrl: c.couplePhotoUrl,
              husbandPhotoUrl: c.husbandPhotoUrl,
              wifePhotoUrl: c.wifePhotoUrl,
              anniversaryDate: c.weddingAnniversary,
              month: m,
              day: d,
              weddingYear: y,
              couple: c,
            });
          }
        }
      }
    });

    return { birthdaysList: bdays, anniversariesList: annivs };
  }, [couples]);

  // ---------------------------------------------------------------------------
  // FILTER CELEBRANTS FOR CURRENT MONTH & SELECTED DAY
  // ---------------------------------------------------------------------------
  const currentMonthNum = viewMonth + 1; // 1-indexed

  // Month-wide lists
  const monthBirthdays = useMemo(() => {
    return birthdaysList
      .filter((b) => b.month === currentMonthNum)
      .sort((a, b) => a.day - b.day);
  }, [birthdaysList, currentMonthNum]);

  const monthAnniversaries = useMemo(() => {
    return anniversariesList
      .filter((a) => a.month === currentMonthNum)
      .sort((a, b) => a.day - b.day);
  }, [anniversariesList, currentMonthNum]);

  const monthEvents = useMemo(() => {
    return events
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, viewYear, viewMonth]);

  // Filtered Celebrants & Events (Search & Tab filtering for right panel)
  const filteredPanelBirthdays = useMemo(() => {
    const list = panelViewMode === 'day' && selectedDayNumber
      ? monthBirthdays.filter((b) => b.day === selectedDayNumber)
      : monthBirthdays;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (b) =>
        b.personName.toLowerCase().includes(q) ||
        (b.nickname && b.nickname.toLowerCase().includes(q)) ||
        b.couple.barangay.toLowerCase().includes(q)
    );
  }, [monthBirthdays, panelViewMode, selectedDayNumber, searchQuery]);

  const filteredPanelAnniversaries = useMemo(() => {
    const list = panelViewMode === 'day' && selectedDayNumber
      ? monthAnniversaries.filter((a) => a.day === selectedDayNumber)
      : monthAnniversaries;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.husbandName.toLowerCase().includes(q) ||
        a.wifeName.toLowerCase().includes(q) ||
        a.couple.husbandLastName.toLowerCase().includes(q) ||
        a.couple.barangay.toLowerCase().includes(q)
    );
  }, [monthAnniversaries, panelViewMode, selectedDayNumber, searchQuery]);

  const filteredPanelEvents = useMemo(() => {
    const list = panelViewMode === 'day' && selectedDayNumber
      ? monthEvents.filter((e) => new Date(e.date).getDate() === selectedDayNumber)
      : monthEvents;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [monthEvents, panelViewMode, selectedDayNumber, searchQuery]);

  // ---------------------------------------------------------------------------
  // GENERATE MONTH CALENDAR DAYS GRID
  // ---------------------------------------------------------------------------
  const calendarGridDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
        isPrevMonth: true,
        fullDate: new Date(viewYear, viewMonth - 1, prevMonthDays - i),
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        fullDate: new Date(viewYear, viewMonth, d),
      });
    }

    // Next month padding days to complete 6-row or 5-row grid (42 or 35 cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      days.push({
        dayNumber: n,
        isCurrentMonth: false,
        isNextMonth: true,
        fullDate: new Date(viewYear, viewMonth + 1, n),
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Handle Event Submit (Admin)
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDateStr) return;

    try {
      setIsSubmittingEvent(true);
      const newEvt = await saveEvent({
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        date: eventDateStr,
        time: eventTime.trim(),
        location: eventLocation.trim(),
        ministry: eventMinistry,
        category: eventCategory,
      });

      setEvents((prev) => [newEvt, ...prev.filter((item) => item.id !== newEvt.id)]);
      setShowAddEventModal(false);
      setEventTitle('');
      setEventDesc('');
    } catch (err) {
      console.error('Failed to create event:', err);
      alert('Could not save event.');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // Handle Delete Event (Admin)
  const handleDeleteEventClick = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this chapter event?')) return;
    try {
      await deleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setDetailEvent(null);
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* TOP BAR / PAGE TITLE & ACTIONS                                       */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#243c81] text-xs font-bold uppercase tracking-wider mb-2">
            <CalendarIcon className="w-3.5 h-3.5 text-[#243c81]" />
            <span>Tuy Pastoral Calendar &amp; Celebrants</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Events, Birthdays &amp; Anniversaries
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Interactive monthly calendar showcasing chapter assemblies, CLP talks, member birthdays, and wedding anniversaries with photos.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                if (selectedDayNumber) {
                  const mStr = String(viewMonth + 1).padStart(2, '0');
                  const dStr = String(selectedDayNumber).padStart(2, '0');
                  setEventDateStr(`${viewYear}-${mStr}-${dStr}`);
                }
                setShowAddEventModal(true);
              }}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Event / Activity</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleGoToToday}
            className="px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#243c81] font-bold text-xs sm:text-sm transition-all"
          >
            Today (Oct 2026)
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN LAYOUT: LEFT CALENDAR GRID (7 COLUMNS) + RIGHT CELEBRANTS PANEL   */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =================================================================-- */}
        {/* LEFT COLUMN: MONTHLY CALENDAR GRID (LG: COL-SPAN-7 OR 8)             */}
        {/* =================================================================-- */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          {/* Month & Navigation Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{MONTH_NAMES[viewMonth]}</span>
                <span className="text-blue-700 font-black">{viewYear}</span>
              </h2>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                {monthBirthdays.length + monthAnniversaries.length} Celebrants
              </span>
            </div>

            {/* Navigation Buttons & Month Selector */}
            <div className="flex items-center gap-2">
              <select
                value={viewMonth}
                onChange={(e) => setCurrentDate(new Date(viewYear, parseInt(e.target.value, 10), 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value, 10), viewMonth, 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 cursor-pointer"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg text-slate-700 hover:bg-white transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg text-slate-700 hover:bg-white transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Legend Bar */}
          <div className="flex items-center gap-4 flex-wrap text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
              <span>🎂 Birthdays</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
              <span>💍 Anniversaries</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs" />
              <span>📅 Events</span>
            </div>
          </div>

          {/* 7-COLUMNS CALENDAR GRID */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
            {/* Days of Week Header */}
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="py-2 text-[11px] sm:text-xs font-black uppercase text-slate-400 tracking-wider"
              >
                {day}
              </div>
            ))}

            {/* Date Cells */}
            {calendarGridDays.map((cell, idx) => {
              const { dayNumber, isCurrentMonth, fullDate } = cell;

              if (!isCurrentMonth) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[75px] sm:min-h-[95px] p-1.5 sm:p-2 rounded-2xl bg-slate-50/50 border border-slate-100 text-slate-300 text-xs font-medium pointer-events-none select-none"
                  >
                    <span>{dayNumber}</span>
                  </div>
                );
              }

              // Find birthdays, anniversaries, and events for this specific day
              const dayBirthdays = monthBirthdays.filter((b) => b.day === dayNumber);
              const dayAnniversaries = monthAnniversaries.filter((a) => a.day === dayNumber);
              const dayEvents = monthEvents.filter((e) => new Date(e.date).getDate() === dayNumber);

              const hasItems = dayBirthdays.length > 0 || dayAnniversaries.length > 0 || dayEvents.length > 0;
              const isSelected = selectedDayNumber === dayNumber;
              const isToday =
                viewYear === 2026 && viewMonth === 9 && dayNumber === 18;

              return (
                <div
                  key={`day-${dayNumber}`}
                  onClick={() => {
                    setSelectedDayNumber(dayNumber);
                    setPanelViewMode('day');
                  }}
                  className={`min-h-[80px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-blue-50/90 border-[#243c81] shadow-md ring-2 ring-[#243c81]/20'
                      : isToday
                      ? 'bg-amber-50/80 border-amber-300 hover:border-amber-400'
                      : hasItems
                      ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm'
                      : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {/* Top Cell Row (Date Number + Badges) */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                        isSelected
                          ? 'bg-[#243c81] text-white'
                          : isToday
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-800 group-hover:text-[#243c81]'
                      }`}
                    >
                      {dayNumber}
                    </span>

                    {/* Indicators Dot Count */}
                    {hasItems && (
                      <div className="flex items-center gap-0.5">
                        {dayBirthdays.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-2xs" />
                        )}
                        {dayAnniversaries.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-2xs" />
                        )}
                        {dayEvents.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shadow-2xs" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Day Content Badges Preview */}
                  <div className="space-y-1 mt-1">
                    {/* Birthdays Preview */}
                    {dayBirthdays.map((b) => (
                      <div
                        key={b.id}
                        className="px-1.5 py-0.5 rounded-lg bg-amber-100/90 text-amber-900 border border-amber-200 text-[10px] font-black truncate flex items-center gap-1 shadow-2xs"
                        title={`🎂 ${b.personName}`}
                      >
                        <Cake className="w-3 h-3 text-amber-700 shrink-0" />
                        <span className="truncate">{b.nickname || b.personName.split(' ')[1]}</span>
                      </div>
                    ))}

                    {/* Anniversaries Preview */}
                    {dayAnniversaries.map((a) => (
                      <div
                        key={a.id}
                        className="px-1.5 py-0.5 rounded-lg bg-rose-100/90 text-rose-900 border border-rose-200 text-[10px] font-black truncate flex items-center gap-1 shadow-2xs"
                        title={`💍 ${a.husbandName} & ${a.wifeName} Anniversary`}
                      >
                        <Heart className="w-3 h-3 text-rose-600 fill-rose-600 shrink-0" />
                        <span className="truncate">
                          {a.husbandNickname || a.husbandName} &amp; {a.wifeNickname || a.wifeName}
                        </span>
                      </div>
                    ))}

                    {/* Events Preview */}
                    {dayEvents.map((e) => (
                      <div
                        key={e.id}
                        className="px-1.5 py-0.5 rounded-lg bg-blue-100/90 text-blue-900 border border-blue-200 text-[10px] font-black truncate flex items-center gap-1 shadow-2xs"
                        title={`📅 ${e.title}`}
                      >
                        <CalendarIcon className="w-3 h-3 text-[#243c81] shrink-0" />
                        <span className="truncate">{e.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =================================================================-- */}
        {/* RIGHT COLUMN: LIST OF CELEBRANTS & EVENTS WITH PICTURES             */}
        {/* =================================================================-- */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header & View Mode Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 flex items-center justify-center shrink-0">
                  <PartyPopper className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-snug">
                    {panelViewMode === 'day' && selectedDayNumber
                      ? `${MONTH_NAMES[viewMonth]} ${selectedDayNumber} Celebrants`
                      : `${MONTH_NAMES[viewMonth]} Celebrants`}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Birthdays &amp; Wedding Anniversaries
                  </p>
                </div>
              </div>

              {/* Toggle Month vs Day */}
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold flex items-center">
                <button
                  type="button"
                  onClick={() => setPanelViewMode('month')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    panelViewMode === 'month'
                      ? 'bg-white text-[#243c81] shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setPanelViewMode('day')}
                  disabled={!selectedDayNumber}
                  className={`px-2.5 py-1 rounded-lg transition-all disabled:opacity-40 ${
                    panelViewMode === 'day'
                      ? 'bg-white text-[#243c81] shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Day {selectedDayNumber ? `(${selectedDayNumber})` : ''}
                </button>
              </div>
            </div>

            {/* Filter Tabs: ALL, BIRTHDAYS, ANNIVERSARIES, EVENTS */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setCelebrantFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  celebrantFilter === 'ALL'
                    ? 'bg-[#243c81] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setCelebrantFilter('BIRTHDAYS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                  celebrantFilter === 'BIRTHDAYS'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                <Cake className="w-3.5 h-3.5" />
                <span>Birthdays ({filteredPanelBirthdays.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCelebrantFilter('ANNIVERSARIES')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                  celebrantFilter === 'ANNIVERSARIES'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200/60'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Anniversaries ({filteredPanelAnniversaries.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCelebrantFilter('EVENTS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                  celebrantFilter === 'EVENTS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200/60'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Events ({filteredPanelEvents.length})</span>
              </button>
            </div>

            {/* Search Filter Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search celebrant name, barangay..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* LIST SCROLL CONTAINER */}
            <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
              {/* ------------------------------------------------------------ */}
              {/* 1. BIRTHDAYS SECTION WITH PICTURES                           */}
              {/* ------------------------------------------------------------ */}
              {(celebrantFilter === 'ALL' || celebrantFilter === 'BIRTHDAYS') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <Cake className="w-3.5 h-3.5 text-amber-600" />
                      Birthdays ({filteredPanelBirthdays.length})
                    </span>
                  </div>

                  {filteredPanelBirthdays.length === 0 ? (
                    <div className="p-4 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-400">
                      No birthdays recorded for this view.
                    </div>
                  ) : (
                    filteredPanelBirthdays.map((bday) => {
                      const age = bday.birthYear ? viewYear - bday.birthYear : null;
                      return (
                        <div
                          key={bday.id}
                          className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/80 via-white to-white border border-amber-200/80 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                        >
                          {/* Celebrant Picture & Details */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-950 font-black flex items-center justify-center shrink-0 border-2 border-white shadow-xs overflow-hidden">
                              {bday.photoUrl ? (
                                <img
                                  src={bday.photoUrl}
                                  alt={bday.personName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-black">
                                  {bday.personName.replace(/^(Bro\.|Sis\.)\s*/, '').charAt(0)}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-amber-700 transition-colors">
                                {bday.personName}
                              </h4>

                              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 mt-0.5">
                                <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                                  {MONTH_NAMES[bday.month - 1]} {bday.day}
                                </span>
                                {age && (
                                  <span className="font-bold text-slate-700">
                                    Turns {age} yrs
                                  </span>
                                )}
                              </div>

                              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                {bday.couple.householdGroupName || `${bday.couple.barangay}, Tuy`}
                              </p>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setBirthdayCardCelebrant(bday);
                                setBirthdayCardGender(bday.type === 'wife_birthday' ? 'wife' : 'husband');
                              }}
                              className="p-1.5 sm:p-2 rounded-xl bg-amber-100/80 text-amber-900 hover:bg-amber-200 transition-colors flex items-center gap-1 text-xs font-bold"
                              title="Generate Birthday Greeting Card"
                            >
                              <IdCard className="w-4 h-4 text-amber-700" />
                              <span className="hidden sm:inline">Card</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDetailCouple(bday.couple)}
                              className="p-2 rounded-xl bg-amber-100/60 text-amber-900 hover:bg-amber-200 transition-colors"
                              title="View Pastoral Record"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* 2. WEDDING ANNIVERSARIES SECTION WITH PICTURES               */}
              {/* ------------------------------------------------------------ */}
              {(celebrantFilter === 'ALL' || celebrantFilter === 'ANNIVERSARIES') && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                      Wedding Anniversaries ({filteredPanelAnniversaries.length})
                    </span>
                  </div>

                  {filteredPanelAnniversaries.length === 0 ? (
                    <div className="p-4 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-400">
                      No anniversaries recorded for this view.
                    </div>
                  ) : (
                    filteredPanelAnniversaries.map((anniv) => {
                      const years = anniv.weddingYear ? viewYear - anniv.weddingYear : null;
                      return (
                        <div
                          key={anniv.id}
                          className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50/80 via-white to-white border border-rose-200/80 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                        >
                          {/* Couple Picture & Details */}
                          <div className="flex items-center gap-3 min-w-0">
                            {anniv.couplePhotoUrl ? (
                              <div className="w-12 h-12 rounded-2xl bg-rose-100 overflow-hidden shrink-0 border-2 border-white shadow-xs">
                                <img
                                  src={anniv.couplePhotoUrl}
                                  alt="Couple"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              /* Side-by-Side Dual Avatars */
                              <div className="flex items-center -space-x-2 shrink-0">
                                <div className="w-9 h-9 rounded-full bg-blue-100 text-[#243c81] font-black flex items-center justify-center border-2 border-white text-xs overflow-hidden shadow-xs">
                                  {anniv.husbandPhotoUrl ? (
                                    <img src={anniv.husbandPhotoUrl} alt="Husband" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{anniv.husbandName.charAt(0)}</span>
                                  )}
                                </div>
                                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-800 font-black flex items-center justify-center border-2 border-white text-xs overflow-hidden shadow-xs">
                                  {anniv.wifePhotoUrl ? (
                                    <img src={anniv.wifePhotoUrl} alt="Wife" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{anniv.wifeName.charAt(0)}</span>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-rose-700 transition-colors">
                                Bro. {anniv.husbandName} &amp; Sis. {anniv.wifeName} {anniv.couple.husbandLastName}
                              </h4>

                              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 mt-0.5">
                                <span className="px-2 py-0.2 rounded-full bg-rose-100 text-rose-900 font-bold text-[10px]">
                                  {MONTH_NAMES[anniv.month - 1]} {anniv.day}
                                </span>
                                {years && (
                                  <span className="font-extrabold text-rose-700">
                                    {years}th Anniversary 🎉
                                  </span>
                                )}
                              </div>

                              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                {anniv.couple.householdGroupName || `${anniv.couple.barangay}, Tuy`}
                              </p>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setGreetingCardCouple(anniv.couple)}
                              className="p-1.5 sm:p-2 rounded-xl bg-amber-100/80 text-amber-900 hover:bg-amber-200 transition-colors flex items-center gap-1 text-xs font-bold"
                              title="Generate Greeting Card"
                            >
                              <IdCard className="w-4 h-4 text-amber-700" />
                              <span className="hidden sm:inline">Card</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDetailCouple(anniv.couple)}
                              className="p-2 rounded-xl bg-rose-100/60 text-rose-900 hover:bg-rose-200 transition-colors"
                              title="View Pastoral Record"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* 3. SCHEDULED CHAPTER EVENTS SECTION                          */}
              {/* ------------------------------------------------------------ */}
              {(celebrantFilter === 'ALL' || celebrantFilter === 'EVENTS') && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#243c81]" />
                      Scheduled Chapter Events ({filteredPanelEvents.length})
                    </span>
                  </div>

                  {filteredPanelEvents.length === 0 ? (
                    <div className="p-4 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-400">
                      No chapter events scheduled for this view.
                    </div>
                  ) : (
                    filteredPanelEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-white border border-blue-200/80 shadow-2xs hover:shadow-md transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-[#243c81] border border-blue-200">
                            {evt.category} • {evt.ministry}
                          </span>

                          <span className="text-[10px] font-bold text-slate-500">
                            {new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#243c81] transition-colors leading-snug">
                          {evt.title}
                        </h4>

                        <div className="space-y-1 text-[11px] text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-[#243c81] shrink-0" />
                            <span>{evt.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => setDetailEvent(evt)}
                            className="text-[#243c81] hover:underline font-bold text-[11px] flex items-center gap-1"
                          >
                            <span>View Details</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEventClick(evt.id)}
                              className="text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50"
                              title="Delete Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: ADD EVENT MODAL (ADMIN MODE)                                 */}
      {/* ===================================================================== */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-[#243c81] px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-base">Schedule New Chapter Event</h3>
                  <p className="text-[11px] text-blue-200">CFC Tuy Pastoral Roster &amp; Calendar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEventModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Monthly General Assembly, Youth Camp..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventDateStr}
                    onChange={(e) => setEventDateStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Schedule</label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="e.g. 6:00 PM - 9:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ministry</label>
                  <select
                    value={eventMinistry}
                    onChange={(e) => setEventMinistry(e.target.value as MinistryType | 'ALL')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold cursor-pointer"
                  >
                    <option value="ALL">All Ministries</option>
                    <option value="CFC">Couples for Christ (CFC)</option>
                    <option value="SFC">Singles for Christ (SFC)</option>
                    <option value="YFC">Youth for Christ (YFC)</option>
                    <option value="KFC">Kids for Christ (KFC)</option>
                    <option value="HOLD">Handmaids of the Lord (HOLD)</option>
                    <option value="SOLD">Servants of the Lord (SOLD)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as ChapterEvent['category'])}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold cursor-pointer"
                  >
                    <option value="Assembly">Assembly</option>
                    <option value="CLP">CLP Session</option>
                    <option value="Household">Household</option>
                    <option value="Fellowship">Fellowship</option>
                    <option value="Conference">Conference</option>
                    <option value="Service">Service / Mass</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Venue Location</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g. St. Vincent Ferrer Parish Pastoral Center, Tuy..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Pastoral Notes</label>
                <textarea
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Additional details regarding program, speaker, or materials..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className="px-5 py-2.5 rounded-xl bg-[#243c81] text-white font-black hover:bg-blue-900 shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmittingEvent ? 'Saving...' : 'Save Chapter Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: PASTORAL MEMBER / COUPLE RECORD DETAIL MODAL                */}
      {/* ===================================================================== */}
      {detailCouple && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-[#243c81] p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-black text-lg">
                  {detailCouple.husbandLastName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    Bro. {detailCouple.husbandFirstName} &amp; Sis. {detailCouple.wifeFirstName} {detailCouple.husbandLastName}
                  </h3>
                  <p className="text-xs text-blue-200">
                    {detailCouple.ministry} Ministry • {detailCouple.barangay}, Tuy
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailCouple(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Husband</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">
                    {detailCouple.husbandFirstName} {detailCouple.husbandLastName}
                  </p>
                  {detailCouple.husbandNickname && (
                    <p className="text-amber-800 font-bold">&quot;{detailCouple.husbandNickname}&quot;</p>
                  )}
                  {detailCouple.husbandBirthday && (
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-slate-600 font-medium flex items-center gap-1 text-xs">
                        <Cake className="w-3.5 h-3.5 text-amber-600" />
                        <span>{detailCouple.husbandBirthday}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setBirthdayCardCelebrant(detailCouple);
                          setBirthdayCardGender('husband');
                        }}
                        className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Generate Birthday Card"
                      >
                        <IdCard className="w-3 h-3 text-amber-700" />
                        <span>Card</span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Wife</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">
                    {detailCouple.wifeFirstName} {detailCouple.wifeLastName}
                  </p>
                  {detailCouple.wifeNickname && (
                    <p className="text-rose-800 font-bold">&quot;{detailCouple.wifeNickname}&quot;</p>
                  )}
                  {detailCouple.wifeBirthday && (
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-slate-600 font-medium flex items-center gap-1 text-xs">
                        <Cake className="w-3.5 h-3.5 text-amber-600" />
                        <span>{detailCouple.wifeBirthday}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setBirthdayCardCelebrant(detailCouple);
                          setBirthdayCardGender('wife');
                        }}
                        className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Generate Birthday Card"
                      >
                        <IdCard className="w-3 h-3 text-amber-700" />
                        <span>Card</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {detailCouple.weddingAnniversary && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-900">
                  <span className="font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                    <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                    Wedding Anniversary: <span className="font-black">{detailCouple.weddingAnniversary}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setGreetingCardCouple(detailCouple)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-black text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <IdCard className="w-4 h-4" />
                    <span>Greeting Card</span>
                  </button>
                </div>
              )}

              <div className="space-y-1.5 text-slate-700 font-medium">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Household Group:</span>
                  <span className="font-black text-slate-900">{detailCouple.householdGroupName || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Barangay Location:</span>
                  <span className="font-bold text-slate-900">{detailCouple.barangay}, Tuy</span>
                </div>
                {(detailCouple.husbandContact || detailCouple.wifeContact) && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Contact Number:</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {detailCouple.husbandContact || detailCouple.wifeContact}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setDetailCouple(null)}
                  className="px-5 py-2 rounded-xl bg-[#243c81] text-white font-bold text-xs shadow-xs"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: CHAPTER EVENT DETAIL MODAL                                   */}
      {/* ===================================================================== */}
      {detailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-[#243c81] p-6 text-white flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950">
                  {detailEvent.category} • {detailEvent.ministry}
                </span>
                <h3 className="font-black text-base sm:text-lg mt-1.5 leading-snug">
                  {detailEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailEvent(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-2 text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#243c81] shrink-0" />
                  <span className="font-bold text-slate-900">
                    {new Date(detailEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#243c81] shrink-0" />
                  <span>{detailEvent.time}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{detailEvent.location}</span>
                </div>
              </div>

              {detailEvent.description && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed">
                  {detailEvent.description}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detailEvent.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-50 text-[#243c81] font-bold text-xs flex items-center gap-1.5"
                >
                  <span>Directions Map</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setDetailEvent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANNIVERSARY GREETING CARD MODAL */}
      <AnniversaryGreetingCardModal
        isOpen={!!greetingCardCouple}
        onClose={() => setGreetingCardCouple(null)}
        couple={greetingCardCouple}
      />

      {/* BIRTHDAY GREETING CARD MODAL */}
      <BirthdayGreetingCardModal
        isOpen={!!birthdayCardCelebrant}
        onClose={() => setBirthdayCardCelebrant(null)}
        celebrant={birthdayCardCelebrant}
        targetPerson={birthdayCardGender}
      />
    </div>
  );
}
