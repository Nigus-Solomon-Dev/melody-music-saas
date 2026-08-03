'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { musicApi } from '@/lib/musicApi';
import TrackCard from '@/components/TrackCard';
import CanvasBackground from '@/components/CanvasBackground';
import PlayerBar from '@/components/PlayerBar';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setSearched(false);
      setError(null);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await musicApi.search(query.trim(), 20);
        setResults(data.tracks);
        setSearched(true);
      } catch (err) {
        setError(err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div className="relative min-h-screen flex flex-col bg-black">
      <CanvasBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3 flex-shrink-0 bg-black/50 backdrop-blur-sm text-white border-b border-white/10">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition"
          >
            ← Back to Dashboard
          </button>

          <div className="relative w-full max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#b3b3b3]">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </div>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists..."
              className="w-full bg-[#1f1f1f] border border-transparent hover:border-[#333] focus:border-white focus:outline-none rounded-full py-3 pl-11 pr-10 text-sm text-white placeholder-[#747474] transition"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-6">
          <div className="max-w-3xl mx-auto">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm mb-6">
                {error}
              </div>
            )}

            {loading && (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-[#1f1f1f] rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {!loading && !query.trim() && (
              <p className="text-center text-gray-500 mt-20 text-sm">
                Start typing to search for songs and artists.
              </p>
            )}

            {!loading && searched && results.length === 0 && (
              <p className="text-center text-gray-500 mt-20 text-sm">
                No results found for &ldquo;{query}&rdquo;.
              </p>
            )}

            {!loading && results.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4">
                  Results for &ldquo;{query}&rdquo;
                </h2>
                <div className="bg-[#181818]/60 rounded-xl p-2 border border-white/10">
                  {results.map((track, i) => (
                    <TrackCard key={track.id} track={track} index={i} queue={results} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        <PlayerBar />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen flex flex-col bg-black items-center justify-center">
          <CanvasBackground />
          <div className="w-10 h-10 border-4 border-[#ff6b6b] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
