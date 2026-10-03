'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CLPCouple } from '@/types';
import { TUY_CENTER_COORDINATES } from '@/lib/data/mock-data';
import { BARANGAY_COORDINATES } from '@/components/map/TuyMapPicker';
import { computeAgeString, getCoupleAgeBracketKey, REPORT_AGE_BRACKETS } from '@/lib/reports/reportHelpers';
import { Navigation, Compass, Layers, Crosshair, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface TuyParticipantsLeafletMapProps {
  couples: CLPCouple[];
  selectedCoupleId?: string | null;
  onSelectCouple?: (couple: CLPCouple) => void;
  className?: string;
}

export default function TuyParticipantsLeafletMap({
  couples,
  selectedCoupleId,
  onSelectCouple,
  className = 'w-full h-full',
}: TuyParticipantsLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersGroupRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersMapRef = useRef<Record<string, any>>({});
  const [mapReady, setMapReady] = useState(false);
  const [activeTileType, setActiveTileType] = useState<'voyager' | 'osm'>('voyager');

  // Center Tuy coordinates: lat = 14.0228, lng = 120.7289
  const tuyLat = TUY_CENTER_COORDINATES[1];
  const tuyLng = TUY_CENTER_COORDINATES[0];

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!containerRef.current || mapRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !containerRef.current) return;

      // Fix default Leaflet icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current, {
        center: [tuyLat, tuyLng],
        zoom: 13,
        minZoom: 11,
        maxZoom: 18,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // CartoDB Voyager tiles (clean, modern with clear labels)
      const voyagerLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
          subdomains: 'abcd',
        }
      );

      voyagerLayer.addTo(map);
      mapRef.current = map;

      const markersGroup = L.featureGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      setMapReady(true);

      // Resize trigger
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [tuyLat, tuyLng]);

  // Update Markers whenever couples or selection changes
  useEffect(() => {
    if (!mapReady || !mapRef.current || !markersGroupRef.current) return;

    let isMounted = true;

    async function renderMarkers() {
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapRef.current || !markersGroupRef.current) return;

      const markersGroup = markersGroupRef.current;
      markersGroup.clearLayers();
      markersMapRef.current = {};

      if (!couples.length) return;

      const bounds = L.latLngBounds([]);

      couples.forEach((couple, idx) => {
        let lng = couple.coordinates ? couple.coordinates[0] : 0;
        let lat = couple.coordinates ? couple.coordinates[1] : 0;

        // If coordinates missing or invalid, fallback to barangay coordinates with minor jitter
        if (!lat || !lng || lat < 13 || lng < 120) {
          const bCoord = BARANGAY_COORDINATES[couple.barangay] || [tuyLng, tuyLat];
          const jx = ((idx % 5) - 2) * 0.0025;
          const jy = ((Math.floor(idx / 5) % 5) - 2) * 0.0025;
          lng = bCoord[0] + jx;
          lat = bCoord[1] + jy;
        }

        const isSelected = couple.id === selectedCoupleId;
        const initials = `${couple.husbandFirstName.charAt(0)}${couple.wifeFirstName.charAt(0)}`;
        const pinBg = isSelected ? '#d97706' : '#243c81';
        const ringColor = isSelected ? '#fbbf24' : '#ffffff';

        const customHtml = `
          <div style="position: relative; width: 36px; height: 44px; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              background: ${pinBg};
              transform: rotate(-45deg);
              border: 2.5px solid ${ringColor};
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
            ">
              <span style="
                transform: rotate(45deg);
                color: #ffffff;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                font-weight: 900;
                font-size: 10px;
                letter-spacing: -0.5px;
              ">
                ${initials}
              </span>
            </div>
            <div style="
              width: 6px;
              height: 4px;
              background: rgba(0,0,0,0.3);
              border-radius: 50%;
              margin-top: 1px;
            "></div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'cfc-leaflet-pin',
          html: customHtml,
          iconSize: [36, 44],
          iconAnchor: [18, 42],
          popupAnchor: [0, -42],
        });

        const marker = L.marker([lat, lng], {
          icon: customIcon,
          zIndexOffset: isSelected ? 1000 : 10,
        });

        // Popup Content
        const hAge = computeAgeString(couple.husbandBirthday);
        const wAge = computeAgeString(couple.wifeBirthday);
        const hBracket =
          REPORT_AGE_BRACKETS.find((b) => b.key === getCoupleAgeBracketKey(couple.husbandBirthday))
            ?.label || '';
        const wBracket =
          REPORT_AGE_BRACKETS.find((b) => b.key === getCoupleAgeBracketKey(couple.wifeBirthday))
            ?.label || '';

        const popupHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 2px; min-width: 250px; color: #0f172a;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; gap: 8px;">
              <span style="font-size: 10px; font-weight: 800; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px;">
                ${couple.status || 'Active'}
              </span>
              <span style="font-size: 11px; font-weight: 700; color: #243c81;">
                Brgy. ${couple.barangay}
              </span>
            </div>
            <h4 style="font-size: 13px; font-weight: 900; margin: 0 0 4px 0; color: #0f172a; line-height: 1.3;">
              Bro. ${couple.husbandFirstName} &amp; Sis. ${couple.wifeFirstName} ${couple.husbandLastName}
            </h4>
            <div style="font-size: 11px; color: #475569; margin-bottom: 6px; line-height: 1.4;">
              <div>• Husband: <strong>${hAge} yrs</strong> <span style="color:#64748b;">(${hBracket})</span></div>
              <div>• Wife: <strong>${wAge} yrs</strong> <span style="color:#64748b;">(${wBracket})</span></div>
            </div>
            ${
              couple.weddingAnniversary
                ? `<div style="font-size: 11px; color: #e11d48; font-weight: 700; margin-bottom: 6px;">
                    ♥ Married: ${couple.weddingAnniversary}
                  </div>`
                : ''
            }
            <div style="font-size: 10px; color: #64748b; margin-bottom: 8px; line-height: 1.3;">
              ${couple.address || `Tuy, Batangas`}
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">${lat.toFixed(4)}°, ${lng.toFixed(4)}°</span>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; font-weight: 800; color: #2563eb; text-decoration: none;">
                Directions ↗
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml, {
          closeButton: true,
          maxWidth: 300,
          className: 'cfc-leaflet-popup',
        });

        marker.on('click', () => {
          if (onSelectCouple) {
            onSelectCouple(couple);
          }
        });

        markersGroup.addLayer(marker);
        markersMapRef.current[couple.id] = marker;
        bounds.extend([lat, lng]);
      });

      // Fit bounds if no couple specifically focused
      if (!selectedCoupleId && bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }

    renderMarkers();

    return () => {
      isMounted = false;
    };
  }, [couples, mapReady, selectedCoupleId, onSelectCouple, tuyLat, tuyLng]);

  // Center and open popup when selectedCoupleId changes
  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedCoupleId) return;

    const marker = markersMapRef.current[selectedCoupleId];
    if (marker) {
      const latLng = marker.getLatLng();
      mapRef.current.flyTo(latLng, 16, { duration: 0.8 });
      marker.openPopup();
    }
  }, [selectedCoupleId, mapReady]);

  // Fit bounds helper button
  const handleFitAll = () => {
    if (markersGroupRef.current && mapRef.current) {
      const bounds = markersGroupRef.current.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }
  };

  // Toggle map tiles (Voyager vs Standard OpenStreetMap)
  const handleToggleTile = async () => {
    if (!mapRef.current) return;
    const L = (await import('leaflet')).default;
    const nextType = activeTileType === 'voyager' ? 'osm' : 'voyager';
    setActiveTileType(nextType);

    // Remove existing tile layers
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current.removeLayer(layer);
      }
    });

    const url =
      nextType === 'voyager'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(url, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Map Canvas Container */}
      <div ref={containerRef} className="w-full h-full min-h-[320px] bg-slate-100 z-0" />

      {/* Floating Header Info Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl border border-white/15 text-xs font-bold shadow-xl pointer-events-auto flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-amber-400" />
          <span>Tuy Interactive Map Directory</span>
          <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black">
            {couples.length} Pins Plotted
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={handleFitAll}
            className="bg-white/95 hover:bg-white text-slate-800 p-2 rounded-xl border border-slate-200 shadow-md text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
            title="Fit all markers in view"
          >
            <Crosshair className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline text-[11px]">Fit Pins</span>
          </button>

          <button
            type="button"
            onClick={handleToggleTile}
            className="bg-white/95 hover:bg-white text-slate-800 p-2 rounded-xl border border-slate-200 shadow-md text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
            title="Toggle Map Style"
          >
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline text-[11px]">
              {activeTileType === 'voyager' ? 'Voyager' : 'Street'}
            </span>
          </button>
        </div>
      </div>

      {/* Tuy Center Compass Indicator */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-lg text-[11px] font-bold text-slate-700 pointer-events-none flex items-center gap-1.5">
        <Compass className="w-3.5 h-3.5 text-blue-600" />
        <span>Tuy, Batangas (14.02° N, 120.73° E)</span>
      </div>
    </div>
  );
}
