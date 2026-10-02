'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
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
  Layers,
  Sparkles,
  Users,
  Search,
  ExternalLink,
} from 'lucide-react';

interface CLPCouplesMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  couples: CLPCouple[];
  focusedCoupleId?: string | null;
  title?: string;
}

export default function CLPCouplesMapModal({
  isOpen,
  onClose,
  couples,
  focusedCoupleId,
  title = 'Invited Couples Tuy Map',
}: CLPCouplesMapModalProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [selectedCouple, setSelectedCouple] = useState<CLPCouple | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'outdoors'>('streets');
  const [searchQuery, setSearchQuery] = useState('');

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const isMapboxActive = Boolean(mapboxToken && mapboxToken.startsWith('pk.') && mapboxToken.length > 20);

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

  // Initialize Mapbox map
  useEffect(() => {
    if (!isOpen || !isMapboxActive || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken as string;

    const styleUrl =
      mapStyle === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : mapStyle === 'outdoors'
        ? 'mapbox://styles/mapbox/outdoors-v12'
        : 'mapbox://styles/mapbox/streets-v12';

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

    try {
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: initialCenter,
        zoom: focusedCoupleId ? 15 : 13.5,
        pitch: 25,
      });

      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current = mapInstance;

      return () => {
        mapInstance.remove();
      };
    } catch (err) {
      console.error('Error initializing Mapbox in modal:', err);
    }
  }, [isOpen, isMapboxActive, mapboxToken, mapStyle]);

  // Update markers
  useEffect(() => {
    const currentMap = map.current;
    if (!currentMap || !isMapboxActive) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    couples.forEach((couple) => {
      if (!couple.coordinates || couple.coordinates.length < 2) return;

      const isSelected = selectedCouple?.id === couple.id;

      // Custom marker DOM element
      const el = document.createElement('div');
      el.className = 'cursor-pointer transition-transform hover:scale-110';
      el.innerHTML = `
        <div style="
          width: ${isSelected ? '38px' : '30px'};
          height: ${isSelected ? '38px' : '30px'};
          background-color: ${isSelected ? '#D97706' : '#243c81'};
          color: white;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          border: 2px solid white;
          font-weight: 800;
          font-size: 11px;
        ">
          ${couple.husbandFirstName.charAt(0)}${couple.wifeFirstName.charAt(0)}
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedCouple(couple);
        currentMap.flyTo({ center: couple.coordinates, zoom: 15.5, essential: true });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(couple.coordinates)
        .addTo(currentMap);

      markersRef.current.push(marker);
    });
  }, [couples, selectedCouple, isMapboxActive]);

  // Fly to selected couple when changed
  const handleSelectCouple = (c: CLPCouple) => {
    setSelectedCouple(c);
    if (map.current && c.coordinates) {
      map.current.flyTo({ center: c.coordinates, zoom: 15.5, essential: true });
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
                Interactive Mapbox visualization of invited couples across Tuy, Batangas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Style switcher */}
            {isMapboxActive && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-700">
                <button
                  type="button"
                  onClick={() => setMapStyle('streets')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    mapStyle === 'streets' ? 'bg-white shadow-xs text-blue-800' : 'hover:bg-white/50'
                  }`}
                >
                  Streets
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
                  onClick={() => setMapStyle('outdoors')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    mapStyle === 'outdoors' ? 'bg-white shadow-xs text-blue-800' : 'hover:bg-white/50'
                  }`}
                >
                  Outdoors
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

          {/* Right Area: Interactive Mapbox Map */}
          <div className="flex-1 relative bg-slate-950 overflow-hidden">
            {isMapboxActive ? (
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
