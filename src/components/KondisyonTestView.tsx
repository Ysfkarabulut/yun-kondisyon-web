'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MoistureCalculator } from '@/lib/calculations';
import { ParseUtils, Formatting } from '@/lib/formatting';
import { StorageService } from '@/lib/storage';
import { DryingMeasurement } from '@/lib/types';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface KondisyonTestViewProps {
  onNotify: (msg: string) => void;
}

export default function KondisyonTestView({ onNotify }: KondisyonTestViewProps) {
  // Kondisyon Inputs
  const [lot, setLot] = useState('');
  const [incoming, setIncoming] = useState('');
  const [grossKg, setGrossKg] = useState('');
  const [wet, setWet] = useState('');
  const [dry, setDry] = useState('');
  const [standardMoisture, setStandardMoisture] = useState('17');
  const [conditionKg, setConditionKg] = useState('');
  const [conditionPercent, setConditionPercent] = useState('');

  // Drying Notes Section state
  const [notesLot, setNotesLot] = useState('');
  const [tare, setTare] = useState('');
  const [measurementInput, setMeasurementInput] = useState('');
  const [measurements, setMeasurements] = useState<DryingMeasurement[]>([]);

  // Show formulas accordion
  const [showFormulas, setShowFormulas] = useState(false);

  // Load drafts on mount
  useEffect(() => {
    const draft = StorageService.getKondisyonDraft();
    if (draft) {
      if (draft.lot !== undefined) setLot(draft.lot);
      if (draft.incoming !== undefined) setIncoming(draft.incoming);
      if (draft.grossKg !== undefined) setGrossKg(draft.grossKg);
      if (draft.wet !== undefined) setWet(draft.wet);
      if (draft.dry !== undefined) setDry(draft.dry);
      if (draft.standardMoisture !== undefined) setStandardMoisture(draft.standardMoisture);
      if (draft.conditionKg !== undefined) setConditionKg(draft.conditionKg);
      if (draft.conditionPercent !== undefined) setConditionPercent(draft.conditionPercent);
    }

    const dDraft = StorageService.getDryingNotesDraft();
    if (dDraft) {
      setNotesLot(dDraft.lot || '');
      setTare(dDraft.tare || '');
      setMeasurements(dDraft.rows || []);
    }
  }, []);

  // Save drafts on change
  useEffect(() => {
    StorageService.setKondisyonDraft({
      lot,
      incoming,
      grossKg,
      wet,
      dry,
      standardMoisture,
      conditionKg,
      conditionPercent,
    });
  }, [lot, incoming, grossKg, wet, dry, standardMoisture, conditionKg, conditionPercent]);

  useEffect(() => {
    StorageService.setDryingNotesDraft({
      lot: notesLot,
      tare,
      rows: measurements,
    });
  }, [notesLot, tare, measurements]);

  // Live Calculations
  const calculatedMetrics = useMemo(() => {
    const wetVal = ParseUtils.parseDouble(wet);
    const dryVal = ParseUtils.parseDouble(dry);
    const incVal = ParseUtils.parseDouble(incoming);
    const grossVal = ParseUtils.parseDouble(grossKg);
    const stdVal = ParseUtils.parseDouble(standardMoisture);
    const condKgVal = ParseUtils.parseDouble(conditionKg);
    const condPctVal = ParseUtils.parseDouble(conditionPercent);

    if (!wetVal || !dryVal || wetVal <= 0 || dryVal <= 0 || dryVal > wetVal) {
      return null;
    }

    return MoistureCalculator.calculateAll({
      lotNo: lot,
      incomingTotalKg: incVal,
      grossKg: grossVal,
      wetGrams: wetVal,
      dryGrams: dryVal,
      standardMoisturePercent: stdVal,
      conditionKg: condKgVal,
      conditionPercent: condPctVal,
    });
  }, [lot, incoming, grossKg, wet, dry, standardMoisture, conditionKg, conditionPercent]);

  // Save Record
  const handleSave = () => {
    const wetVal = ParseUtils.parseDouble(wet);
    const dryVal = ParseUtils.parseDouble(dry);
    const incVal = ParseUtils.parseDouble(incoming);
    const grossVal = ParseUtils.parseDouble(grossKg);
    const stdVal = ParseUtils.parseDouble(standardMoisture);
    const condKgVal = ParseUtils.parseDouble(conditionKg);
    const condPctVal = ParseUtils.parseDouble(conditionPercent);

    if (!lot.trim()) {
      onNotify('Lütfen hammadde (lot) bilgisini girin.');
      return;
    }
    if (!wetVal || !dryVal || wetVal <= 0 || dryVal <= 0) {
      onNotify('Lütfen geçerli numune yaş ve kuru ağırlıklarını girin.');
      return;
    }
    if (dryVal > wetVal) {
      onNotify('Kuru ağırlık, nemli ağırlıktan büyük olamaz!');
      return;
    }

    const mc = MoistureCalculator.moistureContentPercent(wetVal, dryVal);
    const regain = MoistureCalculator.regainPercent(wetVal, dryVal);

    StorageService.saveMoistureRecord({
      lotNo: lot.trim(),
      incomingTotalKg: incVal,
      grossKg: grossVal,
      wetGrams: wetVal,
      dryGrams: dryVal,
      moistureContentPercent: mc,
      regainPercent: regain,
      standardMoisturePercent: stdVal,
      conditionKg: condKgVal,
      conditionPercent: condPctVal,
    });

    onNotify('✓ Test başarıyla kaydedildi!');

    // Reset fields after successful save
    setLot('');
    setIncoming('');
    setGrossKg('');
    setWet('');
    setDry('');
    setConditionKg('');
    setConditionPercent('');
    StorageService.setKondisyonDraft(null);
  };

  // Add Drying Note Measurement
  const handleAddMeasurement = () => {
    const trimmed = measurementInput.trim();
    if (!trimmed) return;

    const measured = ParseUtils.parseDouble(trimmed);
    const tareVal = ParseUtils.parseDouble(tare);

    let displayVal = `${trimmed} g`;
    let netVal: string | undefined = undefined;

    if (measured !== null && tareVal !== null) {
      const net = measured - tareVal;
      displayVal = `${Formatting.formatGrams(net)} g`;
      netVal = `Brüt: ${Formatting.formatGrams(measured)} - Dara: ${Formatting.formatGrams(tareVal)}`;
    }

    const nextSeq = measurements.length > 0 ? Math.max(...measurements.map(m => m.sequence)) + 1 : 1;

    const newMeasurement: DryingMeasurement = {
      id: Date.now().toString(),
      sequence: nextSeq,
      time: Formatting.currentTimeHHmm(),
      value: displayVal,
      netValue: netVal,
    };

    setMeasurements([newMeasurement, ...measurements]);
    setMeasurementInput('');
  };

  const handleArchiveDryingNotes = () => {
    if (measurements.length === 0 && !notesLot.trim()) {
      onNotify('Arşivlenecek ölçüm bulunamadı.');
      return;
    }

    StorageService.archiveDryingSession({
      hammaddeLot: notesLot.trim(),
      tare: tare.trim(),
      measurements,
    });

    setNotesLot('');
    setTare('');
    setMeasurementInput('');
    setMeasurements([]);
    StorageService.setDryingNotesDraft({ lot: '', tare: '', rows: [] });
    onNotify('✓ Kurutma seansı arşive kaldırıldı ve temizlendi.');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-3xl p-5 text-white shadow-lg shadow-indigo-700/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">Test Paneli</span>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">Yün Kondisyon Testi</h1>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-200" />
          </div>
        </div>
        <p className="text-xs text-blue-100/90 mt-2">
          Nem içeriği, Regain, Ticari Ağırlık ve Çeki listesi fark analizlerini anında hesaplar.
        </p>
      </div>

      {/* Main Input Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>Test Parametreleri</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Hammadde */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Hammadde (Lot No) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={lot}
              onChange={e => setLot(e.target.value)}
              placeholder="Örn: MZ6015 / Yün Lot 12"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Net KG */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Net KG (Nemli)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={incoming}
              onChange={e => setIncoming(e.target.value)}
              placeholder="Örn: 5000"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Brüt KG */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Brüt KG (Nemli)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={grossKg}
              onChange={e => setGrossKg(e.target.value)}
              placeholder="Opsiyonel"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Numune Nemli */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Numune (Nemli) (g) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={wet}
              onChange={e => setWet(e.target.value)}
              placeholder="Örn: 1000.00"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Numune Kuru */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Numune (Kuru) (g) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={dry}
              onChange={e => setDry(e.target.value)}
              placeholder="Örn: 840.00"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Standart Nem */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Standart Nem (Ticari %)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={standardMoisture}
              onChange={e => setStandardMoisture(e.target.value)}
              placeholder="Varsayılan: 17"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Kondisyon KG (Çeki Listesi) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Kondisyon KG (Çeki Listesi)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={conditionKg}
              onChange={e => setConditionKg(e.target.value)}
              placeholder="Opsiyonel"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Kondisyon Oranı (Çeki Listesi) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Kondisyon Oranı % (Çeki Listesi)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={conditionPercent}
              onChange={e => setConditionPercent(e.target.value)}
              placeholder="Opsiyonel (Örn: 17)"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Live Calculation Preview Card */}
        {calculatedMetrics && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Canlı Önizleme Sonuçları
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold">
                Hesaplandı
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Moisture Content</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {Formatting.pct(calculatedMetrics.moistureContentPercent)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Regain</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {Formatting.pct(calculatedMetrics.regainPercent)}
                </span>
              </div>

              {calculatedMetrics.estimatedDryTotalKg !== null && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Dry Weight</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {Formatting.formatKg(calculatedMetrics.estimatedDryTotalKg)} kg
                  </span>
                </div>
              )}

              {calculatedMetrics.commercialTotalKg !== null && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Invoice Weight (Ticari)</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {Formatting.formatKg(calculatedMetrics.commercialTotalKg)} kg
                  </span>
                </div>
              )}

              {calculatedMetrics.standardRegainKg !== null && (
                <div className="col-span-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Regain at {Formatting.pct(ParseUtils.parseDouble(standardMoisture) || 17)}:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {Formatting.formatKg(calculatedMetrics.standardRegainKg)} kg ({Formatting.pct(calculatedMetrics.standardRegainPercentOfIncoming)})
                  </span>
                </div>
              )}

              {calculatedMetrics.gainKg !== null && (
                <div className="col-span-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                  <span className="text-indigo-700 dark:text-indigo-300 font-medium text-[11px]">
                    Gain (Kazanım / Fark):
                  </span>
                  <span className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                    {Formatting.formatSignedKg(calculatedMetrics.gainKg)} kg ({Formatting.pct(calculatedMetrics.gainPercentOfIncoming)})
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-98 transition"
        >
          <Save className="w-5 h-5" />
          <span>Testi Kaydet</span>
        </button>

        {/* Formulas Accordion */}
        <div className="pt-2">
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <HelpCircle className="w-3.5 h-3.5" />
              Hesaplama Formülleri
            </span>
            {showFormulas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFormulas && (
            <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 border border-slate-200 dark:border-slate-800">
              <p>• <strong>Moisture Content:</strong> (Numune Nemli - Numune Kuru) / Numune Nemli × 100</p>
              <p>• <strong>Regain:</strong> (Numune Nemli - Numune Kuru) / Numune Kuru × 100</p>
              <p>• <strong>Total Dry Weight:</strong> Net KG × (Numune Kuru / Numune Nemli)</p>
              <p>• <strong>Invoice Weight (Ticari):</strong> Total Dry Weight × (1 + Standart Nem / 100)</p>
              <p>• <strong>Gain:</strong> Invoice Weight - Net KG</p>
            </div>
          )}
        </div>
      </div>

      {/* Kurutma Notları / Tartım Takibi Bölümü */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Kurutma Notları</h2>
            <p className="text-xs text-slate-400">Fırındaki numunenin peş peşe tartımlarını takip edin</p>
          </div>
          <button
            onClick={handleArchiveDryingNotes}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Arşive Kaldır & Temizle
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Hammadde (Lot No)
            </label>
            <input
              type="text"
              value={notesLot}
              onChange={e => setNotesLot(e.target.value)}
              placeholder="Lot no"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              TARE (Dara g)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={tare}
              onChange={e => setTare(e.target.value)}
              placeholder="Örn: 15.20"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={measurementInput}
            onChange={e => setMeasurementInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddMeasurement()}
            placeholder="Tartım değeri (g)"
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleAddMeasurement}
            className="px-5 py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm flex items-center gap-1.5 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ekle</span>
          </button>
        </div>

        {/* Measurements List */}
        <div className="space-y-2 mt-3">
          {measurements.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Henüz ölçüm eklenmedi.</p>
          ) : (
            measurements.map(m => (
              <div
                key={m.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {m.sequence}. Ölçüm
                  </span>
                  <span className="text-xs text-slate-400 ml-2">Saat: {m.time}</span>
                  {m.netValue && (
                    <span className="block text-[11px] text-slate-400 mt-0.5">{m.netValue}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
                    {m.value}
                  </span>
                  <button
                    onClick={() => setMeasurements(measurements.filter(row => row.id !== m.id))}
                    className="p-1 text-slate-400 hover:text-rose-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
