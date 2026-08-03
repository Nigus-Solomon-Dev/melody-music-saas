'use client';

import Link from 'next/link';
import { usePlayer } from '@/context/PlayerContext';
import { can } from '@/lib/features';
import { useSubscription } from '@/context/SubscriptionContext';

export default function TrackCard({ track, index = null, showRank = false, queue = null }) {
  const { playTrack, currentTrack, isPlaying, usingFull } = usePlayer();
  const { plan } = useSubscription();
  const canFull = can(plan, 'fullPlayback');
  const isCurrent = currentTrack?.id === track.id;
  const isCurrentPlaying = isCurrent && isPlaying;
  const showFull = canFull;
  const trackQueue = queue && queue.length ? queue : null;

  const handlePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrent && isPlaying) {
      // clicking an already-playing track toggles off via player bar; here we just keep playing
      return;
    }
    playTrack(track, trackQueue);
  };

  return (
    <div className="group relative flex items-center gap-4 p-3 rounded-lg hover:bg-[#1f1f1f] transition">
      {/* Rank or index */}
      {showRank && index !== null && (
        <span className="w-6 text-right text-[#b3b3b3] text-sm font-bold flex-shrink-0">{index + 1}</span>
      )}

      {/* Artwork + play overlay (image navigates to track page) */}
      <Link href={`/track/${track.id}`} className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 group/art">
        {track.albumCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.albumCover} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">â™ª</div>
        )}
        <button
          onClick={handlePlay}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover/art:opacity-100 transition flex items-center justify-center"
          aria-label={isCurrentPlaying ? 'Pause' : 'Play'}
        >
          {isCurrentPlaying ? (
            <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/track/${track.id}`} className="block">
          <p className={`text-sm font-medium truncate ${isCurrent ? 'text-[#ff6b6b]' : 'text-white'} hover:underline`}>
            {track.title}
          </p>
        </Link>
        <p className="text-xs text-[#b3b3b3] truncate">
          {track.artistId ? (
            <Link href={`/artist/${track.artistId}`} className="hover:underline hover:text-white">
              {track.artist}
            </Link>
          ) : (
            track.artist
          )}
          {track.album ? ` â€¢ ${track.album}` : ''}
        </p>
      </div>

      {/* Full playback badge */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {showFull ? (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-[#ff6b6b]/20 text-[#ff6b6b] text-[10px] font-bold">
            FULL
          </span>
        ) : track.previewUrl ? (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">
            30s
          </span>
        ) : null}
        <span className="text-[#b3b3b3] text-xs font-medium w-10 text-right">
          {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
