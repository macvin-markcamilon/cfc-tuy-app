'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { TUY_BARANGAYS, TUY_CENTER_COORDINATES } from '@/lib/data/mock-data';
import { MapPin, Check, Compass, Crosshair, Sparkles } from 'lucide-react';

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

// Approximate coordinate centroids for all Tuy barangays
export const BARANGAY_COORDINATES: Record<string, [number, number]> = {
  'Poblacion 1': [120.7289, 14.0228],
  'Poblacion 2': [120.7298, 14.0235],
  'Poblacion 3': [120.7275, 14.0221],
  'Poblacion 4': [120.7282, 14.0212],
  'Burgos': [120.7270, 14.0245],
  'Luna': [120.7305, 14.0215],
  'Rillo': [120.7320, 14.0390],
  'Putol': [120.7360, 14.0310],
  'Luntal': [120.7410, 14.0150],
  'Malibu': [120.7180, 14.0120],
  'Obispo': [120.7210, 14.0320],
  'Guinhawa': [120.7480, 14.0250],
  'Talon': [120.7150, 14.0260],
  'Toong': [120.7250, 14.0080],
  'Dao': [120.7510, 14.0180],
  'Bayudbud': [120.7380, 14.0450],
  'Bolocboc': [120.7550, 14.0300],
  'Mataywanac': [120.7120, 14.0400],
  'Sabang': [120.7440, 14.0380],
  'San Jose': [120.7350, 14.0110],
  'Tuyon-tuyon': [120.7240, 14.0350],
};

/**
 * Automatically determine the closest Tuy Barangay to any [longitude, latitude] pinpoint.
 */
export function getClosestTuyBarangay(lng: number, lat: number): string {
  let closest = 'Poblacion 1';
  let minDistance = Infinity;

  for (const [brgy, [bLng, bLat]] of Object.entries(BARANGAY_COORDINATES)) {
    const dist = Math.hypot(bLng - lng, bLat - lat);
    if (dist < minDistance) {
      minDistance = dist;
      closest = brgy;
    }
  }

  return closest;
}

export default function TuyMapPicker({
  initialCoordinates = TUY_CENTER_COORDINATES,
  initialAddress = '',
  initialBarangay = 'Poblacion 1',
  onSelectLocation,
  onClose,
}: TuyMapPickerProps) {
  const [coords, setCoords] = useState<[number, number]>(initialCoordinates);
  const [barangay, setBarangay] = useState<string>(initialBarangay);
  const [streetAddress, setStreetAddress] = useState<string>(
    initialAddress || `Brgy. ${initialBarangay}, Tuy, Batangas`
  );

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

    // Auto-detect barangay and set address when marker is dragged
    markerInstance.on('dragend', () => {
      const lngLat = markerInstance.getLngLat();
      const detected = getClosestTuyBarangay(lngLat.lng, lngLat.lat);
      setCoords([lngLat.lng, lngLat.lat]);
      setBarangay(detected);
      setStreetAddress(`Brgy. ${detected}, Tuy, Batangas`);
    });

    // Auto-detect barangay and set address when map is clicked
    mapInstance.on('click', (e) => {
      markerInstance.setLngLat(e.lngLat);
      const detected = getClosestTuyBarangay(e.lngLat.lng, e.lngLat.lat);
      setCoords([e.lngLat.lng, e.lngLat.lat]);
      setBarangay(detected);
      setStreetAddress(`Brgy. ${detected}, Tuy, Batangas`);
    });

    map.current = mapInstance;
    marker.current = markerInstance;

    return () => {
      mapInstance.remove();
    };
  }, [isMapboxActive, mapboxToken]);

  // When barangay quick button or dropdown is chosen
  const handleBarangaySelect = (brgyName: string) => {
    setBarangay(brgyName);
    const targetCoords = BARANGAY_COORDINATES[brgyName] || TUY_CENTER_COORDINATES;
    setCoords(targetCoords);
    setStreetAddress(`Brgy. ${brgyName}, Tuy, Batangas`);

    if (map.current && marker.current) {
      marker.current.setLngLat(targetCoords);
      map.current.flyTo({ center: targetCoords, zoom: 15 });
    }
  };

  // Click on interactive vector canvas (Fallback when Mapbox token not configured)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    // Bounds for Tuy: Lng ~120.710 to 120.755, Lat ~14.045 to 14.008
    const lng = 120.710 + x * (120.755 - 120.710);
    const lat = 14.045 - y * (14.045 - 14.008);

    const detected = getClosestTuyBarangay(lng, lat);
    setCoords([lng, lat]);
    setBarangay(detected);
    setStreetAddress(`Brgy. ${detected}, Tuy, Batangas`);
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
    <div className="flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-w-2xl w-full">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Tuy Address &amp; Map Pinpoint Picker
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Click anywhere on the map or select a barangay to auto-detect and populate the address.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Barangay Buttons */}
      <div className="p-3 bg-slate-50 border-b border-slate-200">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
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
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Visual Area */}
      <div className="relative h-64 sm:h-72 w-full bg-slate-900 overflow-hidden cursor-crosshair">
        {isMapboxActive ? (
          <div ref={mapContainer} className="w-full h-full" />
        ) : (
          /* Interactive High-Fidelity Vector Canvas for Tuy */
          <div
            onClick={handleCanvasClick}
            className="w-full h-full relative p-4 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-[#101c42] to-slate-950 text-white select-none"
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"></div>

            {/* Top Bar with detected location */}
            <div className="relative z-10 flex items-center justify-between text-xs text-blue-200 bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 pointer-events-none">
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300">Auto-detected: Brgy. {barangay}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-300">
                {coords[1].toFixed(4)}° N, {coords[0].toFixed(4)}° E
              </span>
            </div>

            {/* Visual Pinpoint at center of active selection */}
            <div className="relative z-10 my-auto text-center pointer-events-none">
              <div className="inline-flex flex-col items-center animate-bounce">
                <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl border-2 border-white">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="w-3 h-1 bg-black/60 rounded-full blur-xs mt-1"></div>
              </div>
              <p className="text-sm text-amber-300 font-extrabold mt-2 drop-shadow-md">
                Brgy. {barangay}, Tuy, Batangas
              </p>
              <p className="text-[11px] text-blue-200/90 font-medium">
                Tap anywhere on the map to place pin &amp; auto-update address
              </p>
            </div>

            <div className="relative z-10 text-[11px] text-slate-400 text-center font-medium pointer-events-none flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Municipality of Tuy • Saint Vincent Ferrer Parish</span>
            </div>
          </div>
        )}
      </div>

      {/* Address Form Inputs */}
      <div className="p-4 sm:p-5 space-y-3 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detected Barangay
            </label>
            <select
              value={barangay}
              onChange={(e) => handleBarangaySelect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
            >
              {TUY_BARANGAYS.map((b) => (
                <option key={b} value={b}>
                  Brgy. {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pinpoint Coordinates (Lng, Lat)
            </label>
            <input
              type="text"
              readOnly
              value={`${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-mono text-slate-700 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>Home Address (Auto-populated from map pin)</span>
            <span className="text-[11px] text-blue-600 font-semibold">Editable</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 142 Rizal St., Brgy. Poblacion 1, Tuy, Batangas"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
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
