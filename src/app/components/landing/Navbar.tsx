import ThemeToggle from "@/app/components/ThemeToggle";

export function LandingNavbar() {
  return (
    <>
      {/* Desktop navbar */}
      <nav className="hidden md:block fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="nav-surface flex items-center gap-1 px-2 py-2 rounded-full bg-gray-900/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/30">
          <a href="/" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-500/15 text-sky-300 text-sm font-semibold transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
            </svg>
            Beranda
          </a>
          <a
            href="/siswa"
            className="lm-muted px-5 py-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
          >
            Data Siswa
          </a>
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="nav-surface md:hidden sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="ExamCoy" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-lg font-bold tracking-tight">
              Exam<span className="text-gradient-cool">Coy</span>
            </span>
          </a>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <div className="nav-surface flex items-center gap-1 px-3 py-2.5 rounded-[20px] bg-gray-800/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <a
            href="/"
            className="flex flex-col items-center gap-1 px-5 py-2 rounded-2xl bg-sky-500/10 border border-sky-400/20 shadow-[0_0_12px_rgba(56,189,248,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all"
          >
            <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
            </svg>
            <span className="text-[10px] font-semibold text-sky-300">Beranda</span>
          </a>
          <a
            href="/siswa"
            className="flex flex-col items-center gap-1 px-5 py-2 rounded-2xl hover:bg-white/5 transition-all"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] font-medium text-gray-500">Data Siswa</span>
          </a>
        </div>
      </div>
    </>
  );
}

