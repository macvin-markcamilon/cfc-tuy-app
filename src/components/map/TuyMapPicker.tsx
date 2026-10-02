'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TUY_BARANGAYS, TUY_CENTER_COORDINATES } from '@/lib/data/mock-data';
import { MapPin, Check, Compass, Crosshair, Sparkles } from 'lucide-react';
import {
  loadGoogleMaps,
  toLatLngLiteral,
  isGoogleMapsKeyValid,
  onGoogleMapsAuthError,
} from '@/lib/maps/googleMapsLoader';

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

// Approximate coordinate centroids for all 23 official Tuy barangays
export const BARANGAY_COORDINATES: Record<string, [number, number]> = {
  'Acle': [120.7490, 14.0420],
  'Bayudbud': [120.7380, 14.0450],
  'Bolboc (Maligas)': [120.7550, 14.0300],
  'Burgos (Pob.)': [120.7270, 14.0245],
  'Dalima': [120.7100, 14.0160],
  'Dao': [120.7510, 14.0180],
  'Guinhawa': [120.7480, 14.0250],
  'Lumbangan': [120.7420, 14.0050],
  'Luna (Pob.)': [120.7305, 14.0215],
  'Luntal': [120.7410, 14.0150],
  'Magahis': [120.7200, 14.0480],
  'Malibu': [120.7180, 14.0120],
  'Mataywanac': [120.7120, 14.0400],
  'Palincaro': [120.7080, 14.0200],
  'Putol': [120.7360, 14.0310],
  'Rillo (Pob.)': [120.7320, 14.0390],
  'Rizal (Pob.)': [120.7289, 14.0228],
  'Sabang': [120.7440, 14.0380],
  'San Jose': [120.7350, 14.0110],
  'San Jose (Putic)': [120.7390, 14.0130],
  'Talon': [120.7150, 14.0260],
  'Toong': [120.7250, 14.0080],
  'Tuyon-tuyon (Obispo)': [120.7240, 14.0350],
};

/**
 * Automatically determine the closest Tuy Barangay to any [longitude, latitude] pinpoint.
 */
export function getClosestTuyBarangay(lng: number, lat: number): string {
  let closest = 'Rizal (Pob.)';
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
  initialBarangay = 'Rizal (Pob.)',
  onSelectLocation,
  onClose,
}: TuyMapPickerProps) {
  const [coords, setCoords] = useState<[number, number]>(initialCoordinates);
  const [barangay, setBarangay] = useState<string>(initialBarangay);
  const [streetAddress, setStreetAddress] = useState<string>(
    initialAddress || `Brgy. ${initialBarangay}, Tuy, Batangas`
  );

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);

  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    return onGoogleMapsAuthError(() => {
      setAuthError(true);
    });
  }, []);

  const isGoogleMapsActive = isGoogleMapsKeyValid();

  // Initialize Google Maps if key is valid
  useEffect(() => {
    if (!isGoogleMapsActive || !mapContainer.current) return;

    let isMounted = true;

    loadGoogleMaps()
      .then(({ maps }) => {
        if (!isMounted || !mapContainer.current) return;

        const center = toLatLngLiteral(coords);

        const map = new maps.Map(mapContainer.current, {
          center,
          zoom: 14,
          mapTypeId: maps.MapTypeId.ROADMAP,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
        });

        // Draggable pin
        const marker = new maps.Marker({
          position: center,
          map,
          draggable: true,
          title: 'Drag me to adjust Tuy pinpoint',
          animation: maps.Animation.DROP,
        });

        // When marker is dragged
        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (pos) {
            const lng = Number(pos.lng().toFixed(6));
            const lat = Number(pos.lat().toFixed(6));
            const detected = getClosestTuyBarangay(lng, lat);
            setCoords([lng, lat]);
            setBarangay(detected);
            setStreetAddress(`Brgy. ${detected}, Tuy, Batangas`);
          }
        });

        // When map is clicked
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          marker.setPosition(e.latLng);
          const lng = Number(e.latLng.lng().toFixed(6));
          const lat = Number(e.latLng.lat().toFixed(6));
          const detected = getClosestTuyBarangay(lng, lat);
          setCoords([lng, lat]);
          setBarangay(detected);
          setStreetAddress(`Brgy. ${detected}, Tuy, Batangas`);
        });

        mapInstance.current = map;
        markerInstance.current = marker;
      })
      .catch((err) => {
        console.error('Error initializing Google Maps in picker:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isGoogleMapsActive]);

  // When barangay quick button or dropdown is chosen
  const handleBarangaySelect = (brgyName: string) => {
    setBarangay(brgyName);
    const targetCoords = BARANGAY_COORDINATES[brgyName] || TUY_CENTER_COORDINATES;
    setCoords(targetCoords);
    setStreetAddress(`Brgy. ${brgyName}, Tuy, Batangas`);

    if (mapInstance.current && markerInstance.current) {
      const pos = toLatLngLiteral(targetCoords);
      markerInstance.current.setPosition(pos);
      mapInstance.current.panTo(pos);
      mapInstance.current.setZoom(15);
    }
  };

  // Click on interactive vector canvas (Fallback when Google Maps key is not configured)
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
              Tuy Address &amp; Google Map Pinpoint Picker
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Click anywhere on the map or drag the pin to auto-detect and populate the Tuy address.
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
      {authError && (
        <div className="px-4 py-2.5 bg-amber-500 text-slate-950 text-xs font-semibold flex items-center justify-between gap-2 border-b border-amber-600 animate-in fade-in">
          <span className="flex items-center gap-1.5">
            <span>⚠️</span>
            <span>Google Maps billing is required on your GCP project. Interactive vector mode is active below.</span>
          </span>
          <a
            href="https://console.cloud.google.com/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold shrink-0 hover:text-black"
          >
            Enable GCP Billing
          </a>
        </div>
      )}
      <div className="relative h-64 sm:h-72 w-full bg-slate-900 overflow-hidden cursor-crosshair">
        {isGoogleMapsActive && !authError ? (
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
