'use client';

export default function MusicCard({ track, onClick }) {
  return (
    <div
      className="group relative bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative mb-4 overflow-hidden rounded-lg">
        {track.albumCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.albumCover}
            alt={track.title}
            className="w-full aspect-square object-cover rounded-lg transform group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full aspect-square rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 text-3xl">
            ♪
          </div>
        )}
        {/* hover play button */}
        <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-11 h-11 bg-[#ff6b6b] rounded-full flex items-center justify-center shadow-2xl translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      </div>

      <h3 className="text-white font-semibold text-sm truncate">{track.title}</h3>
      <p className="text-white/50 text-xs truncate mt-0.5">{track.artist}</p>
    </div>
  );
}