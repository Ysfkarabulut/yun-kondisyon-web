'use client';

import React, { useState } from 'react';
import KondisyonTestView from '@/components/KondisyonTestView';
import YunOraniTestView from '@/components/YunOraniTestView';
import HistoryView from '@/components/HistoryView';
import NotesAndSettingsView from '@/components/NotesAndSettingsView';
import StopwatchModal from '@/components/StopwatchModal';
import {
  Scale,
  Percent,
  History,
  FileEdit,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'kondisyon' | 'yunOrani' | 'history' | 'notes'>('kondisyon');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isStopwatchOpen, setIsStopwatchOpen] = useState(false);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  return (
    <main className="min-h-screen flex flex-col max-w-xl mx-auto w-full relative">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/70 px-4 py-3 flex items-center justify-between">
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

        {/* Global Stopwatch Shortcut */}
        <button
          onClick={() => setIsStopwatchOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold active:scale-95 transition"
          title="Kronometreyi Aç"
        >
          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Sayaç</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-4">
        {activeTab === 'kondisyon' && <KondisyonTestView onNotify={showNotification} />}
        {activeTab === 'yunOrani' && <YunOraniTestView onNotify={showNotification} />}
        {activeTab === 'history' && <HistoryView onNotify={showNotification} />}
        {activeTab === 'notes' && <NotesAndSettingsView onNotify={showNotification} />}
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

      {/* Fixed Bottom Navigation Bar (Thumb ergonomic for mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-xl mx-auto flex items-center justify-around px-2 py-2">
          {/* Tab 1: Kondisyon */}
          <button
            onClick={() => setActiveTab('kondisyon')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition active:scale-90 ${
              activeTab === 'kondisyon'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'kondisyon' ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
              <Scale className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Kondisyon</span>
          </button>

          {/* Tab 2: Yün Oranı */}
          <button
            onClick={() => setActiveTab('yunOrani')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition active:scale-90 ${
              activeTab === 'yunOrani'
                ? 'text-teal-600 dark:text-teal-400 font-bold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'yunOrani' ? 'bg-teal-50 dark:bg-teal-950/60' : ''}`}>
              <Percent className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Yün Oranı</span>
          </button>

          {/* Tab 3: Geçmiş */}
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition active:scale-90 ${
              activeTab === 'history'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'history' ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
              <History className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Geçmiş</span>
          </button>

          {/* Tab 4: Notlar & Ayarlar */}
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition active:scale-90 ${
              activeTab === 'notes'
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'notes' ? 'bg-amber-50 dark:bg-amber-950/60' : ''}`}>
              <FileEdit className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Notlar</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
