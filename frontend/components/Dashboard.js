'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, clearToken, getMe } from '../lib/api';
import { musicApi } from '../lib/musicApi';
import CanvasBackground from './CanvasBackground';
import SubscriptionCard from './dashboard/SubscriptionCard';
import BillingPortalButton from './dashboard/BillingPortalButton';
import PlayerBar from './PlayerBar';
import TrackCard from './TrackCard';
import { useSubscription } from '@/context/SubscriptionContext';
import { usePlayer } from '@/context/PlayerContext';
import { can } from '@/lib/features';

export default function Dashboard() {
  const router = useRouter();
  const { hasSubscription, plan } = useSubscription();
  const { currentTrack, usingFull, playTrack, isPlaying } = usePlayer();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [chartTracks, setChartTracks] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [nav, setNav] = useState('home'); // home | search | library
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [curatedArtists, setCuratedArtists] = useState([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const debounceRef = useRef(null);
  const mainScrollRef = useRef(null);

  useEffect(() => {
    const len = curatedArtists.length;
    if (len === 0) return;
    // Sequential cycle: artists pop up in order, one every 6s.
    const id = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % len);
    }, 6000);
    return () => clearInterval(id);
  }, [curatedArtists.length]);

  useEffect(() => {
    musicApi
      .curatedArtists(['Bruno Mars', 'Rihanna', 'Dawit Tsige', 'J. Cole', 'Burna Boy', 'Wizkid', 'The Weeknd'])
      .then((data) => setCuratedArtists(data.artists || []))
      .catch(() => setCuratedArtists([]));
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    if (!q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      setSearched(false);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await musicApi.search(q, 20);
        setSearchResults(data.tracks);
        setSearched(true);
      } catch (err) {
        setSearchError(err.message);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/');
      return;
    }
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        clearToken();
        router.replace('/');
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    musicApi
      .chart(30)
      .then((data) => setChartTracks(data.tracks))
      .catch(() => setChartTracks([]))
      .finally(() => setChartLoading(false));
  }, []);

  function handleLogout() {
    clearToken();
    router.replace('/');
  }

  const firstName = (user?.name || 'You').split(' ')[0];
  const initial = (user?.name || 'K').charAt(0).toUpperCase();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const featuredArtists = curatedArtists;
  const featured = featuredArtists[featuredIndex % featuredArtists.length] || null;

  const favoriteArtists = curatedArtists;

  const NAV_ITEMS = [
    { key: 'home', label: 'Home', icon: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10' },
    { key: 'search', label: 'Search', icon: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' },
    { key: 'library', label: 'Your Library', icon: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z' },
  ];

  if (loading) {
    return (
      <div className="relative min-h-screen flex flex-col">
        <CanvasBackground />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#ff6b6b] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white/70 font-medium text-sm">Checking your session…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col select-none overflow-hidden font-sans">
      <CanvasBackground scrollRef={mainScrollRef} dim />

      <style jsx global>{`
        @import url('https://fonts.cdnfonts.com/css/circular-std-book');
        body { font-family: 'Circular Std', -apple-system, BlinkMacSystemFont, sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
        .search-pill:focus-within {
          border-radius: 9999px;
          box-shadow: 0 0 0 4px rgba(255,107,107,0.12), 0 8px 24px -8px rgba(255,107,107,0.3);
        }
        .track-card { transition: transform .25s ease, box-shadow .25s ease, background-color .25s ease; }
        .track-card:hover { transform: translateY(-4px); box-shadow: 0 18px 36px -12px rgba(0,0,0,.6); }
        @keyframes ocean-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-5px) rotate(-1deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(4px) rotate(1deg); }
        }
        .float-ocean {
          animation: ocean-float 3.2s ease-in-out infinite;
          box-shadow: 0 10px 30px -8px rgba(255,107,107,.45), inset 0 -6px 16px -6px rgba(255,255,255,.18), inset 0 4px 12px -4px rgba(255,255,255,.25);
        }
        .float-ocean:hover { animation-duration: 1.1s; box-shadow: 0 14px 36px -8px rgba(255,107,107,.6), inset 0 -6px 16px -6px rgba(255,255,255,.18), inset 0 4px 12px -4px rgba(255,255,255,.25); }
      `}</style>

      {/* HEADER */}
      <header className="h-16 px-3 sm:px-6 flex items-center justify-between gap-2 flex-shrink-0 bg-black/50 backdrop-blur-sm text-white z-10 relative">
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle navigation"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition border ${
              sidebarOpen
                ? 'bg-[#ff6b6b]/20 border-[#ff6b6b]/40 text-[#ff6b6b]'
                : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
            }`}
          >
            {sidebarOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff6b6b] to-red-700 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 min-w-0 max-w-[500px] flex items-center justify-center gap-2 sm:gap-3">
          <div className="relative w-full group search-pill">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#b3b3b3] group-focus-within:text-[#ff6b6b]">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full bg-white/[0.06] border border-white/10 hover:border-white/25 focus:border-[#ff6b6b]/50 focus:outline-none rounded-full py-3 pl-11 pr-10 text-sm text-white placeholder-[#747474] transition"
              placeholder={searchQuery ? 'What do you want to play?' : 'Search songs, artists, albums'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) setNav('search');
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setNav('home'); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#b3b3b3] hover:text-white cursor-pointer"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M4 6h16v2H4zm2 5h12v2H6zm3 5h6v2H9z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-4 flex-shrink-0">
          <button
            onClick={() => router.push(hasSubscription ? '/dashboard/settings' : '/pricing')}
            className="hidden md:block bg-gradient-to-r from-[#ff6b6b] to-red-600 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-md shadow-[#ff6b6b]/25 hover:scale-105 hover:shadow-[#ff6b6b]/40 transition-all"
          >
            Explore Premium
          </button>
          <button
            title={user?.name || 'Account'}
            onClick={() => router.push('/dashboard/settings')}
            className="w-9 h-9 bg-gradient-to-br from-[#ff6b6b] to-red-700 border-2 border-white/10 hover:border-white rounded-full flex items-center justify-center font-bold text-sm text-white cursor-pointer transition"
          >
            {initial}
          </button>
          <button
            onClick={handleLogout}
            title="Log out"
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-bold px-3 py-2 rounded-full border border-white/15 hover:border-[#ff6b6b]/50 hover:bg-[#ff6b6b]/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex gap-2 px-2 pb-2 overflow-hidden z-10 relative transition-all duration-300">
        {/* LEFT NAV (sliding drawer) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={`fixed top-16 bottom-16 left-0 z-40 bg-[#121212]/95 backdrop-blur-md border-r border-white/10 flex flex-col w-60 p-4 gap-1 transition-transform duration-300 ease-out ${
            sidebarOpen ? 'translate-x-0 shadow-2xl shadow-black/60' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">Browse</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setNav(item.key);
                  if (item.key === 'search') setSearchQuery('');
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition ${
                  nav === item.key ? 'text-white bg-white/10' : 'text-[#b3b3b3] hover:text-white hover:bg-white/5'
                }`}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="my-3 border-t border-white/10" />

          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Recently Played</p>
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
            {chartLoading
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-md animate-pulse">
                    <div className="w-10 h-10 rounded bg-white/10" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-white/10 rounded w-3/4" />
                      <div className="h-2.5 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                ))
              : chartTracks.slice(0, 4).map((track, idx) => (
                  <div
                    key={track.id || idx}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 cursor-pointer transition group"
                    onClick={() => { playTrack(track, chartTracks); setSidebarOpen(false); }}
                  >
                    {track.albumCover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={track.albumCover} alt="cover" className="w-10 h-10 rounded object-cover shadow" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center text-gray-500">?</div>
                    )}
                    <div className="flex flex-col truncate">
                      <span className="text-white text-sm font-medium truncate group-hover:text-[#ff6b6b] transition">{track.title}</span>
                      <span className="text-xs text-[#b3b3b3] truncate">{track.artist}</span>
                    </div>
                  </div>
                ))}
          </div>
        </aside>

        {/* MIDDLE MAIN CONTAINER */}
        <section
          ref={mainScrollRef}
          className="flex-1 min-w-0 bg-gradient-to-b from-[#1f1f1f]/60 via-[#121212]/60 to-[#121212]/60 backdrop-blur-sm rounded-lg overflow-y-auto custom-scrollbar border border-white/10 p-4 sm:p-6"
        >
          {searchQuery.trim() ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Results for &ldquo;{searchQuery.trim()}&rdquo;
                </h2>
                <button
                  onClick={() => { setSearchQuery(''); setNav('home'); }}
                  className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition"
                >
                  Clear
                </button>
              </div>

              {searchError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm mb-6">
                  {searchError}
                </div>
              )}

              {searchLoading && (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              )}

              {!searchLoading && searched && searchResults.length === 0 && (
                <p className="text-center text-gray-500 mt-16 text-sm">
                  No results found for &ldquo;{searchQuery.trim()}&rdquo;.
                </p>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="bg-white/[0.03] rounded-xl p-2 border border-white/10">
                  {searchResults.map((track, i) => (
                    <TrackCard key={track.id} track={track} index={i} queue={searchResults} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Greeting + Upgrade row */}
              <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {greeting}, <span className="bg-gradient-to-r from-[#ff6b6b] to-red-400 bg-clip-text text-transparent">{firstName}</span>
                  </h1>
                  <p className="text-white/50 text-sm mt-1">Here is what is trending on Melody today.</p>
                </div>

                {!can(plan, 'fullPlayback') && (
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <div
                      onClick={() => router.push('/dashboard/settings')}
                      className="float-ocean flex-shrink-0 rounded-full border border-white/20 bg-gradient-to-r from-[#ff6b6b] to-red-600 px-6 py-3 text-white text-sm font-bold cursor-pointer select-none"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l1.6 4.8L18 10l-4.4 1.2L12 16l-1.6-4.8L6 10l4.4-1.2z"/><path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9z" opacity=".7"/></svg>
                        Upgrade to Pro
                      </span>
                    </div>
                    <p className="text-white/50 text-xs max-w-[200px] text-right leading-snug">
                      Unlock <span className="text-white font-medium">full song playback</span> &mdash; you&apos;re only hearing 30s previews.
                    </p>
                  </div>
                )}

                {can(plan, 'fullPlayback') && !can(plan, 'lyrics') && (
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <div
                      onClick={() => router.push('/dashboard/settings')}
                      className="float-ocean flex-shrink-0 rounded-full border border-white/20 bg-gradient-to-r from-[#ff6b6b] to-red-600 px-6 py-3 text-white text-sm font-bold cursor-pointer select-none"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l1.6 4.8L18 10l-4.4 1.2L12 16l-1.6-4.8L6 10l4.4-1.2z"/><path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9z" opacity=".7"/></svg>
                        Upgrade to Enterprise
                      </span>
                    </div>
                    <p className="text-white/50 text-xs max-w-[200px] text-right leading-snug">
                      Keep <span className="text-white font-medium">full playback</span> &mdash; add <span className="text-white font-medium">song lyrics</span> with Enterprise.
                    </p>
                  </div>
                )}
              </div>

              {/* Featured artists — rotating circle carousel */}
              {featured && (
                <div className="relative mb-10 flex flex-col items-center overflow-hidden">
                  {/* soft ambient glow behind the circle */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[560px] h-[420px] sm:h-[560px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(255,107,107,0.18) 0%, rgba(255,107,107,0.05) 45%, transparent 70%)' }}
                  />
                  <div className="relative w-full h-[280px] sm:h-[340px]">
                    {featuredArtists.map((artist, i) => {
                      const len = featuredArtists.length;
                      let off = ((i - featuredIndex) % len + len) % len;
                      if (off > len / 2) off -= len;
                      const abs = Math.abs(off);
                      const spacing = 196;
                      const size = 264;
                      const scale = Math.max(0.28, 1 - abs * 0.15);
                      const arc = Math.abs(off) * 8; // raise side cards up in an arc
                      const glow = off === 0;
                      const isPrevOrNext = abs === 1;
                      return (
                        <button
                          key={artist.artistId || i}
                          type="button"
                          onClick={() => router.push(`/artist/${artist.artistId}`)}
                          className={`absolute left-1/2 top-1/2 rounded-full will-change-transform focus:outline-none select-none ${
                            glow ? 'ring-4 ring-[#ff6b6b]/70 shadow-2xl shadow-[#ff6b6b]/60 cursor-pointer z-30' : 'ring-2 ring-[#ff6b6b]/20 cursor-pointer'
                          }`}
                          style={{
                            width: size,
                            height: size,
                            transform: `translate(-50%,-50%) translateX(${off * spacing}px) translateY(${off < 0 ? -arc : arc}px) scale(${scale})`,
                            opacity: glow ? 1 : isPrevOrNext ? 0.8 : 0.42,
                            filter: glow ? 'none' : 'blur(0.5px) saturate(0.65) brightness(0.7)',
                            zIndex: glow ? 30 : 20 - abs,
                            transition: 'transform 3s cubic-bezier(.32,.7,.2,1), opacity 1.2s ease, filter 1.2s ease',
                          }}
                        >
                          {/* image inside its own overflow-hidden circle so the ring is NOT clipped */}
                          <span className="block w-full h-full rounded-full overflow-hidden">
                            {artist.artistPicture ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={artist.artistPicture} alt={artist.artist} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <span className="flex w-full h-full items-center justify-center bg-gray-800 text-gray-500 text-5xl font-black">
                                {(artist.artist || 'A').charAt(0)}
                              </span>
                            )}
                            {glow && (
                              <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            )}
                          </span>
                          {glow && (
                            <>
                              {/* pulsing halo ring */}
                              <span className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: '0 0 0 0 rgba(255,107,107,0.45)', animation: 'haloPulse 3s ease-in-out infinite' }} />
                              {/* circular play button */}
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); router.push(`/artist/${artist.artistId}`); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); router.push(`/artist/${artist.artistId}`); } }}
                                className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-[#ff6b6b] to-red-600 shadow-lg shadow-red-500/50 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform z-10"
                              >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-white translate-x-0.5"><path d="M8 5v14l11-7z" /></svg>
                              </span>
                              {/* spinning progress ring — OUTSIDE the clipped circle */}
                              <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(255,107,107,0.35)" strokeWidth="2" />
                                <circle
                                  cx="50" cy="50" r="49" fill="none" stroke="#ff6b6b" strokeWidth="3" strokeLinecap="round"
                                  strokeDasharray="307.9" strokeDashoffset="307.9"
                                  style={{ animation: 'progressRing 6s linear infinite', filter: 'drop-shadow(0 0 6px rgba(255,107,107,0.8))' }}
                                  transform="rotate(-90 50 50)"
                                />
                              </svg>
                            </>
                          )}
                        </button>
                      );
                    })}
                    {/* reflective floor */}
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-10 rounded-full pointer-events-none"
                      style={{ background: 'radial-gradient(ellipse at center, rgba(255,107,107,0.25) 0%, transparent 70%)', filter: 'blur(6px)' }}
                    />
                  </div>

                  <div className="relative z-40 text-center mt-4">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff6b6b]/25 text-[#ffb3b3] text-[11px] font-bold uppercase tracking-widest mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b6b] animate-pulse" />
                      Featured Artists
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">{featured.artist}</h2>
                    <p className="text-white/80 text-sm mt-1">Trending music from top artists</p>
                  </div>
                </div>
              )}

              {/* Made For You — Daily Mix */}
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Made For {firstName}</h2>
                <span className="text-[#b3b3b3] text-xs font-bold hover:underline cursor-pointer">Show all</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5 mb-12">
                {chartLoading
                  ? [1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-white/[0.04] rounded-lg animate-pulse p-5">
                        <div className="w-full aspect-square rounded bg-white/10 mb-3" />
                        <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
                        <div className="h-2.5 bg-white/10 rounded w-1/2" />
                      </div>
                    ))
                  : chartTracks.slice(20, 26).map((track, idx) => {
                      const isCurrent = currentTrack?.id === track.id;
                      const mixNum = idx + 1;
                      return (
                        <div
                          key={track.id || idx}
                          onClick={() => playTrack(track, chartTracks.slice(20, 26))}
                          className="track-card bg-gradient-to-br from-white/[0.07] to-white/[0.02] group/cover backdrop-blur-sm hover:from-[#ff6b6b]/10 hover:to-white/[0.02] p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-[#ff6b6b]/40 transition duration-300 group relative cursor-pointer overflow-hidden"
                        >
                          <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#ff6b6b]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative mb-3 group-hover:scale-[1.03] transition-transform duration-300">
                            {track.albumCover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={track.albumCover} className="w-full aspect-square object-cover rounded-xl shadow-lg ring-1 ring-white/10" alt={track.title} />
                            ) : (
                              <div className="w-full aspect-square rounded-xl bg-gray-800 flex items-center justify-center text-gray-500 text-3xl">?</div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playTrack(track, chartTracks.slice(20, 26));
                              }}
                              className={`absolute bottom-2 right-2 w-11 h-11 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-[-4px] transition-all duration-300 shadow-2xl hover:scale-110 ${
                                isCurrent && isPlaying ? 'bg-white text-black' : 'bg-gradient-to-br from-[#ff6b6b] to-red-600 text-white'
                              }`}
                            >
                              {isCurrent && isPlaying ? (
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                              ) : (
                                <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              )}
                            </button>
                          </div>
                          <h3 className="font-bold text-base text-white mb-1 truncate">Daily Mix {mixNum}</h3>
                          <p className="text-[#b3b3b3] text-sm truncate">{track.artist}</p>
                        </div>
                      );
                    })}
              </div>

              {/* Recommended For You */}
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Recommended For You</h2>
                <span className="text-[#b3b3b3] text-xs font-bold hover:underline cursor-pointer">Show all</span>
              </div>
              <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-3 mb-12">
                {chartLoading
                  ? [1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-48 flex-shrink-0 bg-white/[0.04] rounded-lg animate-pulse p-5">
                        <div className="w-full aspect-square rounded bg-white/10 mb-3" />
                        <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
                        <div className="h-2.5 bg-white/10 rounded w-1/2" />
                      </div>
                    ))
                  : chartTracks.slice(8, 12).map((track, idx) => {
                      const isCurrent = currentTrack?.id === track.id;
                      return (
                        <div
                          key={track.id || idx}
                          onClick={() => playTrack(track, chartTracks.slice(8, 12))}
                          className="w-48 flex-shrink-0 track-card bg-gradient-to-br from-white/[0.07] to-white/[0.02] hover:from-[#ff6b6b]/10 hover:to-white/[0.02] p-4 sm:px-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-[#ff6b6b]/40 transition duration-300 group relative cursor-pointer overflow-hidden"
                        >
                          <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#ff6b6b]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative mb-3 group-hover:scale-[1.03] transition-transform duration-300">
                            {track.albumCover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={track.albumCover} className="w-full aspect-square object-cover rounded-xl shadow-lg ring-1 ring-white/10" alt={track.title} />
                            ) : (
                              <div className="w-full aspect-square rounded-xl bg-gray-800 flex items-center justify-center text-gray-500 text-3xl">?</div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playTrack(track, chartTracks.slice(8, 12));
                              }}
                              className={`absolute bottom-2 right-2 w-11 h-11 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-[-4px] transition-all duration-300 shadow-2xl hover:scale-110 ${
                                isCurrent && isPlaying ? 'bg-white text-black' : 'bg-gradient-to-br from-[#ff6b6b] to-red-600 text-white'
                              }`}
                            >
                              {isCurrent && isPlaying ? (
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                              ) : (
                                <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              )}
                            </button>
                          </div>
                          <h3 className="font-bold text-base text-white mb-1 truncate">{track.title}</h3>
                          <p className="text-[#b3b3b3] text-sm truncate">{track.artist}</p>
                        </div>
                      );
                    })}
              </div>

              {/* Your Favorite Artists */}
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Your Favorite Artists</h2>
                <span className="text-[#b3b3b3] text-xs font-bold hover:underline cursor-pointer">Show all</span>
              </div>
              <div className="flex gap-8 overflow-x-auto custom-scrollbar pb-3 mb-12">
                {chartLoading
                  ? [1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex flex-col items-center gap-2 w-28 flex-shrink-0 animate-pulse">
                        <div className="w-28 h-28 rounded-full bg-white/10" />
                        <div className="h-2.5 bg-white/10 rounded w-3/4" />
                      </div>
                    ))
                  : favoriteArtists.map((t) => (
                      <div
                        key={t.artistId}
                        onClick={() => router.push(`/artist/${t.artistId}`)}
                        className="flex flex-col items-center gap-2 w-28 flex-shrink-0 group cursor-pointer"
                      >
                        <div className="relative">
                          {t.artistPicture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={t.artistPicture}
                              alt={t.artist}
                              className="w-28 h-28 rounded-full object-cover shadow-lg group-hover:scale-105 transition"
                            />
                          ) : (
                            <div className="w-28 h-28 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 text-3xl">
                              {(t.artist || 'A').charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="text-base font-medium text-white text-center truncate w-full group-hover:underline">
                          {t.artist}
                        </span>
                      </div>
                    ))}
              </div>

              {/* Top Charts */}
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Top Charts Right Now</h2>
                <span className="text-[#b3b3b3] text-xs font-bold hover:underline cursor-pointer">Show all</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5 mb-4">
                {chartLoading
                  ? [1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="bg-white/[0.04] rounded-lg animate-pulse p-5">
                        <div className="w-full aspect-square rounded bg-white/10 mb-4" />
                        <div className="h-4 bg-white/10 rounded mb-2" />
                        <div className="h-3 bg-white/10 rounded w-2/3" />
                      </div>
                    ))
                  : chartTracks.slice(0, 8).map((track, idx) => {
                      const isCurrent = currentTrack?.id === track.id;
                      return (
                        <div
                          key={track.id || idx}
                          onClick={() => playTrack(track, chartTracks.slice(0, 8))}
                          className="track-card bg-gradient-to-br from-white/[0.07] to-white/[0.02] hover:from-[#ff6b6b]/10 hover:to-white/[0.02] p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-[#ff6b6b]/40 transition duration-300 group relative cursor-pointer overflow-hidden"
                        >
                          <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#ff6b6b]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative mb-3 group-hover:scale-[1.03] transition-transform duration-300">
                            {track.albumCover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={track.albumCover} className="w-full aspect-square object-cover rounded-xl shadow-lg ring-1 ring-white/10" alt={track.title} />
                            ) : (
                              <div className="w-full aspect-square rounded-xl bg-gray-800 flex items-center justify-center text-gray-500 text-3xl">?</div>
                            )}
                            <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-black flex items-center justify-center ring-1 ring-white/20">#{idx + 1}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playTrack(track, chartTracks.slice(0, 8));
                              }}
                              className={`absolute bottom-2 right-2 w-11 h-11 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-[-4px] transition-all duration-300 shadow-2xl hover:scale-110 ${
                                isCurrent && isPlaying ? 'bg-white text-black' : 'bg-gradient-to-br from-[#ff6b6b] to-red-600 text-white'
                              }`}
                            >
                              {isCurrent && isPlaying ? (
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                              ) : (
                                <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              )}
                            </button>
                          </div>
                          <h3 className="font-bold text-base text-white mb-1 truncate">{track.title}</h3>
                          <p className="text-[#b3b3b3] text-sm truncate">{track.artist}</p>
                        </div>
                      );
                    })}
              </div>
            </>
          )}
        </section>

        {/* RIGHT SIDEBAR (Now Playing + Subscription) */}
        <aside className="w-80 bg-[#121212]/80 backdrop-blur-sm rounded-lg p-4 overflow-y-auto custom-scrollbar hidden xl:flex flex-col gap-4 flex-shrink-0 border border-white/10">
          {/* Now Playing */}
          <div className="flex items-center justify-between text-white font-bold text-sm flex-shrink-0">
            <span className="truncate pr-2">Now Playing</span>
            {currentTrack && (
              <span
                className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  usingFull ? 'bg-[#ff6b6b]/20 text-[#ff6b6b]' : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {usingFull ? 'FULL' : '30s PREVIEW'}
              </span>
            )}
          </div>

          {currentTrack ? (
            <div className="overflow-hidden rounded-xl shadow-2xl flex-shrink-0">
              {currentTrack.albumCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentTrack.albumCover} className="w-full aspect-square object-cover" alt="Album Cover" />
              ) : (
                <div className="w-full aspect-square bg-gray-800 flex items-center justify-center text-gray-500 text-6xl">?</div>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl shadow-2xl flex items-center justify-center aspect-square bg-white/[0.03] border border-white/10 flex-shrink-0">
              <p className="text-gray-500 text-sm">Pick a song to start listening</p>
            </div>
          )}

          <div className="flex justify-between items-start pt-1 flex-shrink-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-white truncate">{currentTrack?.title || '?'}</h2>
              <p className="text-sm text-[#b3b3b3] mt-0.5 truncate">{currentTrack?.artist || 'No song playing'}</p>
            </div>
          </div>

          {currentTrack?.album && (
            <p className="text-xs text-gray-500 truncate -mt-2 flex-shrink-0">{currentTrack.album}</p>
          )}

          <div className="border-t border-white/10 my-2" />

          {/* Subscription */}
          <section className="flex flex-col gap-3 flex-shrink-0">
            <SubscriptionCard />
            <div className="flex justify-end">
              <BillingPortalButton />
            </div>
          </section>
        </aside>
      </main>

      {/* BOTTOM PLAYER BAR */}
      <PlayerBar />
    </div>
  );
}
