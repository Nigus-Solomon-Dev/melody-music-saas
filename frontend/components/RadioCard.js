export default function RadioCard({ item, onClick }) {
  return (
    <div key={item.title} className="relative group" onClick={onClick}>
      <div className="rounded-lg p-4 flex flex-col overflow-hidden cursor-pointer relative" style={{ background: item.bg, color: item.color, aspectRatio: '1/1.2' }}>
        <div className="flex justify-between text-[10px] font-bold mb-2 opacity-80"><span>Melody</span><span>RADIO</span></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden">
            <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="text-2xl font-black mt-auto">{item.title}</div>
        <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex flex-col items-center gap-2">
          <span className="bg-black/80 text-white text-xs px-3 py-1.5 rounded whitespace-nowrap">Play {item.title} Radio</span>
          <div className="w-12 h-12 bg-[#ff6b6b] rounded-full flex items-center justify-center shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <p className="text-white/50 text-xs mt-2">{item.desc}</p>
    </div>
  );
}
