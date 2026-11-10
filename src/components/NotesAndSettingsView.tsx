'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import {
  StickyNote,
  Download,
  Upload,
  Smartphone,
  Globe,
  Trash2,
  CheckCircle,
  HelpCircle,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { SyncService } from '@/lib/syncService';

interface NotesAndSettingsViewProps {
  onNotify: (msg: string) => void;
}

export default function NotesAndSettingsView({ onNotify }: NotesAndSettingsViewProps) {
  const [pendingLotsText, setPendingLotsText] = useState('');

  useEffect(() => {
    setPendingLotsText(StorageService.getPendingLots());
  }, []);

  const handleNotesChange = (text: string) => {
    setPendingLotsText(text);
    StorageService.setPendingLots(text);
  };

  const handleBackupDownload = () => {
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `YunKondisyon_Yedek_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('✓ Tüm verileriniz JSON dosyası olarak indirildi.');
  };

  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importAllData(content);
        if (success) {
          setPendingLotsText(StorageService.getPendingLots());
          onNotify('✓ Yedek başarıyla geri yüklendi!');
        } else {
          onNotify('Yedek dosyası geçersiz veya bozuk.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Notlar ve Ayarlar</h1>
        <p className="text-xs text-slate-500">Test bekleyen lotlar, veri yedekleme ve sistem ayarları</p>
      </div>

      {/* Test Bekleyen Lotlar Scratchpad */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
            <StickyNote className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Test Bekleyen Lotlar</h2>
            <p className="text-xs text-slate-400">Yazdığınız her şey anında otomatik kaydedilir</p>
          </div>
        </div>

        <textarea
          value={pendingLotsText}
          onChange={e => handleNotesChange(e.target.value)}
          placeholder={`Örn:\nMZ6015 (Kondisyon yapılacak)\nMZ6020 (Kostik oranı bakılacak)\nLot 482...`}
          rows={7}
          className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-mono"
        />
        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>{pendingLotsText.split('\n').filter(Boolean).length} satır kayıtlı</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Otomatik senkronize</span>
        </div>
      </div>

      {/* Bulut Eşitleme (PC + Telefon) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Bulut Senkronizasyonu (PC + Telefon)
              </h2>
              <p className="text-xs text-slate-400">
                Bilgisayar ve telefon arasında canlı test aktarımı
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              const ok = await SyncService.triggerSync();
              if (ok) {
                onNotify('✓ Bulut ile başarıyla eşitlendi!');
              } else if (!navigator.onLine) {
                onNotify('İnternet bağlantısı yok, veriler lokal hafızada güvende.');
              } else {
                onNotify('Vercel Storage henüz bağlanmadı (Lokal Modda çalışıyor).');
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Şimdi Eşitle</span>
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <p className="leading-relaxed">
            • <strong>Nasıl Çalışır?</strong> İnternet varken bilgisayar ve telefonunuz aynı veritabanını kullanır. İnternet kesilirse testler cihazın kendi hafızasında saklanır, internet geldiğinde otomatik buluta aktarılır.
          </p>
          <p className="leading-relaxed">
            • <strong>Vercel'de Aktif Etme:</strong> Vercel panelinizde projenizi açın &gt; <strong>Storage</strong> sekmesine tıklayın &gt; <strong>Postgres (Neon)</strong> veritabanını bağlayın. Kodlar sıfır ayarla anında buluta bağlanacaktır.
          </p>
        </div>
      </div>

      {/* Veri Yedekleme & Geri Yükleme */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Veri Yedekleme</h2>
            <p className="text-xs text-slate-400">Verilerinizi cihazlar arasında aktarın veya saklayın</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleBackupDownload}
            className="py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-98"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Verileri Yedekle (JSON İndir)</span>
          </button>

          <label className="py-3.5 px-4 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-98">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Yedekten Geri Yükle</span>
            <input
              type="file"
              accept=".json"
              onChange={handleBackupUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Mobil ve Vercel Kurulum Rehberi */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-5 text-white shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-white/10 text-indigo-300">
            <Smartphone className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold">Mobilde Uygulama Olarak Kullanma</h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Bu web panelini cep telefonunuzun tarayıcısında (Safari veya Chrome) açtıktan sonra 
          <strong> "Ana Ekrana Ekle" (Add to Home Screen)</strong> seçeneğine dokunarak telefonunuza tıpkı bir uygulama (PWA) gibi kurabilirsiniz.
        </p>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-indigo-200 space-y-1.5">
          <p>• <strong>iPhone (Safari):</strong> Alt kısımdaki Paylaş butonuna dokunun &gt; <em>Ana Ekrana Ekle</em></p>
          <p>• <strong>Android (Chrome):</strong> Sağ üstteki üç noktaya dokunun &gt; <em>Uygulamayı Yükle / Ana Ekrana Ekle</em></p>
        </div>
      </div>
    </div>
  );
}
