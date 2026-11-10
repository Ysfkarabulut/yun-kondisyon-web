'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { YunOraniCalculator, WoolRatioResult } from '@/lib/calculations';
import { ParseUtils, Formatting } from '@/lib/formatting';
import { StorageService } from '@/lib/storage';
import { DryingMeasurement } from '@/lib/types';
import StopwatchModal from './StopwatchModal';
import {
  Save,
  Plus,
  Trash2,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Percent,
} from 'lucide-react';

interface YunOraniTestViewProps {
  onNotify: (msg: string) => void;
}

export default function YunOraniTestView({ onNotify }: YunOraniTestViewProps) {
  const [hammadde, setHammadde] = useState('');
  const [sample1Start, setSample1Start] = useState('');
  const [sample2Start, setSample2Start] = useState('');

  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');

  const [sample1Rows, setSample1Rows] = useState<DryingMeasurement[]>([]);
  const [sample2Rows, setSample2Rows] = useState<DryingMeasurement[]>([]);

  const [isStopwatchOpen, setIsStopwatchOpen] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);

  // Load draft
  useEffect(() => {
    const draft = StorageService.getYunOraniDraft();
    if (draft) {
      if (draft.hammadde !== undefined) setHammadde(draft.hammadde);
      if (draft.sample1Start !== undefined) setSample1Start(draft.sample1Start);
      if (draft.sample2Start !== undefined) setSample2Start(draft.sample2Start);
      if (draft.sample1Rows) setSample1Rows(draft.sample1Rows);
      if (draft.sample2Rows) setSample2Rows(draft.sample2Rows);
    }
  }, []);

  // Save draft
  useEffect(() => {
    StorageService.setYunOraniDraft({
      hammadde,
      sample1Start,
      sample2Start,
      sample1Rows,
      sample2Rows,
    });
  }, [hammadde, sample1Start, sample2Start, sample1Rows, sample2Rows]);

  // Add Measurement to Sample 1
  const handleAddSample1 = () => {
    const trimmed = input1.trim();
    if (!trimmed) return;
    const nextSeq = sample1Rows.length > 0 ? Math.max(...sample1Rows.map(r => r.sequence)) + 1 : 1;
    const newRow: DryingMeasurement = {
      id: 's1_' + Date.now(),
      sequence: nextSeq,
      time: Formatting.currentTimeHHmm(),
      value: trimmed.endsWith('g') ? trimmed : `${trimmed} g`,
    };
    setSample1Rows([newRow, ...sample1Rows]);
    setInput1('');
  };

  // Add Measurement to Sample 2
  const handleAddSample2 = () => {
    const trimmed = input2.trim();
    if (!trimmed) return;
    const nextSeq = sample2Rows.length > 0 ? Math.max(...sample2Rows.map(r => r.sequence)) + 1 : 1;
    const newRow: DryingMeasurement = {
      id: 's2_' + Date.now(),
      sequence: nextSeq,
      time: Formatting.currentTimeHHmm(),
      value: trimmed.endsWith('g') ? trimmed : `${trimmed} g`,
    };
    setSample2Rows([newRow, ...sample2Rows]);
    setInput2('');
  };

  // Live Calculation based on final weighings
  const liveResult: WoolRatioResult | null = useMemo(() => {
    if (sample1Rows.length === 0 || sample2Rows.length === 0) return null;

    const s1Final = [...sample1Rows].sort((a, b) => b.sequence - a.sequence)[0];
    const s2Final = [...sample2Rows].sort((a, b) => b.sequence - a.sequence)[0];

    const s1Dry = ParseUtils.parseDouble(s1Final.value);
    const s2Dry = ParseUtils.parseDouble(s2Final.value);

    if (s1Dry === null || s2Dry === null) return null;
    return YunOraniCalculator.calculate(s1Dry, s2Dry);
  }, [sample1Rows, sample2Rows]);

  // Save
  const handleSave = () => {
    const s1Start = ParseUtils.parseDouble(sample1Start);
    const s2Start = ParseUtils.parseDouble(sample2Start);

    if (!hammadde.trim()) {
      onNotify('Hammadde (lot) bilgisi gerekli.');
      return;
    }
    if (s1Start === null || s1Start <= 0) {
      onNotify('1. Numune başlangıç gramı geçerli olmalıdır.');
      return;
    }
    if (s2Start === null || s2Start <= 0) {
      onNotify('2. Numune başlangıç gramı geçerli olmalıdır.');
      return;
    }
    if (sample1Rows.length === 0 || sample2Rows.length === 0) {
      onNotify('Lütfen her iki numune için de en az bir kurutma ölçümü ekleyin.');
      return;
    }

    StorageService.saveYunOraniRecord({
      hammaddeLot: hammadde.trim(),
      sample1StartGrams: s1Start,
      sample2StartGrams: s2Start,
      sample1Measurements: sample1Rows,
      sample2Measurements: sample2Rows,
    });

    onNotify('✓ Yün Oranı testi başarıyla kaydedildi!');

    // Reset inputs on success
    setHammadde('');
    setSample1Start('');
    setSample2Start('');
    setInput1('');
    setInput2('');
    setSample1Rows([]);
    setSample2Rows([]);
    StorageService.setYunOraniDraft(null);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner with Built-in Stopwatch Trigger */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 rounded-3xl p-5 text-white shadow-lg shadow-teal-800/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-200">Karışım Analizi</span>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">Yün Oranı Testi</h1>
          </div>

          {/* Quick Stopwatch Button */}
          <button
            onClick={() => setIsStopwatchOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur transition border border-white/20 text-xs font-bold shadow-sm"
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>Kronometre</span>
          </button>
        </div>
        <p className="text-xs text-teal-100/90 mt-2">
          Kostik çözeltisi son tartımı (Diğer) ile kurutulmuş toplam tartımı karşılaştırarak yün oranını bulur.
        </p>
      </div>

      {/* Main Parameters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Test Bilgileri</h2>

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Hammadde (Lot No) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={hammadde}
              onChange={e => setHammadde(e.target.value)}
              placeholder="Örn: Lot 104 / İplik 28/2"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                1. Numune Gr (Başlangıç) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={sample1Start}
                onChange={e => setSample1Start(e.target.value)}
                placeholder="Örn: 20.00"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                2. Numune Gr (Başlangıç) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={sample2Start}
                onChange={e => setSample2Start(e.target.value)}
                placeholder="Örn: 20.00"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 1. Numune Kurutma (Kostik sonrası; viskon/diğer kalır) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">1. Numune Kurutma</h2>
            <p className="text-[11px] text-slate-400">Kostik çözeltisi sonrası kalan (Diğer) tartımları</p>
          </div>
          {sample1Rows.length > 0 && (
            <button
              onClick={() => setSample1Rows([])}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium"
            >
              Temizle
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={input1}
            onChange={e => setInput1(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddSample1()}
            placeholder="Ölçüm gramı (g)"
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={handleAddSample1}
            className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex items-center gap-1.5 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ekle</span>
          </button>
        </div>

        <div className="space-y-1.5 mt-2">
          {sample1Rows.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">Ölçüm eklenmedi.</p>
          ) : (
            sample1Rows.map(r => (
              <div
                key={r.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <span>{r.sequence}. Ölçüm — Saat: {r.time}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded">
                    {r.value}
                  </span>
                  <button
                    onClick={() => setSample1Rows(sample1Rows.filter(x => x.id !== r.id))}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Numune Kurutma (Yıkama sonrası; yün + diğer kalır) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">2. Numune Kurutma</h2>
            <p className="text-[11px] text-slate-400">Yıkama sonrası kalan (Toplam) tartımları</p>
          </div>
          {sample2Rows.length > 0 && (
            <button
              onClick={() => setSample2Rows([])}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium"
            >
              Temizle
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={input2}
            onChange={e => setInput2(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddSample2()}
            placeholder="Ölçüm gramı (g)"
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={handleAddSample2}
            className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex items-center gap-1.5 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ekle</span>
          </button>
        </div>

        <div className="space-y-1.5 mt-2">
          {sample2Rows.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">Ölçüm eklenmedi.</p>
          ) : (
            sample2Rows.map(r => (
              <div
                key={r.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <span>{r.sequence}. Ölçüm — Saat: {r.time}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded">
                    {r.value}
                  </span>
                  <button
                    onClick={() => setSample2Rows(sample2Rows.filter(x => x.id !== r.id))}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live Result Highlight */}
      {liveResult && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-teal-500/10 via-emerald-500/10 to-teal-500/5 border border-teal-500/30 dark:border-teal-500/20 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
              <Percent className="w-4 h-4" />
              Canlı Oran Sonucu
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-semibold">
              Son Tartımlara Göre
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Diğer Oranı</span>
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {Formatting.pct(liveResult.otherPercent)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Yün Oranı</span>
              <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {Formatting.pct(liveResult.woolPercent)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 active:scale-98 transition"
      >
        <Save className="w-5 h-5" />
        <span>Yün Oranı Testini Kaydet</span>
      </button>

      {/* Formula Accordion */}
      <div className="pt-1">
        <button
          onClick={() => setShowFormulas(!showFormulas)}
          className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <HelpCircle className="w-3.5 h-3.5" />
            Hesaplama Formülü
          </span>
          {showFormulas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFormulas && (
          <div className="mt-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 border border-slate-200 dark:border-slate-800">
            <p>• <strong>Diğer Oranı (%):</strong> (Numune 1 Son Tartım / Numune 2 Son Tartım) × 100</p>
            <p>• <strong>Yün Oranı (%):</strong> 100 − Diğer Oranı (%)</p>
          </div>
        )}
      </div>

      {/* Built-in Stopwatch Modal */}
      <StopwatchModal isOpen={isStopwatchOpen} onClose={() => setIsStopwatchOpen(false)} />
    </div>
  );
}
