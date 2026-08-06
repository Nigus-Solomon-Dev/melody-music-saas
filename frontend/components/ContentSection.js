export default function ContentSection({ title, subtitle, bgClass = '', id, children }) {
  return (
    <section id={id} className={`px-4 sm:px-10 py-12 sm:py-14 ${bgClass}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end gap-3 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h2 className="text-white text-xl sm:text-3xl font-black tracking-tight">{title}</h2>
            {subtitle && <p className="text-white/50 text-sm mt-1.5 truncate">{subtitle}</p>}
          </div>
          <button className="text-white/50 text-xs sm:text-sm font-bold hover:text-white hover:underline transition-colors whitespace-nowrap">
            Show all
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {children}
        </div>
      </div>
    </section>
  );
}
