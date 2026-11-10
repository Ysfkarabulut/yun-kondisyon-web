'use client';

import React, { useState, useEffect } from 'react';
import { SyncService, SyncState } from '@/lib/syncService';
import { Cloud, CloudCheck, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

export default function SyncBadge() {
  const [status, setStatus] = useState<SyncState>('idle');
  const [lastTime, setLastTime] = useState<Date | null>(null);

  useEffect(() => {
    SyncService.initAutoSync();
    const unsubscribe = SyncService.subscribe((s, t) => {
      setStatus(s);
      setLastTime(t);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = () => {
    SyncService.triggerSync();
  };

  if (status === 'syncing') {
    return (
      <button
        onClick={handleManualSync}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold border border-amber-500/20 active:scale-95 transition"
        title="Bulut ile senkronize ediliyor..."
      >
        <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
        <span>Eşitleniyor...</span>
      </button>
    );
  }

  if (status === 'synced') {
    return (
      <button
        onClick={handleManualSync}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/20 active:scale-95 transition"
        title={`Bulut ile senkronize. Son: ${lastTime ? lastTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Az önce'}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <Cloud className="w-3 h-3 text-emerald-600" />
        <span>Bulut Senkron</span>
      </button>
    );
  }

  if (status === 'offline') {
    return (
      <button
        onClick={handleManualSync}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 active:scale-95 transition"
        title="İnternet bağlantısı yok. Testler cihazın hafızasına kaydediliyor."
      >
        <CloudOff className="w-3 h-3 text-slate-400" />
        <span>Çevrimdışı (Lokal)</span>
      </button>
    );
  }

  if (status === 'local') {
    return (
      <button
        onClick={handleManualSync}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[11px] font-semibold border border-blue-500/20 active:scale-95 transition"
        title="Vercel Storage henüz bağlanmadı, yerel hafızada güvenle çalışıyor. Bağlandığında otomatik buluta geçer."
      >
        <Cloud className="w-3 h-3 text-blue-500" />
        <span>Lokal Mod</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleManualSync}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold active:scale-95 transition"
      title="Senkronizasyonu kontrol et"
    >
      <RefreshCw className="w-3 h-3 text-slate-400" />
      <span>Eşitle</span>
    </button>
  );
}
