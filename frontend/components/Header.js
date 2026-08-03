'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header({ user, onOpenAuth, onLogout, onSearchSubmit }) {
  const [query, setQuery] = useState('');

  function handleSubmit() {
    if (onSearchSubmit) onSearchSubmit(query);
  }

  return (
    <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b6b] to-red-700 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
        </div>
        <span className="text-white font-bold text-xl tracking-tight">Melody</span>
      </div>

      <div className="flex-1 flex justify-center px-8">
        <div className="search-pill group flex items-center gap-1 bg-white/[0.06] border border-white/10 hover:border-white/25 rounded-full h-11 w-full max-w-md pl-4 pr-1.5 transition-colors">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Search songs, artists, albums"
            className="flex-1 min-w-0 bg-transparent border-none text-white placeholder-white/40 text-sm outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/10 text-white/50 text-[10px] font-bold mr-1">
            ?
          </kbd>
          <button
            onClick={handleSubmit}
            aria-label="Search"
            className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b6b] to-red-600 flex items-center justify-center text-white shadow-md shadow-[#ff6b6b]/25 transition-transform hover:scale-110"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {user ? (
          <>
            <span className="text-white/70 font-bold text-sm">{user.name}</span>
            <Link href="/dashboard" className="bg-gradient-to-r from-[#ff6b6b] to-red-600 text-white font-bold px-6 py-2.5 rounded-full text-sm shadow-md shadow-[#ff6b6b]/25 hover:scale-105 hover:shadow-lg hover:shadow-[#ff6b6b]/40 transition-all inline-block">
              Dashboard
            </Link>
            <button className="bg-white/10 border border-white/15 text-white font-bold px-5 py-2.5 rounded-full text-sm hover:bg-white/20 hover:scale-105 transition-all"
              onClick={onLogout}>Log out</button>
          </>
        ) : (
          <>
            <button className="bg-white/10 border border-white/15 text-white font-bold px-5 py-2.5 rounded-full text-sm hover:bg-white/20 hover:scale-105 transition-all"
              onClick={() => onOpenAuth('signup')}>Sign up</button>
            <button className="bg-gradient-to-r from-[#ff6b6b] to-red-600 text-white font-bold px-6 py-2.5 rounded-full text-sm shadow-md shadow-[#ff6b6b]/25 hover:scale-105 hover:shadow-lg hover:shadow-[#ff6b6b]/40 transition-all"
              onClick={() => onOpenAuth('login')}>Log in</button>
          </>
        )}
      </div>

      <style jsx>{`
        .search-pill:focus-within {
          border-color: rgba(255, 107, 107, 0.6);
          box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12), 0 8px 24px -8px rgba(255, 107, 107, 0.3);
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </header>
  );
}
