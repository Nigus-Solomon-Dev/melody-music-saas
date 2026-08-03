'use client';

export default function HeroSection({ tracks = [], onStart }) {
  const covers = tracks.map((t) => t.albumCover).filter(Boolean);
  const [cover0, cover1, cover2] = covers;

  function handleTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(900px) rotateY(${px * 18}deg) rotateX(${py * -14}deg) translateY(-6px)`;
  }

  function handleTiltLeave(e) {
    e.currentTarget.style.transform = '';
  }

  const TILT_CLASS = 'tilt-card w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10';

  return (
    <section className="relative overflow-hidden">
      {/* soft ambient glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#ff6b6b]/20 blur-[120px]" />
      <div className="absolute top-1/2 right-0 -translate-y-1/3 w-80 h-80 rounded-full bg-red-500/10 blur-[120px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-20 lg:py-28 grid lg:grid-cols-2 gap-14 items-center">
        {/* Left: copy */}
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff6b6b]/10 border border-[#ff6b6b]/25 text-[#ff9b9b] text-xs font-semibold uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b6b] animate-pulse" />
            Music, without the limits
          </span>

          <h1 className="text-white text-5xl sm:text-6xl font-black leading-[1.04] tracking-tight">
            Your music.
            <br />
            <span className="bg-gradient-to-r from-[#ff6b6b] to-red-400 bg-clip-text text-transparent">
              Your way.
            </span>
          </h1>

          <p className="text-white/60 text-lg mt-6 max-w-md mx-auto lg:mx-0 leading-relaxed">
            Preview any song free. Upgrade when you want the full experience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-10">
            <button
              onClick={onStart}
              className="w-full sm:w-auto px-9 py-3.5 rounded-full bg-[#ff6b6b] text-black font-bold text-sm hover:bg-[#ff8a8a] hover:scale-105 transition-transform shadow-lg shadow-[#ff6b6b]/20"
            >
              Start Listening Free
            </button>
            <button
              onClick={onStart}
              className="w-full sm:w-auto px-9 py-3.5 rounded-full border border-white/20 text-white font-bold text-sm hover:bg-white/10 hover:scale-105 transition-all"
            >
              See Plans
            </button>
          </div>

          <p className="text-white/35 text-sm mt-8">
            No credit card required · Cancel anytime
          </p>
        </div>

        {/* Right: floating album art */}
        <div className="relative h-[380px] hidden lg:block" onMouseLeave={handleTiltLeave}>
          {/* glow behind the stack */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-80 h-80 rounded-full bg-gradient-to-br from-[#ff6b6b]/25 to-red-500/5 blur-3xl" />
          </div>

          {/* mid / hero card */}
          <div className="float-slow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52" style={{ animationDelay: '0s' }}>
            <div className={TILT_CLASS} onMouseMove={handleTilt}>
              {cover0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover0} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#ff6b6b]/40 to-red-900/40" />
              )}
            </div>
          </div>

          {/* top-right card */}
          <div className="float-slow absolute right-0 top-6 rotate-6 w-40 h-40" style={{ animationDelay: '0.7s' }}>
            <div className={TILT_CLASS} onMouseMove={handleTilt}>
              {cover1 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover1} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500/40 to-[#ff6b6b]/30" />
              )}
            </div>
          </div>

          {/* bottom-left card */}
          <div className="float-slow absolute left-0 bottom-4 -rotate-6 w-40 h-40" style={{ animationDelay: '1.4s' }}>
            <div className={TILT_CLASS} onMouseMove={handleTilt}>
              {cover2 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover2} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#ff6b6b]/40 to-red-900/30" />
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes floatY {
          from { transform: translateY(0); }
          to { transform: translateY(-18px); }
        }
        .float-slow {
          animation: floatY 4.5s ease-in-out infinite alternate;
        }
        .tilt-card {
          transition: transform 0.15s ease-out;
          transform-style: preserve-3d;
          will-change: transform;
        }
        .tilt-card:hover {
          box-shadow: 0 24px 48px -12px rgba(255, 107, 107, 0.45);
        }
      `}</style>
    </section>
  );
}
