'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { musicApi } from '@/lib/musicApi';
import { usePlayer } from '@/context/PlayerContext';
import TrackCard from '@/components/TrackCard';
import CanvasBackground from '@/components/CanvasBackground';
import PlayerBar from '@/components/PlayerBar';

function formatDuration(total) {
  if (!total) return '—';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const secs = `${String(s).padStart(2, '0')}`;
  if (h > 0) return `${h} hr ${m} min`;
  return `${m}:${secs}`;
}

export default function AlbumPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = params.id;
  const { playTrack } = usePlayer();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    musicApi
      .album(albumId)
      .then((data) => {
        if (cancelled) return;
        setAlbum(data.album);
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
  }, [albumId]);

  if (loading) {
    return (
      <div className="relative h-screen bg-black flex flex-col">
        <CanvasBackground darker />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="w-10 h-10 border-4 border-[#ff6b6b] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="relative h-screen bg-black flex flex-col">
        <CanvasBackground darker />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 text-center px-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-4">Album not found</h1>
            <button
              onClick={() => router.back()}
              className="inline-block bg-gradient-to-r from-[#ff6b6b] to-red-600 text-white px-6 py-3 rounded-full font-bold shadow-md shadow-[#ff6b6b]/25 hover:scale-105 hover:shadow-[#ff6b6b]/40 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalDuration = (album.tracks || []).reduce((sum, t) => sum + (t.duration || 0), 0);

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
          <span className="text-sm font-bold text-white/80 px-3 py-1 rounded-full bg-white/10 border border-white/10">Album</span>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 mb-10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b6b]/25 via-transparent to-transparent" />
              {album.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={album.cover} alt={album.title} className="absolute inset-0 w-full h-full object-cover opacity-40" aria-hidden />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent" />

              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 p-8 sm:p-10">
                <div className="w-44 h-44 rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl ring-2 ring-white/10">
                  {album.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={album.cover} alt={album.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-4xl">♪</div>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#ff6b6b]/20 text-[#ffb3b3] text-[11px] font-bold uppercase tracking-widest mb-3">
                    Album
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">{album.title}</h1>
                  <div className="mt-3 text-white/80 text-sm">
                    {album.artistId ? (
                      <button
                        onClick={() => router.push(`/artist/${album.artistId}`)}
                        className="font-bold text-white hover:underline"
                      >
                        {album.artist}
                      </button>
                    ) : (
                      <span className="font-bold">{album.artist}</span>
                    )}
                    <span className="text-white/30 mx-2">•</span>
                    {album.releaseDate?.slice(0, 4) || 'Unknown'}
                    <span className="text-white/30 mx-2">•</span>
                    {album.nbTracks} songs, {formatDuration(totalDuration)}
                  </div>
                  <div className="flex justify-center sm:justify-start gap-3 mt-5">
                    <button
                      onClick={() => album.tracks[0] && playTrack(album.tracks[0], album.tracks)}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff6b6b] to-red-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md shadow-[#ff6b6b]/25 hover:scale-105 hover:shadow-[#ff6b6b]/40 transition"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      Play
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracks */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">Tracks</h2>
              <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.015] rounded-2xl p-2 ring-1 ring-white/10">
                {(album.tracks || []).map((track, i) => (
                  <TrackCard key={track.id} track={track} index={i} showRank queue={album.tracks} />
                ))}
              </div>
            </section>
          </div>
        </main>

        <PlayerBar />
      </div>
    </div>
  );
}