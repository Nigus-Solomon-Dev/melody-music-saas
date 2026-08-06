export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-10 py-6 sm:py-8 flex flex-wrap items-center justify-center sm:justify-between gap-x-4 gap-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff6b6b] to-red-700 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
          <span className="text-white font-bold tracking-tight">Melody</span>
        </div>

        <p className="text-white/35 text-sm">© 2026 Melody</p>

        <div className="flex gap-2">
          {['X', 'IG', 'FB'].map((s) => (
            <div
              key={s}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 text-xs font-bold cursor-pointer hover:bg-white/25 hover:text-white transition-colors"
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
