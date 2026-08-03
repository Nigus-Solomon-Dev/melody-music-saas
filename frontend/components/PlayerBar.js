'use client';

import { useRouter } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerBar() {
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    volume,
    muted,
    usingFull,
    loadingTrack,
    togglePlay,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleMute,
    cycleRepeat,
    shuffle,
    repeatMode,
    seek,
    setVolumeAndPlay,
  } = usePlayer();

  if (!currentTrack) {
    return (
      <footer className="h-[72px] bg-black/60 backdrop-blur-sm px-4 flex items-center border-t border-white/10 flex-shrink-0">
        <p className="text-sm text-gray-500 w-full text-center">Select a song to start listening</p>
      </footer>
    );
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  };

  const handleVolumeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolumeAndPlay(ratio);
  };

  return (
    <footer className="bg-black/60 backdrop-blur-sm px-3 sm:px-4 py-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-white/10 flex-shrink-0 z-50 relative">
      {/* Track info (click to open track page) */}
      <button
        onClick={() => router.push(`/track/${currentTrack.id}`)}
        className="flex items-center gap-3 min-w-0 w-full sm:w-[30%] text-left group"
      >
        {currentTrack.albumCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentTrack.albumCover}
            alt="Album Art"
            className="w-12 h-12 sm:w-16 sm:h-16 rounded shadow-md object-cover flex-shrink-0 group-hover:opacity-80 transition"
          />
        ) : (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-500 text-xl font-bold">
            â™ª
          </div>
        )}
        <div className="truncate min-w-0">
          <p className="text-sm font-medium text-white truncate group-hover:underline">{currentTrack.title}</p>
          <p className="text-xs text-[#b3b3b3] truncate group-hover:underline">{currentTrack.artist}</p>
        </div>
        {usingFull ? (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-[#ff6b6b]/20 text-[#ff6b6b] text-[10px] font-bold ml-1 flex-shrink-0">
            FULL
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold ml-1 flex-shrink-0">
            30s PREVIEW
          </span>
        )}
        <svg className="hidden sm:block w-4 h-4 fill-current text-[#b3b3b3] group-hover:text-white flex-shrink-0 ml-1" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </button>

      {/* Controls + progress */}
      <div className="flex flex-col items-center w-full sm:w-[40%] sm:max-w-[722px] gap-1.5 sm:gap-2">
        <div className="flex items-center gap-5 sm:gap-7 text-[#b3b3b3]">
          <button
            onClick={toggleShuffle}
            disabled={!currentTrack}
            title={shuffle ? 'Shuffle on' : 'Shuffle'}
            className={`hidden sm:block hover:text-white transition disabled:opacity-40 ${shuffle ? 'text-[#ff6b6b]' : ''}`}
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.45 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          </button>
          <button
            onClick={playPrevious}
            disabled={!currentTrack || loadingTrack}
            className="hover:text-white transition disabled:opacity-40"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>

          <button
            onClick={togglePlay}
            disabled={!currentTrack || loadingTrack}
            className="w-10 h-10 bg-gradient-to-br from-[#ff6b6b] to-red-600 rounded-full flex items-center justify-center text-white hover:scale-110 hover:shadow-lg hover:shadow-[#ff6b6b]/30 transition disabled:opacity-50"
          >
            {loadingTrack ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : isPlaying ? (
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <button
            onClick={playNext}
            disabled={!currentTrack || loadingTrack}
            className="hover:text-white transition disabled:opacity-40"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
          <button
            onClick={cycleRepeat}
            disabled={!currentTrack}
            title={repeatMode === 'one' ? 'Repeat one' : repeatMode === 'all' ? 'Repeat all' : 'Repeat off'}
            className={`hover:text-white transition disabled:opacity-40 ${repeatMode !== 'off' ? 'text-[#ff6b6b]' : ''}`}
          >
            {repeatMode === 'one' ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-6v-1.5L11 12h1.5l.5-.5V11h1v2h-2z"/></svg>
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
            )}
          </button>
        </div>

        <div className="flex items-center w-full gap-2 text-xs text-[#b3b3b3]">
          <span>{formatTime(currentTime)}</span>
          <div
            className="flex-1 h-1 bg-[#4f4f4f] rounded-full group cursor-pointer relative flex items-center"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-white group-hover:bg-[#ff6b6b] rounded-full"
              style={{ width: `${progress}%` }}
            />
            <div
              className="w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow -ml-1.5 transition-opacity"
              style={{ left: `${progress}%` }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="hidden sm:flex items-center justify-end gap-3 w-[30%] text-[#b3b3b3]">
        <button
          onClick={toggleMute}
          title={muted ? 'Unmute' : 'Mute'}
          className={`hover:text-white transition flex-shrink-0 ${muted ? 'text-[#ff6b6b]' : ''}`}
        >
          {muted ? (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          ) : volume === 0 ? (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          ) : (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          )}
        </button>
        <span className={`text-[10px] font-bold w-8 text-right tabular-nums ${muted ? 'text-[#ff6b6b]' : 'text-white/60'}`}>
          {muted ? 'OFF' : `${Math.round(volume * 100)}%`}
        </span>
        <div
          className="w-24 h-1.5 bg-[#4f4f4f] rounded-full group cursor-pointer flex items-center"
          onClick={handleVolumeClick}
        >
          <div
            className={`h-full rounded-full ${muted ? 'bg-[#ff6b6b]/40' : 'bg-white group-hover:bg-[#ff6b6b]'} ${muted ? '' : 'transition-colors'}`}
            style={{ width: `${(muted ? 0 : volume) * 100}%` }}
          />
          <div
            className={`w-3 h-3 rounded-full shadow -ml-1.5 ${muted ? 'bg-[#ff6b6b]' : 'bg-white'} ${muted ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}
            style={{ left: `${(muted ? 0 : volume) * 100}%` }}
          />
        </div>
      </div>
    </footer>
  );
}
