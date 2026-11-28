'use client';

import React, { useState } from 'react';
import KondisyonTestView from '@/components/KondisyonTestView';
import YunOraniTestView from '@/components/YunOraniTestView';
import HistoryView from '@/components/HistoryView';
import NotesAndSettingsView from '@/components/NotesAndSettingsView';
import CertifiedMaterialView from '@/components/CertifiedMaterialView';
import IncomingMaterialView from '@/components/IncomingMaterialView';
import { StorageService } from '@/lib/storage';
import StopwatchModal from '@/components/StopwatchModal';
import SyncBadge from '@/components/SyncBadge';
import {
  Scale,
  Percent,
  History,
  FileEdit,
  Clock,
  CheckCircle2,
  BadgeCheck,
  PackageOpen,
} from 'lucide-react';

type TabKey = 'kondisyon' | 'yunOrani' | 'hammadde' | 'sertifikali' | 'history' | 'notes';

const TABS: { key: TabKey; label: string; Icon: React.ComponentType<{ className?: string }>; active: string }[] = [
  { key: 'kondisyon', label: 'Kondisyon', Icon: Scale, active: 'text-indigo-600 dark:text-indigo-400 [&>div]:bg-indigo-50 dark:[&>div]:bg-indigo-950/60' },
  { key: 'yunOrani', label: 'Yün Oranı', Icon: Percent, active: 'text-teal-600 dark:text-teal-400 [&>div]:bg-teal-50 dark:[&>div]:bg-teal-950/60' },
  { key: 'hammadde', label: 'Hammadde', Icon: PackageOpen, active: 'text-sky-600 dark:text-sky-400 [&>div]:bg-sky-50 dark:[&>div]:bg-sky-950/60' },
  { key: 'sertifikali', label: 'Sertifikalı', Icon: BadgeCheck, active: 'text-emerald-600 dark:text-emerald-400 [&>div]:bg-emerald-50 dark:[&>div]:bg-emerald-950/60' },
  { key: 'history', label: 'Geçmiş', Icon: History, active: 'text-indigo-600 dark:text-indigo-400 [&>div]:bg-indigo-50 dark:[&>div]:bg-indigo-950/60' },
  { key: 'notes', label: 'Notlar', Icon: FileEdit, active: 'text-amber-600 dark:text-amber-400 [&>div]:bg-amber-50 dark:[&>div]:bg-amber-950/60' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>('kondisyon');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isStopwatchOpen, setIsStopwatchOpen] = useState(false);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Hammadde kaydından kondisyon testine geçiş: lot numarasını taslağa yazar
  const startConditionTest = (lotNo: string) => {
    const draft = StorageService.getKondisyonDraft() || {};
    StorageService.setKondisyonDraft({ ...draft, lot: lotNo });
    setActiveTab('kondisyon');
    window.scrollTo({ top: 0 });
  };

  // Tablo/liste ekranları masaüstünde tam genişlik kullanır, form ekranları okunaklı genişlikte kalır
  const isWideTab = activeTab === 'sertifikali' || activeTab === 'hammadde' || activeTab === 'history';

  return (
    <main className="min-h-screen flex flex-col w-full relative">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="max-w-xl lg:max-w-none mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Yün Test Laboratuvarı
              </h1>
              <span className="text-[10px] text-slate-400 font-medium block">
                Kondisyon &amp; Oran Analizleri
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SyncBadge />
            {/* Global Stopwatch Shortcut */}
            <button
              onClick={() => setIsStopwatchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold active:scale-95 transition"
              title="Kronometreyi Aç"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Sayaç</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex w-full">
        {/* Masaüstü: sol menü */}
        <aside className="hidden lg:flex flex-col gap-1 w-56 shrink-0 sticky top-[57px] h-[calc(100vh-57px)] p-3 border-r border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/40">
          {TABS.map(({ key, label, Icon, active }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-left transition ${
                activeTab === key
                  ? `${active} font-bold bg-slate-100 dark:bg-slate-800`
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <div className="p-1 rounded-lg">
                <Icon className="w-5 h-5" />
              </div>
              {label}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 p-4 lg:p-8">
          <div className={`mx-auto w-full ${isWideTab ? 'max-w-xl lg:max-w-7xl' : 'max-w-xl lg:max-w-3xl'}`}>
            {activeTab === 'kondisyon' && <KondisyonTestView onNotify={showNotification} />}
            {activeTab === 'yunOrani' && <YunOraniTestView onNotify={showNotification} />}
            {activeTab === 'hammadde' && (
              <IncomingMaterialView onNotify={showNotification} onStartTest={startConditionTest} />
            )}
            {activeTab === 'sertifikali' && <CertifiedMaterialView onNotify={showNotification} />}
            {activeTab === 'history' && <HistoryView onNotify={showNotification} />}
            {activeTab === 'notes' && <NotesAndSettingsView onNotify={showNotification} />}
          </div>
        </div>
      </div>

      {/* Global Stopwatch Modal */}
      <StopwatchModal isOpen={isStopwatchOpen} onClose={() => setIsStopwatchOpen(false)} />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="p-3.5 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-semibold shadow-xl backdrop-blur flex items-center gap-2 border border-slate-700/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
            <span className="flex-1">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Mobil: alt menü (başparmak erişimi) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-xl mx-auto flex items-center justify-around px-1 py-2">
          {TABS.map(({ key, label, Icon, active }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-1 px-0.5 rounded-2xl transition active:scale-90 ${
                activeTab === key
                  ? `${active} font-bold`
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="p-1 rounded-xl transition">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] truncate max-w-full">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
