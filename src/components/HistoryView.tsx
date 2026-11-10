'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { MoistureTestRecord, YunOraniTestRecord, DryingNoteSession } from '@/lib/types';
import { MoistureCalculator, YunOraniCalculator } from '@/lib/calculations';
import { Formatting, ParseUtils } from '@/lib/formatting';
import { PdfGenerator } from '@/lib/pdfGenerator';
import {
  FileText,
  Trash2,
  Share2,
  CheckSquare,
  Square,
  Search,
  Calendar,
  Layers,
  Archive,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';

interface HistoryViewProps {
  onNotify: (msg: string) => void;
}

export default function HistoryView({ onNotify }: HistoryViewProps) {
  const [activeTab, setActiveTab] = useState<'kondisyon' | 'yunOrani' | 'kurutma'>('kondisyon');
  const [searchTerm, setSearchTerm] = useState('');

  // Data states
  const [moistureRecords, setMoistureRecords] = useState<MoistureTestRecord[]>([]);
  const [yunOraniRecords, setYunOraniRecords] = useState<YunOraniTestRecord[]>([]);
  const [dryingSessions, setDryingSessions] = useState<DryingNoteSession[]>([]);

  // Multi-select for Yün Oranı
  const [selectedYunIds, setSelectedYunIds] = useState<string[]>([]);

  // Detail Modal for Kondisyon
  const [selectedMoistureRecord, setSelectedMoistureRecord] = useState<MoistureTestRecord | null>(null);

  // Load records
  const loadData = () => {
    setMoistureRecords(StorageService.getMoistureRecords());
    setYunOraniRecords(StorageService.getYunOraniRecords());
    setDryingSessions(StorageService.getDryingSessions());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('yun_storage_updated', handleUpdate);
    return () => window.removeEventListener('yun_storage_updated', handleUpdate);
  }, []);

  // Filtered lists
  const filteredMoisture = moistureRecords.filter(r =>
    r.lotNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredYunOrani = yunOraniRecords.filter(r =>
    r.hammaddeLot.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDrying = dryingSessions.filter(s =>
    s.hammaddeLot.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle multi-select for Yün Oranı
  const toggleSelectYun = (id: string) => {
    if (selectedYunIds.includes(id)) {
      setSelectedYunIds(selectedYunIds.filter(x => x !== id));
    } else {
      setSelectedYunIds([...selectedYunIds, id]);
    }
  };

  const selectAllYun = () => {
    if (selectedYunIds.length === filteredYunOrani.length) {
      setSelectedYunIds([]);
    } else {
      setSelectedYunIds(filteredYunOrani.map(r => r.id));
    }
  };

  // Actions for Yün Oranı
  const handleShareSelectedYunPdf = async () => {
    const selected = yunOraniRecords.filter(r => selectedYunIds.includes(r.id));
    if (selected.length === 0) return;
    try {
      await PdfGenerator.generateYunOraniReport(selected);
      onNotify(`✓ ${selected.length} adet test PDF olarak hazırlandı.`);
    } catch (e) {
      console.error(e);
      onNotify('PDF oluşturulurken bir hata oluştu.');
    }
  };

  const handleDeleteSelectedYun = () => {
    if (selectedYunIds.length === 0) return;
    if (confirm(`${selectedYunIds.length} adet testi silmek istediğinize emin misiniz?`)) {
      StorageService.deleteMultipleYunOraniRecords(selectedYunIds);
      setSelectedYunIds([]);
      onNotify('✓ Seçilen testler silindi.');
    }
  };

  // Actions for Kondisyon
  const handleDownloadMoisturePdf = async (record: MoistureTestRecord) => {
    try {
      await PdfGenerator.generateMoistureReport(record);
      onNotify('✓ PDF raporu hazırlandı.');
    } catch (e) {
      console.error(e);
      onNotify('PDF oluşturulurken hata oluştu.');
    }
  };

  const handleDeleteMoisture = (id: string) => {
    if (confirm('Bu kondisyon testi kaydını silmek istediğinize emin misiniz?')) {
      StorageService.deleteMoistureRecord(id);
      if (selectedMoistureRecord?.id === id) setSelectedMoistureRecord(null);
      onNotify('✓ Kayıt silindi.');
    }
  };

  // Actions for Kurutma
  const handleDownloadDryingPdf = async (session: DryingNoteSession) => {
    try {
      await PdfGenerator.generateDryingSessionReport(session);
      onNotify('✓ Kurutma raporu hazırlandı.');
    } catch (e) {
      console.error(e);
      onNotify('PDF oluşturulurken hata oluştu.');
    }
  };

  const handleDeleteDrying = (id: string) => {
    if (confirm('Bu kurutma notu seansını silmek istediğinize emin misiniz?')) {
      StorageService.deleteDryingSession(id);
      onNotify('✓ Seans silindi.');
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Test Geçmişi</h1>
          <p className="text-xs text-slate-500">Tüm arşivlenmiş raporlar ve ölçümler</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
        <button
          onClick={() => { setActiveTab('kondisyon'); setSelectedYunIds([]); }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
            activeTab === 'kondisyon'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kondisyon ({moistureRecords.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('yunOrani'); setSelectedYunIds([]); }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
            activeTab === 'yunOrani'
              ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Yün Oranı ({yunOraniRecords.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('kurutma'); setSelectedYunIds([]); }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
            activeTab === 'kurutma'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Kurutma ({dryingSessions.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Hammadde / Lot No ile ara..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Multi-select Action Bar for Yün Oranı */}
      {activeTab === 'yunOrani' && filteredYunOrani.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-900/50">
          <button
            onClick={selectAllYun}
            className="flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-300"
          >
            {selectedYunIds.length === filteredYunOrani.length ? (
              <CheckSquare className="w-4 h-4 text-teal-600" />
            ) : (
              <Square className="w-4 h-4 text-teal-600" />
            )}
            <span>
              {selectedYunIds.length > 0
                ? `${selectedYunIds.length} Test Seçildi`
                : 'Tümünü Seç'}
            </span>
          </button>

          {selectedYunIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareSelectedYunPdf}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Tek Sayfa PDF</span>
              </button>

              <button
                onClick={handleDeleteSelectedYun}
                className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 active:scale-95 transition"
                title="Seçilenleri Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 1. KONDİSYON TESTLERİ LİSTESİ */}
      {activeTab === 'kondisyon' && (
        <div className="space-y-3">
          {filteredMoisture.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Henüz kayıtlı kondisyon testi yok
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Kondisyon Testi ekranından testlerinizi kaydedebilirsiniz.
              </p>
            </div>
          ) : (
            filteredMoisture.map(record => {
              const metrics = MoistureCalculator.calculateAll({
                lotNo: record.lotNo,
                incomingTotalKg: record.incomingTotalKg,
                grossKg: record.grossKg,
                wetGrams: record.wetGrams,
                dryGrams: record.dryGrams,
                standardMoisturePercent: record.standardMoisturePercent,
                conditionKg: record.conditionKg,
                conditionPercent: record.conditionPercent,
              });

              return (
                <div
                  key={record.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500/50 transition cursor-pointer"
                  onClick={() => setSelectedMoistureRecord(record)}
                >
                  <div className="flex items-start justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{record.lotNo}</span>
                      </h3>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {Formatting.formatDateTime(record.createdAtEpochMs)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleDownloadMoisturePdf(record)}
                        className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                        title="PDF Paylaş / İndir"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMoisture(record.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Net KG (Nemli):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {record.incomingTotalKg ? `${Formatting.formatKg(record.incomingTotalKg)} kg` : '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Numune (Nemli/Kuru):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {Formatting.formatGrams(record.wetGrams)}g / {Formatting.formatGrams(record.dryGrams)}g
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Moisture / Regain:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {Formatting.pct(record.moistureContentPercent)} / {Formatting.pct(record.regainPercent)}
                      </span>
                    </div>

                    {metrics?.commercialTotalKg && (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Ticari Ağırlık:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {Formatting.formatKg(metrics.commercialTotalKg)} kg
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    <span>Detaylı Raporu Gör</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. YÜN ORANI TESTLERİ LİSTESİ */}
      {activeTab === 'yunOrani' && (
        <div className="space-y-3">
          {filteredYunOrani.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Henüz kayıtlı yün oranı testi yok
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Yün Oranı Testi ekranından testlerinizi kaydedebilirsiniz.
              </p>
            </div>
          ) : (
            filteredYunOrani.map(t => {
              const m1Final = t.sample1Measurements.length > 0
                ? [...t.sample1Measurements].sort((a, b) => b.sequence - a.sequence)[0]
                : null;
              const m2Final = t.sample2Measurements.length > 0
                ? [...t.sample2Measurements].sort((a, b) => b.sequence - a.sequence)[0]
                : null;

              const s1Val = m1Final ? ParseUtils.parseDouble(m1Final.value) : null;
              const s2Val = m2Final ? ParseUtils.parseDouble(m2Final.value) : null;

              const ratio = s1Val !== null && s2Val !== null
                ? YunOraniCalculator.calculate(s1Val, s2Val)
                : null;

              const isSelected = selectedYunIds.includes(t.id);

              return (
                <div
                  key={t.id}
                  onClick={() => toggleSelectYun(t.id)}
                  className={`border rounded-3xl p-4 transition cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-500 shadow-teal-500/10'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="text-teal-600 dark:text-teal-400">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 fill-teal-600/10" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {t.hammaddeLot}
                        </h3>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {Formatting.formatDateTime(t.createdAtEpochMs)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => PdfGenerator.generateYunOraniReport([t])}
                        className="p-2 rounded-xl text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition"
                        title="Tek Başına PDF İndir"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Bu testi silmek istediğinize emin misiniz?')) {
                            StorageService.deleteYunOraniRecord(t.id);
                            onNotify('✓ Test silindi.');
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Measurements details as user requested: start grams and all measurements */}
                  <div className="space-y-1.5 mt-3 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Num. 1 Başlangıç:</span>{' '}
                      {Formatting.formatGrams(t.sample1StartGrams)} g
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Num. 1 Ölçümler:</span>{' '}
                      {t.sample1Measurements.length > 0
                        ? t.sample1Measurements.map(m => m.value).join(', ')
                        : 'Yok'}
                    </div>

                    <div className="pt-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Num. 2 Başlangıç:</span>{' '}
                      {Formatting.formatGrams(t.sample2StartGrams)} g
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Num. 2 Ölçümler:</span>{' '}
                      {t.sample2Measurements.length > 0
                        ? t.sample2Measurements.map(m => m.value).join(', ')
                        : 'Yok'}
                    </div>
                  </div>

                  {/* Result Badge */}
                  {ratio && (
                    <div className="mt-3 p-2.5 rounded-2xl bg-teal-100/60 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-900/50 flex items-center justify-between font-bold text-xs">
                      <span className="text-amber-800 dark:text-amber-300">
                        Diğer: {Formatting.pct(ratio.otherPercent)}
                      </span>
                      <span className="text-teal-800 dark:text-teal-300">
                        Yün: {Formatting.pct(ratio.woolPercent)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3. KURUTMA NOTLARI ARŞİVİ */}
      {activeTab === 'kurutma' && (
        <div className="space-y-3">
          {filteredDrying.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <Archive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Arşivlenmiş kurutma seansı yok
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Kondisyon Testi ekranında Kurutma Notları &gt; Arşive Kaldır dendiğinde burada saklanır.
              </p>
            </div>
          ) : (
            filteredDrying.map(session => (
              <div
                key={session.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {session.hammaddeLot || 'İsimsiz Seans'}
                    </h3>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {Formatting.formatDateTime(session.archivedAtEpochMs)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownloadDryingPdf(session)}
                      className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                      title="PDF İndir"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDrying(session.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  <span>TARE: {session.tare ? `${session.tare} g` : '—'}</span>
                  <span className="mx-2">•</span>
                  <span>{session.measurements.length} Ölçüm</span>
                </div>

                <div className="mt-2 space-y-1 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-2xl">
                  {session.measurements.map(m => (
                    <div key={m.id} className="flex justify-between text-xs py-0.5">
                      <span className="text-slate-600 dark:text-slate-400">
                        {m.sequence}. Ölçüm ({m.time})
                      </span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Kondisyon Detay Modal */}
      {selectedMoistureRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                  Kayıt Detayı
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedMoistureRecord.lotNo}
                </h2>
              </div>
              <button
                onClick={() => setSelectedMoistureRecord(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calculations Breakdown */}
            {(() => {
              const r = selectedMoistureRecord;
              const m = MoistureCalculator.calculateAll({
                lotNo: r.lotNo,
                incomingTotalKg: r.incomingTotalKg,
                grossKg: r.grossKg,
                wetGrams: r.wetGrams,
                dryGrams: r.dryGrams,
                standardMoisturePercent: r.standardMoisturePercent,
                conditionKg: r.conditionKg,
                conditionPercent: r.conditionPercent,
              });

              return (
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Tarih / Saat:</span>
                    <span className="font-semibold">{Formatting.formatDateTime(r.createdAtEpochMs)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Net KG (Nemli):</span>
                    <span className="font-semibold">{r.incomingTotalKg ? `${Formatting.formatKg(r.incomingTotalKg)} kg` : '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Brüt KG (Nemli):</span>
                    <span className="font-semibold">{r.grossKg ? `${Formatting.formatKg(r.grossKg)} kg` : '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Numune (Nemli / Kuru):</span>
                    <span className="font-semibold">{Formatting.formatGrams(r.wetGrams)} g / {Formatting.formatGrams(r.dryGrams)} g</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Moisture Content:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{Formatting.pct(r.moistureContentPercent)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Regain:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{Formatting.pct(r.regainPercent)}</span>
                  </div>

                  {m?.estimatedDryTotalKg && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Total Dry Weight (Toplam Kuru):</span>
                      <span className="font-semibold">{Formatting.formatKg(m.estimatedDryTotalKg)} kg</span>
                    </div>
                  )}

                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Standart Nem (Ticari):</span>
                    <span className="font-semibold">{r.standardMoisturePercent ? Formatting.pct(r.standardMoisturePercent) : '—'}</span>
                  </div>

                  {m?.standardRegainKg && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Regain at Standart Nem:</span>
                      <span className="font-semibold">
                        {Formatting.formatKg(m.standardRegainKg)} kg ({Formatting.pct(m.standardRegainPercentOfIncoming)})
                      </span>
                    </div>
                  )}

                  {m?.commercialTotalKg && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/30 p-2 rounded-xl">
                      <span className="font-semibold text-indigo-900 dark:text-indigo-300">Invoice Weight (Ticari):</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {Formatting.formatKg(m.commercialTotalKg)} kg ({Formatting.pct(m.commercialPercentOfIncoming)})
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Kondisyon KG (Çeki Listesi):</span>
                    <span className="font-semibold">{r.conditionKg ? `${Formatting.formatKg(r.conditionKg)} kg` : '—'}</span>
                  </div>

                  {m?.gainKg !== null && m?.gainKg !== undefined && (
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Gain (Fark):</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {Formatting.formatSignedKg(m.gainKg)} kg ({Formatting.pct(m.gainPercentOfIncoming)})
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Kondisyon Oranı (Çeki Listesi):</span>
                    <span className="font-semibold">{r.conditionPercent ? Formatting.pct(r.conditionPercent) : '—'}</span>
                  </div>

                  {/* Actions in Modal */}
                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => handleDownloadMoisturePdf(r)}
                      className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-md transition"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>PDF Paylaş / İndir</span>
                    </button>

                    <button
                      onClick={() => handleDeleteMoisture(r.id)}
                      className="px-4 py-3 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
