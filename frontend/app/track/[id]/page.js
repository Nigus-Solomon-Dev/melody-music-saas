'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { musicApi } from '@/lib/musicApi';
import { usePlayer } from '@/context/PlayerContext';
import { can } from '@/lib/features';
import { useSubscription } from '@/context/SubscriptionContext';
import TrackCard from '@/components/TrackCard';
import CanvasBackground from '@/components/CanvasBackground';
import PlayerBar from '@/components/PlayerBar';
import UpgradePrompt from '@/components/UpgradePrompt';

export default function TrackPage() {
  const router = useRouter();
  const params = useParams();
  const trackId = params.id;
  const { playTrack, currentTrack, isPlaying, usingFull, togglePlay } = usePlayer();
  const { plan } = useSubscription();
  const [track, setTrack] = useState(null);
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lyricsLoading, setLyricsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLyrics, setShowLyrics] = useState(true);
  const [activeId, setActiveId] = useState(trackId);

  // Follow either the current URL track or the player's current track (next/prev).
  useEffect(() => {
    const desired = currentTrack?.id && currentTrack.id !== trackId ? currentTrack.id : trackId;
    if (desired !== activeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveId(desired);
      if (currentTrack?.id && currentTrack.id !== trackId) {
        router.replace(`/track/${currentTrack.id}`, { scroll: false });
      }
    }
  }, [currentTrack?.id, trackId, router, activeId]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    setTrack(null);
    setLyrics(null);

    musicApi
      .track(activeId)
      .then((data) => {
        if (cancelled) return;
        setTrack(data.track);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    musicApi
      .lyrics(activeId)
      .then((data) => {
        if (cancelled) return;
        setLyrics(data.lyrics);
        setLyricsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLyrics(null);
        setLyricsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const canFull = can(plan, 'fullPlayback');
  const canLyrics = can(plan, 'lyrics');
  const isCurrent = currentTrack?.id === activeId;
  const showFull = canFull;

  const handlePlayToggle = () => {
    if (isCurrent) {
      togglePlay();
    } else if (track) {
      playTrack(track);
    }
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

  if (error || !track) {
    return (
      <div className="relative min-h-screen bg-black flex flex-col">
        <CanvasBackground />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 text-center px-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-4">Track not found</h1>
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
          <span className="text-sm font-bold text-white/80 px-3 py-1 rounded-full bg-white/10 border border-white/10">Track</span>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-8">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: artwork + play */}
            <div className="lg:sticky lg:top-0 lg:self-start">
              <div className="relative rounded-xl overflow-hidden shadow-2xl aspect-square max-w-sm mx-auto">
                {track.albumCover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={track.albumCover} alt={track.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-6xl">♪</div>
                )}
                <button
                  onClick={handlePlayToggle}
                  className="absolute bottom-4 right-4 bg-gradient-to-br from-[#ff6b6b] to-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl shadow-[#ff6b6b]/30 hover:scale-105 transition"
                >
                  {isCurrent && isPlaying ? (
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-8 h-8 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
              </div>

              <div className="mt-6 text-center max-w-sm mx-auto">
                <h1 className="text-2xl font-bold text-white">{track.title}</h1>
                {track.artistId ? (
                  <button
                    onClick={() => router.push(`/artist/${track.artistId}`)}
                    className="text-gray-400 hover:text-white hover:underline mt-1"
                  >
                    {track.artist}
                  </button>
                ) : (
                  <p className="text-gray-400 mt-1">{track.artist}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">{track.album}</p>

                <div className="flex justify-center gap-2 mt-4">
                  {showFull ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#ff6b6b]/20 text-[#ff6b6b] text-xs font-bold">
                      FULL PLAYBACK
                    </span>
                  ) : track.previewUrl ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                      30-SECOND PREVIEW
                    </span>
                  ) : null}
                </div>

                {!showFull && !canFull && (
                  <div className="mt-4 w-full max-w-xs mx-auto">
                    <UpgradePrompt feature="Full song playback" requiredPlan="pro" />
                  </div>
                )}
              </div>
            </div>

            {/* Right: lyrics */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Lyrics</h2>
                <button
                  onClick={() => setShowLyrics(!showLyrics)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  {showLyrics ? 'Hide' : 'Show'}
                </button>
              </div>

              {showLyrics && (
                <div className="bg-[#181818]/60 rounded-xl p-6 border border-[#ff6b6b]/20 shadow-[0_8px_40px_-8px_rgba(255,107,107,0.35)] min-h-[300px]">
                  {!canLyrics ? (
                    <div className="flex flex-col items-center justify-center min-h-[250px]">
                      <p className="text-gray-400 text-sm mb-5 text-center">
                        Lyrics are available on the Enterprise plan only.
                      </p>
                      <UpgradePrompt feature="Song lyrics" requiredPlan="enterprise" compact />
                    </div>
                  ) : (
                    <>
                      {lyricsLoading && <p className="text-gray-500 text-sm animate-pulse">Loading lyrics...</p>}
                      {!lyricsLoading && !lyrics?.plainLyrics && (
                        <p className="text-gray-500 text-sm">No lyrics available for this track.</p>
                      )}
                      {!lyricsLoading && lyrics?.plainLyrics && (
                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-200 leading-relaxed">
                          {lyrics.plainLyrics}
                        </pre>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        <PlayerBar />
      </div>
    </div>
  );
}
