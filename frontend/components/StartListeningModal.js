export default function StartListeningModal({ open, onClose, onOpenAuth }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative bg-[#242424] w-[800px] max-w-[92%] rounded-lg flex flex-col sm:flex-row overflow-y-auto max-h-[90vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 left-3 z-10 w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div
          className="sm:flex-1 min-h-[200px] sm:min-h-[450px] relative flex items-center justify-center overflow-hidden"
          style={{
            background:
              "url('https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=1000&auto=format&fit=crop') center/cover",
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
          {/* animated ripple rings, like the music is being touched */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36">
            <div className="absolute inset-0 rounded-full border-2 border-[#ff6b6b]/60" style={{ animation: 'ring 1.6s ease-out infinite' }} />
            <div className="absolute inset-0 rounded-full border-2 border-[#ff6b6b]/40" style={{ animation: 'ring 1.6s ease-out 0.6s infinite' }} />
            <div className="absolute inset-3 rounded-full bg-[#ff6b6b]/90 flex items-center justify-center">
              <svg width="32" height="32" className="sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="black">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="sm:flex-[1.2] p-8 sm:p-[60px_40px] flex flex-col justify-center items-center text-center">
          <h1 className="text-2xl sm:text-[32px] font-bold mb-6 sm:mb-8 leading-tight text-white">
            Start listening with a free Melody account
          </h1>
          <button
            onClick={() => onOpenAuth('signup')}
            className="bg-[#ff6b6b] text-black w-full max-w-[250px] py-[14px] rounded-[500px] border-none font-bold text-base cursor-pointer mb-3 hover:bg-[#ff8a8a] hover:scale-105 transition-transform">
            Sign up free
          </button>
          <p className="text-[#b3b3b3] text-sm">
            Already have an account? <a className="text-white underline font-bold cursor-pointer"
              onClick={() => onOpenAuth('login')}>Log in</a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes ring {
          0% { transform: scale(0.7); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
