export default function SongCard({ item, onClick }) {
  return (
    <div key={item.title} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg cursor-pointer hover:bg-white/20 transition-colors group relative" onClick={onClick}>
      <div className="relative mb-4">
        <img src={item.img} alt={item.title} className="w-full aspect-square object-cover rounded-md shadow-lg" />
        <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex flex-col items-center gap-2">
          <span className="bg-black/80 text-white text-xs px-3 py-1.5 rounded whitespace-nowrap">Play {item.title}</span>
          <div className="w-12 h-12 bg-[#ff6b6b] rounded-full flex items-center justify-center shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <h3 className="text-white font-semibold mb-1">{item.title}</h3>
      <p className="text-white/60 text-sm">{item.sub}</p>
    </div>
  );
}
