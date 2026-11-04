import { MinistryType } from '@/types';
import { createClient } from '@/lib/supabase/client';

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
  ccliNumber?: string;
  audioUrl?: string; // MP3 URL or base64 data URI
  audioFileName?: string;
  youtubeUrl?: string; // YouTube video or audio link
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
        (s: WorshipSong) => s && s.id && !deletedIds.has(s.id) && !LEGACY_MOCK_SONG_IDS.has(s.id)
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
    (s) => s && s.id && !deletedIds.has(s.id) && !LEGACY_MOCK_SONG_IDS.has(s.id)
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
let sharedSongsBroadcastChannel: any = null;

export function getSongsRealtimeChannel() {
  if (!isBrowser()) return null;
  if (!sharedSongsBroadcastChannel) {
    const supabase = createClient();
    if (supabase) {
      sharedSongsBroadcastChannel = supabase.channel('cfc_songs_live');
      sharedSongsBroadcastChannel.subscribe();
    }
  }
  return sharedSongsBroadcastChannel;
}

export function notifySongsChange(payload?: any) {
  if (!isBrowser()) return;
  try {
    const ch = getSongsRealtimeChannel();
    if (ch) {
      ch.send({
        type: 'broadcast',
        event: 'songs_changed',
        payload: payload || { timestamp: Date.now() },
      });
    }
  } catch (err) {
    console.warn('Failed to broadcast song change:', err);
  }
}

/**
 * Subscribes to real-time song repertoire updates across browsers, devices, and tabs.
 */
export function subscribeToSongsChanges(onChange: () => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const supabase = createClient();
  let channel: any = null;

  if (supabase) {
    channel = supabase
      .channel(`cfc_songs_sub_${Math.random().toString(36).substring(2, 7)}`)
      .on('broadcast', { event: 'songs_changed' }, () => {
        onChange();
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worship_songs' },
        () => {
          onChange();
        }
      )
      .subscribe();
  }

  // Cross-tab storage changes
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === DELETED_SONGS_KEY) {
      onChange();
    }
  };
  window.addEventListener('storage', handleStorage);

  // Tab focus change
  const handleFocus = () => {
    onChange();
  };
  window.addEventListener('focus', handleFocus);

  // Tab visibility change
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      onChange();
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}

/**
 * Maps a Supabase DB row to the application's WorshipSong interface
 */
export function mapRowToWorshipSong(d: any, local?: WorshipSong): WorshipSong {
  let youtubeUrl = d.youtube_url || local?.youtubeUrl || '';
  let audioUrl = d.audio_url || local?.audioUrl || '';
  let notes = d.notes || local?.notes || '';

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
      notes = notes.replace(/\[YOUTUBE:\s*[^\]]+\]/, '').trim();
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
    ccliNumber: d.ccli_number || local?.ccliNumber,
    audioUrl: audioUrl,
    audioFileName: d.audio_file_name || local?.audioFileName,
    youtubeUrl: youtubeUrl,
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
  let notes = song.notes || '';

  if (song.youtubeUrl && !finalAudioUrl) {
    finalAudioUrl = song.youtubeUrl;
  } else if (song.youtubeUrl && finalAudioUrl) {
    if (!notes.includes('[YOUTUBE:')) {
      notes = notes ? `${notes}\n[YOUTUBE: ${song.youtubeUrl}]` : `[YOUTUBE: ${song.youtubeUrl}]`;
    }
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
  const deletedIds = getDeletedWorshipSongIds();
  const localSongs = getLocalSongs();
  const localMap = new Map<string, WorshipSong>(localSongs.map((s) => [s.id, s]));

  try {
    const supabase = createClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('worship_songs')
        .select('*')
        .order('title', { ascending: true });

      if (!error && data) {
        // Exclude deleted or legacy mock songs
        const validData = data.filter(
          (d: any) => !deletedIds.has(d.id) && !LEGACY_MOCK_SONG_IDS.has(d.id)
        );

        const merged: WorshipSong[] = validData.map((d: any) => {
          const local = localMap.get(d.id);
          const supabaseUpdatedAt = d.updated_at ? new Date(d.updated_at).getTime() : 0;
          const localUpdatedAt = local?.updatedAt ? new Date(local.updatedAt).getTime() : 0;

          if (local && localUpdatedAt > supabaseUpdatedAt) {
            return local;
          }

          return mapRowToWorshipSong(d, local);
        });

        // Detect any authentic local songs that are not yet in Supabase
        const supabaseIds = new Set(validData.map((d: any) => d.id));
        const pendingUploads: WorshipSong[] = [];

        for (const [id, localSong] of localMap.entries()) {
          if (!supabaseIds.has(id) && !deletedIds.has(id) && !LEGACY_MOCK_SONG_IDS.has(id)) {
            merged.push(localSong);
            pendingUploads.push(localSong);
          }
        }

        if (pendingUploads.length > 0) {
          try {
            await Promise.all(pendingUploads.map((s) => pushSongToSupabase(s)));
          } catch (err) {
            console.warn('Sync error pushing pending songs to Supabase:', err);
          }
        }

        setLocalSongs(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('Error fetching songs from Supabase, falling back to local storage:', err);
  }

  return localSongs;
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

  const completeSong: WorshipSong = {
    id,
    title: song.title?.trim() || 'Untitled Worship Song',
    artist: song.artist?.trim() || 'CFC Music Ministry',
    key: song.key || 'G',
    tempo: song.tempo || 'Moderate',
    timeSignature: song.timeSignature || '4/4',
    category: song.category || 'Praise',
    ministry: song.ministry || 'CFC',
    lyricsAndChords: song.lyricsAndChords || '',
    ccliNumber: song.ccliNumber || '',
    audioUrl: finalAudioUrl,
    audioFileName: song.audioFileName || '',
    youtubeUrl: finalYoutubeUrl,
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
