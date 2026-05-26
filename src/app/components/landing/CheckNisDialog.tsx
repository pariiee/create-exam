"use client";

import { useEffect, useRef } from "react";
import type { NisResult } from "./types";

type Props = {
  open: boolean;
  loading: boolean;
  message: { type: "success" | "error" | "warning"; text: string } | null;
  results: NisResult[];
  nis: string;
  onChangeNis: (nis: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function CheckNisDialog({ open, loading, message, results, nis, onChangeNis, onClose, onSubmit }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => firstFieldRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleBackdropClick: React.MouseEventHandler<HTMLDialogElement> = (e) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="modal-dialog"
      aria-modal="true"
      role="dialog"
      aria-labelledby="check-nis-title"
      aria-describedby="check-nis-desc"
    >
      <div className="w-full max-w-lg glass-card glow-border rounded-2xl p-6 sm:p-8 relative mx-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white cursor-pointer"
          aria-label="Tutup dialog cek NIS"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/25" aria-hidden="true">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 id="check-nis-title" className="text-2xl font-bold text-white">
            Check NIS
          </h2>
          <p id="check-nis-desc" className="text-gray-400 text-sm mt-1">
            Masukkan NIS untuk mengecek status pendaftaran
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                : message.type === "warning"
                  ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                  : "bg-red-500/10 border border-red-500/20 text-red-300"
            }`}
            role="status"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  message.type === "success"
                    ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                }
              />
            </svg>
            {message.text}
          </div>
        )}

        {results.length > 0 && (
          <div className="mb-6 space-y-3" aria-label="Hasil pencarian NIS">
            {results.map((r, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Nama</span>
                  <span className="text-white text-sm font-medium">{r.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">NIS</span>
                  <span className="text-white text-sm font-medium">{r.nis}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Kelas</span>
                  <span className="text-white text-sm font-medium">{r.kelas}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="check_nis" className="block text-sm font-medium text-gray-300 mb-2">
              NIS (5 Digit)
            </label>
            <input
              ref={firstFieldRef}
              type="text"
              id="check_nis"
              value={nis}
              onChange={(e) => onChangeNis(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
              placeholder="Masukkan NIS kamu"
              maxLength={5}
              inputMode="numeric"
              className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Mengecek..." : "Cek NIS"}
          </button>
        </form>
      </div>
    </dialog>
  );
}

