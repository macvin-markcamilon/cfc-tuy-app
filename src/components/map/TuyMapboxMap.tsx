'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAP_PINS, TUY_CENTER_COORDINATES } from '@/lib/data/mock-data';
import { MapLocationPin, MinistryType } from '@/types';
import { MapPin, Navigation, Compass, Phone, Calendar, Layers, CheckCircle2, Info, ExternalLink, X } from 'lucide-react';

interface TuyMapProps {
  initialMinistry?: MinistryType | 'ALL';
  height?: string;
  showFilters?: boolean;
}

export default function TuyMapboxMap({
  initialMinistry = 'ALL',
  height = 'h-[550px] lg:h-[650px]',
  showFilters = true,
}: TuyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [selectedMinistry, setSelectedMinistry] = useState<MinistryType | 'ALL'>(initialMinistry);
  const [selectedPin, setSelectedPin] = useState<MapLocationPin | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'outdoors'>('streets');
  const [tokenPresent, setTokenPresent] = useState<boolean>(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Filter pins based on ministry
  const filteredPins = useMemo(() => {
    return MAP_PINS.filter((pin) => {
      if (selectedMinistry === 'ALL') return true;
      if (pin.category === 'parish' || pin.category === 'event') return true;
      return pin.ministry === selectedMinistry;
    });
  }, [selectedMinistry]);

  useEffect(() => {
    const hasValidToken = Boolean(mapboxToken && mapboxToken.startsWith('pk.') && mapboxToken.length > 20);
    setTokenPresent(hasValidToken);

    if (!hasValidToken || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken as string;

    const styleUrl =
      mapStyle === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : mapStyle === 'outdoors'
        ? 'mapbox://styles/mapbox/outdoors-v12'
        : 'mapbox://styles/mapbox/streets-v12';

    try {
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: TUY_CENTER_COORDINATES,
        zoom: 13.5,
        pitch: 30,
      });

      mapInstance.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
      mapInstance.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        'top-right'
      );

      map.current = mapInstance;

      return () => {
        mapInstance.remove();
      };
    } catch (err) {
      console.error('Error initializing Mapbox:', err);
    }
  }, [mapboxToken, mapStyle]);

  // Update Mapbox markers whenever filteredPins changes
  useEffect(() => {
    if (!map.current || !tokenPresent) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredPins.forEach((pin) => {
      // Determine pin color
      let markerColor = '#2563EB'; // default blue
      if (pin.category === 'parish') markerColor = '#D97706'; // gold for Parish
      else if (pin.ministry === 'SFC') markerColor = '#0D9488';
      else if (pin.ministry === 'YFC') markerColor = '#EA580C';
      else if (pin.ministry === 'KFC') markerColor = '#EAB308';
      else if (pin.ministry === 'HOLD') markerColor = '#9333EA';
      else if (pin.ministry === 'SOLD') markerColor = '#475569';

      const el = document.createElement('div');
      el.className = 'custom-pin-marker cursor-pointer transform hover:scale-125 transition-transform duration-200';
      el.innerHTML = `
        <div style="background-color: ${markerColor};" class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
          ${pin.category === 'parish' ? '⛪' : pin.ministry || 'CFC'}
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedPin(pin);
        map.current?.flyTo({
          center: pin.coordinates,
          zoom: 15,
          speed: 1.2,
          curve: 1,
        });
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat(pin.coordinates)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [filteredPins, tokenPresent]);

  const ministriesList: Array<MinistryType | 'ALL'> = ['ALL', 'CFC', 'SFC', 'YFC', 'KFC', 'HOLD', 'SOLD'];

  return (
    <div className="w-full flex flex-col rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      
      {/* Controls / Filter Header */}
      {showFilters && (
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Tuy Barangay & Household Locator
            </h3>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full">
              {filteredPins.length} Locations
            </span>
          </div>

          {/* Ministry Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
            {ministriesList.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMinistry(m)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  selectedMinistry === m
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {m === 'ALL' ? 'All Ministries' : m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Map Container */}
      <div className={`relative w-full ${height} bg-slate-100 dark:bg-slate-950`}>
        
        {/* If Mapbox Token is configured, render real Mapbox canvas */}
        {tokenPresent ? (
          <>
            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Layer switcher */}
            <div className="absolute top-4 left-4 z-10 glass-panel rounded-xl p-1.5 flex gap-1 shadow-md">
              <button
                onClick={() => setMapStyle('streets')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  mapStyle === 'streets' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50'
                }`}
              >
                Streets
              </button>
              <button
                onClick={() => setMapStyle('satellite')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  mapStyle === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapStyle('outdoors')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  mapStyle === 'outdoors' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50'
                }`}
              >
                Terrain
              </button>
            </div>
          </>
        ) : (
          /* Interactive Fallback Map (Styled Tuy Vector Map) */
          <div className="w-full h-full relative overflow-hidden flex flex-col justify-between p-6 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white">
            
            {/* Background Grid & Compass Rose */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"></div>
            
            {/* Notice Banner */}
            <div className="relative z-10 max-w-xl mx-auto glass-panel border-blue-500/30 bg-blue-950/70 p-3 sm:p-4 rounded-2xl shadow-xl flex items-start gap-3 text-xs sm:text-sm">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Mapbox Setup Ready:</span>
                <p className="text-slate-300 text-xs mt-0.5">
                  Interactive community pins below are fully clickable. To load live high-res Mapbox satellite imagery, paste your free public token in <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200">.env.local</code> as <code className="bg-black/40 px-1.5 py-0.5 rounded text-blue-200">NEXT_PUBLIC_MAPBOX_TOKEN=pk...</code>.
                </p>
              </div>
            </div>

            {/* Interactive Vector Pinboard for Tuy Barangays */}
            <div className="relative z-10 my-auto py-8">
              <div className="text-center mb-6">
                <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">
                  Municipality of Tuy, Batangas • Community Map
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Active Household Clusters & Venues
                </h4>
              </div>

              {/* Responsive grid of interactive pins */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
                {filteredPins.map((pin) => {
                  const isSelected = selectedPin?.id === pin.id;
                  return (
                    <button
                      key={pin.id}
                      onClick={() => setSelectedPin(pin)}
                      className={`text-left p-3.5 rounded-2xl transition-all duration-200 border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-white/40 shadow-lg scale-102 ring-2 ring-amber-400'
                          : 'bg-white/10 hover:bg-white/15 border-white/10 text-slate-100 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                          {pin.category === 'parish' ? 'Parish' : pin.ministry || 'CFC'}
                        </span>
                        <span className="text-[11px] text-amber-300 font-medium">
                          {pin.barangay}
                        </span>
                      </div>
                      <p className="font-bold text-xs sm:text-sm line-clamp-1">{pin.name}</p>
                      <p className="text-[11px] opacity-80 line-clamp-1 mt-0.5">{pin.address}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-3">
              <span>Coordinates: 14.0228° N, 120.7289° E (Tuy Central)</span>
              <span>Click any location to see leader and schedule details</span>
            </div>

          </div>
        )}

        {/* Selected Location Detail Card (Bottom Sheet / Popup) */}
        {selectedPin && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-30 glass-panel rounded-2xl p-5 shadow-2xl border border-blue-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {selectedPin.category === 'parish' ? 'Parish Center' : selectedPin.ministry || 'CFC'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Brgy. {selectedPin.barangay}
                </span>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2">
              {selectedPin.name}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              {selectedPin.description}
            </p>

            <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{selectedPin.address}</span>
              </div>
              {selectedPin.schedule && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{selectedPin.schedule}</span>
                </div>
              )}
              {selectedPin.contactPerson && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Leader: {selectedPin.contactPerson}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPin.coordinates[1]},${selectedPin.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions (Tuy GPS)</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <span className="text-[10px] text-slate-400 font-mono">
                {selectedPin.coordinates[1].toFixed(4)}, {selectedPin.coordinates[0].toFixed(4)}
              </span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
