/**
 * Type definitions for System Snapshots / Time Machine
 */
export interface SystemSnapshot {
  id: string;
  timestamp: string; // ISO String
  label: string;
  isAuto: boolean;
  sizeBytes: number;
  data: Record<string, string>;
}

const DB_NAME = 'sata_time_machine_db';
const STORE_NAME = 'snapshots';
const DB_VERSION = 1;

/**
 * Open the IndexedDB database connection
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Capture all state keys from localStorage and save them to IndexedDB
 */
export async function createSnapshot(label: string, isAuto: boolean = false): Promise<SystemSnapshot> {
  const db = await openDB();
  
  // Serialize all relevant local storage states
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // Capture sata_ prefix keys as well as active states
      if (key.startsWith('sata_') || key.includes('cert') || key.includes('tender') || key.includes('compliance')) {
        const val = localStorage.getItem(key);
        if (val !== null) {
          data[key] = val;
        }
      }
    }
  }

  // Calculate size in bytes
  const serialized = JSON.stringify(data);
  const sizeBytes = new Blob([serialized]).size;

  const snapshot: SystemSnapshot = {
    id: `SNAP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    label: label || (isAuto ? 'Periodic Auto-Snapshot' : 'Manual Workspace Snapshot'),
    isAuto,
    sizeBytes,
    data,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(snapshot);

    request.onsuccess = () => {
      resolve(snapshot);
    };

    request.onerror = () => {
      reject(new Error('Failed to save snapshot to IndexedDB'));
    };
  });
}

/**
 * Retrieve all snapshots from IndexedDB
 */
export async function getAllSnapshots(): Promise<SystemSnapshot[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result as SystemSnapshot[];
      // Sort desc by timestamp
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      resolve(results);
    };

    request.onerror = () => {
      reject(new Error('Failed to retrieve snapshots from IndexedDB'));
    };
  });
}

/**
 * Delete a specific snapshot from IndexedDB
 */
export async function deleteSnapshot(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete snapshot with ID ${id}`));
    };
  });
}

/**
 * Restore a snapshot into localStorage
 */
export async function restoreSnapshot(id: string): Promise<SystemSnapshot> {
  const db = await openDB();
  
  // 1. Fetch snapshot details
  const snapshot: SystemSnapshot = await new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result as SystemSnapshot);
      } else {
        reject(new Error(`Snapshot with ID ${id} not found`));
      }
    };

    request.onerror = () => {
      reject(new Error(`Failed to fetch snapshot with ID ${id}`));
    };
  });

  // 2. Clear old sata_ keys to avoid pollution, then restore snapshot values
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('sata_') || key.includes('cert') || key.includes('tender') || key.includes('compliance'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  // 3. Write data from snapshot back to localStorage
  Object.entries(snapshot.data).forEach(([key, val]) => {
    localStorage.setItem(key, val);
  });

  return snapshot;
}

/**
 * Clear all snapshots in the store
 */
export async function clearAllSnapshots(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to clear snapshots database'));
    };
  });
}
