'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Clock } from 'lucide-react';

interface StopwatchModalProps {
  isOpen: boolean;
  onClose: () => Unit;
}

type Unit = void;

export default function StopwatchModal({ isOpen, onClose }: StopwatchModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimestampRef = useRef<number | null>(null);
  const savedElapsedRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning) {
      startTimestampRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (startTimestampRef.current) {
          const currentElapsed = savedElapsedRef.current + (Date.now() - startTimestampRef.current);
          setElapsedMs(currentElapsed);
        }
      }, 50);
    } else {
      if (startTimestampRef.current) {
        savedElapsedRef.current += Date.now() - startTimestampRef.current;
        startTimestampRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  if (!isOpen) return null;

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((elapsedMs % 1000) / 10);

  const format2 = (n: number) => String(n).padStart(2, '0');

  const handleReset = () => {
    setIsRunning(false);
    savedElapsedRef.current = 0;
    startTimestampRef.current = null;
    setElapsedMs(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-lg">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Kurutma Kronometresi</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Digit Display */}
        <div className="my-8 text-center">
          <div className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white flex items-baseline justify-center">
            <span>{format2(minutes)}:{format2(seconds)}</span>
            <span className="text-2xl sm:text-3xl text-indigo-600 dark:text-indigo-400 ml-1">
              .{format2(centiseconds)}
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Ekran kapansa dahi gerçek zamanlı saymaya devam eder
          </p>
        </div>

        {/* Controls */}
        <div className="w-full flex items-center justify-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 py-3.5 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 transition active:scale-95 shadow-md ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Durdur</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Başlat</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="py-3.5 px-5 rounded-2xl font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Sıfırla</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Pencereyi Kapat
        </button>
      </div>
    </div>
  );
}
