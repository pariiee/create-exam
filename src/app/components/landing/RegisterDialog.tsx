"use client";

import { useEffect, useRef } from "react";
import type { DupInfo, RegForm } from "./types";

type Props = {
  open: boolean;
  loading: boolean;
  message: { type: "success" | "error"; text: string } | null;
  dupInfo: DupInfo | null;
  regForm: RegForm;
  selTingkat: string;
  selJurusan: string;
  selNomor: string;
  jurusanOptions: { jurusan: string; nomors: string[] }[];
  nomorOptions: string[];
  onChangeForm: (form: RegForm) => void;
  onChangeTingkat: (t: string) => void;
  onChangeJurusan: (j: string) => void;
  onChangeNomor: (n: string) => void;
  onClose: () => void;
  onSubmitConfirm: (e: React.FormEvent) => void;
};

export function RegisterDialog(props: Props) {
  const {
    open,
    loading,
    message,
    dupInfo,
    regForm,
    selTingkat,
    selJurusan,
    selNomor,
    jurusanOptions,
    nomorOptions,
    onChangeForm,
    onChangeTingkat,
    onChangeJurusan,
    onChangeNomor,
    onClose,
    onSubmitConfirm,
  } = props;

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  // Imperatively open/close dialog based on `open` prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Fokus ke input nama
      requestAnimationFrame(() => {
        firstFieldRef.current?.focus();
      });
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Close on Escape
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
      aria-labelledby="register-dialog-title"
      aria-describedby="register-dialog-desc"
    >
      <div className="w-full max-w-lg glass-card glow-border rounded-2xl p-6 sm:p-8 relative mx-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white cursor-pointer"
          aria-label="Tutup formulir pendaftaran"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl gradient-bg-cool flex items-center justify-center mb-4 shadow-lg shadow-sky-500/25">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 id="register-dialog-title" className="text-2xl font-bold text-white">
            Buat Akun Exam
          </h2>
          <p id="register-dialog-desc" className="text-gray-400 text-sm mt-1">
            Isi formulir di bawah untuk mendaftarkan akun ujianmu
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-xl text-sm flex items-center gap-3 ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                : "bg-red-500/10 border border-red-500/20 text-red-300"
            }`}
            role="status"
          >
            {message.type === "success" ? (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {message.text}
          </div>
        )}

        {dupInfo && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm space-y-2">
            <p className="text-amber-300 font-medium">Data yang sudah terdaftar:</p>
            <div className="space-y-1 text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">NIS</span>
                <span className="text-white font-medium">{dupInfo.nis}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nama</span>
                <span className="text-white font-medium">{dupInfo.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Kelas</span>
                <span className="text-white font-medium">{dupInfo.kelas}</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={onSubmitConfirm} className="space-y-5">
          <div>
            <label htmlFor="nama" className="block text-sm font-medium text-gray-300 mb-2">
              Nama Lengkap
            </label>
            <input
              ref={firstFieldRef}
              type="text"
              id="nama"
              value={regForm.nama}
              onChange={(e) => onChangeForm({ ...regForm, nama: e.target.value })}
              placeholder="Masukkan nama lengkap"
              className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
              required
            />
          </div>
          <div>
            <label htmlFor="nis" className="block text-sm font-medium text-gray-300 mb-2">
              NIS (5 Digit)
            </label>
            <input
              type="text"
              id="nis"
              value={regForm.nis}
              onChange={(e) =>
                onChangeForm({
                  ...regForm,
                  nis: e.target.value.replace(/[^0-9]/g, "").slice(0, 5),
                })
              }
              placeholder="Contoh: 12345"
              maxLength={5}
              inputMode="numeric"
              className="input-glow w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          {/* Kelas Step Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Kelas</label>

            {/* Step 1: Tingkat */}
            <div>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tingkat</span>
              <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {["X", "XI", "XII"].map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => onChangeTingkat(t)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selTingkat === t
                        ? "bg-sky-600 text-white shadow-md shadow-sky-500/30"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Jurusan */}
            {selTingkat && jurusanOptions.length > 0 && (
              <div className="animate-slideDown">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Jurusan</span>
                <div className="flex flex-wrap gap-1.5">
                  {jurusanOptions.map(({ jurusan }) => (
                    <button
                      type="button"
                      key={jurusan}
                      onClick={() => onChangeJurusan(jurusan)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        selJurusan === jurusan
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                          : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:border-cyan-500/30"
                      }`}
                    >
                      {jurusan}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Nomor Kelas */}
            {selJurusan && nomorOptions.length > 0 && (
              <div className="animate-slideDown">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Nomor Kelas
                </span>
                <div className="flex gap-1.5">
                  {nomorOptions.map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => onChangeNomor(n)}
                      className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        selNomor === n
                          ? "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                          : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:border-purple-500/30"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Result preview */}
            {regForm.kelas && (
              <div className="flex items-center gap-2 pt-1" aria-live="polite">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-emerald-300 font-medium">{regForm.kelas}</span>
              </div>
            )}

            {/* Hidden required input for native form validation */}
            <input type="text" value={regForm.kelas} required className="sr-only" tabIndex={-1} onChange={() => {}} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl gradient-bg-cool text-white font-semibold disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Menyimpan..." : "Daftarkan Akun"}
          </button>
        </form>
      </div>
    </dialog>
  );
}

