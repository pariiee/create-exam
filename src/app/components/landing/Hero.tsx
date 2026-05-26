type Props = {
  totalUsers: number;
  downloadApkUrl: string;
  onOpenRegister: () => void;
  onOpenCheckNis: () => void;
  handleDownloadApk: () => void;
};

export function HeroSection({
  totalUsers,
  downloadApkUrl,
  onOpenRegister,
  onOpenCheckNis,
  handleDownloadApk,
}: Props) {
  return (
    <section className="relative min-h-screen flex items-center pb-32 md:pb-0 overflow-x-hidden" aria-labelledby="hero-title">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] bg-blue-500/8 rounded-full blur-[100px]" />
        <div className="absolute top-20 right-1/3 w-[250px] h-[250px] bg-sky-400/8 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 w-full py-12 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Text Content */}
          <div className="animate-slide-left text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-400/20 bg-sky-500/10 text-sky-300 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              Portal Pendaftaran Aktif
            </div>

            <h1
              id="hero-title"
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.1]"
            >
              <span className="text-white">Daftarkan</span>
              <br />
              <span className="text-white">Akun </span>
              <span className="text-gradient-cool">Ujian</span>
              <br />
              <span className="text-gradient-cool">Kamu</span>
            </h1>

            {/* Mobile-only visual — between title and description */}
            <div className="lg:hidden relative mt-8 mb-2">
              <div className="relative w-full aspect-square max-w-[300px] sm:max-w-[360px] mx-auto" aria-hidden="true">
                <div className="absolute inset-4 rounded-full border border-dashed border-sky-400/20 animate-spin-slow" />
                <div
                  className="absolute inset-12 rounded-full border border-dashed border-cyan-400/15 animate-spin-slow"
                  style={{ animationDirection: "reverse", animationDuration: "30s" }}
                />
                <div className="absolute inset-16 rounded-full gradient-bg-cool opacity-10 animate-pulse-glow" />
                <div className="absolute inset-8 rounded-full bg-gray-950/80 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                  <img src="/pelajar.png" alt="Pelajar" className="w-full h-full object-contain animate-breathe" />
                </div>
                {/* Floating Cards */}
                <div className="absolute -top-2 right-2 animate-float-slow">
                  <div className="glass-card rounded-2xl p-3 shadow-xl shadow-sky-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400">Status</div>
                        <div className="text-xs font-semibold text-emerald-400">Aktif</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-1/4 -left-1 animate-float-reverse">
                  <div className="glass-card rounded-2xl p-3 shadow-xl shadow-cyan-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400">Terdaftar</div>
                        <div className="text-xs font-bold text-gradient-cool">{totalUsers}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-6 right-0 animate-float">
                  <div className="glass-card rounded-2xl p-3 shadow-xl shadow-blue-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400">Proses</div>
                        <div className="text-xs font-semibold text-blue-400">Cepat</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-1/4 -left-1 animate-float-slow" style={{ animationDelay: "2s" }}>
                  <div className="glass-card rounded-2xl p-3 shadow-xl shadow-teal-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400">Data</div>
                        <div className="text-xs font-semibold text-teal-400">Aman</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-10 left-1/3 w-2.5 h-2.5 rounded-full bg-sky-500/40 animate-pulse" />
                <div className="absolute bottom-14 right-1/3 w-2 h-2 rounded-full bg-cyan-500/50 animate-pulse" style={{ animationDelay: "1s" }} />
              </div>
            </div>

            <p className="mt-6 text-base sm:text-lg text-gray-400 max-w-lg leading-relaxed mx-auto lg:mx-0">
              Satu Pintu, Menuju Gerbang Ujian SMK Negeri 1 Dukuhturi. Daftarkan akun ujianmu dengan standar keamanan tinggi
              dan integrasi penuh ke sistem sekolah.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                type="button"
                onClick={onOpenRegister}
                style={{ touchAction: "manipulation" }}
                className="px-8 py-4 text-base font-semibold rounded-2xl gradient-bg-cool text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all duration-300"
              >
                Buat Akun Exam
              </button>
              <button
                type="button"
                onClick={onOpenCheckNis}
                style={{ touchAction: "manipulation" }}
                className="px-8 py-4 text-base font-semibold rounded-2xl border-2 border-white/10 text-gray-300 hover:border-sky-400/50 hover:text-white hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all duration-300"
              >
                Cek Status NIS
              </button>
            </div>

            {/* Download APK */}
            {downloadApkUrl && (
              <div className="mt-5 flex justify-center lg:justify-start">
                <button
                  type="button"
                  onClick={handleDownloadApk}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-emerald-600/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-600/25 hover:text-emerald-200 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download APK
                </button>
              </div>
            )}

            {/* Inline Stats */}
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-8 sm:gap-10">
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-gradient-cool">
                  {totalUsers.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-0.5">User Terdaftar</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white">45+</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-0.5">Kelas Tersedia</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white">3</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-0.5">Tingkat</div>
              </div>
            </div>
          </div>

          {/* Right - Visual / Decorative Illustration (desktop only) */}
          <div className="hidden lg:block relative animate-slide-right" aria-hidden="true">
            <div className="relative w-full aspect-square max-w-[320px] sm:max-w-[400px] lg:max-w-[500px] mx-auto">
              <div className="absolute inset-4 rounded-full border border-dashed border-sky-400/20 animate-spin-slow" />
              <div
                className="absolute inset-12 rounded-full border border-dashed border-cyan-400/15 animate-spin-slow"
                style={{ animationDirection: "reverse", animationDuration: "30s" }}
              />
              <div className="absolute inset-16 rounded-full gradient-bg-cool opacity-10 animate-pulse-glow" />
              <div className="absolute inset-8 rounded-full bg-gray-950/80 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                <img src="/pelajar.png" alt="Pelajar" className="w-full h-full object-contain animate-breathe" />
              </div>

              <div className="absolute -top-2 right-2 sm:right-8 animate-float-slow">
                <div className="glass-card rounded-2xl p-4 shadow-xl shadow-sky-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Status</div>
                      <div className="text-sm font-semibold text-emerald-400">Aktif</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/4 -left-2 sm:-left-6 animate-float-reverse">
                <div className="glass-card rounded-2xl p-4 shadow-xl shadow-cyan-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Terdaftar</div>
                      <div className="text-sm font-bold text-gradient-cool">{totalUsers}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 right-0 sm:-right-2 animate-float">
                <div className="glass-card rounded-2xl p-4 shadow-xl shadow-blue-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Proses</div>
                      <div className="text-sm font-semibold text-blue-400">Cepat</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-1/4 -left-2 sm:-left-10 animate-float-slow" style={{ animationDelay: "2s" }}>
                <div className="glass-card rounded-2xl p-4 shadow-xl shadow-teal-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Data</div>
                      <div className="text-sm font-semibold text-teal-400">Aman</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-10 left-1/3 w-3 h-3 rounded-full bg-sky-500/40 animate-pulse" />
              <div className="absolute bottom-16 right-1/3 w-2 h-2 rounded-full bg-cyan-500/50 animate-pulse" style={{ animationDelay: "1s" }} />
              <div className="absolute top-1/2 right-4 w-2.5 h-2.5 rounded-full bg-blue-400/40 animate-pulse" style={{ animationDelay: "0.5s" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

