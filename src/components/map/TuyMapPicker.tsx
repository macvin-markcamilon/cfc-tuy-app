'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TUY_BARANGAYS, TUY_CENTER_COORDINATES } from '@/lib/data/mock-data';
import { BARANGAY_BOUNDARIES } from '@/lib/data/tuyBarangayBoundaries';
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
  onChange?: (data: {
    coordinates: [number, number];
    address: string;
    barangay: string;
  }) => void;
  onClose?: () => void;
  isEmbedded?: boolean;
}

// Approximate coordinate centroids for all 23 official Tuy barangays
export const BARANGAY_COORDINATES: Record<string, [number, number]> = {
  'Acle': [120.7420, 14.0200],
  'Bayudbud': [120.7420, 14.0510],
  'Bolboc': [120.7580, 14.0280],
  'Burgos (Pob.)': [120.7300, 14.0195],
  'Dalima': [120.7120, 14.0400],
  'Dao': [120.7530, 14.0140],
  'Guinhawa': [120.7270, 13.9950],
  'Lumbangan': [120.7240, 14.0270],
  'Luna (Pob.)': [120.7320, 14.0230],
  'Luntal': [120.7300, 14.0400],
  'Magahis': [120.7630, 14.0440],
  'Malibu': [120.7160, 14.0060],
  'Mataywanac': [120.7480, 14.0450],
  'Palincaro': [120.7120, 14.0170],
  'Putol': [120.7300, 14.0090],
  'Rillo (Pob.)': [120.7285, 14.0230],
  'Rizal (Pob.)': [120.7305, 14.0265],
  'Sabang': [120.7300, 14.0500],
  'San Jose': [120.7750, 14.0420],
  'San Jose (Putic)': [120.7420, 14.0030],
  'Talon': [120.7140, 14.0270],
  'Toong': [120.7560, 14.0580],
  'Tuyon-tuyon (Obispo)': [120.7310, 14.0180],
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
  onChange,
  onClose,
  isEmbedded = false,
}: TuyMapPickerProps) {
  const [coords, setCoords] = useState<[number, number]>(initialCoordinates);
  const [barangay, setBarangay] = useState<string>(initialBarangay);
  const [detectedBarangay, setDetectedBarangay] = useState<string>(initialBarangay);
  const [addressChoice, setAddressChoice] = useState<'custom' | 'barangay'>('custom');
  const [streetAddress, setStreetAddress] = useState<string>(
    initialAddress || `Brgy. ${initialBarangay}, Tuy, Batangas`
  );
  const [hasPin, setHasPin] = useState<boolean>(true);
  const [justApplied, setJustApplied] = useState<boolean>(false);
  const [isAddressDirty, setIsAddressDirty] = useState<boolean>(
    Boolean(initialAddress && initialAddress !== `Brgy. ${initialBarangay}, Tuy, Batangas`)
  );

  useEffect(() => {
    if (onChange) {
      const finalAddress =
        addressChoice === 'barangay'
          ? `Brgy. ${barangay}, Tuy, Batangas`
          : (streetAddress.trim() || `Brgy. ${barangay}, Tuy, Batangas`);
      onChange({
        coordinates: hasPin ? coords : [0, 0],
        address: finalAddress,
        barangay,
      });
    }
  }, [coords, barangay, streetAddress, addressChoice, hasPin]);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);
  const polygonsRef = useRef<Record<string, google.maps.Polygon>>({});

  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    return onGoogleMapsAuthError(() => {
      setAuthError(true);
    });
  }, []);

  const isGoogleMapsActive = isGoogleMapsKeyValid();

  // Custom high-visibility SVG Pin Icon
  const createPinIcon = (googleObj: typeof google) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="38" height="50" viewBox="0 0 38 50">
        <defs>
          <filter id="pShadow" x="-30%" y="-20%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3.5" stdDeviation="3" flood-color="#000000" flood-opacity="0.45"/>
          </filter>
        </defs>
        <path d="M19 48 C19 48, 35 30, 35 19 A16 16 0 0 0 3 19 C3 30, 19 48, 19 48 Z" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5" filter="url(#pShadow)"/>
        <circle cx="19" cy="19" r="7.5" fill="#FFFFFF"/>
        <circle cx="19" cy="19" r="4.5" fill="#F59E0B"/>
      </svg>
    `;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new googleObj.maps.Size(38, 50),
      anchor: new googleObj.maps.Point(19, 48),
    };
  };

  // Helper to safely instantiate or move marker
  const createOrUpdateMarker = (
    map: google.maps.Map,
    position: google.maps.LatLng | google.maps.LatLngLiteral,
    googleObj: typeof google
  ) => {
    if (!markerInstance.current) {
      const MarkerClass =
        googleObj?.maps?.Marker ||
        (window as unknown as { google?: { maps?: { Marker: typeof google.maps.Marker } } })?.google?.maps?.Marker;

      if (!MarkerClass) {
        console.warn('google.maps.Marker class not found');
        return null;
      }

      const marker = new MarkerClass({
        position,
        map,
        draggable: true,
        title: 'Tuy Pinpoint (Drag to adjust or click map to move)',
        icon: createPinIcon(googleObj),
        animation: googleObj.maps.Animation.DROP,
        zIndex: 9999,
      });

      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) {
          const lng = Number(pos.lng().toFixed(6));
          const lat = Number(pos.lat().toFixed(6));
          const detected = getClosestTuyBarangay(lng, lat);
          setCoords([lng, lat]);
          setHasPin(true);
          setDetectedBarangay(detected);
        }
      });

      markerInstance.current = marker;
    } else {
      markerInstance.current.setPosition(position);
      markerInstance.current.setMap(map);
    }

    setHasPin(true);
    return markerInstance.current;
  };

  // Initialize Google Maps if key is valid
  useEffect(() => {
    if (!isGoogleMapsActive || !mapContainer.current) return;

    let isMounted = true;

    loadGoogleMaps()
      .then(({ maps }) => {
        if (!isMounted || !mapContainer.current) return;

        const googleObj = window.google;
        if (!googleObj || !googleObj.maps) {
          console.error('Google Maps global object not available');
          return;
        }

        const center = toLatLngLiteral(coords);

        const map = new maps.Map(mapContainer.current, {
          center,
          zoom: 15,
          mapTypeId: maps.MapTypeId.ROADMAP,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
        });

        mapInstance.current = map;

        // Force resize trigger after container layout is painted
        setTimeout(() => {
          if (mapInstance.current && googleObj.maps.event) {
            googleObj.maps.event.trigger(mapInstance.current, 'resize');
            mapInstance.current.setCenter(center);
          }
        }, 150);

        // Create initial marker if enabled
        if (hasPin) {
          createOrUpdateMarker(map, center, googleObj);
        }

        // When map is clicked: Place or move marker to clicked spot
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const pos = e.latLng;
          createOrUpdateMarker(map, pos, googleObj);

          const lng = Number(pos.lng().toFixed(6));
          const lat = Number(pos.lat().toFixed(6));
          const detected = getClosestTuyBarangay(lng, lat);
          setCoords([lng, lat]);
          setHasPin(true);
          setDetectedBarangay(detected);
        });

        // Draw Barangays Boundaries on Google Maps
        Object.entries(BARANGAY_BOUNDARIES).forEach(([bName, pts]) => {
          const path = pts.map(([lng, lat]) => ({ lat, lng }));
          const isSelected = bName === barangay || bName === detectedBarangay;

          const poly = new maps.Polygon({
            paths: path,
            strokeColor: isSelected ? '#D97706' : '#2563EB',
            strokeOpacity: isSelected ? 1.0 : 0.35,
            strokeWeight: isSelected ? 4 : 1.2,
            fillColor: isSelected ? '#F59E0B' : '#3B82F6',
            fillOpacity: isSelected ? 0.25 : 0.02,
            zIndex: isSelected ? 100 : 1,
            map,
          });

          poly.addListener('click', (e: google.maps.MapMouseEvent) => {
            setBarangay(bName);
            if (e.latLng) {
              const lng = Number(e.latLng.lng().toFixed(6));
              const lat = Number(e.latLng.lat().toFixed(6));
              setCoords([lng, lat]);
              setHasPin(true);
              setDetectedBarangay(bName);
              if (mapInstance.current && window.google) {
                createOrUpdateMarker(mapInstance.current, e.latLng, window.google);
              }
            }
          });

          polygonsRef.current[bName] = poly;
        });

        // ResizeObserver to ensure map properly repaints if layout changes or window resizes
        if (typeof ResizeObserver !== 'undefined' && mapContainer.current) {
          const ro = new ResizeObserver(() => {
            if (mapInstance.current && googleObj?.maps?.event) {
              googleObj.maps.event.trigger(mapInstance.current, 'resize');
            }
          });
          ro.observe(mapContainer.current);
          return () => {
            isMounted = false;
            ro.disconnect();
          };
        }
      })
      .catch((err) => {
        console.error('Error initializing Google Maps in picker:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isGoogleMapsActive]);

  // Dynamically update polygon styling when selected barangay changes
  useEffect(() => {
    const activeBrgy = barangay || detectedBarangay;
    Object.entries(polygonsRef.current).forEach(([bName, poly]) => {
      const isSelected = bName === activeBrgy;
      poly.setOptions({
        strokeColor: isSelected ? '#D97706' : '#2563EB',
        strokeOpacity: isSelected ? 1.0 : 0.35,
        strokeWeight: isSelected ? 4 : 1.2,
        fillColor: isSelected ? '#F59E0B' : '#3B82F6',
        fillOpacity: isSelected ? 0.25 : 0.02,
        zIndex: isSelected ? 100 : 1,
      });
    });
  }, [barangay, detectedBarangay]);

  // When barangay dropdown is manually chosen by the user
  const handleBarangayDropdownChange = (brgyName: string) => {
    setBarangay(brgyName);
    if (!isAddressDirty) {
      setStreetAddress(`Brgy. ${brgyName}, Tuy, Batangas`);
    }
  };

  // Move pin to the selected barangay center (User-initiated only)
  const handleCenterPinToBarangay = (brgyName: string = barangay) => {
    setBarangay(brgyName);
    const targetCoords = BARANGAY_COORDINATES[brgyName] || TUY_CENTER_COORDINATES;
    setCoords(targetCoords);
    setDetectedBarangay(brgyName);
    if (!isAddressDirty) {
      setStreetAddress(`Brgy. ${brgyName}, Tuy, Batangas`);
    }

    if (mapInstance.current && typeof window !== 'undefined' && window.google) {
      const pos = toLatLngLiteral(targetCoords);
      if (hasPin) {
        createOrUpdateMarker(mapInstance.current, pos, window.google);
      }
      mapInstance.current.panTo(pos);
      mapInstance.current.setZoom(15);
    }
  };

  // Toggle or Clear Pin (No Marker mode)
  const handleTogglePin = () => {
    if (hasPin) {
      if (markerInstance.current) {
        markerInstance.current.setMap(null);
      }
      setHasPin(false);
    } else {
      if (mapInstance.current && typeof window !== 'undefined' && window.google) {
        const pos = toLatLngLiteral(coords);
        createOrUpdateMarker(mapInstance.current, pos, window.google);
        mapInstance.current.panTo(pos);
      }
      setHasPin(true);
    }
  };

  // Click on interactive vector canvas (Fallback when Google Maps key is not configured)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const lng = 120.710 + x * (120.755 - 120.710);
    const lat = 14.045 - y * (14.045 - 14.008);

    const detected = getClosestTuyBarangay(lng, lat);
    setCoords([lng, lat]);
    setHasPin(true);
    setDetectedBarangay(detected);
  };

  const handleConfirm = () => {
    // Determine the address string based on user's choice:
    // Either the custom editable text or the official barangay format
    const finalAddress =
      addressChoice === 'barangay'
        ? `Brgy. ${barangay}, Tuy, Batangas`
        : (streetAddress.trim() || `Brgy. ${barangay}, Tuy, Batangas`);

    onSelectLocation({
      coordinates: hasPin ? coords : [0, 0],
      address: finalAddress,
      barangay,
    });
    if (onChange) {
      onChange({
        coordinates: hasPin ? coords : [0, 0],
        address: finalAddress,
        barangay,
      });
    }
    setJustApplied(true);
    setTimeout(() => {
      setJustApplied(false);
    }, 2000);
    if (!isEmbedded && onClose) onClose();
  };

  const handleCancel = () => {
    if (initialCoordinates) {
      setCoords(initialCoordinates);
    }
    setStreetAddress(initialAddress || `Brgy. ${initialBarangay}, Tuy, Batangas`);
    setBarangay(initialBarangay);
    setDetectedBarangay(initialBarangay);
    setIsAddressDirty(false);
    if (onClose) onClose();
  };

  return (
    <div
      className={`flex flex-col bg-white ${
        isEmbedded
          ? 'w-full h-full overflow-y-auto'
          : 'overflow-hidden rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full'
      }`}
    >
      {/* Header */}
      {!isEmbedded && (
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
      )}

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
      <div
        className={`relative w-full bg-slate-900 overflow-hidden cursor-crosshair shrink-0 ${
          isEmbedded ? 'h-[320px] sm:h-[360px] lg:flex-1 lg:min-h-[260px]' : 'h-80 sm:h-[420px]'
        }`}
      >
        {/* Floating Pin Status & Quick Controls Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-2 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-lg text-[11px] font-bold text-white flex items-center gap-1.5 pointer-events-auto">
            {hasPin ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Pin Placed • Click map to move or drag</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-amber-200">No Pin Placed • Click map to drop pin</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleTogglePin}
            className={`pointer-events-auto px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 border ${
              hasPin
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
            }`}
          >
            {hasPin ? 'Clear Pin (No Marker)' : 'Drop Pin Here'}
          </button>
        </div>

        {isGoogleMapsActive && !authError ? (
          <div ref={mapContainer} className="w-full h-full" />
        ) : (
          /* Interactive High-Fidelity Vector Canvas for Tuy */
          <div
            onClick={handleCanvasClick}
            className="w-full h-full relative p-4 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-[#101c42] to-slate-950 text-white select-none overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"></div>

            {/* SVG Barangay Boundaries Layer for Fallback Canvas */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
            >
              {Object.entries(BARANGAY_BOUNDARIES).map(([bName, pts]) => {
                const isSelected = bName === barangay || bName === detectedBarangay;
                const svgPts = pts
                  .map(([lng, lat]) => {
                    const x = ((lng - 120.700) / (120.765 - 120.700)) * 1000;
                    const y = ((14.055 - lat) / (14.055 - 13.995)) * 1000;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ');

                return (
                  <polygon
                    key={bName}
                    points={svgPts}
                    fill={isSelected ? 'rgba(245, 158, 11, 0.28)' : 'rgba(59, 130, 246, 0.03)'}
                    stroke={isSelected ? '#F59E0B' : '#3B82F6'}
                    strokeWidth={isSelected ? '4' : '1.2'}
                    strokeOpacity={isSelected ? '1' : '0.35'}
                  />
                );
              })}
            </svg>

            {/* Top Bar with detected location */}
            <div className="relative z-10 flex items-center justify-between text-xs text-blue-200 bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 pointer-events-none mt-8">
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300">Proximity: Brgy. {detectedBarangay}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-300">
                {hasPin ? `${coords[1].toFixed(4)}° N, ${coords[0].toFixed(4)}° E` : 'No Pin'}
              </span>
            </div>

            {/* Visual Pinpoint at center of active selection */}
            <div className="relative z-10 my-auto text-center pointer-events-none">
              {hasPin ? (
                <div className="inline-flex flex-col items-center animate-bounce">
                  <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl border-2 border-white">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="w-3 h-1 bg-black/60 rounded-full blur-xs mt-1"></div>
                  <p className="text-sm text-amber-300 font-extrabold mt-2 drop-shadow-md">
                    Brgy. {barangay}, Tuy, Batangas
                  </p>
                  <p className="text-[11px] text-blue-200/90 font-medium">
                    Tap anywhere on the map to place pin
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-900/80 rounded-2xl border border-white/10 max-w-xs mx-auto">
                  <p className="text-sm text-amber-300 font-bold">No Marker Placed</p>
                  <p className="text-xs text-slate-400 mt-1">Tap anywhere to place a pin marker</p>
                </div>
              )}
            </div>

            <div className="relative z-10 text-[11px] text-slate-400 text-center font-medium pointer-events-none flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Municipality of Tuy • Saint Vincent Ferrer Parish</span>
            </div>
          </div>
        )}
      </div>

      {/* Address & Barangay Controls (Image 2 controls - shown in both standalone modal & embedded page) */}
      <div className="p-4 sm:p-5 space-y-4 bg-white shrink-0 border-t border-slate-200">
        {/* Row 1: Barangay selection & Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Selected Barangay (Official)</span>
              {detectedBarangay !== barangay && (
                <button
                  type="button"
                  onClick={() => handleBarangayDropdownChange(detectedBarangay)}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                  title="Click to use the nearest detected barangay"
                >
                  Use Proximity ({detectedBarangay})
                </button>
              )}
            </label>
            <select
              value={barangay}
              onChange={(e) => handleBarangayDropdownChange(e.target.value)}
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
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Pinned GPS Coordinates (Saved)</span>
              <button
                type="button"
                onClick={handleTogglePin}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                {hasPin ? 'Clear Pin' : 'Drop Pin'}
              </button>
            </label>
            <input
              type="text"
              readOnly
              value={hasPin ? `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}` : 'No Pinpoint Placed'}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-medium ${
                hasPin ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            />
          </div>
        </div>

        {/* Address Selection Option (Save Home Address Editable OR Barangay Address) */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900">
              Choose Address Format to Save:
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Coordinates ({coords[1].toFixed(4)}, {coords[0].toFixed(4)}) will be saved
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Option A: Custom Editable Home Address */}
            <label
              className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                addressChoice === 'custom'
                  ? 'bg-white border-blue-600 shadow-xs ring-1 ring-blue-600'
                  : 'bg-white/70 border-slate-200 hover:bg-white'
              }`}
            >
              <input
                type="radio"
                name="addressChoice"
                checked={addressChoice === 'custom'}
                onChange={() => setAddressChoice('custom')}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Home Address (Editable)</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Save custom street, house #, or sitio
                </span>
              </div>
            </label>

            {/* Option B: Standard Barangay Address */}
            <label
              className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                addressChoice === 'barangay'
                  ? 'bg-white border-blue-600 shadow-xs ring-1 ring-blue-600'
                  : 'bg-white/70 border-slate-200 hover:bg-white'
              }`}
            >
              <input
                type="radio"
                name="addressChoice"
                checked={addressChoice === 'barangay'}
                onChange={() => setAddressChoice('barangay')}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Barangay Format</span>
                <span className="text-[11px] text-blue-700 font-semibold block mt-0.5 truncate">
                  Brgy. {barangay}, Tuy, Batangas
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Editable Address Text Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>
              {addressChoice === 'custom'
                ? 'Custom Home Address (Will be saved)'
                : 'Custom Home Address (Optional)'}
            </span>
            <button
              type="button"
              onClick={() => {
                setStreetAddress(`Brgy. ${barangay}, Tuy, Batangas`);
                setIsAddressDirty(false);
              }}
              className="text-[11px] text-blue-600 font-semibold hover:underline"
            >
              Reset to &quot;Brgy. {barangay}&quot;
            </button>
          </label>
          <input
            type="text"
            required={addressChoice === 'custom'}
            placeholder="e.g. 142 Rizal St., Brgy. Poblacion 1, Tuy, Batangas"
            value={streetAddress}
            onChange={(e) => {
              setStreetAddress(e.target.value);
              setIsAddressDirty(true);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          {onClose && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 ${
              justApplied
                ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-400'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{justApplied ? 'Address Applied ✓' : 'Apply Selected Address'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
