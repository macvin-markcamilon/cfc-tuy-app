'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CLPCouple } from '@/types';
import { TUY_CENTER_COORDINATES } from '@/lib/data/mock-data';
import {
  MapPin,
  X,
  Phone,
  Mail,
  Heart,
  Compass,
  Navigation,
  Sparkles,
  Search,
  ExternalLink,
} from 'lucide-react';
import {
  loadGoogleMaps,
  toLatLngLiteral,
  isGoogleMapsKeyValid,
} from '@/lib/maps/googleMapsLoader';

interface CLPCouplesMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  couples: CLPCouple[];
  focusedCoupleId?: string | null;
  title?: string;
}

function buildCouplePinSvg(couple: CLPCouple, isSelected: boolean): string {
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

export default function CLPCouplesMapModal({
  isOpen,
  onClose,
  couples,
  focusedCoupleId,
  title = 'Invited Couples Tuy Map',
}: CLPCouplesMapModalProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [selectedCouple, setSelectedCouple] = useState<CLPCouple | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const isGoogleMapsActive = isGoogleMapsKeyValid();

  // Set initial selected couple
  useEffect(() => {
    if (focusedCoupleId) {
      const match = couples.find((c) => c.id === focusedCoupleId);
      if (match) {
        setSelectedCouple(match);
      }
    } else if (couples.length > 0 && !selectedCouple) {
      setSelectedCouple(couples[0]);
    }
  }, [focusedCoupleId, couples]);

  // Initialize Google Maps in modal
  useEffect(() => {
    if (!isOpen || !isGoogleMapsActive || !mapContainer.current) return;

    let isMounted = true;

    // Center on focused couple or default Tuy center
    let initialCenter: [number, number] = TUY_CENTER_COORDINATES;
    if (focusedCoupleId) {
      const focused = couples.find((c) => c.id === focusedCoupleId);
      if (focused && focused.coordinates) {
        initialCenter = focused.coordinates;
      }
    } else if (couples.length > 0 && couples[0].coordinates) {
      initialCenter = couples[0].coordinates;
    }

    loadGoogleMaps()
      .then(({ maps }) => {
        if (!isMounted || !mapContainer.current) return;

        const mapTypeId =
          mapStyle === 'satellite'
            ? maps.MapTypeId.HYBRID
            : mapStyle === 'terrain'
            ? maps.MapTypeId.TERRAIN
            : maps.MapTypeId.ROADMAP;

        if (!mapInstanceRef.current) {
          const map = new maps.Map(mapContainer.current, {
            center: toLatLngLiteral(initialCenter),
            zoom: focusedCoupleId ? 15 : 13.5,
            mapTypeId,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            gestureHandling: 'greedy',
          });

          mapInstanceRef.current = map;
          setIsMapLoaded(true);
        } else {
          mapInstanceRef.current.setMapTypeId(mapTypeId);
        }
      })
      .catch((err) => {
        console.error('Error initializing Google Maps in modal:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, isGoogleMapsActive, mapStyle]);

  // Update markers
  useEffect(() => {
    const currentMap = mapInstanceRef.current;
    if (!currentMap || !isMapLoaded || typeof google === 'undefined' || !google.maps) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    couples.forEach((couple) => {
      if (!couple.coordinates || couple.coordinates.length < 2) return;

      const isSelected = selectedCouple?.id === couple.id;
      const position = toLatLngLiteral(couple.coordinates);

      const marker = new google.maps.Marker({
        position,
        map: currentMap,
        title: `Bro. ${couple.husbandFirstName} & Sis. ${couple.wifeFirstName} ${couple.husbandLastName}`,
        icon: {
          url: buildCouplePinSvg(couple, isSelected),
          scaledSize: new google.maps.Size(36, 46),
          anchor: new google.maps.Point(18, 46),
        },
        zIndex: isSelected ? 999 : 1,
      });

      marker.addListener('click', () => {
        setSelectedCouple(couple);
        currentMap.panTo(position);
        currentMap.setZoom(15.5);
      });

      markersRef.current.push(marker);
    });
  }, [couples, selectedCouple, isMapLoaded]);

  // Pan to selected couple when changed
  const handleSelectCouple = (c: CLPCouple) => {
    setSelectedCouple(c);
    if (mapInstanceRef.current && c.coordinates) {
      const pos = toLatLngLiteral(c.coordinates);
      mapInstanceRef.current.panTo(pos);
      mapInstanceRef.current.setZoom(15.5);
    }
  };

  const filteredCouples = couples.filter(
    (c) =>
      c.husbandFirstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.husbandLastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.wifeFirstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.barangay.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-w-5xl w-full flex flex-col h-[90vh] max-h-[850px]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <span>{title}</span>
                <span className="bg-blue-50 text-[#243c81] text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  {couples.length} {couples.length === 1 ? 'Couple' : 'Couples'} Plotted
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Interactive Google Maps visualization of invited couples across Tuy, Batangas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Style switcher */}
            {isGoogleMapsActive && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-700">
                <button
                  type="button"
                  onClick={() => setMapStyle('streets')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    mapStyle === 'streets' ? 'bg-white shadow-xs text-blue-800' : 'hover:bg-white/50'
                  }`}
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle('satellite')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    mapStyle === 'satellite' ? 'bg-white shadow-xs text-blue-800' : 'hover:bg-white/50'
                  }`}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle('terrain')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    mapStyle === 'terrain' ? 'bg-white shadow-xs text-blue-800' : 'hover:bg-white/50'
                  }`}
                >
                  Terrain
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 font-bold transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content: Split into Sidebar & Map View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Left/Mobile Bottom Sidebar: Couple List & Active Card */}
          <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search couple or barangay..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Couple Selection Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-48 md:max-h-none">
              {filteredCouples.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No couples found matching your search.
                </div>
              ) : (
                filteredCouples.map((c) => {
                  const isSelected = selectedCouple?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCouple(c)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#243c81] text-white border-[#1c3066] shadow-sm'
                          : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-extrabold text-xs truncate">
                          Bro. {c.husbandFirstName} &amp; Sis. {c.wifeFirstName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-50 text-[#243c81] border border-blue-200'
                          }`}
                        >
                          {c.barangay}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] truncate ${
                          isSelected ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {c.address}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Couple Detailed Info Card */}
            {selectedCouple && (
              <div className="p-4 border-t border-slate-200 bg-white shrink-0 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {selectedCouple.status}
                  </span>
                  <span className="text-xs font-bold text-[#243c81] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    Brgy. {selectedCouple.barangay}
                  </span>
                </div>

                <h4 className="font-black text-sm text-slate-900 leading-snug">
                  Bro. {selectedCouple.husbandFirstName} &amp; Sis. {selectedCouple.wifeFirstName}{' '}
                  {selectedCouple.husbandLastName}
                </h4>

                {selectedCouple.weddingAnniversary && (
                  <p className="text-[11px] text-rose-700 font-bold flex items-center gap-1 mt-1">
                    <Heart className="w-3 h-3 fill-rose-500" />
                    <span>Married: {selectedCouple.weddingAnniversary}</span>
                  </p>
                )}

                <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#243c81] shrink-0 mt-0.5" />
                    <span className="font-medium text-[11px] leading-tight text-slate-800">
                      {selectedCouple.address}
                    </span>
                  </div>

                  {selectedCouple.husbandContact && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>{selectedCouple.husbandFirstName}: {selectedCouple.husbandContact}</span>
                    </div>
                  )}

                  {selectedCouple.wifeContact && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>{selectedCouple.wifeFirstName}: {selectedCouple.wifeContact}</span>
                    </div>
                  )}

                  {selectedCouple.husbandEmail && (
                    <div className="flex items-center gap-1.5 text-[11px] truncate">
                      <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="truncate">{selectedCouple.husbandEmail}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-400 text-[10px]">
                    {selectedCouple.coordinates[1].toFixed(4)}°, {selectedCouple.coordinates[0].toFixed(4)}°
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCouple.coordinates[1]},${selectedCouple.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
                  >
                    <span>Google Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Area: Interactive Google Map */}
          <div className="flex-1 relative bg-slate-950 overflow-hidden">
            {isGoogleMapsActive ? (
              <div ref={mapContainer} className="w-full h-full" />
            ) : (
              /* Fallback Interactive Vector Canvas */
              <div className="w-full h-full relative p-6 flex flex-col justify-between bg-gradient-to-br from-[#0c1633] via-[#101c42] to-slate-950 text-white select-none">
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"></div>

                {/* Map Info Bar */}
                <div className="relative z-10 flex items-center justify-between text-xs text-blue-200 bg-black/60 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white">Tuy Geographic Couple Directory</span>
                  </div>
                  <span className="font-mono text-[11px] text-amber-300">
                    {couples.length} Plotted Pins
                  </span>
                </div>

                {/* Visual Pins on Vector Canvas */}
                <div className="relative z-10 my-auto text-center">
                  {selectedCouple ? (
                    <div className="inline-flex flex-col items-center animate-bounce">
                      <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl border-4 border-white text-base font-black">
                        {selectedCouple.husbandFirstName.charAt(0)}{selectedCouple.wifeFirstName.charAt(0)}
                      </div>
                      <div className="w-4 h-1 bg-black/60 rounded-full blur-xs mt-1"></div>
                      <p className="text-base text-amber-300 font-extrabold mt-3 drop-shadow-md">
                        Bro. {selectedCouple.husbandFirstName} &amp; Sis. {selectedCouple.wifeFirstName} {selectedCouple.husbandLastName}
                      </p>
                      <p className="text-xs text-blue-200 font-medium">
                        Brgy. {selectedCouple.barangay}, Tuy, Batangas
                      </p>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs">Select a couple from the sidebar to view pinpoint</div>
                  )}
                </div>

                <div className="relative z-10 text-xs text-slate-400 text-center font-medium flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Municipality of Tuy, Batangas • Saint Vincent Ferrer Parish</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
