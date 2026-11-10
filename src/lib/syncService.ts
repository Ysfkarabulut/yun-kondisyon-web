'use client';

import { StorageService } from './storage';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'local' | 'error';

const DELETED_IDS_KEY = 'yun_deleted_ids_v1';
const PENDING_SYNC_TIME_KEY = 'yun_pending_lots_time_v1';

function getDeletedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setDeletedIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(ids));
  } catch {}
}

export const SyncService = {
  status: 'idle' as SyncState,
  lastSyncTime: null as Date | null,
  listeners: new Set<(state: SyncState, lastTime: Date | null) => void>(),

  subscribe(listener: (state: SyncState, lastTime: Date | null) => void) {
    this.listeners.add(listener);
    listener(this.status, this.lastSyncTime);
    return () => {
      this.listeners.delete(listener);
    };
  },

  notify() {
    this.listeners.forEach(l => l(this.status, this.lastSyncTime));
  },

  registerDeletedId(id: string) {
    const ids = getDeletedIds();
    if (!ids.includes(id)) {
      ids.push(id);
      setDeletedIds(ids);
    }
    this.triggerSync();
  },

  markPendingLotsUpdated() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PENDING_SYNC_TIME_KEY, String(Date.now()));
    }
  },

  async triggerSync(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (!navigator.onLine) {
      this.status = 'offline';
      this.notify();
      return false;
    }

    this.status = 'syncing';
    this.notify();

    try {
      const deletedIds = getDeletedIds();
      const moistureRecords = StorageService.getMoistureRecords();
      const yunOraniRecords = StorageService.getYunOraniRecords();
      const dryingSessions = StorageService.getDryingSessions();
      const pendingLots = StorageService.getPendingLots();
      const pendingLotsTime = Number(localStorage.getItem(PENDING_SYNC_TIME_KEY) || '0');

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moistureRecords,
          yunOraniRecords,
          dryingSessions,
          pendingLots,
          pendingLotsUpdatedAt: pendingLotsTime,
          deletedIds,
        }),
      });

      if (!res.ok) {
        throw new Error(`Sync HTTP ${res.status}`);
      }

      const json = await res.json();

      if (!json.connected) {
        this.status = 'local';
        this.notify();
        return false;
      }

      // Merge data back to LocalStorage
      if (json.data) {
        StorageService.setRawMoistureRecords(json.data.moistureRecords || []);
        StorageService.setRawYunOraniRecords(json.data.yunOraniRecords || []);
        StorageService.setRawDryingSessions(json.data.dryingSessions || []);

        if (json.data.pendingLots && json.data.pendingLots !== pendingLots) {
          StorageService.setRawPendingLots(json.data.pendingLots);
        }

        // Clear synced deletedIds
        setDeletedIds([]);
      }

      this.status = 'synced';
      this.lastSyncTime = new Date();
      this.notify();
      return true;
    } catch (err) {
      console.warn('Sync failed:', err);
      this.status = navigator.onLine ? 'error' : 'offline';
      this.notify();
      return false;
    }
  },

  initAutoSync() {
    if (typeof window === 'undefined') return;

    // Trigger on initial load
    setTimeout(() => this.triggerSync(), 500);

    // Online/Offline events
    window.addEventListener('online', () => {
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.status = 'offline';
      this.notify();
    });

    // Window focus / tab switch
    window.addEventListener('focus', () => {
      this.triggerSync();
    });

    // Periodic sync every 45s
    setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.triggerSync();
      }
    }, 45000);
  },
};
