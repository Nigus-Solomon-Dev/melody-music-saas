'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { musicApi } from '@/lib/musicApi';
import { usePlayer } from '@/context/PlayerContext';
import TrackCard from '@/components/TrackCard';
import CanvasBackground from '@/components/CanvasBackground';
import PlayerBar from '@/components/PlayerBar';

export default function ArtistPage() {
  const router = useRouter();
  const params = useParams();
  const artistId = params.id;
  const { playTrack } = usePlayer();
  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    musicApi
      .artist(artistId)
      .then((data) => {
        if (cancelled) return;
        setArtist(data.artist);
        setTopTracks(data.topTracks);
        setAlbums(data.albums);
        setRelated(data.related);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [artistId]);

  const formatFans = (n) => {
    if (!n) return '';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black flex flex-col">
        <CanvasBackground />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="w-10 h-10 border-4 border-[#ff6b6b] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="relative min-h-screen bg-black flex flex-col">
        <CanvasBackground />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 text-center px-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-4">Artist not found</h1>
            <button
              onClick={() => router.push('/search')}
              className="inline-block bg-gradient-to-r from-[#ff6b6b] to-red-600 text-white px-6 py-3 rounded-full font-bold shadow-md shadow-[#ff6b6b]/25 hover:scale-105 hover:shadow-[#ff6b6b]/40 transition"
            >
              Back to Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col bg-black overflow-hidden">
      <CanvasBackground darker />

      <div className="relative z-10 flex flex-col h-full">
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 bg-black/50 backdrop-blur-sm text-white border-b border-white/10">
          <button
            onClick={() => router.back()}
            className="text-xs font-bold text-white bg-gradient-to-r from-[#ff6b6b] to-red-600 px-4 py-2 rounded-full shadow-md shadow-[#ff6b6b]/25 hover:scale-105 hover:shadow-[#ff6b6b]/40 transition"
          >
            ← Back
          </button>
          <span className="text-sm font-bold text-white/80 px-3 py-1 rounded-full bg-white/10 border border-white/10">Artist</span>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 mb-10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b6b]/25 via-transparent to-transparent" />
              {artist.picture && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={artist.picture} alt={artist.name} className="absolute inset-0 w-full h-full object-cover opacity-40" aria-hidden />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent" />

              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 p-8 sm:p-10">
                <div className="w-40 h-40 rounded-full overflow-hidden flex-shrink-0 shadow-2xl ring-2 ring-white/10">
                  {artist.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artist.picture} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-4xl">♪</div>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#ff6b6b]/20 text-[#ffb3b3] text-[11px] font-bold uppercase tracking-widest mb-3">
                    Artist
                  </span>
                  <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">{artist.name}</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 text-white/80 text-sm">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-[#ff6b6b]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21s-6.9-4.2-9.4-8.1C.5 9.9 1.6 6 4.9 5.2 7.1 4.7 8.8 5.6 10 7.1l2 2.4 2-2.4c1.2-1.5 2.9-2.4 5.1-1.9 3.3.8 4.4 4.7 2.3 7.7C18.9 16.8 12 21 12 21z"/></svg>
                      {formatFans(artist.nbFans)} monthly listeners
                    </span>
                    <span className="text-white/30">•</span>
                    <span>{artist.nbAlbums} albums</span>
                  </div>
                  <button
                    onClick={() => topTracks[0] && playTrack(topTracks[0], topTracks)}
                    className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-[#ff6b6b] to-red-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md shadow-[#ff6b6b]/25 hover:scale-105 hover:shadow-[#ff6b6b]/40 transition"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    Play
                  </button>
                </div>
              </div>
            </div>

            {/* Top tracks */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4">Popular</h2>
              <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.015] rounded-2xl p-2 ring-1 ring-white/10">
                {topTracks.map((track, i) => (
                  <TrackCard key={track.id} track={track} index={i} showRank queue={topTracks} />
                ))}
              </div>
            </section>

            {/* Albums */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => router.push(`/album/${album.id}`)}
                    className="track-card bg-gradient-to-br from-white/[0.07] to-white/[0.02] hover:from-[#ff6b6b]/10 hover:to-white/[0.02] p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-[#ff6b6b]/40 transition duration-300 cursor-pointer overflow-hidden group relative"
                  >
                    <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#ff6b6b]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative mb-3 group-hover:scale-[1.03] transition-transform duration-300">
                      {album.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={album.cover} alt={album.title} className="w-full aspect-square object-cover rounded-xl shadow-lg ring-1 ring-white/10" />
                      ) : (
                        <div className="w-full aspect-square bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 text-2xl">♪</div>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-white truncate">{album.title}</h3>
                    <p className="text-[#b3b3b3] text-xs mt-1">
                      {album.releaseDate?.slice(0, 4)} • {album.nbTracks} tracks
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Related artists */}
            {related.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4">Related Artists</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  {related.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => router.push(`/artist/${r.id}`)}
                      className="track-card bg-gradient-to-br from-white/[0.07] to-white/[0.02] hover:from-[#ff6b6b]/10 hover:to-white/[0.02] p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-[#ff6b6b]/40 transition duration-300 cursor-pointer text-center overflow-hidden group relative"
                    >
                      <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#ff6b6b]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 ring-2 ring-white/10 group-hover:ring-[#ff6b6b]/40 group-hover:scale-[1.05] transition duration-300">
                        {r.picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.picture} alt={r.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">♪</div>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-white truncate">{r.name}</h3>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>

        <PlayerBar />
      </div>
    </div>
  );
}
