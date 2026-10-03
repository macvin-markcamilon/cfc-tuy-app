'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { CLPCouple, CLPProgram } from '@/types';
import TuyParticipantsLeafletMap from '@/components/map/TuyParticipantsLeafletMap';
import { generateComprehensivePdfReport } from '@/lib/reports/generateComprehensivePdfReport';
import { TUY_BARANGAYS, TUY_CENTER_COORDINATES } from '@/lib/data/mock-data';
import {
  X,
  FileText,
  Printer,
  Search,
  MapPin,
  Heart,
  Phone,
  Compass,
  ExternalLink,
  Users,
  Map as MapIcon,
  List,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  Crosshair,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Filter,
  RotateCcw,
  Navigation,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  loadGoogleMaps,
  toLatLngLiteral,
  isGoogleMapsKeyValid,
  onGoogleMapsAuthError,
} from '@/lib/maps/googleMapsLoader';

export interface AgeBracketInfo {
  key: string;
  label: string;
  sublabel: string;
  range: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
}

export const REPORT_AGE_BRACKETS: AgeBracketInfo[] = [
  {
    key: '20-30',
    label: '20–30 yrs',
    sublabel: 'Young Adults',
    range: 'Ages 20 to 30',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    accentColor: '#059669',
  },
  {
    key: '31-40',
    label: '31–40 yrs',
    sublabel: 'Young Couples',
    range: 'Ages 31 to 40',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    accentColor: '#2563eb',
  },
  {
    key: '41-50',
    label: '41–50 yrs',
    sublabel: 'Prime Family',
    range: 'Ages 41 to 50',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    accentColor: '#7c3aed',
  },
  {
    key: '51-60',
    label: '51–60 yrs',
    sublabel: 'Mature Adults',
    range: 'Ages 51 to 60',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    accentColor: '#d97706',
  },
  {
    key: '61-plus',
    label: '61+ yrs',
    sublabel: 'Senior Elders',
    range: 'Ages 61 and above',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    accentColor: '#e11d48',
  },
  {
    key: 'unknown',
    label: 'Age N/A',
    sublabel: 'Unspecified',
    range: 'Birthday not provided',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-200',
    accentColor: '#64748b',
  },
];

export function computeAgeNumber(birthdateStr?: string): number | null {
  if (!birthdateStr) return null;
  const birth = new Date(birthdateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 && age < 130 ? age : null;
}

export function computeAgeString(birthdateStr?: string): string {
  const age = computeAgeNumber(birthdateStr);
  return age !== null ? String(age) : '—';
}

export function getCoupleAgeBracketKey(birthdateStr?: string): string {
  const age = computeAgeNumber(birthdateStr);
  if (age === null) return 'unknown';
  if (age <= 30) return '20-30';
  if (age <= 40) return '31-40';
  if (age <= 50) return '41-50';
  if (age <= 60) return '51-60';
  return '61-plus';
}

export function computeYearsMarried(annivStr?: string): string {
  if (!annivStr) return '—';
  const anniv = new Date(annivStr);
  if (isNaN(anniv.getTime())) return '—';
  const today = new Date();
  let years = today.getFullYear() - anniv.getFullYear();
  const m = today.getMonth() - anniv.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < anniv.getDate())) {
    years--;
  }
  return years >= 0 ? `${years} yrs` : '—';
}

function buildMarkerPinSvg(couple: CLPCouple, isSelected: boolean): string {
  const bg = isSelected ? '#D97706' : '#243c81';
  const initials = `${couple.husbandFirstName.charAt(0)}${couple.wifeFirstName.charAt(0)}`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <defs>
        <filter id="cShadow" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.38"/>
        </filter>
      </defs>
      <path d="M18 44 C18 44, 33 26, 33 17 A15 15 0 0 0 3 17 C3 26, 18 44, 18 44 Z" fill="${bg}" stroke="#FFFFFF" stroke-width="2.5" filter="url(#cShadow)"/>
      <circle cx="18" cy="17" r="10.5" fill="#FFFFFF"/>
      <text x="18" y="20.5" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="9" fill="${bg}">${initials}</text>
    </svg>
  `)}`;
}

interface CLPInviteeFullReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClp: CLPProgram | null;
  couples: CLPCouple[];
  onTriggerToast?: (message: string) => void;
}

export default function CLPInviteeFullReportModal({
  isOpen,
  onClose,
  currentClp,
  couples,
  onTriggerToast,
}: CLPInviteeFullReportModalProps) {
  // Navigation / View Modes
  const [reportViewMode, setReportViewMode] = useState<'split' | 'map' | 'table'>('split');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgeBracket, setFilterAgeBracket] = useState<string>('ALL');
  const [filterSpouseScope, setFilterSpouseScope] = useState<'either' | 'husband' | 'wife'>('either');
  const [filterBarangay, setFilterBarangay] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'hAge-asc' | 'hAge-desc' | 'brgy-asc'>('name-asc');

  // Selected couple for map inspection
  const [selectedCoupleId, setSelectedCoupleId] = useState<string | null>(null);

  // Google Maps State
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [authError, setAuthError] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    return onGoogleMapsAuthError(() => {
      setAuthError(true);
    });
  }, []);

  const isGoogleMapsActive = isGoogleMapsKeyValid();

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Demographic Statistics (Calculated across all couples in batch)
  const demographics = useMemo(() => {
    const totalCouples = couples.length;
    const totalIndividuals = totalCouples * 2;

    const husbandAges: number[] = [];
    const wifeAges: number[] = [];

    // Tally by bracket
    const bracketCounts: Record<
      string,
      { husbands: number; wives: number; total: number; percentage: number }
    > = {
      '20-30': { husbands: 0, wives: 0, total: 0, percentage: 0 },
      '31-40': { husbands: 0, wives: 0, total: 0, percentage: 0 },
      '41-50': { husbands: 0, wives: 0, total: 0, percentage: 0 },
      '51-60': { husbands: 0, wives: 0, total: 0, percentage: 0 },
      '61-plus': { husbands: 0, wives: 0, total: 0, percentage: 0 },
      unknown: { husbands: 0, wives: 0, total: 0, percentage: 0 },
    };

    // Tally by barangay
    const barangayCounts: Record<string, number> = {};

    couples.forEach((c) => {
      const hAge = computeAgeNumber(c.husbandBirthday);
      const wAge = computeAgeNumber(c.wifeBirthday);

      if (hAge !== null) husbandAges.push(hAge);
      if (wAge !== null) wifeAges.push(wAge);

      const hBracket = getCoupleAgeBracketKey(c.husbandBirthday);
      const wBracket = getCoupleAgeBracketKey(c.wifeBirthday);

      if (bracketCounts[hBracket]) bracketCounts[hBracket].husbands++;
      if (bracketCounts[wBracket]) bracketCounts[wBracket].wives++;

      const brgy = c.barangay || 'Tuy Proper';
      barangayCounts[brgy] = (barangayCounts[brgy] || 0) + 1;
    });

    Object.keys(bracketCounts).forEach((key) => {
      const b = bracketCounts[key];
      b.total = b.husbands + b.wives;
      b.percentage = totalIndividuals > 0 ? Math.round((b.total / totalIndividuals) * 100) : 0;
    });

    const avgHusbandAge =
      husbandAges.length > 0
        ? Math.round(husbandAges.reduce((a, b) => a + b, 0) / husbandAges.length)
        : null;
    const avgWifeAge =
      wifeAges.length > 0
        ? Math.round(wifeAges.reduce((a, b) => a + b, 0) / wifeAges.length)
        : null;
    const allAges = [...husbandAges, ...wifeAges];
    const avgOverallAge =
      allAges.length > 0 ? Math.round(allAges.reduce((a, b) => a + b, 0) / allAges.length) : null;

    const sortedBarangays = Object.entries(barangayCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalCouples > 0 ? Math.round((count / totalCouples) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const activeCouplesCount = couples.filter((c) => (c.status || 'Active') === 'Active').length;

    return {
      totalCouples,
      totalIndividuals,
      activeCouplesCount,
      avgHusbandAge,
      avgWifeAge,
      avgOverallAge,
      bracketCounts,
      sortedBarangays,
    };
  }, [couples]);

  // Filtered and Sorted couples
  const filteredCouples = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const list = couples.filter((c) => {
      // Search match
      const matchesSearch =
        !query ||
        c.husbandFirstName.toLowerCase().includes(query) ||
        c.husbandLastName.toLowerCase().includes(query) ||
        c.wifeFirstName.toLowerCase().includes(query) ||
        c.wifeLastName.toLowerCase().includes(query) ||
        c.barangay.toLowerCase().includes(query) ||
        (c.address && c.address.toLowerCase().includes(query)) ||
        (c.husbandContact && c.husbandContact.includes(query)) ||
        (c.wifeContact && c.wifeContact.includes(query));

      // Barangay filter
      const matchesBarangay = filterBarangay === 'ALL' || c.barangay === filterBarangay;

      // Status filter
      const matchesStatus = filterStatus === 'ALL' || (c.status || 'Active') === filterStatus;

      // Age bracket filter
      let matchesAge = true;
      if (filterAgeBracket !== 'ALL') {
        const hBracket = getCoupleAgeBracketKey(c.husbandBirthday);
        const wBracket = getCoupleAgeBracketKey(c.wifeBirthday);

        if (filterSpouseScope === 'husband') {
          matchesAge = hBracket === filterAgeBracket;
        } else if (filterSpouseScope === 'wife') {
          matchesAge = wBracket === filterAgeBracket;
        } else {
          matchesAge = hBracket === filterAgeBracket || wBracket === filterAgeBracket;
        }
      }

      return matchesSearch && matchesBarangay && matchesStatus && matchesAge;
    });

    // Sort
    return list.sort((a, b) => {
      if (sortBy === 'name-asc') {
        const cmp = a.husbandLastName.localeCompare(b.husbandLastName);
        return cmp !== 0 ? cmp : a.husbandFirstName.localeCompare(b.husbandFirstName);
      }
      if (sortBy === 'name-desc') {
        const cmp = b.husbandLastName.localeCompare(a.husbandLastName);
        return cmp !== 0 ? cmp : b.husbandFirstName.localeCompare(a.husbandFirstName);
      }
      if (sortBy === 'hAge-asc') {
        const ageA = computeAgeNumber(a.husbandBirthday) ?? 999;
        const ageB = computeAgeNumber(b.husbandBirthday) ?? 999;
        return ageA - ageB;
      }
      if (sortBy === 'hAge-desc') {
        const ageA = computeAgeNumber(a.husbandBirthday) ?? -1;
        const ageB = computeAgeNumber(b.husbandBirthday) ?? -1;
        return ageB - ageA;
      }
      if (sortBy === 'brgy-asc') {
        return a.barangay.localeCompare(b.barangay);
      }
      return 0;
    });
  }, [
    couples,
    searchQuery,
    filterAgeBracket,
    filterSpouseScope,
    filterBarangay,
    filterStatus,
    sortBy,
  ]);

  // Selected couple reference
  const selectedCouple = useMemo(() => {
    if (!selectedCoupleId) return filteredCouples[0] || null;
    return filteredCouples.find((c) => c.id === selectedCoupleId) || filteredCouples[0] || null;
  }, [selectedCoupleId, filteredCouples]);

  // Map Initialization & Marker Updates
  const updateMapMarkers = useCallback(
    (maps: typeof google.maps, map: google.maps.Map) => {
      // Clear existing markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      if (!filteredCouples.length) return;

      const bounds = new maps.LatLngBounds();

      filteredCouples.forEach((couple) => {
        const isSelected = couple.id === selectedCoupleId;
        const pinSvg = buildMarkerPinSvg(couple, isSelected);

        const marker = new maps.Marker({
          position: toLatLngLiteral(couple.coordinates),
          map,
          title: `Bro. ${couple.husbandFirstName} & Sis. ${couple.wifeFirstName} ${couple.husbandLastName}`,
          icon: {
            url: pinSvg,
            scaledSize: new maps.Size(36, 46),
            anchor: new maps.Point(18, 44),
          },
          zIndex: isSelected ? 999 : 10,
        });

        marker.addListener('click', () => {
          setSelectedCoupleId(couple.id);

          const hAge = computeAgeString(couple.husbandBirthday);
          const wAge = computeAgeString(couple.wifeBirthday);

          const contentString = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 6px 4px; max-width: 270px; color: #0f172a;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 10px; font-weight: 800; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px;">
                  ${couple.status || 'Active'}
                </span>
                <span style="font-size: 11px; font-weight: 700; color: #243c81;">
                  Brgy. ${couple.barangay}
                </span>
              </div>
              <h4 style="font-size: 13px; font-weight: 800; margin: 0 0 4px 0; color: #0f172a; line-height: 1.3;">
                Bro. ${couple.husbandFirstName} &amp; Sis. ${couple.wifeFirstName} ${couple.husbandLastName}
              </h4>
              <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0;">
                Husband: ${hAge} yrs • Wife: ${wAge} yrs
              </p>
              ${
                couple.weddingAnniversary
                  ? `<p style="font-size: 11px; color: #be123c; font-weight: 700; margin: 0 0 6px 0;">
                      ♥ Married: ${couple.weddingAnniversary}
                    </p>`
                  : ''
              }
              <p style="font-size: 10px; color: #64748b; margin: 0 0 8px 0; line-height: 1.3;">
                ${couple.address || `Tuy, Batangas`}
              </p>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 10px; color: #94a3b8;">${couple.coordinates[1].toFixed(4)}°, ${couple.coordinates[0].toFixed(4)}°</span>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${couple.coordinates[1]},${couple.coordinates[0]}" target="_blank" rel="noopener" style="font-size: 11px; font-weight: 700; color: #2563eb; text-decoration: none;">
                  Directions ↗
                </a>
              </div>
            </div>
          `;

          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
          infoWindowRef.current = new maps.InfoWindow({ content: contentString });
          infoWindowRef.current.open(map, marker);
        });

        bounds.extend(toLatLngLiteral(couple.coordinates));
        markersRef.current.push(marker);
      });

      if (!selectedCoupleId && filteredCouples.length > 0) {
        map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
      }
    },
    [filteredCouples, selectedCoupleId]
  );

  // Initialize map when modal is open and in split/map mode
  useEffect(() => {
    if (!isOpen || reportViewMode === 'table') return;
    if (!isGoogleMapsActive || authError || !mapContainerRef.current) return;

    let isMounted = true;

    loadGoogleMaps()
      .then(({ maps }) => {
        if (!isMounted || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const map = new maps.Map(mapContainerRef.current, {
            center: toLatLngLiteral(TUY_CENTER_COORDINATES),
            zoom: 13,
            minZoom: 11,
            maxZoom: 18,
            mapTypeId: maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            mapTypeControlOptions: {
              position: maps.ControlPosition.TOP_RIGHT,
            },
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
          });

          mapInstanceRef.current = map;
        }

        updateMapMarkers(maps, mapInstanceRef.current);
      })
      .catch((err) => {
        console.warn('Google Maps loader warning in full report:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, reportViewMode, isGoogleMapsActive, authError, updateMapMarkers]);

  // Center on selected couple
  const handleSelectCoupleOnMap = (couple: CLPCouple) => {
    setSelectedCoupleId(couple.id);

    if (mapInstanceRef.current && isGoogleMapsActive) {
      mapInstanceRef.current.panTo(toLatLngLiteral(couple.coordinates));
      mapInstanceRef.current.setZoom(16);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterAgeBracket('ALL');
    setFilterSpouseScope('either');
    setFilterBarangay('ALL');
    setFilterStatus('ALL');
    setSortBy('name-asc');
  };

  const isAnyFilterActive =
    searchQuery.trim() !== '' ||
    filterAgeBracket !== 'ALL' ||
    filterBarangay !== 'ALL' ||
    filterStatus !== 'ALL' ||
    sortBy !== 'name-asc';

  // ---------------------------------------------------------------------------
  // Generate & Download Comprehensive PDF Report
  // ---------------------------------------------------------------------------
  const handleDownloadFullPDF = async () => {
    if (!couples.length || !currentClp) {
      if (onTriggerToast) onTriggerToast('No invitee data to generate report.');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      await generateComprehensivePdfReport({
        currentClp,
        couples,
        filteredCouples,
        filterAgeBracket,
        filterBarangay,
        filterStatus,
        onToast: onTriggerToast,
      });
    } catch (err) {
      console.error('Failed to generate full report PDF:', err);
      if (onTriggerToast) {
        onTriggerToast('Failed to download PDF. You can also print the report directly.');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 w-full transition-all duration-300 ${
          isFullScreen ? 'h-[98vh] max-w-[99vw]' : 'h-[92vh] max-w-7xl'
        }`}
      >
        {/* ========================================================================= */}
        {/* TOP MODAL HEADER                                                          */}
        {/* ========================================================================= */}
        <div className="bg-[#243c81] text-white px-6 py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0 text-amber-300 shadow-inner">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Total Invitee Comprehensive Report
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Full Roster &amp; Demographics
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                {currentClp?.name || 'Christian Life Program'} • {currentClp?.venue || 'Tuy, Batangas'} • {demographics.totalCouples} Couples ({demographics.totalIndividuals} Individuals)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setReportViewMode('split')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  reportViewMode === 'split'
                    ? 'bg-white text-[#243c81] shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
                title="Split Map & Table View"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split View</span>
              </button>
              <button
                type="button"
                onClick={() => setReportViewMode('map')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  reportViewMode === 'map'
                    ? 'bg-white text-[#243c81] shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
                title="Full Map View"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>
              <button
                type="button"
                onClick={() => setReportViewMode('table')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  reportViewMode === 'table'
                    ? 'bg-white text-[#243c81] shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
                title="Full Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            {/* Open in Dedicated Page */}
            {currentClp && (
              <Link
                href={`/admin/clp/report?clpId=${currentClp.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md active:scale-95"
                title="Open this comprehensive report in its own dedicated page"
              >
                <span>Open in Dedicated Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadFullPDF}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF File'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all active:scale-95"
              title="Print Current Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all active:scale-95"
              aria-label="Close Report"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KPI OVERVIEW CARDS & DEMOGRAPHICS SUMMARY BAR                             */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Couples */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                  Total Invitees
                </span>
                <span className="text-base font-black text-slate-900 leading-none">
                  {demographics.totalCouples} Couples
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {demographics.totalIndividuals} individuals
                </span>
              </div>
            </div>

            {/* Active Membership */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                  Active Status
                </span>
                <span className="text-base font-black text-emerald-700 leading-none">
                  {demographics.activeCouplesCount}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {demographics.totalCouples > 0
                    ? Math.round((demographics.activeCouplesCount / demographics.totalCouples) * 100)
                    : 0}% active rate
                </span>
              </div>
            </div>

            {/* Average Age */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                  Avg Invitee Age
                </span>
                <span className="text-base font-black text-amber-800 leading-none">
                  {demographics.avgOverallAge ? `${demographics.avgOverallAge} yrs` : '—'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block truncate">
                  H: {demographics.avgHusbandAge || '—'} • W: {demographics.avgWifeAge || '—'}
                </span>
              </div>
            </div>

            {/* Geographic Reach */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                  Tuy Barangays
                </span>
                <span className="text-base font-black text-indigo-900 leading-none">
                  {demographics.sortedBarangays.length} Areas
                </span>
                <span className="text-[10px] text-slate-400 font-medium block truncate">
                  Top: {demographics.sortedBarangays[0]?.name || 'Tuy Proper'}
                </span>
              </div>
            </div>

            {/* Marriages Tracked */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-100">
                <Heart className="w-4 h-4 fill-rose-500" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                  Anniversaries
                </span>
                <span className="text-base font-black text-rose-700 leading-none">
                  {couples.filter((c) => !!c.weddingAnniversary).length}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block truncate">
                  Marriages recorded
                </span>
              </div>
            </div>

            {/* Currently Filtered */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
                <Filter className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                  Active Display
                </span>
                <span className="text-base font-black text-purple-900 leading-none">
                  {filteredCouples.length} Couples
                </span>
                <span className="text-[10px] text-slate-400 font-medium block truncate">
                  {filteredCouples.length * 2} individuals
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE AGE GROUPS FILTER BAR                                         */}
        {/* ========================================================================= */}
        <div className="bg-white px-6 py-3 border-b border-slate-200 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Age Brackets Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[#243c81]" />
                <span>Age Groups:</span>
              </span>

              {/* All Age Groups Button */}
              <button
                type="button"
                onClick={() => setFilterAgeBracket('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 ${
                  filterAgeBracket === 'ALL'
                    ? 'bg-[#243c81] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>All Groups</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    filterAgeBracket === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {demographics.totalIndividuals}
                </span>
              </button>

              {/* Individual Age Brackets */}
              {REPORT_AGE_BRACKETS.map((bracket) => {
                const count = demographics.bracketCounts[bracket.key]?.total || 0;
                const isSelected = filterAgeBracket === bracket.key;

                return (
                  <button
                    key={bracket.key}
                    type="button"
                    onClick={() => setFilterAgeBracket(bracket.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border flex items-center gap-1.5 ${
                      isSelected
                        ? `${bracket.badgeBg} ${bracket.badgeText} border-current ring-2 ring-current/30 shadow-xs`
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{bracket.label}</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      ({bracket.sublabel})
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        isSelected ? 'bg-black/10' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Scope Toggle (Either Spouse vs Husband vs Wife) */}
            {filterAgeBracket !== 'ALL' && (
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs shrink-0 self-start lg:self-auto">
                <span className="text-[11px] font-bold text-slate-500 px-2">Scope:</span>
                <button
                  type="button"
                  onClick={() => setFilterSpouseScope('either')}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    filterSpouseScope === 'either' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Either Spouse
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSpouseScope('husband')}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    filterSpouseScope === 'husband' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Husband Only
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSpouseScope('wife')}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    filterSpouseScope === 'wife' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Wife Only
                </button>
              </div>
            )}
          </div>

          {/* Secondary Filter Row: Search & Barangay */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search invitee name, phone, address..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#243c81]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Barangay Filter */}
              <select
                value={filterBarangay}
                onChange={(e) => setFilterBarangay(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="ALL">All Barangays ({demographics.sortedBarangays.length})</option>
                {TUY_BARANGAYS.map((b) => (
                  <option key={b} value={b}>
                    Brgy. {b}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white hidden md:block"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Graduated">Graduated</option>
                <option value="Dropped">Dropped</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | 'name-asc'
                      | 'name-desc'
                      | 'hAge-asc'
                      | 'hAge-desc'
                      | 'brgy-asc'
                  )
                }
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="name-asc">Sort: Name (A-Z)</option>
                <option value="name-desc">Sort: Name (Z-A)</option>
                <option value="hAge-asc">Sort: Age (Youngest)</option>
                <option value="hAge-desc">Sort: Age (Oldest)</option>
                <option value="brgy-asc">Sort: Barangay</option>
              </select>

              {/* Reset Filter Button */}
              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN REPORT BODY: INTERACTIVE MAP & DETAILED INVITEES LIST                */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* ----------------------------------------------------------------------- */}
          {/* MAP VIEW SECTION                                                        */}
          {/* ----------------------------------------------------------------------- */}
          {(reportViewMode === 'split' || reportViewMode === 'map') && (
            <div
              className={`relative bg-slate-900 border-r border-slate-200 flex flex-col overflow-hidden transition-all ${
                reportViewMode === 'map' ? 'w-full h-full' : 'w-full lg:w-5/12 h-[340px] lg:h-full'
              }`}
            >
              {/* Map Floating Info Bar */}
              <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
                <div className="bg-slate-950/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold shadow-lg pointer-events-auto flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tuy Geographic Plotted Directory</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black">
                    {filteredCouples.length} Pins
                  </span>
                </div>

                {selectedCouple && (
                  <div className="bg-[#243c81]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-blue-400/30 text-xs font-bold shadow-lg pointer-events-auto hidden sm:flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-blue-300" />
                    <span className="truncate max-w-[160px]">
                      {selectedCouple.husbandFirstName} &amp; {selectedCouple.wifeFirstName}
                    </span>
                  </div>
                )}
              </div>

              {/* Leaflet Map with all Participant Markers */}
              <div className="w-full h-full relative">
                <TuyParticipantsLeafletMap
                  couples={filteredCouples}
                  selectedCoupleId={selectedCoupleId}
                  onSelectCouple={(c) => setSelectedCoupleId(c.id)}
                />
              </div>

              {/* Bottom Quick Card for Selected Couple on Map */}
              {selectedCouple && (
                <div className="p-3.5 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 truncate">
                        Bro. {selectedCouple.husbandFirstName} &amp; Sis.{' '}
                        {selectedCouple.wifeFirstName} {selectedCouple.husbandLastName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        Brgy. {selectedCouple.barangay}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Husband: {computeAgeString(selectedCouple.husbandBirthday)} yrs (
                      {
                        REPORT_AGE_BRACKETS.find(
                          (b) =>
                            b.key === getCoupleAgeBracketKey(selectedCouple.husbandBirthday)
                        )?.label
                      }
                      ) • Wife: {computeAgeString(selectedCouple.wifeBirthday)} yrs •{' '}
                      {selectedCouple.address}
                    </p>
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCouple.coordinates[1]},${selectedCouple.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold shrink-0 transition-all"
                  >
                    <span>Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* EVERYTHING LIST OF INVITEES TABLE SECTION                               */}
          {/* ----------------------------------------------------------------------- */}
          {(reportViewMode === 'split' || reportViewMode === 'table') && (
            <div
              className={`flex-1 flex flex-col overflow-hidden bg-white ${
                reportViewMode === 'table' ? 'w-full' : 'w-full lg:w-7/12'
              }`}
            >
              {/* Table Toolbar Header */}
              <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <List className="w-4 h-4 text-[#243c81]" />
                    <span>Complete Roster Directory</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-900">
                    {filteredCouples.length} couples listed
                  </span>
                </div>

                <span className="text-[11px] text-slate-500 font-medium">
                  Showing all details: Ages, Brackets, Anniversaries &amp; Contact Numbers
                </span>
              </div>

              {/* Scrollable Data Table */}
              <div className="flex-1 overflow-auto">
                {filteredCouples.length > 0 ? (
                  <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200 shadow-2xs">
                      <tr>
                        <th className="py-3 px-3 text-center w-10">#</th>
                        <th className="py-3 px-3">Invitee Couple</th>
                        <th className="py-3 px-3">Husband Details</th>
                        <th className="py-3 px-3">Wife Details</th>
                        <th className="py-3 px-3">Anniversary</th>
                        <th className="py-3 px-3">Address &amp; Barangay</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredCouples.map((couple, index) => {
                        const isSelected = selectedCouple?.id === couple.id;
                        const hAge = computeAgeString(couple.husbandBirthday);
                        const hBracket = REPORT_AGE_BRACKETS.find(
                          (b) => b.key === getCoupleAgeBracketKey(couple.husbandBirthday)
                        );

                        const wAge = computeAgeString(couple.wifeBirthday);
                        const wBracket = REPORT_AGE_BRACKETS.find(
                          (b) => b.key === getCoupleAgeBracketKey(couple.wifeBirthday)
                        );

                        return (
                          <tr
                            key={couple.id}
                            className={`transition-colors hover:bg-slate-50/80 cursor-pointer ${
                              isSelected ? 'bg-amber-50/70 border-l-4 border-l-amber-500' : ''
                            }`}
                            onClick={() => handleSelectCoupleOnMap(couple)}
                          >
                            {/* Row Index */}
                            <td className="py-3 px-3 text-center font-bold text-slate-400 font-mono text-[11px]">
                              {index + 1}
                            </td>

                            {/* Invitee Couple */}
                            <td className="py-3 px-3">
                              <div className="font-extrabold text-slate-900 text-xs">
                                Bro. {couple.husbandFirstName} &amp; Sis. {couple.wifeFirstName}
                              </div>
                              <div className="text-[11px] font-bold text-[#243c81]">
                                {couple.husbandLastName}
                              </div>
                            </td>

                            {/* Husband Details */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900">
                                  {couple.husbandFirstName}
                                </span>
                                {hAge !== '—' && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                      hBracket?.badgeBg || 'bg-slate-100'
                                    } ${hBracket?.badgeText || 'text-slate-700'} ${
                                      hBracket?.badgeBorder || 'border-slate-200'
                                    }`}
                                  >
                                    {hAge} yrs • {hBracket?.label}
                                  </span>
                                )}
                              </div>
                              {couple.husbandContact && (
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-blue-600" />
                                  <span>{couple.husbandContact}</span>
                                </div>
                              )}
                              {couple.husbandOccupation && (
                                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                  {couple.husbandOccupation}
                                </div>
                              )}
                            </td>

                            {/* Wife Details */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900">
                                  {couple.wifeFirstName}
                                </span>
                                {wAge !== '—' && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                      wBracket?.badgeBg || 'bg-slate-100'
                                    } ${wBracket?.badgeText || 'text-slate-700'} ${
                                      wBracket?.badgeBorder || 'border-slate-200'
                                    }`}
                                  >
                                    {wAge} yrs • {wBracket?.label}
                                  </span>
                                )}
                              </div>
                              {couple.wifeContact && (
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-rose-600" />
                                  <span>{couple.wifeContact}</span>
                                </div>
                              )}
                              {couple.wifeOccupation && (
                                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                  {couple.wifeOccupation}
                                </div>
                              )}
                            </td>

                            {/* Anniversary */}
                            <td className="py-3 px-3">
                              {couple.weddingAnniversary ? (
                                <div>
                                  <span className="font-bold text-rose-700 text-xs flex items-center gap-1">
                                    <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                                    <span>{couple.weddingAnniversary}</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {computeYearsMarried(couple.weddingAnniversary)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            {/* Barangay & Address */}
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200 inline-block mb-0.5">
                                Brgy. {couple.barangay}
                              </span>
                              <div className="text-[11px] text-slate-600 truncate max-w-[180px]">
                                {couple.address || `Tuy, Batangas`}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  (couple.status || 'Active') === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : (couple.status || 'Active') === 'Graduated'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {couple.status || 'Active'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectCoupleOnMap(couple);
                                    if (reportViewMode === 'table') {
                                      setReportViewMode('split');
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all"
                                  title="View on Map"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                </button>

                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${couple.coordinates[1]},${couple.coordinates[0]}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                                  title="Google Maps Directions"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center space-y-3">
                    <Users className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="font-extrabold text-sm text-slate-800">
                      No invitees match your active filter
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try clearing the age bracket, barangay, or search query to view all invitees.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-xl bg-[#243c81] text-white text-xs font-bold hover:bg-[#1a2c60] transition-all"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Table Footer with Summary Stats */}
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 shrink-0">
                <div className="font-medium">
                  Showing <strong className="text-slate-900">{filteredCouples.length}</strong> of{' '}
                  <strong className="text-slate-900">{demographics.totalCouples}</strong> total invitee couples (
                  <strong className="text-slate-900">{filteredCouples.length * 2}</strong> individuals)
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadFullPDF}
                    className="inline-flex items-center gap-1.5 font-bold text-[#243c81] hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download Invitee Directory PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
