'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { can } from '@/lib/features';
import { musicApi } from '@/lib/musicApi';
import { useSubscription } from '@/context/SubscriptionContext';

const PlayerContext = createContext(null);

// Global audio element used for Deezer 30s previews
let audioEl = null;
if (typeof window !== 'undefined') {
  audioEl = new Audio();
}

// YouTube IFrame player for full-length playback (audio only)
let ytPlayer = null;
let ytReady = false;
let ytHostEl = null;
const ytCallbacks = [];

function ensureYtApi() {
  if (typeof window === 'undefined') return;
  if (window.YT) {
    ytReady = true;
    return;
  }
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  tag.async = true;
  document.head.appendChild(tag);
}

if (typeof window !== 'undefined') {
  window.onYouTubeIframeAPIReady = () => {
    ytReady = true;
    ytCallbacks.forEach((cb) => cb());
    ytCallbacks.length = 0;
  };
}

export function PlayerProvider({ children }) {
  const { plan } = useSubscription();
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [usingFull, setUsingFull] = useState(false);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'

  const rafRef = useRef(null);
  const handleEndedRef = useRef(() => {});
  const usingFullRef = useRef(false);

  useEffect(() => {
    usingFullRef.current = usingFull;
  }, [usingFull]);

  // Expose the global audio element's timeupdates to React state
  useEffect(() => {
    const onTime = () => setCurrentTime(audioEl.currentTime);
    const onLoaded = () => setDuration(audioEl.duration || 0);
    const onEnd = () => handleEndedRef.current();
    audioEl.addEventListener('timeupdate', onTime);
    audioEl.addEventListener('loadedmetadata', onLoaded);
    audioEl.addEventListener('ended', onEnd);
    audioEl.volume = volume;
    return () => {
      audioEl.removeEventListener('timeupdate', onTime);
      audioEl.removeEventListener('loadedmetadata', onLoaded);
      audioEl.removeEventListener('ended', onEnd);
    };
  }, [volume]);

  useEffect(() => {
    ensureYtApi();
    const interval = setInterval(() => {
      // Only read the YouTube player while a full track is actually loaded.
      // Otherwise getCurrentTime() returns 0 and fights the preview's
      // timeupdate events, making the progress bar flicker.
      if (usingFullRef.current && ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
        setCurrentTime(ytPlayer.getCurrentTime());
        const d = ytPlayer.getDuration();
        if (d) setDuration(d);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const stopAudio = () => {
    audioEl.pause();
    audioEl.removeAttribute('src');
    audioEl.load();
  };

  const stopYt = () => {
    if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
      ytPlayer.stopVideo();
    }
  };

  const playYtVideoRef = useRef(null);

  const playYtVideo = useCallback((videoId) => {
    const startYt = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(() => playYtVideoRef.current?.(videoId), 300);
        return;
      }
      // Stop the 30s preview so it doesn't overlap with the full YouTube audio
      stopAudio();
      if (ytPlayer) {
        ytPlayer.loadVideoById({ videoId, startSeconds: 0 });
        ytPlayer.playVideo();
        return;
      }
      // Create the host element imperatively so React never reconciles it
      // (YouTube's iframe API replaces its contents, which breaks React DOM tracking)
      if (!ytHostEl) {
        ytHostEl = document.createElement('div');
        ytHostEl.setAttribute('id', 'yt-player-host');
        ytHostEl.style.cssText = 'position:fixed;width:1px;height:1px;left:-9999px;top:0;opacity:0;pointer-events:none;overflow:hidden;';
        document.body.appendChild(ytHostEl);
      }
      ytPlayer = new window.YT.Player(ytHostEl, {
        width: '200',
        height: '200',
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
        },
        events: {
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) handleEndedRef.current();
            if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
          },
          onReady: (e) => {
            e.target.setVolume(Math.round(volume * 100));
            e.target.playVideo();
          },
        },
      });
    };

    if (ytReady) {
      startYt();
    } else {
      ytCallbacks.push(startYt);
      ensureYtApi();
    }
  }, [volume]);

  useEffect(() => {
    playYtVideoRef.current = playYtVideo;
  }, [playYtVideo]);

  const startPreview = useCallback(async (track) => {
    if (track.previewUrl) {
      setUsingFull(false);
      setCurrentTrack(track);
      setCurrentTime(0);
      setDuration(track.duration || 30);
      audioEl.src = track.previewUrl;
      try {
        await audioEl.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      setCurrentTrack(track);
      setUsingFull(false);
      setIsPlaying(false);
    }
  }, []);

  const playTrack = useCallback(async (track, trackQueue) => {
    if (!track) return;
    const planAllowsFull = can(plan, 'fullPlayback');
    setLoadingTrack(true);

    stopYt();
    stopAudio();

    // Build/update the queue so next/prev work
    if (Array.isArray(trackQueue) && trackQueue.length > 0) {
      setQueue(trackQueue);
      const idx = trackQueue.findIndex((t) => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    } else {
      setQueue([track]);
      setQueueIndex(0);
    }

    if (!planAllowsFull) {
      // Free/Basic: straight to 30s preview
      await startPreview(track);
      setLoadingTrack(false);
      return;
    }

    // Pro/Enterprise: resolve the full-length YouTube video FIRST (no preview),
    // so playback starts from the beginning exactly once. Falls back to the
    // 30s preview only when no full version can be found.
    let videoId = track.youtube?.videoId;
    if (!videoId) {
      try {
        const data = await musicApi.fullPlayback(track.id);
        videoId = data.track?.youtube?.videoId || null;
      } catch {
        videoId = null;
      }
    }

    if (videoId) {
      setUsingFull(true);
      setCurrentTrack(track);
      setCurrentTime(0);
      setDuration(track.duration || 0);
      playYtVideo(videoId);
      setLoadingTrack(false);
      return;
    }

    // No full version available -> 30s preview fallback
    await startPreview(track);
    setLoadingTrack(false);
  }, [plan, playYtVideo, startPreview]);

  // Pick the next track (respecting shuffle + repeat), or null when the queue ends
  const pickNext = useCallback(() => {
    if (!queue.length) return null;
    if (shuffle) {
      if (queue.length === 1) return queue[0];
      let idx;
      do {
        idx = Math.floor(Math.random() * queue.length);
      } while (idx === queueIndex);
      return queue[idx];
    }
    const nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      return repeatMode === 'all' ? queue[0] : null;
    }
    return queue[nextIdx];
  }, [queue, queueIndex, shuffle, repeatMode]);

  const seek = useCallback((time) => {
    if (!currentTrack) return;
    if (usingFull && ytPlayer && typeof ytPlayer.seekTo === 'function') {
      ytPlayer.seekTo(time, true);
    } else {
      audioEl.currentTime = time;
    }
    setCurrentTime(time);
  }, [currentTrack, usingFull]);

  // Previous track (restarts current if >3s in, otherwise goes back one)
  const playPrevious = useCallback(() => {
    if (!currentTrack) return;
    if (currentTime > 3) {
      seek(0);
      return;
    }
    if (!queue.length) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) prevIdx = queue.length - 1;
    const prev = queue[prevIdx];
    if (prev) playTrack(prev, queue);
  }, [currentTrack, currentTime, seek, queue, queueIndex, playTrack]);

  const playNext = useCallback(() => {
    if (!currentTrack) return;
    const next = pickNext();
    if (next) {
      playTrack(next, queue);
    } else {
      // End of queue, stop
      if (usingFull) stopYt();
      else stopAudio();
      setIsPlaying(false);
    }
  }, [currentTrack, pickNext, queue, usingFull, playTrack]);

  // Called when the current audio/video ends naturally
  const handleEnded = useCallback(() => {
    if (repeatMode === 'one' && currentTrack) {
      seek(0);
      if (usingFull && ytPlayer && typeof ytPlayer.playVideo === 'function') {
        ytPlayer.playVideo();
      } else if (!usingFull && currentTrack.previewUrl) {
        audioEl.play().catch(() => {});
      }
      setIsPlaying(true);
      return;
    }
    const next = pickNext();
    if (next) {
      playTrack(next, queue);
    } else {
      setIsPlaying(false);
    }
  }, [repeatMode, currentTrack, usingFull, seek, pickNext, queue, playTrack]);

  useEffect(() => {
    handleEndedRef.current = handleEnded;
  }, [handleEnded]);

  // Graceful downgrade: if the user's plan no longer allows full playback
  // (e.g. cancelled/expired), stop the YouTube player and drop to the 30s preview.
  useEffect(() => {
    if (usingFull && currentTrack && !can(plan, 'fullPlayback')) {
      const t = setTimeout(() => {
        stopYt();
        setIsPlaying(false);
        startPreview(currentTrack);
      }, 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    if (isPlaying) {
      if (usingFull && ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
        ytPlayer.pauseVideo();
      } else {
        audioEl.pause();
      }
      setIsPlaying(false);
    } else {
      if (usingFull && ytPlayer && typeof ytPlayer.playVideo === 'function') {
        ytPlayer.playVideo();
      } else if (!usingFull && currentTrack.previewUrl) {
        audioEl.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  }, [currentTrack, isPlaying, usingFull]);

  const setVolumeAndPlay = useCallback((v) => {
    setVolume(v);
    setMuted(false);
    audioEl.volume = v;
    if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
      ytPlayer.setVolume(Math.round(v * 100));
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      const effective = next ? 0 : volume;
      audioEl.volume = effective;
      if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
        ytPlayer.setVolume(Math.round(effective * 100));
      }
      return next;
    });
  }, [volume]);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'));
  }, []);

  useEffect(() => {
    audioEl.volume = volume;
  }, [volume]);

  useEffect(() => {
    const effective = muted ? 0 : volume;
    audioEl.volume = effective;
    if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
      ytPlayer.setVolume(Math.round(effective * 100));
    }
  }, [muted, volume]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        duration,
        currentTime,
        volume,
        muted,
        usingFull,
        loadingTrack,
        queue,
        queueIndex,
        shuffle,
        repeatMode,
        playTrack,
        togglePlay,
        playNext,
        playPrevious,
        toggleShuffle,
        toggleMute,
        cycleRepeat,
        seek,
        setVolumeAndPlay,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
