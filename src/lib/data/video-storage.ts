/**
 * IndexedDB Visualizer Video Storage
 * Allows reliable, unlimited storage of HD background video loops (.mp4, .webm, .mov)
 * in the browser without exceeding localStorage 5MB quota restrictions.
 */

const DB_NAME = 'cfc_tuy_video_db';
const DB_VERSION = 1;
const STORE_NAME = 'visualizer_videos';

function openVideoDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not available in this environment.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a video Blob/File in IndexedDB and return an active Object URL
 */
export async function saveVideoBlob(key: string, blob: Blob | File): Promise<string> {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const putRequest = store.put(blob, key);

    putRequest.onsuccess = () => {
      try {
        const blobUrl = URL.createObjectURL(blob);
        resolve(blobUrl);
      } catch (err) {
        reject(err);
      }
    };

    putRequest.onerror = () => reject(putRequest.error);
  });
}

/**
 * Retrieve a video Blob from IndexedDB and return an active Object URL
 */
export async function getVideoBlobUrl(key: string): Promise<string | null> {
  try {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(key);

      getRequest.onsuccess = () => {
        const result = getRequest.result as Blob | File | undefined;
        if (result && result instanceof Blob) {
          try {
            const blobUrl = URL.createObjectURL(result);
            resolve(blobUrl);
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (err) {
    console.warn('Failed to load video from IndexedDB:', err);
    return null;
  }
}

/**
 * Delete a video from IndexedDB
 */
export async function deleteVideoBlob(key: string): Promise<void> {
  try {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delRequest = store.delete(key);
      delRequest.onsuccess = () => resolve();
      delRequest.onerror = () => reject(delRequest.error);
    });
  } catch (err) {
    console.warn('Failed to delete video from IndexedDB:', err);
  }
}

/**
 * Convert base64 Data URL to binary Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'video/mp4';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
