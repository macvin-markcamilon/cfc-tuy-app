import { MinistryType } from '@/types';
import { createClient } from '@/lib/supabase/client';
import {
  saveVideoBlob,
  getVideoBlobUrl,
  deleteVideoBlob,
  dataUrlToBlob,
} from './video-storage';

export interface WorshipSong {
  id: string;
  title: string;
  artist: string;
  key: string;
  tempo?: string;
  timeSignature?: string;
  category: 'Praise' | 'Worship' | 'Reflection' | 'Offertory' | 'Gathering' | 'Recessional' | 'Marian' | 'Mass Ordinary';
  ministry?: MinistryType | 'ALL';
  lyricsAndChords: string;
  lyricsOnly?: string; // Separate clean presentation lyrics (distinct from lyrics with chords)
  ccliNumber?: string;
  audioUrl?: string; // MP3 URL or base64 data URI
  audioFileName?: string;
  youtubeUrl?: string; // YouTube video or audio link
  videoUrl?: string; // Visualizer background video URL (.mp4, .webm)
  videoFileName?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Helper to extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const str = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = str.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  return null;
}

/**
 * Checks whether a given URL is a YouTube link
 */
export function isYouTubeUrl(url?: string): boolean {
  return extractYouTubeId(url) !== null;
}

const STORAGE_KEY = 'cfc_tuy_worship_songs_v1';
const DELETED_SONGS_KEY = 'cfc_tuy_worship_songs_deleted_v1';
export const SYSTEM_VISUALIZER_SETTINGS_ID = 'system-visualizer-settings';
export const DEFAULT_VISUALIZER_VIDEO_KEY = 'cfc_tuy_default_visualizer_video_v1';

/**
 * Empty default list - real songs are always sourced from Supabase.
 */
export const DEFAULT_CFC_SONGS: WorshipSong[] = [];

/**
 * Identifiers of former static placeholder / mock songs to filter out
 */
export const LEGACY_MOCK_SONG_IDS = new Set([
  'song-1-light-of-christ',
  'song-2-ablaze',
  'song-3-god-is-enough',
  'song-4-you-are-near',
  'song-5-offer-my-life',
]);

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getDeletedWorshipSongIds(): Set<string> {
  if (!isBrowser()) return new Set();
  try {
    const raw = localStorage.getItem(DELETED_SONGS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function addDeletedWorshipSongId(id: string): void {
  if (!isBrowser()) return;
  try {
    const deleted = getDeletedWorshipSongIds();
    deleted.add(id);
    localStorage.setItem(DELETED_SONGS_KEY, JSON.stringify(Array.from(deleted)));
  } catch (err) {
    console.error('Failed to record deleted worship song ID:', err);
  }
}

export function removeDeletedWorshipSongId(id: string): void {
  if (!isBrowser()) return;
  try {
    const deleted = getDeletedWorshipSongIds();
    deleted.delete(id);
    localStorage.setItem(DELETED_SONGS_KEY, JSON.stringify(Array.from(deleted)));
  } catch (err) {
    console.error('Failed to remove deleted worship song ID:', err);
  }
}

export function getLocalSongs(): WorshipSong[] {
  if (!isBrowser()) return [];
  const deletedIds = getDeletedWorshipSongIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (s: WorshipSong) =>
          s &&
          s.id &&
          !deletedIds.has(s.id) &&
          !LEGACY_MOCK_SONG_IDS.has(s.id) &&
          s.id !== SYSTEM_VISUALIZER_SETTINGS_ID &&
          !s.title?.startsWith('__')
      );
    }
    return [];
  } catch {
    return [];
  }
}

export function setLocalSongs(songs: WorshipSong[]): void {
  if (!isBrowser()) return;
  const deletedIds = getDeletedWorshipSongIds();
  const cleanSongs = songs.filter(
    (s) =>
      s &&
      s.id &&
      !deletedIds.has(s.id) &&
      !LEGACY_MOCK_SONG_IDS.has(s.id) &&
      s.id !== SYSTEM_VISUALIZER_SETTINGS_ID &&
      !s.title?.startsWith('__')
  );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanSongs));
  } catch (err) {
    console.error('Failed to save worship songs to local storage:', err);
    try {
      const sanitized = cleanSongs.map((s) => ({
        ...s,
        audioUrl: s.audioUrl?.startsWith('data:') ? '' : s.audioUrl,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch (innerErr) {
      console.warn('Could not save sanitized songs to localStorage:', innerErr);
    }
  }
}

// -----------------------------------------------------------------------------
// Realtime Broadcast Channel & Notifications
// -----------------------------------------------------------------------------
const SONGS_UPDATE_TS_KEY = 'cfc_songs_last_update_ts';

export function notifySongsChange(payload?: any) {
  if (!isBrowser()) return;

  // 1. Immediately notify listeners in the current tab/window
  try {
    window.dispatchEvent(new CustomEvent('cfc_songs_changed', { detail: payload }));
  } catch {}

  // 2. Trigger native cross-tab storage event across all open browser tabs
  try {
    localStorage.setItem(SONGS_UPDATE_TS_KEY, String(Date.now()));
  } catch {}

  // 3. Broadcast to Supabase Realtime channel across other devices and browsers
  try {
    const supabase = createClient();
    if (supabase) {
      const tempChannelName = `cfc_bc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const bc = supabase.channel(tempChannelName);
      bc.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          bc.send({
            type: 'broadcast',
            event: 'songs_changed',
            payload: payload || { timestamp: Date.now() },
          }).finally(() => {
            setTimeout(() => {
              try {
                supabase.removeChannel(bc);
              } catch {}
            }, 1500);
          });
        }
      });
    }
  } catch (err) {
    console.warn('Failed to broadcast song change:', err);
  }
}

/**
 * Subscribes to real-time song repertoire updates across browsers, devices, and tabs.
 * Each subscriber uses an isolated, uniquely identified Supabase channel to prevent
 * "cannot add postgres_changes callbacks after subscribe()" channel reuse errors.
 */
export function subscribeToSongsChanges(onChange: () => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const supabase = createClient();
  let channel: any = null;

  if (supabase) {
    try {
      // Use unique channel identifier so subscribers never conflict
      const uniqueChannelName = `cfc_sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      channel = supabase.channel(uniqueChannelName);

      channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'worship_songs' },
          () => {
            try {
              onChange();
            } catch (err) {
              console.warn('Realtime postgres_changes callback error:', err);
            }
          }
        )
        .subscribe();
    } catch (realtimeErr) {
      console.warn('Supabase realtime subscription failed:', realtimeErr);
    }
  }

  // Same-tab event listener
  const handleCustomEvent = () => {
    try {
      onChange();
    } catch {}
  };
  window.addEventListener('cfc_songs_changed', handleCustomEvent);

  // Cross-tab storage changes
  const handleStorage = (e: StorageEvent) => {
    if (
      e.key === STORAGE_KEY ||
      e.key === DELETED_SONGS_KEY ||
      e.key === SONGS_UPDATE_TS_KEY ||
      e.key === DEFAULT_VISUALIZER_VIDEO_KEY
    ) {
      try {
        onChange();
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorage);

  // Tab focus change
  const handleFocus = () => {
    try {
      onChange();
    } catch {}
  };
  window.addEventListener('focus', handleFocus);

  // Tab visibility change
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      try {
        onChange();
      } catch {}
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  // Heartbeat fallback poll (every 5 seconds) to ensure real-time guarantee across network drops
  const pollTimer = setInterval(() => {
    try {
      onChange();
    } catch {}
  }, 5000);

  return () => {
    if (channel && supabase) {
      try {
        supabase.removeChannel(channel);
      } catch {}
    }
    window.removeEventListener('cfc_songs_changed', handleCustomEvent);
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibility);
    clearInterval(pollTimer);
  };
}

/**
 * Maps a Supabase DB row to the application's WorshipSong interface
 */
export function mapRowToWorshipSong(d: any, local?: WorshipSong): WorshipSong {
  let youtubeUrl = d.youtube_url || local?.youtubeUrl || '';
  let audioUrl = d.audio_url || local?.audioUrl || '';
  let notes = d.notes || local?.notes || '';
  let videoUrl = d.video_url || local?.videoUrl || '';
  let videoFileName = d.video_file_name || local?.videoFileName || '';
  let lyricsOnly = d.lyrics_only || d.lyricsOnly || local?.lyricsOnly || '';

  // 1. If audio_url is actually a YouTube link, route it to youtubeUrl
  if (!youtubeUrl && audioUrl && isYouTubeUrl(audioUrl)) {
    youtubeUrl = audioUrl;
    audioUrl = '';
  }

  // 2. If YouTube URL was encoded inside notes with [YOUTUBE: ...], extract it
  if (notes && notes.includes('[YOUTUBE:')) {
    const match = notes.match(/\[YOUTUBE:\s*([^\]]+)\]/);
    if (match) {
      if (!youtubeUrl) youtubeUrl = match[1].trim();
      notes = notes.replace(/\[YOUTUBE:\s*[^\]]+\]/g, '').trim();
    }
  }

  // 3. If Visualizer Video URL was encoded inside notes with [VIDEO: ...], extract it
  if (notes && notes.includes('[VIDEO:')) {
    const match = notes.match(/\[VIDEO:\s*([^\]]+)\]/);
    if (match) {
      if (!videoUrl) videoUrl = match[1].trim();
      notes = notes.replace(/\[VIDEO:\s*[^\]]+\]/g, '').trim();
    }
  }

  // Clean expired/stale blob: URLs from song videoUrl so they don't block default visualizer
  if (videoUrl && (videoUrl.startsWith('blob:') || videoUrl.startsWith('Uploaded:'))) {
    videoUrl = '';
  }

  // 4. If Video file name was encoded inside notes with [VIDEO_FILE: ...], extract it
  if (notes && notes.includes('[VIDEO_FILE:')) {
    const match = notes.match(/\[VIDEO_FILE:\s*([^\]]+)\]/);
    if (match) {
      if (!videoFileName) videoFileName = match[1].trim();
      notes = notes.replace(/\[VIDEO_FILE:\s*[^\]]+\]/g, '').trim();
    }
  }

  // 5. If separate Lyrics Only content was encoded inside notes with [LYRICS_ONLY_START]...[LYRICS_ONLY_END], extract it
  if (notes && notes.includes('[LYRICS_ONLY_START]')) {
    const match = notes.match(/\[LYRICS_ONLY_START\]([\s\S]*?)\[LYRICS_ONLY_END\]/);
    if (match) {
      if (!lyricsOnly) lyricsOnly = match[1].trim();
      notes = notes.replace(/\[LYRICS_ONLY_START\][\s\S]*?\[LYRICS_ONLY_END\]/g, '').trim();
    }
  }

  return {
    id: d.id,
    title: d.title || local?.title || 'Untitled Worship Song',
    artist: d.artist || local?.artist || 'CFC Music Ministry',
    key: d.key_signature || d.key || local?.key || 'G',
    tempo: d.tempo || local?.tempo,
    timeSignature: d.time_signature || local?.timeSignature,
    category: d.category || local?.category || 'Praise',
    ministry: d.ministry || local?.ministry || 'CFC',
    lyricsAndChords: d.lyrics_and_chords || d.lyricsAndChords || local?.lyricsAndChords || '',
    lyricsOnly: lyricsOnly,
    ccliNumber: d.ccli_number || local?.ccliNumber,
    audioUrl: audioUrl,
    audioFileName: d.audio_file_name || local?.audioFileName,
    youtubeUrl: youtubeUrl,
    videoUrl: videoUrl,
    videoFileName: videoFileName,
    tags: d.tags || local?.tags || [],
    notes: notes,
    createdAt: d.created_at || local?.createdAt || new Date().toISOString(),
    updatedAt: d.updated_at || local?.updatedAt,
  };
}

/**
 * Maps WorshipSong to Supabase worship_songs database row schema
 */
export function mapSongToRow(song: WorshipSong) {
  let finalAudioUrl = song.audioUrl || '';
  let notes = (song.notes || '')
    .replace(/\[YOUTUBE:\s*[^\]]+\]/g, '')
    .replace(/\[VIDEO:\s*[^\]]+\]/g, '')
    .replace(/\[VIDEO_FILE:\s*[^\]]+\]/g, '')
    .replace(/\[LYRICS_ONLY_START\][\s\S]*?\[LYRICS_ONLY_END\]/g, '')
    .trim();

  if (song.youtubeUrl && !finalAudioUrl) {
    finalAudioUrl = song.youtubeUrl;
  } else if (song.youtubeUrl && finalAudioUrl) {
    notes = notes ? `${notes}\n[YOUTUBE: ${song.youtubeUrl}]` : `[YOUTUBE: ${song.youtubeUrl}]`;
  }

  if (song.videoUrl && !song.videoUrl.startsWith('blob:') && !song.videoUrl.startsWith('Uploaded:')) {
    notes = notes ? `${notes}\n[VIDEO: ${song.videoUrl}]` : `[VIDEO: ${song.videoUrl}]`;
  }

  if (song.videoFileName) {
    notes = notes ? `${notes}\n[VIDEO_FILE: ${song.videoFileName}]` : `[VIDEO_FILE: ${song.videoFileName}]`;
  }

  if (song.lyricsOnly && song.lyricsOnly.trim()) {
    notes = notes
      ? `${notes}\n[LYRICS_ONLY_START]\n${song.lyricsOnly.trim()}\n[LYRICS_ONLY_END]`
      : `[LYRICS_ONLY_START]\n${song.lyricsOnly.trim()}\n[LYRICS_ONLY_END]`;
  }

  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    key_signature: song.key,
    tempo: song.tempo || null,
    time_signature: song.timeSignature || '4/4',
    category: song.category,
    ministry: song.ministry || 'CFC',
    lyrics_and_chords: song.lyricsAndChords,
    ccli_number: song.ccliNumber || null,
    audio_url: finalAudioUrl || null,
    audio_file_name: song.audioFileName || null,
    tags: song.tags && song.tags.length > 0 ? song.tags : null,
    notes: notes || null,
    updated_at: song.updatedAt || new Date().toISOString(),
  };
}

/**
 * Push a single song to Supabase database
 */
export async function pushSongToSupabase(song: WorshipSong): Promise<boolean> {
  if (LEGACY_MOCK_SONG_IDS.has(song.id)) return false;
  if (song.id === SYSTEM_VISUALIZER_SETTINGS_ID || song.title?.startsWith('__')) return false;
  const deletedIds = getDeletedWorshipSongIds();
  if (deletedIds.has(song.id)) return false;

  try {
    const supabase = createClient();
    if (!supabase) return false;

    const row = mapSongToRow(song);
    const { error } = await supabase.from('worship_songs').upsert(row);
    if (error) {
      console.warn('Supabase worship_songs upsert failed for:', song.title, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error pushing song to Supabase:', song.title, err);
    return false;
  }
}

export async function fetchWorshipSongs(): Promise<WorshipSong[]> {
  try {
    const supabase = createClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('worship_songs')
        .select('*')
        .order('title', { ascending: true });

      if (!error && data) {
        // Exclude legacy mock songs and system configuration records
        const validData = data.filter(
          (d: any) =>
            d &&
            d.id &&
            !LEGACY_MOCK_SONG_IDS.has(d.id) &&
            d.id !== SYSTEM_VISUALIZER_SETTINGS_ID &&
            !d.title?.startsWith('__')
        );

        // Clear any stale deleted IDs for songs that exist in Supabase
        const deletedIds = getDeletedWorshipSongIds();
        validData.forEach((d: any) => {
          if (deletedIds.has(d.id)) {
            removeDeletedWorshipSongId(d.id);
          }
        });

        const songs: WorshipSong[] = validData.map((d: any) => mapRowToWorshipSong(d));
        setLocalSongs(songs);
        return songs;
      }
    }
  } catch (err) {
    console.warn('Error fetching songs from Supabase, falling back to local storage:', err);
  }

  return getLocalSongs();
}

export async function fetchWorshipSongById(id: string): Promise<WorshipSong | null> {
  const decodedId = decodeURIComponent(id);
  const deletedIds = getDeletedWorshipSongIds();

  if (
    LEGACY_MOCK_SONG_IDS.has(id) ||
    LEGACY_MOCK_SONG_IDS.has(decodedId) ||
    deletedIds.has(id) ||
    deletedIds.has(decodedId)
  ) {
    return null;
  }

  // 1. Direct query to Supabase for instant real-time sync across devices
  try {
    const supabase = createClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('worship_songs')
        .select('*')
        .or(`id.eq.${decodedId},id.eq.${id}`)
        .maybeSingle();

      if (!error && data) {
        if (LEGACY_MOCK_SONG_IDS.has(data.id) || deletedIds.has(data.id)) {
          return null;
        }
        const localSongs = getLocalSongs();
        const local = localSongs.find((s) => s.id === decodedId || s.id === id);
        const song = mapRowToWorshipSong(data, local);

        const idx = localSongs.findIndex((s) => s.id === song.id);
        if (idx >= 0) {
          localSongs[idx] = song;
        } else {
          localSongs.unshift(song);
        }
        setLocalSongs(localSongs);
        return song;
      }
    }
  } catch (err) {
    console.warn('Supabase fetch song by id error:', err);
  }

  // 2. Fallback to all songs
  const songs = await fetchWorshipSongs();
  return songs.find((s) => s.id === decodedId || s.id === id) || null;
}

export async function saveWorshipSong(song: Partial<WorshipSong>): Promise<WorshipSong> {
  const current = getLocalSongs();
  const id = song.id || `song-${Date.now()}`;
  removeDeletedWorshipSongId(id);
  const now = new Date().toISOString();

  let finalYoutubeUrl = song.youtubeUrl?.trim() || '';
  let finalAudioUrl = song.audioUrl?.trim() || '';

  if (isYouTubeUrl(finalAudioUrl) && !finalYoutubeUrl) {
    finalYoutubeUrl = finalAudioUrl;
  }

  if (isYouTubeUrl(finalAudioUrl)) {
    finalAudioUrl = '';
  }

  let cleanLyricsOnly = song.lyricsOnly?.trim() || '';
  const cleanTitle = song.title?.trim() || 'Untitled Worship Song';
  if (cleanLyricsOnly && cleanTitle) {
    const firstLine = cleanLyricsOnly.split('\n')[0]?.trim().toLowerCase();
    if (firstLine !== cleanTitle.toLowerCase()) {
      cleanLyricsOnly = `${cleanTitle}\n\n${cleanLyricsOnly}`;
    }
  }

  const completeSong: WorshipSong = {
    id,
    title: cleanTitle,
    artist: song.artist?.trim() || 'CFC Music Ministry',
    key: song.key || 'G',
    tempo: song.tempo || 'Moderate',
    timeSignature: song.timeSignature || '4/4',
    category: song.category || 'Praise',
    ministry: song.ministry || 'CFC',
    lyricsAndChords: song.lyricsAndChords || '',
    lyricsOnly: cleanLyricsOnly,
    ccliNumber: song.ccliNumber || '',
    audioUrl: finalAudioUrl,
    audioFileName: song.audioFileName || '',
    youtubeUrl: finalYoutubeUrl,
    videoUrl: song.videoUrl?.trim() || '',
    videoFileName: song.videoFileName?.trim() || '',
    tags: song.tags || [],
    notes: song.notes || '',
    createdAt: song.createdAt || now,
    updatedAt: now,
  };

  const existingIdx = current.findIndex((s) => s.id === id);
  let updatedList: WorshipSong[];

  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = completeSong;
  } else {
    updatedList = [completeSong, ...current];
  }

  setLocalSongs(updatedList);

  // Synchronize to Supabase database
  await pushSongToSupabase(completeSong);

  // Broadcast real-time change to all other tabs and browsers
  notifySongsChange({ action: 'save', id: completeSong.id });

  return completeSong;
}

export async function deleteWorshipSong(id: string): Promise<boolean> {
  if (id === SYSTEM_VISUALIZER_SETTINGS_ID) return false;
  addDeletedWorshipSongId(id);

  const current = getLocalSongs();
  const filtered = current.filter((s) => s.id !== id);
  setLocalSongs(filtered);

  try {
    const supabase = createClient();
    if (supabase) {
      await supabase.from('worship_songs').delete().eq('id', id);
    }
  } catch (err) {
    console.error('Failed to delete song from Supabase:', err);
  }

  // Broadcast real-time deletion to all other tabs and browsers
  notifySongsChange({ action: 'delete', id });

  return true;
}

/**
 * Helper to convert File to base64 audio data URL
 */
export function fileToAudioDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an MP3 audio file directly to Supabase Storage ('songs' bucket)
 * Returns the public URL of the uploaded audio file
 */
export async function uploadSongAudio(file: File): Promise<{ url: string; fileName: string }> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
    throw new Error('Please upload an audio file (.mp3, .wav, .ogg, .m4a).');
  }

  const fileExt = file.name.split('.').pop() || 'mp3';
  const cleanBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `${Date.now()}-${cleanBase}.${fileExt}`;
  const filePath = `audio/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('songs')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'audio/mpeg',
    });

  if (uploadError) {
    console.error('Supabase storage upload error:', uploadError);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ url: reader.result as string, fileName: file.name });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const { data: publicUrlData } = supabase.storage.from('songs').getPublicUrl(filePath);

  return {
    url: publicUrlData.publicUrl,
    fileName: file.name,
  };
}

// -----------------------------------------------------------------------------
// Visualizer Background Video Settings & Cloud Sync
// -----------------------------------------------------------------------------

export interface VisualizerConfig {
  defaultVideoUrl: string;
  fontColor?: string;
  isBlurred?: boolean;
  blurAmount?: number;
  updatedAt: string;
}

export function getDefaultVisualizerVideo(): string {
  if (!isBrowser()) return '';
  return localStorage.getItem(DEFAULT_VISUALIZER_VIDEO_KEY) || '';
}

/**
 * Discovers the latest uploaded visualizer video from Supabase Storage ('songs/videos')
 * as a resilient fallback if the DB configuration record was cleared or not yet initialized.
 */
export async function discoverLatestStorageVideoUrl(): Promise<string> {
  try {
    const supabase = createClient();
    if (!supabase) return '';
    const { data: files, error } = await supabase.storage.from('songs').list('videos', {
      limit: 20,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error || !files || files.length === 0) return '';

    // Filter out tiny dummy test files (< 50KB) or non-video placeholders
    const validVideos = files.filter((f: any) => {
      const name = (f.name || '').toLowerCase();
      if (!name.match(/\.(mp4|webm|mov|m4v)$/i)) return false;
      if (name.startsWith('test')) return false;
      const size = f.metadata?.size ?? f.metadata?.contentLength ?? 100000;
      return size >= 50000;
    });

    const chosen = validVideos[0] || files.find((f: any) => (f.metadata?.size ?? 0) > 100000);
    if (!chosen) return '';

    const { data: pubData } = supabase.storage.from('songs').getPublicUrl(`videos/${chosen.name}`);
    return pubData?.publicUrl || '';
  } catch (err) {
    console.warn('Could not list storage videos:', err);
    return '';
  }
}

/**
 * Fetch chapter visualizer configuration from Supabase DB
 */
export async function fetchChapterVisualizerSettingsFromDB(): Promise<VisualizerConfig | null> {
  try {
    const supabase = createClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('worship_songs')
      .select('notes')
      .eq('id', SYSTEM_VISUALIZER_SETTINGS_ID)
      .maybeSingle();

    let parsed: VisualizerConfig = {
      defaultVideoUrl: '',
      updatedAt: new Date().toISOString(),
    };

    if (!error && data && data.notes) {
      try {
        parsed = JSON.parse(data.notes);
      } catch {
        parsed = { defaultVideoUrl: data.notes, updatedAt: new Date().toISOString() };
      }
    }

    // Clean any expired/temporary local blob URLs that might have been saved
    if (parsed.defaultVideoUrl?.startsWith('blob:') || parsed.defaultVideoUrl?.startsWith('Uploaded:')) {
      parsed.defaultVideoUrl = '';
    }

    // Fallback: if defaultVideoUrl is empty in DB, auto-discover the latest uploaded video in Supabase storage
    if (!parsed.defaultVideoUrl) {
      const discovered = await discoverLatestStorageVideoUrl();
      if (discovered) {
        parsed.defaultVideoUrl = discovered;
      }
    }

    if (isBrowser()) {
      if (parsed.defaultVideoUrl) {
        localStorage.setItem(DEFAULT_VISUALIZER_VIDEO_KEY, parsed.defaultVideoUrl);
      }
      if (parsed.fontColor) {
        localStorage.setItem('cfc_presentation_font_color', parsed.fontColor);
      }
      if (typeof parsed.isBlurred === 'boolean') {
        localStorage.setItem('cfc_presentation_blur_video', String(parsed.isBlurred));
      }
      if (parsed.blurAmount) {
        localStorage.setItem('cfc_presentation_blur_amount', String(parsed.blurAmount));
      }
    }

    return parsed;
  } catch (err) {
    console.warn('Failed to fetch visualizer settings from Supabase:', err);
    return null;
  }
}

/**
 * Persist chapter visualizer configuration to Supabase DB so anyone using the web app has it
 */
export async function saveChapterVisualizerSettingsToDB(config: {
  defaultVideoUrl: string;
  fontColor?: string;
  isBlurred?: boolean;
  blurAmount?: number;
}): Promise<VisualizerConfig> {
  let cleanUrl = config.defaultVideoUrl.trim();
  if (cleanUrl.startsWith('blob:') || cleanUrl.startsWith('Uploaded:')) {
    throw new Error('Local browser temporary files cannot be saved to cloud database. Please upload the video file using "Upload Video File".');
  }

  const payload: VisualizerConfig = {
    defaultVideoUrl: cleanUrl,
    fontColor: config.fontColor,
    isBlurred: typeof config.isBlurred === 'boolean' ? config.isBlurred : false,
    blurAmount: config.blurAmount || 8,
    updatedAt: new Date().toISOString(),
  };

  // 1. Update localStorage cache
  if (isBrowser()) {
    try {
      if (!payload.defaultVideoUrl) {
        localStorage.removeItem(DEFAULT_VISUALIZER_VIDEO_KEY);
      } else {
        localStorage.setItem(DEFAULT_VISUALIZER_VIDEO_KEY, payload.defaultVideoUrl);
      }
      if (payload.fontColor) {
        localStorage.setItem('cfc_presentation_font_color', payload.fontColor);
      }
      localStorage.setItem('cfc_presentation_blur_video', String(payload.isBlurred));
      localStorage.setItem('cfc_presentation_blur_amount', String(payload.blurAmount));
    } catch {}
  }

  // 2. Persist to Supabase Database
  try {
    const supabase = createClient();
    if (supabase) {
      const { error: upsertErr } = await supabase.from('worship_songs').upsert({
        id: SYSTEM_VISUALIZER_SETTINGS_ID,
        title: '__CHAPTER_VISUALIZER_CONFIG__',
        artist: 'Couples For Christ Tuy Chapter',
        key_signature: 'G',
        category: 'Worship',
        ministry: 'CFC',
        lyrics_and_chords: '{system: visualizer configuration}',
        notes: JSON.stringify(payload),
        updated_at: payload.updatedAt,
      });

      if (upsertErr) {
        console.error('Supabase upsert error for visualizer:', upsertErr);
        throw new Error(upsertErr.message);
      }

      notifySongsChange({ action: 'chapter_visualizer_saved', payload });
    }
  } catch (err) {
    console.warn('Failed to persist visualizer settings to Supabase DB:', err);
    throw err;
  }

  return payload;
}

export async function resolveVisualizerVideoUrl(urlOrToken?: string): Promise<string> {
  if (!isBrowser()) return '';

  let token = urlOrToken;

  // If no specific video passed, check Supabase DB & localStorage for chapter default
  if (!token) {
    token = getDefaultVisualizerVideo();

    // Check Supabase DB in parallel / if not cached
    const dbConfig = await fetchChapterVisualizerSettingsFromDB();
    if (dbConfig?.defaultVideoUrl) {
      token = dbConfig.defaultVideoUrl;
    }
  }

  if (!token) return '';

  // Reject dead in-memory blobs or invalid upload labels
  if (token.startsWith('blob:') || token.startsWith('Uploaded:')) {
    return '';
  }

  if (token.startsWith('idb:')) {
    const key = token.replace(/^idb:/, '').split('|')[0] || 'default_visualizer';
    const blobUrl = await getVideoBlobUrl(key);
    return blobUrl || '';
  }

  if (token.startsWith('http://') || token.startsWith('https://') || token.startsWith('/api/video')) {
    return token;
  }

  // If a data URL was pasted, convert to binary Blob and save to IndexedDB
  if (token.startsWith('data:video/')) {
    try {
      const blob = dataUrlToBlob(token);
      const blobUrl = await saveVideoBlob('default_visualizer', blob);
      return blobUrl;
    } catch {
      return token;
    }
  }

  return token;
}

/**
 * Synchronous helper to convert a raw Supabase Storage video URL into the /api/video streaming proxy URL.
 */
export function toProxyVideoUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('Uploaded:')) return '';
  if (trimmed.includes('.supabase.co/storage/v1/object/public/songs/videos/')) {
    return `/api/video?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

/**
 * Resolves a raw video URL into a reliable, playable URL for <video> elements.
 * For Supabase Storage videos (which are stored with audio/mpeg MIME to bypass bucket restrictions),
 * caches the binary in IndexedDB with video/mp4 MIME and returns a local ObjectURL,
 * bypassing serverless payload limits and MIME restrictions.
 */
export async function resolvePlayableVideoUrl(rawUrl: string): Promise<string> {
  if (!isBrowser() || !rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('Uploaded:')) return '';

  if (isYouTubeUrl(trimmed)) {
    return trimmed;
  }

  // Extract underlying Supabase URL if wrapped in /api/video?url=...
  let directUrl = trimmed;
  if (trimmed.startsWith('/api/video?url=')) {
    try {
      directUrl = decodeURIComponent(trimmed.replace('/api/video?url=', ''));
    } catch {}
  }

  if (directUrl.includes('.supabase.co/storage/v1/object/public/songs/videos/')) {
    const cacheKey = `vid_cache_${directUrl.split('/').pop() || 'default'}`;
    try {
      const cachedBlobUrl = await getVideoBlobUrl(cacheKey);
      if (cachedBlobUrl) {
        return cachedBlobUrl;
      }
    } catch {}

    try {
      const response = await fetch(directUrl, { mode: 'cors' });
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > 1000) {
          const mp4Blob = new Blob([buffer], { type: 'video/mp4' });
          const blobUrl = await saveVideoBlob(cacheKey, mp4Blob);
          return blobUrl;
        }
      }
    } catch (err) {
      console.warn('Direct CORS video fetch failed, falling back to /api/video proxy:', err);
    }

    return `/api/video?url=${encodeURIComponent(directUrl)}`;
  }

  return trimmed;
}


export async function setDefaultVisualizerVideo(url: string, isBlurred?: boolean, blurAmount?: number): Promise<void> {
  await saveChapterVisualizerSettingsToDB({ defaultVideoUrl: url, isBlurred, blurAmount });
}

/**
 * Upload a visualizer background video (.mp4, .webm, .mov)
 * Uploads directly to Supabase Storage bucket 'songs' under /videos so it's accessible globally
 */
export async function uploadSongVideo(
  file: File,
  key = 'default_visualizer'
): Promise<{ url: string; fileName: string; supabaseUrl?: string }> {
  if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|m4v|ogg)$/i)) {
    throw new Error('Please upload a valid motion video loop (.mp4, .webm, .mov).');
  }

  // 1. First attempt: Server API upload route (robust, no CORS/header issues)
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);

    const res = await fetch('/api/video/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.url) {
        return {
          url: data.url,
          fileName: file.name,
          supabaseUrl: data.url,
        };
      }
    } else {
      const errData = await res.json().catch(() => null);
      if (errData?.error) {
        console.warn('API video upload returned error, trying direct client upload:', errData.error);
      }
    }
  } catch (apiErr) {
    console.warn('API video upload request failed, trying direct client upload:', apiErr);
  }

  // 2. Second attempt: Direct client Supabase upload
  const supabase = createClient();
  const fileExt = file.name.split('.').pop() || 'mp4';
  const cleanBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `${Date.now()}-${cleanBase}.${fileExt}`;
  const filePath = `videos/${fileName}`;

  if (supabase) {
    try {
      // Convert file to audio/mpeg Blob so Supabase Storage bucket constraint doesn't reject video/mp4 MIME in browser FormData
      const uploadBlob = new Blob([file], { type: 'audio/mpeg' });

      const { error: uploadError } = await supabase.storage
        .from('songs')
        .upload(filePath, uploadBlob, {
          cacheControl: '31536000',
          upsert: true,
          contentType: 'audio/mpeg', // Satisfies Supabase bucket mime restriction
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('songs').getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          const directUrl = publicUrlData.publicUrl;
          return {
            url: directUrl,
            fileName: file.name,
            supabaseUrl: directUrl,
          };
        }
      } else {
        console.error('Supabase direct video upload error:', uploadError.message);
        throw new Error(`Cloud storage upload failed: ${uploadError.message}`);
      }
    } catch (storageErr: any) {
      throw new Error(storageErr?.message || 'Failed to upload video to cloud storage.');
    }
  }

  throw new Error('Unable to connect to cloud storage. Please check your internet connection.');
}
