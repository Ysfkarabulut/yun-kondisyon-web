'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { StorageService } from '@/lib/storage';
import { IncomingMaterial, MoistureTestRecord } from '@/lib/types';
import { todayIso, normalizeLot, Formatting } from '@/lib/formatting';
import { PackagePlus, Trash2, FlaskConical, CheckCircle2, Plus } from 'lucide-react';

interface IncomingMaterialViewProps {
  onNotify: (msg: string) => void;
  /** Kondisyon sekmesine geçip lot numarasını doldurur */
  onStartTest: (lotNo: string) => void;
}

type Filter = 'all' | 'open' | 'done';

export default function IncomingMaterialView({ onNotify, onStartTest }: IncomingMaterialViewProps) {
  const [items, setItems] = useState<IncomingMaterial[]>([]);
  const [tests, setTests] = useState<MoistureTestRecord[]>([]);
  const [lotNo, setLotNo] = useState('');
  const [description, setDescription] = useState('');
  const [arrivalDate, setArrivalDate] = useState(todayIso());
  const [filter, setFilter] = useState<Filter>('open');

  useEffect(() => {
    const load = () => {
      setItems(StorageService.getIncomingMaterials());
      setTests(StorageService.getMoistureRecords());
    };
    load();
    window.addEventListener('yun_storage_updated', load);
    return () => window.removeEventListener('yun_storage_updated', load);
  }, []);

  // Lot numarasına göre en son kondisyon testi
  const testByLot = useMemo(() => {
    const map = new Map<string, MoistureTestRecord>();
    tests.forEach(t => {
      const key = normalizeLot(t.lotNo);
      if (key && !map.has(key)) map.set(key, t);
    });
    return map;
  }, [tests]);

  const testFor = (m: IncomingMaterial) => testByLot.get(normalizeLot(m.lotNo));
  const isTested = (m: IncomingMaterial) => m.conditionTested || Boolean(testFor(m));

  const visible = useMemo(() => {
    if (filter === 'open') return items.filter(m => !isTested(m));
    if (filter === 'done') return items.filter(m => isTested(m));
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, filter, testByLot]);

  const openCount = items.filter(m => !isTested(m)).length;

  const handleAdd = () => {
    if (!lotNo.trim()) return;
    StorageService.addIncomingMaterial(lotNo.trim(), description.trim(), arrivalDate);
    setLotNo('');
    setDescription('');
    onNotify('✓ Hammadde kaydı eklendi.');
  };

  const handleDelete = (m: IncomingMaterial) => {
    if (!window.confirm(`${m.lotNo} lot numaralı kayıt silinsin mi?`)) return;
    StorageService.deleteIncomingMaterial(m.id);
    onNotify('Kayıt silindi.');
  };

  const inputCls =
    'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500';

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Hammadde Kayıt</h1>
        <p className="text-xs text-slate-500">Gelen hammaddeler, geliş tarihi ve kondisyon testi durumu</p>
      </div>

      {/* Yeni kayıt */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600">
            <PackagePlus className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Yeni hammadde</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Lot No <span className="text-rose-500">*</span>
            </label>
            <input value={lotNo} onChange={e => setLotNo(e.target.value)} placeholder="MZ6015" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Geliş tarihi</label>
            <input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Açıklama (tedarikçi, cins, miktar…)
            </label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Örn: 8 balya, 1.850 kg"
              className={inputCls}
            />
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={!lotNo.trim()}
          className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
        >
          <Plus className="w-4 h-4" /> Kaydet
        </button>
      </div>

      {/* Filtre */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70 text-xs font-semibold">
        {(
          [
            ['open', `Test bekleyen (${openCount})`],
            ['done', `Test edildi (${items.length - openCount})`],
            ['all', `Tümü (${items.length})`],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 py-2 rounded-xl transition ${
              filter === key ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 && <p className="text-center text-sm text-slate-400 py-10">Bu listede kayıt yok.</p>}

      <div className="space-y-2.5">
        {visible.map(m => {
          const test = testFor(m);
          const tested = isTested(m);
          return (
            <div
              key={m.id}
              className={`bg-white dark:bg-slate-900 border rounded-3xl p-4 shadow-sm space-y-3 ${
                tested ? 'border-emerald-300 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">{m.lotNo}</div>
                  {m.description && <div className="text-xs text-slate-500 truncate">{m.description}</div>}
                </div>
                <button
                  onClick={() => handleDelete(m)}
                  className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 items-end">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1">Geliş tarihi</span>
                  <input
                    type="date"
                    value={m.arrivalDate}
                    onChange={e => StorageService.updateIncomingMaterial(m.id, { arrivalDate: e.target.value })}
                    className={inputCls + ' py-2'}
                  />
                </div>
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer h-[38px]">
                  <input
                    type="checkbox"
                    checked={tested}
                    disabled={Boolean(test)}
                    onChange={() => StorageService.updateIncomingMaterial(m.id, { conditionTested: !m.conditionTested })}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  Kondisyon testi yapıldı
                </label>
              </div>

              {test ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Test kaydı: {Formatting.formatDateTime(test.createdAtEpochMs)} · Nem {Formatting.pct(test.moistureContentPercent)}
                </div>
              ) : (
                !tested && (
                  <button
                    onClick={() => onStartTest(m.lotNo)}
                    className="w-full py-2 rounded-xl border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 active:scale-[0.98] transition"
                  >
                    <FlaskConical className="w-3.5 h-3.5" /> Kondisyon testine başla
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
