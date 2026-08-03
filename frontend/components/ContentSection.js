export default function ContentSection({ title, subtitle, bgClass = '', id, children }) {
  return (
    <section id={id} className={`px-6 sm:px-10 py-14 ${bgClass}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-white text-2xl sm:text-3xl font-black tracking-tight">{title}</h2>
            {subtitle && <p className="text-white/50 text-sm mt-1.5">{subtitle}</p>}
          </div>
          <button className="text-white/50 text-sm font-bold hover:text-white hover:underline transition-colors">
            Show all
          </button>
        </div>
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
          {children}
        </div>
      </div>
    </section>
  );
}
