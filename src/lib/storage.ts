'use client';

import {
  MoistureTestRecord,
  YunOraniTestRecord,
  DryingNoteSession,
  DryingMeasurement,
  CertifiedShipment,
  IncomingMaterial,
} from './types';
import { SyncService } from './syncService';

const STORAGE_KEYS = {
  MOISTURE_RECORDS: 'yun_moisture_records_v1',
  YUN_ORANI_RECORDS: 'yun_orani_records_v1',
  DRYING_NOTE_SESSIONS: 'yun_drying_sessions_v1',
  PENDING_LOTS: 'yun_pending_lots_v1',
  CERTIFIED_SHIPMENTS: 'yun_certified_shipments_v1',
  INCOMING_MATERIALS: 'yun_incoming_materials_v1',
  DRAFT_KONDISYON: 'yun_draft_kondisyon_v1',
  DRAFT_YUN_ORANI: 'yun_draft_yun_orani_v1',
  DRAFT_DRYING_NOTES: 'yun_draft_drying_notes_v1',
};

function safeGet<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.error(`Error reading storage key ${key}:`, err);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T, notifyEvent = true): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (notifyEvent) {
      window.dispatchEvent(new Event('yun_storage_updated'));
    }
  } catch (err) {
    console.error(`Error saving storage key ${key}:`, err);
  }
}

export const StorageService = {
  // Moisture (Kondisyon) Records
  getMoistureRecords(): MoistureTestRecord[] {
    return safeGet<MoistureTestRecord[]>(STORAGE_KEYS.MOISTURE_RECORDS, []);
  },

  setRawMoistureRecords(records: MoistureTestRecord[]): void {
    safeSet(STORAGE_KEYS.MOISTURE_RECORDS, records);
  },

  saveMoistureRecord(record: Omit<MoistureTestRecord, 'id' | 'createdAtEpochMs'>): MoistureTestRecord {
    const records = this.getMoistureRecords();
    const newRecord: MoistureTestRecord = {
      ...record,
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAtEpochMs: Date.now(),
    };
    records.unshift(newRecord);
    safeSet(STORAGE_KEYS.MOISTURE_RECORDS, records);
    SyncService.triggerSync();
    return newRecord;
  },

  deleteMoistureRecord(id: string): void {
    const records = this.getMoistureRecords().filter(r => r.id !== id);
    safeSet(STORAGE_KEYS.MOISTURE_RECORDS, records);
    SyncService.registerDeletedId(id);
  },

  deleteMultipleMoistureRecords(ids: string[]): void {
    const idSet = new Set(ids);
    const records = this.getMoistureRecords().filter(r => !idSet.has(r.id));
    safeSet(STORAGE_KEYS.MOISTURE_RECORDS, records);
    ids.forEach(id => SyncService.registerDeletedId(id));
  },

  // Yun Orani Records
  getYunOraniRecords(): YunOraniTestRecord[] {
    return safeGet<YunOraniTestRecord[]>(STORAGE_KEYS.YUN_ORANI_RECORDS, []);
  },

  setRawYunOraniRecords(records: YunOraniTestRecord[]): void {
    safeSet(STORAGE_KEYS.YUN_ORANI_RECORDS, records);
  },

  saveYunOraniRecord(record: Omit<YunOraniTestRecord, 'id' | 'createdAtEpochMs'>): YunOraniTestRecord {
    const records = this.getYunOraniRecords();
    const newRecord: YunOraniTestRecord = {
      ...record,
      id: 'y_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAtEpochMs: Date.now(),
    };
    records.unshift(newRecord);
    safeSet(STORAGE_KEYS.YUN_ORANI_RECORDS, records);
    SyncService.triggerSync();
    return newRecord;
  },

  deleteYunOraniRecord(id: string): void {
    const records = this.getYunOraniRecords().filter(r => r.id !== id);
    safeSet(STORAGE_KEYS.YUN_ORANI_RECORDS, records);
    SyncService.registerDeletedId(id);
  },

  deleteMultipleYunOraniRecords(ids: string[]): void {
    const idSet = new Set(ids);
    const records = this.getYunOraniRecords().filter(r => !idSet.has(r.id));
    safeSet(STORAGE_KEYS.YUN_ORANI_RECORDS, records);
    ids.forEach(id => SyncService.registerDeletedId(id));
  },

  // Drying Note Sessions (Archived)
  getDryingSessions(): DryingNoteSession[] {
    return safeGet<DryingNoteSession[]>(STORAGE_KEYS.DRYING_NOTE_SESSIONS, []);
  },

  setRawDryingSessions(sessions: DryingNoteSession[]): void {
    safeSet(STORAGE_KEYS.DRYING_NOTE_SESSIONS, sessions);
  },

  archiveDryingSession(session: Omit<DryingNoteSession, 'id' | 'archivedAtEpochMs'>): DryingNoteSession {
    const sessions = this.getDryingSessions();
    const newSession: DryingNoteSession = {
      ...session,
      id: 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      archivedAtEpochMs: Date.now(),
    };
    sessions.unshift(newSession);
    safeSet(STORAGE_KEYS.DRYING_NOTE_SESSIONS, sessions);
    SyncService.triggerSync();
    return newSession;
  },

  deleteDryingSession(id: string): void {
    const sessions = this.getDryingSessions().filter(s => s.id !== id);
    safeSet(STORAGE_KEYS.DRYING_NOTE_SESSIONS, sessions);
    SyncService.registerDeletedId(id);
  },

  // Sertifikalı Hammadde Sevkiyatları
  getCertifiedShipments(): CertifiedShipment[] {
    return safeGet<CertifiedShipment[]>(STORAGE_KEYS.CERTIFIED_SHIPMENTS, []);
  },

  setRawCertifiedShipments(items: CertifiedShipment[]): void {
    safeSet(STORAGE_KEYS.CERTIFIED_SHIPMENTS, items);
  },

  addCertifiedShipment(
    fields: Pick<CertifiedShipment, 'orderText' | 'supplier' | 'kg' | 'standards'>
  ): CertifiedShipment {
    const now = Date.now();
    const item: CertifiedShipment = {
      id: 'c_' + now + '_' + Math.random().toString(36).substring(2, 7),
      ...fields,
      receivedDate: '',
      tcReceived: false,
      tcDate: '',
      portalRegistered: false,
      portalDate: '',
      createdAtEpochMs: now,
      updatedAtEpochMs: now,
    };
    const items = this.getCertifiedShipments();
    items.unshift(item);
    safeSet(STORAGE_KEYS.CERTIFIED_SHIPMENTS, items);
    SyncService.triggerSync();
    return item;
  },

  updateCertifiedShipment(id: string, patch: Partial<Omit<CertifiedShipment, 'id' | 'createdAtEpochMs'>>): void {
    const items = this.getCertifiedShipments().map(i =>
      i.id === id ? { ...i, ...patch, updatedAtEpochMs: Date.now() } : i
    );
    safeSet(STORAGE_KEYS.CERTIFIED_SHIPMENTS, items);
    SyncService.scheduleSync();
  },

  deleteCertifiedShipment(id: string): void {
    safeSet(STORAGE_KEYS.CERTIFIED_SHIPMENTS, this.getCertifiedShipments().filter(i => i.id !== id));
    SyncService.registerDeletedId(id);
  },

  // Gelecek Hammadde Kayıtları
  getIncomingMaterials(): IncomingMaterial[] {
    return safeGet<IncomingMaterial[]>(STORAGE_KEYS.INCOMING_MATERIALS, []);
  },

  setRawIncomingMaterials(items: IncomingMaterial[]): void {
    safeSet(STORAGE_KEYS.INCOMING_MATERIALS, items);
  },

  addIncomingMaterial(lotNo: string, description: string, arrivalDate: string): IncomingMaterial {
    const now = Date.now();
    const item: IncomingMaterial = {
      id: 'h_' + now + '_' + Math.random().toString(36).substring(2, 7),
      lotNo,
      description,
      arrivalDate,
      conditionTested: false,
      createdAtEpochMs: now,
      updatedAtEpochMs: now,
    };
    const items = this.getIncomingMaterials();
    items.unshift(item);
    safeSet(STORAGE_KEYS.INCOMING_MATERIALS, items);
    SyncService.triggerSync();
    return item;
  },

  updateIncomingMaterial(id: string, patch: Partial<Omit<IncomingMaterial, 'id' | 'createdAtEpochMs'>>): void {
    const items = this.getIncomingMaterials().map(i =>
      i.id === id ? { ...i, ...patch, updatedAtEpochMs: Date.now() } : i
    );
    safeSet(STORAGE_KEYS.INCOMING_MATERIALS, items);
    SyncService.scheduleSync();
  },

  deleteIncomingMaterial(id: string): void {
    safeSet(STORAGE_KEYS.INCOMING_MATERIALS, this.getIncomingMaterials().filter(i => i.id !== id));
    SyncService.registerDeletedId(id);
  },

  // Pending Lots Note
  getPendingLots(): string {
    return safeGet<string>(STORAGE_KEYS.PENDING_LOTS, '');
  },

  setRawPendingLots(text: string): void {
    safeSet(STORAGE_KEYS.PENDING_LOTS, text);
  },

  setPendingLots(text: string): void {
    safeSet(STORAGE_KEYS.PENDING_LOTS, text);
    SyncService.markPendingLotsUpdated();
    SyncService.triggerSync();
  },

  // Drafts (Local only - not synced to avoid overwriting unfinished work on other devices)
  getKondisyonDraft(): any {
    return safeGet(STORAGE_KEYS.DRAFT_KONDISYON, null);
  },

  setKondisyonDraft(data: any): void {
    safeSet(STORAGE_KEYS.DRAFT_KONDISYON, data, false);
  },

  getYunOraniDraft(): any {
    return safeGet(STORAGE_KEYS.DRAFT_YUN_ORANI, null);
  },

  setYunOraniDraft(data: any): void {
    safeSet(STORAGE_KEYS.DRAFT_YUN_ORANI, data, false);
  },

  getDryingNotesDraft(): { lot: string; tare: string; rows: DryingMeasurement[] } {
    return safeGet(STORAGE_KEYS.DRAFT_DRYING_NOTES, { lot: '', tare: '', rows: [] });
  },

  setDryingNotesDraft(draft: { lot: string; tare: string; rows: DryingMeasurement[] }): void {
    safeSet(STORAGE_KEYS.DRAFT_DRYING_NOTES, draft, false);
  },

  // Backup & Restore
  exportAllData(): string {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      moistureRecords: this.getMoistureRecords(),
      yunOraniRecords: this.getYunOraniRecords(),
      dryingSessions: this.getDryingSessions(),
      pendingLots: this.getPendingLots(),
      certifiedShipments: this.getCertifiedShipments(),
      incomingMaterials: this.getIncomingMaterials(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importAllData(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.moistureRecords)) {
        safeSet(STORAGE_KEYS.MOISTURE_RECORDS, parsed.moistureRecords);
      }
      if (Array.isArray(parsed.yunOraniRecords)) {
        safeSet(STORAGE_KEYS.YUN_ORANI_RECORDS, parsed.yunOraniRecords);
      }
      if (Array.isArray(parsed.dryingSessions)) {
        safeSet(STORAGE_KEYS.DRYING_NOTE_SESSIONS, parsed.dryingSessions);
      }
      if (Array.isArray(parsed.certifiedShipments)) {
        safeSet(STORAGE_KEYS.CERTIFIED_SHIPMENTS, parsed.certifiedShipments);
      }
      if (Array.isArray(parsed.incomingMaterials)) {
        safeSet(STORAGE_KEYS.INCOMING_MATERIALS, parsed.incomingMaterials);
      }
      if (typeof parsed.pendingLots === 'string') {
        safeSet(STORAGE_KEYS.PENDING_LOTS, parsed.pendingLots);
      }
      SyncService.triggerSync();
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },
};
