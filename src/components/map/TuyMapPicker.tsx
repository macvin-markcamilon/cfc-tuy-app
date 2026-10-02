'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { TUY_BARANGAYS, TUY_CENTER_COORDINATES } from '@/lib/data/mock-data';
import { MapPin, Navigation, Check, Compass, Crosshair } from 'lucide-react';

interface TuyMapPickerProps {
  initialCoordinates?: [number, number];
  initialAddress?: string;
  initialBarangay?: string;
  onSelectLocation: (data: {
    coordinates: [number, number];
    address: string;
    barangay: string;
  }) => void;
  onClose?: () => void;
}

// Approximate coordinates for key Tuy barangays
const BARANGAY_COORDINATES: Record<string, [number, number]> = {
  'Poblacion 1': [120.7289, 14.0228],
  'Poblacion 2': [120.7298, 14.0235],
  'Poblacion 3': [120.7275, 14.0221],
  'Poblacion 4': [120.7282, 14.0212],
  'Putol': [120.736, 14.031],
  'Luntal': [120.741, 14.015],
  'Malibu': [120.718, 14.012],
  'Obispo': [120.721, 14.032],
  'Rillo': [120.732, 14.039],
  'Guinhawa': [120.748, 14.025],
  'Talon': [120.715, 14.026],
  'Toong': [120.725, 14.008],
  'Dao': [120.751, 14.018],
  'Bayudbud': [120.738, 14.045],
};

export default function TuyMapPicker({
  initialCoordinates = TUY_CENTER_COORDINATES,
  initialAddress = '',
  initialBarangay = 'Poblacion 1',
  onSelectLocation,
  onClose,
}: TuyMapPickerProps) {
  const [coords, setCoords] = useState<[number, number]>(initialCoordinates);
  const [barangay, setBarangay] = useState<string>(initialBarangay);
  const [streetAddress, setStreetAddress] = useState<string>(initialAddress);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const isMapboxActive = Boolean(mapboxToken && mapboxToken.startsWith('pk.') && mapboxToken.length > 20);

  // Initialize Mapbox if token is provided
  useEffect(() => {
    if (!isMapboxActive || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken as string;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coords,
      zoom: 14,
    });

    const markerInstance = new mapboxgl.Marker({ draggable: true, color: '#2563EB' })
      .setLngLat(coords)
      .addTo(mapInstance);

    markerInstance.on('dragend', () => {
      const lngLat = markerInstance.getLngLat();
      setCoords([lngLat.lng, lngLat.lat]);
    });

    mapInstance.on('click', (e) => {
      markerInstance.setLngLat(e.lngLat);
      setCoords([e.lngLat.lng, e.lngLat.lat]);
    });

    map.current = mapInstance;
    marker.current = markerInstance;

    return () => {
      mapInstance.remove();
    };
  }, [isMapboxActive, mapboxToken]);

  // When barangay button is selected
  const handleBarangaySelect = (brgyName: string) => {
    setBarangay(brgyName);
    const targetCoords = BARANGAY_COORDINATES[brgyName] || TUY_CENTER_COORDINATES;
    setCoords(targetCoords);

    if (!streetAddress || streetAddress.includes('Brgy.')) {
      setStreetAddress(`Near Barangay Hall/Chapel, Brgy. ${brgyName}, Tuy, Batangas`);
    }

    if (map.current && marker.current) {
      marker.current.setLngLat(targetCoords);
      map.current.flyTo({ center: targetCoords, zoom: 15 });
    }
  };

  const handleConfirm = () => {
    const finalAddress = streetAddress.trim() || `Brgy. ${barangay}, Tuy, Batangas`;
    onSelectLocation({
      coordinates: coords,
      address: finalAddress,
      barangay,
    });
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Tuy Address & Map Pinpoint Picker
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select or click on the map to set the couple&apos;s home location in Tuy
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold px-2 py-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Barangay Buttons */}
      <div className="p-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
          Quick Barangay Jumper (Tuy, Batangas):
        </span>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {Object.keys(BARANGAY_COORDINATES).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => handleBarangaySelect(b)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                barangay === b
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/60'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Visual Area */}
      <div className="relative h-64 sm:h-72 w-full bg-slate-900 overflow-hidden">
        {isMapboxActive ? (
          <div ref={mapContainer} className="w-full h-full" />
        ) : (
          /* High-Fidelity SVG Interactive Vector Canvas for Tuy */
          <div className="w-full h-full relative p-4 flex flex-col justify-between bg-radial from-slate-800 to-slate-950 text-white">
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]"></div>

            <div className="relative z-10 flex items-center justify-between text-xs text-blue-300 bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10">
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                <span>Selected: Brgy. {barangay}</span>
              </span>
              <span className="font-mono text-[11px]">
                {coords[1].toFixed(4)}° N, {coords[0].toFixed(4)}° E
              </span>
            </div>

            {/* Clickable pins visualization */}
            <div className="relative z-10 my-auto text-center">
              <div className="inline-flex flex-col items-center animate-bounce">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl border-2 border-white">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="w-2.5 h-1 bg-black/50 rounded-full blur-xs mt-1"></div>
              </div>
              <p className="text-xs text-amber-300 font-bold mt-2">
                Brgy. {barangay}, Tuy, Batangas
              </p>
              <p className="text-[11px] text-slate-400">
                Click any barangay above or drag to refine coordinates
              </p>
            </div>

            <div className="relative z-10 text-[10px] text-slate-400 text-center">
              Municipality of Tuy • Province of Batangas
            </div>
          </div>
        )}
      </div>

      {/* Address Form Inputs */}
      <div className="p-4 sm:p-5 space-y-3 bg-white dark:bg-slate-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Barangay
            </label>
            <select
              value={barangay}
              onChange={(e) => handleBarangaySelect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              {TUY_BARANGAYS.map((b) => (
                <option key={b} value={b}>
                  Brgy. {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pinpoint Coordinates (Lng, Lat)
            </label>
            <input
              type="text"
              readOnly
              value={`${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-xs font-mono text-slate-600 dark:text-slate-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            House / Street / Sitio Address
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 142 Rizal St., Sitio Ilaya, Brgy. Poblacion"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Apply Selected Address</span>
          </button>
        </div>
      </div>

    </div>
  );
}
