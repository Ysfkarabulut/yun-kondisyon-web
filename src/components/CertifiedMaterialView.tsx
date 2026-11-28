'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { StorageService } from '@/lib/storage';
import { CertifiedShipment, CERT_STANDARDS, CertStandard } from '@/lib/types';
import { todayIso, ParseUtils, Formatting } from '@/lib/formatting';
import { BadgeCheck, Plus, Trash2, Truck, FileCheck2, Globe } from 'lucide-react';

interface CertifiedMaterialViewProps {
  onNotify: (msg: string) => void;
}

type StatusFilter = 'all' | 'open' | 'done';
type StdFilter = 'all' | CertStandard;

const STD_COLORS: Record<CertStandard, { on: string; dot: string }> = {
  GOTS: { on: 'bg-emerald-600 text-white border-emerald-600', dot: 'bg-emerald-500' },
  RWS: { on: 'bg-sky-600 text-white border-sky-600', dot: 'bg-sky-500' },
  GRS: { on: 'bg-violet-600 text-white border-violet-600', dot: 'bg-violet-500' },
  Pamuk: { on: 'bg-amber-500 text-white border-amber-500', dot: 'bg-amber-400' },
  SFA: { on: 'bg-rose-600 text-white border-rose-600', dot: 'bg-rose-500' },
};

const OFF_CHIP =
  'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400';

function isComplete(s: CertifiedShipment) {
  return Boolean(s.receivedDate) && s.tcReceived && s.portalRegistered;
}

function StandardChips({
  value,
  onToggle,
  size = 'md',
  hideOffUntilHover = false,
}: {
  value: CertStandard[];
  onToggle: (std: CertStandard) => void;
  size?: 'sm' | 'md';
  /** true: seçili olmayanlar yalnızca satırın üzerine gelince görünür (tablo için) */
  hideOffUntilHover?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {CERT_STANDARDS.map(std => {
        const on = value.includes(std);
        return (
          <button
            key={std}
            type="button"
            onClick={() => onToggle(std)}
            title={on ? `${std} kaldır` : `${std} ekle`}
            className={`rounded-full border font-semibold transition active:scale-95 ${
              size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs'
            } ${on ? STD_COLORS[std].on : OFF_CHIP} ${
              !on && hideOffUntilHover ? 'hidden group-hover:inline-block opacity-60' : ''
            }`}
          >
            {std}
          </button>
        );
      })}
    </div>
  );
}

function toggleIn(list: CertStandard[], std: CertStandard): CertStandard[] {
  return list.includes(std) ? list.filter(s => s !== std) : [...list, std];
}

const INPUT_CLS =
  'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40';
const CELL_INPUT_CLS =
  'w-full min-w-0 px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-transparent text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40';

/** Onay kutusu + tarih (TC belgesi / portal kaydı) */
function StepCheck({
  checked,
  date,
  label,
  onToggle,
  onDate,
  compact = false,
}: {
  checked: boolean;
  date: string;
  label: string;
  onToggle: () => void;
  onDate: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="w-4 h-4 shrink-0 accent-emerald-600 cursor-pointer"
        aria-label={label}
      />
      <input
        type="date"
        value={date}
        disabled={!checked}
        onChange={e => onDate(e.target.value)}
        className={compact ? CELL_INPUT_CLS : INPUT_CLS}
      />
    </div>
  );
}

export default function CertifiedMaterialView({ onNotify }: CertifiedMaterialViewProps) {
  const [items, setItems] = useState<CertifiedShipment[]>([]);
  const [newStandards, setNewStandards] = useState<CertStandard[]>([]);
  const [newSupplier, setNewSupplier] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newKg, setNewKg] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [stdFilter, setStdFilter] = useState<StdFilter>('all');

  useEffect(() => {
    const load = () => setItems(StorageService.getCertifiedShipments());
    load();
    window.addEventListener('yun_storage_updated', load);
    return () => window.removeEventListener('yun_storage_updated', load);
  }, []);

  const byStandard = useMemo(
    () => (stdFilter === 'all' ? items : items.filter(i => (i.standards || []).includes(stdFilter))),
    [items, stdFilter]
  );

  const visible = useMemo(() => {
    if (statusFilter === 'open') return byStandard.filter(i => !isComplete(i));
    if (statusFilter === 'done') return byStandard.filter(isComplete);
    return byStandard;
  }, [byStandard, statusFilter]);

  const openCount = byStandard.filter(i => !isComplete(i)).length;
  const totalKg = visible.reduce((sum, i) => sum + (i.kg || 0), 0);

  const canAdd = newProduct.trim() && newStandards.length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    StorageService.addCertifiedShipment({
      orderText: newProduct.trim(),
      supplier: newSupplier.trim(),
      kg: ParseUtils.parseDouble(newKg),
      standards: newStandards,
    });
    setNewProduct('');
    setNewKg('');
    onNotify('✓ Sevkiyat eklendi.');
  };

  const update = (id: string, patch: Partial<CertifiedShipment>) => {
    StorageService.updateCertifiedShipment(id, patch);
  };

  const toggleStep = (
    s: CertifiedShipment,
    flag: 'tcReceived' | 'portalRegistered',
    dateKey: 'tcDate' | 'portalDate'
  ) => {
    const next = !s[flag];
    update(s.id, { [flag]: next, [dateKey]: next ? s[dateKey] || todayIso() : '' } as Partial<CertifiedShipment>);
  };

  const handleDelete = (s: CertifiedShipment) => {
    if (!window.confirm(`"${s.orderText}" sevkiyatı silinsin mi?`)) return;
    StorageService.deleteCertifiedShipment(s.id);
    onNotify('Sevkiyat silindi.');
  };

  const inputCls = INPUT_CLS;
  const cellInputCls = CELL_INPUT_CLS;

  const stepProps = (s: CertifiedShipment, which: 'tc' | 'portal') =>
    which === 'tc'
      ? {
          checked: s.tcReceived,
          date: s.tcDate,
          label: 'TC belgesi geldi',
          onToggle: () => toggleStep(s, 'tcReceived', 'tcDate'),
          onDate: (v: string) => update(s.id, { tcDate: v }),
        }
      : {
          checked: s.portalRegistered,
          date: s.portalDate,
          label: 'Portala kaydedildi',
          onToggle: () => toggleStep(s, 'portalRegistered', 'portalDate'),
          onDate: (v: string) => update(s.id, { portalDate: v }),
        };

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sertifikalı Hammadde</h1>
        <p className="text-xs text-slate-500">Sipariş → Geliş → TC belgesi → Portal kaydı takibi</p>
      </div>

      {/* Yeni sevkiyat */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
        <div>
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Standart <span className="text-rose-500">*</span>
            <span className="font-normal text-slate-400"> · birden fazla seçilebilir</span>
          </span>
          <StandardChips value={newStandards} onToggle={std => setNewStandards(v => toggleIn(v, std))} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-[1fr_2fr_8rem_auto] gap-2 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Firma</label>
            <input
              value={newSupplier}
              onChange={e => setNewSupplier(e.target.value)}
              placeholder="Örn: Fuhrmann"
              className={inputCls + ' py-2.5'}
            />
          </div>
          <div className="order-first col-span-2 lg:order-none lg:col-span-1">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Ürün cinsi <span className="text-rose-500">*</span>
            </label>
            <input
              value={newProduct}
              onChange={e => setNewProduct(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Örn: BF 0223 19.5 GOTS 70 MM LOT : 5362"
              className={inputCls + ' py-2.5'}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">KG</label>
            <input
              value={newKg}
              onChange={e => setNewKg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              inputMode="decimal"
              placeholder="12000"
              className={inputCls + ' py-2.5'}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className="col-span-2 lg:col-span-1 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold flex items-center justify-center gap-1 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Ekle
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 lg:pb-0">
          {(['all', ...CERT_STANDARDS] as StdFilter[]).map(key => {
            const on = stdFilter === key;
            const count = key === 'all' ? items.length : items.filter(i => (i.standards || []).includes(key)).length;
            return (
              <button
                key={key}
                onClick={() => setStdFilter(key)}
                className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                  on
                    ? key === 'all'
                      ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white'
                      : STD_COLORS[key].on
                    : OFF_CHIP
                }`}
              >
                {key === 'all' ? 'Tüm standartlar' : key} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70 text-xs font-semibold lg:ml-auto lg:w-96">
          {(
            [
              ['open', `Bekleyen (${openCount})`],
              ['done', `Tamamlanan (${byStandard.length - openCount})`],
              ['all', `Tümü (${byStandard.length})`],
            ] as [StatusFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`flex-1 py-2 rounded-xl transition ${
                statusFilter === key
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visible.length > 0 && (
        <p className="text-xs text-slate-500">
          {visible.length} kayıt · toplam <b className="text-slate-700 dark:text-slate-200">{Formatting.formatKg(totalKg)} kg</b>
        </p>
      )}

      {visible.length === 0 && <p className="text-center text-sm text-slate-400 py-10">Bu listede kayıt yok.</p>}

      {/* Masaüstü: tablo */}
      {visible.length > 0 && (
        <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wide text-slate-500">
              <tr className="text-left">
                <th className="px-3 py-2.5 w-[9rem]">Standart</th>
                <th className="px-3 py-2.5 w-[8.5rem]">Firma</th>
                <th className="px-3 py-2.5">Ürün cinsi</th>
                <th className="px-3 py-2.5 w-[6rem] text-right">KG</th>
                <th className="px-3 py-2.5 w-[9rem]">Geliş tarihi</th>
                <th className="px-3 py-2.5 w-[10.5rem]">TC belgesi</th>
                <th className="px-3 py-2.5 w-[10.5rem]">Portal kaydı</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visible.map(s => {
                const done = isComplete(s);
                return (
                  <tr key={s.id} className={`group ${done ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''}`}>
                    <td className="px-3 py-2">
                      <StandardChips
                        size="sm"
                        hideOffUntilHover
                        value={s.standards || []}
                        onToggle={std => update(s.id, { standards: toggleIn(s.standards || [], std) })}
                      />
                    </td>
                    <td className="px-1 py-2">
                      <input
                        value={s.supplier || ''}
                        onChange={e => update(s.id, { supplier: e.target.value })}
                        className={cellInputCls}
                      />
                    </td>
                    <td className="px-1 py-2">
                      <input
                        value={s.orderText}
                        onChange={e => update(s.id, { orderText: e.target.value })}
                        className={cellInputCls + ' font-semibold'}
                        title={s.orderText}
                      />
                    </td>
                    <td className="px-1 py-2">
                      <input
                        defaultValue={s.kg ?? ''}
                        onBlur={e => update(s.id, { kg: ParseUtils.parseDouble(e.target.value) })}
                        inputMode="decimal"
                        className={cellInputCls + ' text-right tabular-nums'}
                      />
                    </td>
                    <td className="px-1 py-2">
                      <input
                        type="date"
                        value={s.receivedDate}
                        onChange={e => update(s.id, { receivedDate: e.target.value })}
                        className={cellInputCls}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <StepCheck {...stepProps(s, 'tc')} compact />
                    </td>
                    <td className="px-2 py-2">
                      <StepCheck {...stepProps(s, 'portal')} compact />
                    </td>
                    <td className="pr-2 py-2">
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobil: kartlar */}
      <div className="space-y-3 lg:hidden">
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
                <div className="flex-1 min-w-0 space-y-1">
                  <input
                    value={s.orderText}
                    onChange={e => update(s.id, { orderText: e.target.value })}
                    className="w-full bg-transparent text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg px-1 -mx-1"
                  />
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <input
                      value={s.supplier || ''}
                      onChange={e => update(s.id, { supplier: e.target.value })}
                      placeholder="Firma"
                      className="flex-1 min-w-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1 -mx-1"
                    />
                    {s.kg ? <span className="shrink-0 font-semibold tabular-nums">{Formatting.formatKg(s.kg)} kg</span> : null}
                  </div>
                </div>
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

              <StandardChips
                size="sm"
                value={s.standards || []}
                onToggle={std => update(s.id, { standards: toggleIn(s.standards || [], std) })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <Truck className="w-3.5 h-3.5" /> Geliş tarihi
                  </span>
                  <input
                    type="date"
                    value={s.receivedDate}
                    onChange={e => update(s.id, { receivedDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <FileCheck2 className="w-3.5 h-3.5" /> TC belgesi geldi
                  </span>
                  <StepCheck {...stepProps(s, 'tc')} />
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <Globe className="w-3.5 h-3.5" /> Portala kaydedildi
                  </span>
                  <StepCheck {...stepProps(s, 'portal')} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
