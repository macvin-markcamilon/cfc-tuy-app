'use client';

import { WorshipSong } from '../data/songs-service';

export interface SavedPlaylist {
  id: string;
  name: string;
  createdAt: string;
  songIds: string[];
}

const PLAYLISTS_STORAGE_KEY = 'cfc_tuy_saved_playlists';
const ACTIVE_PLAYLIST_KEY = 'cfc_tuy_active_playlist_songs';

/**
 * Get active queued song IDs from localStorage
 */
export function getActivePlaylistIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACTIVE_PLAYLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse active playlist:', err);
    return [];
  }
}

/**
 * Save active queued song IDs to localStorage
 */
export function setActivePlaylistIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_PLAYLIST_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('Failed to save active playlist:', err);
  }
}

/**
 * Get all saved named playlists from localStorage
 */
export function getSavedPlaylists(): SavedPlaylist[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse saved playlists:', err);
    return [];
  }
}

/**
 * Save a new or updated named playlist to localStorage
 */
export function savePlaylist(name: string, songIds: string[]): SavedPlaylist {
  const playlists = getSavedPlaylists();
  const newPlaylist: SavedPlaylist = {
    id: `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || 'My Worship Playlist',
    createdAt: new Date().toISOString(),
    songIds,
  };
  playlists.unshift(newPlaylist);
  if (typeof window !== 'undefined') {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
  }
  return newPlaylist;
}

/**
 * Delete a saved playlist by ID
 */
export function deletePlaylist(id: string): void {
  const playlists = getSavedPlaylists().filter((p) => p.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
  }
}
