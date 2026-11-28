'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { StorageService } from '@/lib/storage';
import { CertifiedShipment } from '@/lib/types';
import { todayIso } from '@/lib/formatting';
import { BadgeCheck, Plus, Trash2, Truck, FileCheck2, Globe } from 'lucide-react';

interface CertifiedMaterialViewProps {
  onNotify: (msg: string) => void;
}

type Filter = 'all' | 'open' | 'done';

function isComplete(s: CertifiedShipment) {
  return Boolean(s.receivedDate) && s.tcReceived && s.portalRegistered;
}

export default function CertifiedMaterialView({ onNotify }: CertifiedMaterialViewProps) {
  const [items, setItems] = useState<CertifiedShipment[]>([]);
  const [newOrder, setNewOrder] = useState('');
  const [filter, setFilter] = useState<Filter>('open');

  useEffect(() => {
    const load = () => setItems(StorageService.getCertifiedShipments());
    load();
    window.addEventListener('yun_storage_updated', load);
    return () => window.removeEventListener('yun_storage_updated', load);
  }, []);

  const visible = useMemo(() => {
    if (filter === 'open') return items.filter(i => !isComplete(i));
    if (filter === 'done') return items.filter(isComplete);
    return items;
  }, [items, filter]);

  const openCount = items.filter(i => !isComplete(i)).length;

  const handleAdd = () => {
    const text = newOrder.trim();
    if (!text) return;
    StorageService.addCertifiedShipment(text);
    setNewOrder('');
    onNotify('✓ Sevkiyat eklendi.');
  };

  const update = (id: string, patch: Partial<CertifiedShipment>) => {
    StorageService.updateCertifiedShipment(id, patch);
  };

  const toggleStep = (s: CertifiedShipment, flag: 'tcReceived' | 'portalRegistered', dateKey: 'tcDate' | 'portalDate') => {
    const next = !s[flag];
    update(s.id, { [flag]: next, [dateKey]: next ? s[dateKey] || todayIso() : '' } as Partial<CertifiedShipment>);
  };

  const handleDelete = (s: CertifiedShipment) => {
    if (!window.confirm(`"${s.orderText}" sevkiyatı silinsin mi?`)) return;
    StorageService.deleteCertifiedShipment(s.id);
    onNotify('Sevkiyat silindi.');
  };

  const inputCls =
    'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40';

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sertifikalı Hammadde</h1>
        <p className="text-xs text-slate-500">Sipariş → Teslim → TC belgesi → Portal kaydı takibi</p>
      </div>

      {/* Yeni sevkiyat */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
          Yeni sipariş / sevkiyat
        </label>
        <div className="flex gap-2">
          <input
            value={newOrder}
            onChange={e => setNewOrder(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Örn: Sipariş 2026/118 – 12 balya GOTS yün"
            className={inputCls + ' py-3'}
          />
          <button
            onClick={handleAdd}
            disabled={!newOrder.trim()}
            className="shrink-0 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold flex items-center gap-1 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Ekle
          </button>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70 text-xs font-semibold">
        {(
          [
            ['open', `Bekleyen (${openCount})`],
            ['done', `Tamamlanan (${items.length - openCount})`],
            ['all', `Tümü (${items.length})`],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 py-2 rounded-xl transition ${
              filter === key
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-10">Bu listede kayıt yok.</p>
      )}

      <div className="space-y-3">
        {visible.map(s => {
          const done = isComplete(s);
          return (
            <div
              key={s.id}
              className={`bg-white dark:bg-slate-900 border rounded-3xl p-4 shadow-sm space-y-3 ${
                done ? 'border-emerald-300 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  value={s.orderText}
                  onChange={e => update(s.id, { orderText: e.target.value })}
                  className="flex-1 min-w-0 bg-transparent text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg px-1 -mx-1"
                />
                {done && (
                  <span className="shrink-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <BadgeCheck className="w-3.5 h-3.5" /> Tamam
                  </span>
                )}
                <button
                  onClick={() => handleDelete(s)}
                  className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Teslim tarihi */}
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <Truck className="w-3.5 h-3.5" /> Teslim tarihi
                  </span>
                  <input
                    type="date"
                    value={s.receivedDate}
                    onChange={e => update(s.id, { receivedDate: e.target.value })}
                    className={inputCls}
                  />
                </div>

                {/* TC belgesi */}
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.tcReceived}
                      onChange={() => toggleStep(s, 'tcReceived', 'tcDate')}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <FileCheck2 className="w-3.5 h-3.5" /> TC belgesi geldi
                  </label>
                  <input
                    type="date"
                    value={s.tcDate}
                    disabled={!s.tcReceived}
                    onChange={e => update(s.id, { tcDate: e.target.value })}
                    className={inputCls}
                  />
                </div>

                {/* Portal kaydı */}
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.portalRegistered}
                      onChange={() => toggleStep(s, 'portalRegistered', 'portalDate')}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <Globe className="w-3.5 h-3.5" /> Portala kaydedildi
                  </label>
                  <input
                    type="date"
                    value={s.portalDate}
                    disabled={!s.portalRegistered}
                    onChange={e => update(s.id, { portalDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
