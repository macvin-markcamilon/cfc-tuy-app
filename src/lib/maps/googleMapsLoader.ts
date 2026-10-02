'use client';

import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

let isConfigured = false;
let mapsLibraryPromise: Promise<{
  maps: typeof google.maps;
  marker?: typeof google.maps.marker;
}> | null = null;

export function getGoogleMapsApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
}

export function isGoogleMapsKeyValid(key?: string): boolean {
  const k = key || getGoogleMapsApiKey();
  return Boolean(k && k.length > 20 && !k.includes('your_google_maps_api_key'));
}

/**
 * Convert [longitude, latitude] array to Google Maps LatLngLiteral { lat, lng }
 */
export function toLatLngLiteral(coords: [number, number]): google.maps.LatLngLiteral {
  return {
    lat: coords[1],
    lng: coords[0],
  };
}

/**
 * Convert Google Maps LatLng or LatLngLiteral to [longitude, latitude]
 */
export function fromLatLng(
  latLng: google.maps.LatLng | google.maps.LatLngLiteral
): [number, number] {
  if (typeof (latLng as google.maps.LatLng).lat === 'function') {
    const l = latLng as google.maps.LatLng;
    return [Number(l.lng().toFixed(6)), Number(l.lat().toFixed(6))];
  }
  const l = latLng as google.maps.LatLngLiteral;
  return [Number(l.lng.toFixed(6)), Number(l.lat.toFixed(6))];
}

/**
 * Initializes and imports the Google Maps JavaScript API libraries
 */
export async function loadGoogleMaps(): Promise<{
  maps: typeof google.maps;
  marker?: typeof google.maps.marker;
}> {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps can only be loaded on the client.');
  }

  const apiKey = getGoogleMapsApiKey();
  if (!isGoogleMapsKeyValid(apiKey)) {
    throw new Error('Invalid or missing Google Maps API key.');
  }

  if (mapsLibraryPromise) {
    return mapsLibraryPromise;
  }

  mapsLibraryPromise = (async () => {
    if (!isConfigured) {
      setOptions({
        key: apiKey,
        v: 'weekly',
      });
      isConfigured = true;
    }

    const maps = (await importLibrary('maps')) as typeof google.maps;
    let marker: typeof google.maps.marker | undefined;
    try {
      marker = (await importLibrary('marker')) as typeof google.maps.marker;
    } catch (e) {
      console.warn('Advanced marker library not available, fallback to standard markers', e);
    }

    return { maps, marker };
  })();

  return mapsLibraryPromise;
}
