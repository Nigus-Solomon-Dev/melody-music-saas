'use client';

export default function MusicLoader({ label = 'Melody' }) {
  const tag = 'Spinning up your music…';

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden">
      {/* ambient red glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,107,107,0.22) 0%, rgba(255,107,107,0.06) 45%, transparent 70%)' }}
      />

      {/* drifting shimmer dots */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#ff6b6b]/50"
            style={{
              left: `${(i * 12) % 100 + 3}%`,
              top: `${(i * 22 + 10) % 90 + 5}%`,
              animation: `shimmerFloat ${4 + (i % 3)}s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* rotating vinyl record */}
        <div className="relative">
          <div className="w-40 h-40 rounded-full record-disc" style={{ animation: 'spinVinyl 4s linear infinite' }}>
            <div className="absolute inset-[6%] rounded-full bg-black/40" style={{ background: 'linear-gradient(45deg, rgba(255,255,255,0.02) 0%, transparent 40%, rgba(255,255,255,0.05) 100%)' }} />
            <div className="absolute inset-[16%] rounded-full border border-white/10" />
            <div className="absolute inset-[26%] rounded-full border border-white/10" />
            <div className="absolute inset-[36%] rounded-full border border-white/10" />
            <div className="absolute inset-[44%] rounded-full bg-[#ff6b6b] flex items-center justify-center shadow-lg shadow-red-500/40">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {/* tonearm hint */}
          <div className="absolute -right-6 -top-2 w-16 h-16 rounded-full border-2 border-white/10 bg-white/[0.03] animate-spin-subtle" />
        </div>

        {/* Melody wordmark */}
        <div className="flex items-center gap-2 mt-4">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#ff6b6b] to-red-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </span>
          <span className="text-white text-3xl sm:text-4xl font-black tracking-tight">{label}</span>
        </div>

        {/* equalizer bars */}
        <div className="flex items-end gap-1.5 h-12">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <span
              key={i}
              className="w-2 sm:w-2.5 rounded-full bg-gradient-to-t from-[#ff6b6b] to-red-400"
              style={{
                height: '12px',
                animation: `eq${i % 3} ${0.7 + (i % 4) * 0.15}s ease-in-out ${i * 0.08}s infinite`,
              }}
            />
          ))}
        </div>

        <p className="text-white/60 text-sm font-medium animate-pulse">{tag}</p>
      </div>

      <style jsx global>{`
        @keyframes spinVinyl {
          to { transform: rotate(360deg); }
        }
        .record-disc {
          background:
            radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.6) 31%, rgba(0,0,0,0.6) 40%, transparent 41%),
            radial-gradient(circle at center, #111 0%, #050505 100%);
          box-shadow: 0 18px 60px -12px rgba(255,107,107,0.35), inset 0 0 0 1px rgba(255,255,255,0.06);
        }
        @keyframes eq0 {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        @keyframes eq1 {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.35); }
        }
        @keyframes eq2 {
          0%, 100% { transform: scaleY(0.6); }
          40% { transform: scaleY(0.3); }
          70% { transform: scaleY(1); }
        }
        @keyframes shimmerFloat {
          0%, 100% { transform: translate(0, 0); opacity: 0.35; }
          50% { transform: translate(18px, -14px); opacity: 1; }
        }
        @keyframes spin-subtle {
          0%, 100% { transform: rotate(-14deg); }
          50% { transform: rotate(14deg); }
        }
        .animate-spin-subtle { animation: spin-subtle 3.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}