"use client";

import { useEffect } from "react";
import type { RegForm } from "./types";

type Props = {
  open: boolean;
  regForm: RegForm;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmOverlay({ open, regForm, onCancel, onConfirm }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      <div className="w-full max-w-sm glass-card glow-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 mx-auto rounded-xl bg-sky-500/10 flex items-center justify-center mb-4" aria-hidden="true">
          <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 id="confirm-title" className="text-lg font-bold text-white text-center mb-2">
          Konfirmasi Pendaftaran
        </h3>
        <p id="confirm-desc" className="text-gray-400 text-sm text-center mb-5">
          Pastikan data berikut sudah benar:
        </p>

        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2.5 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Nama</span>
            <span className="text-sm text-white font-medium text-right max-w-[60%] truncate">{regForm.nama}</span>
          </div>
          <div className="border-t border-white/5" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wider">NIS</span>
            <span className="text-sm text-sky-300 font-mono font-medium">{regForm.nis}</span>
          </div>
          <div className="border-t border-white/5" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Kelas</span>
            <span className="text-sm text-emerald-300 font-medium">{regForm.kelas}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl gradient-bg-cool text-white text-sm font-semibold transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40"
          >
            Ya, Daftarkan
          </button>
        </div>
      </div>
    </div>
  );
}

