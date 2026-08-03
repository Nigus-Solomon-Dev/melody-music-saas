const DEEZER_BASE = 'https://api.deezer.com';
const LRCLIB_BASE = 'https://lrclib.net/api';
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3/search';

// Simple in-memory TTL cache to avoid hammering the free APIs
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cached(key, ttlMs = CACHE_TTL_MS) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) {
    return hit.value;
  }
  return undefined;
}

function setCache(key, value) {
  cache.set(key, { ts: Date.now(), value });
}

// Fetch with a hard timeout so a slow upstream API never hangs the response
async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getJson(url, key) {
  const fromCache = cached(key);
  if (fromCache !== undefined) return fromCache;

  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const err = new Error(`Deezer API error: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  setCache(key, data);
  return data;
}

// Fallback that scrapes the YouTube search results page for a videoId.
// No API key / no quota — used when the Data API is rate-limited or unavailable.
const findYoutubeVideoViaScrape = async (trackTitle, artistName) => {
  const query = `${artistName ? artistName + ' ' : ''}${trackTitle} official audio`;
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          Cookie: 'CONSENT=YES+cb; SOCS=CAI',
        },
        redirect: 'follow',
      },
      7000
    );
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/"videoId":"([A-Za-z0-9_-]{11})"/);
    if (!match) return null;
    return { videoId: match[1], title: `${artistName ? artistName + ' - ' : ''}${trackTitle}` };
  } catch (error) {
    console.error('YouTube scrape error:', error.message);
    return null;
  }
};

// Find a full-length YouTube video for a track. Returns null when no match is
// found (caller falls back to 30s preview). Tries the Data API first (cheap,
// accurate), then falls back to page scraping (quota-free, no key needed).
const findYoutubeVideo = async (trackTitle, artistName) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!trackTitle) return null;

  const cacheKey = `yt:${trackTitle}:${artistName || ''}`;
  const fromCache = cached(cacheKey, 24 * 60 * 60 * 1000); // cache matches for 24h
  if (fromCache !== undefined) return fromCache;

  const query = `${artistName ? artistName + ' ' : ''}${trackTitle} official audio`;

  // 1) Prefer the Data API when a key is configured
  if (apiKey) {
    try {
      const url = `${YOUTUBE_API}?part=snippet&type=video&videoEmbeddable=true&maxResults=1&q=${encodeURIComponent(query)}&key=${apiKey}`;
      const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 5000);
      if (res.ok) {
        const data = await res.json();
        const video = data.items && data.items[0];
        if (video) {
          const result = { videoId: video.id.videoId, title: video.snippet.title };
          setCache(cacheKey, result);
          return result;
        }
      } else {
        console.error('YouTube API error:', res.status, res.statusText, '- falling back to scrape');
      }
    } catch (error) {
      console.error('YouTube API lookup error:', error.message, '- falling back to scrape');
    }
  }

  // 2) Quota-free fallback: scrape the search results page
  const scraped = await findYoutubeVideoViaScrape(trackTitle, artistName);
  setCache(cacheKey, scraped);
  return scraped;
};

function mapTrack(t) {
  return {
    id: String(t.id),
    title: t.title,
    titleShort: t.title_short,
    artist: t.artist?.name,
    artistId: t.artist?.id ? String(t.artist.id) : null,
    artistPicture: t.artist?.picture_medium || t.artist?.picture_big || t.artist?.picture_small || null,
    album: t.album?.title,
    albumCover: t.album?.cover_big || t.album?.cover_medium || t.album?.cover_small || null,
    previewUrl: t.preview || null,
    duration: t.duration,
    explicit: t.explicit_lyrics === true,
    rank: t.rank,
  };
}

function mapAlbum(a) {
  return {
    id: String(a.id),
    title: a.title,
    cover: a.cover_big || a.cover_medium || null,
    nbTracks: a.nb_tracks,
    releaseDate: a.release_date,
    artist: a.artist?.name,
    artistId: a.artist?.id ? String(a.artist.id) : null,
  };
}

const searchTracks = async (query, limit = 20) => {
  const data = await getJson(
    `${DEEZER_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    `search:${query}:${limit}`
  );
  const tracks = (data.data || []).map(mapTrack);
  return tracks;
};

const getTrack = async (trackId) => {
  const data = await getJson(`${DEEZER_BASE}/track/${trackId}`, `track:${trackId}`);
  const track = {
    ...mapTrack(data),
    albumId: data.album?.id ? String(data.album.id) : null,
    releaseDate: data.release_date,
    availableCountries: data.available_countries,
  };
  await enrichWithYoutube([track]);
  return track;
};

// On-demand full playback resolution: ONE YouTube lookup per played track,
// cached 24h so the free API quota lasts. Called when the user presses play.
const getFullPlayback = async (trackId) => {
  const data = await getJson(`${DEEZER_BASE}/track/${trackId}`, `track:${trackId}`);
  const track = { ...mapTrack(data) };
  const video = await findYoutubeVideo(track.title, track.artist);
  if (video) track.youtube = video;
  return track;
};

// Adds a youtube: { videoId, title } field to each track when an API key exists
const enrichWithYoutube = async (tracks) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || !Array.isArray(tracks)) return;
  await Promise.all(
    tracks.map(async (t) => {
      const video = await findYoutubeVideo(t.title, t.artist);
      if (video) t.youtube = video;
    })
  );
};

const getArtist = async (artistId) => {
  const data = await getJson(`${DEEZER_BASE}/artist/${artistId}`, `artist:${artistId}`);
  return {
    id: String(data.id),
    name: data.name,
    picture: data.picture_big || data.picture_medium || data.picture || null,
    pictureSmall: data.picture_small || null,
    nbAlbums: data.nb_album,
    nbFans: data.nb_fan,
  };
};

const getArtistTopTracks = async (artistId, limit = 10) => {
  const data = await getJson(
    `${DEEZER_BASE}/artist/${artistId}/top?limit=${limit}`,
    `artist-top:${artistId}:${limit}`
  );
  return (data.data || []).map(mapTrack);
};

const getArtistAlbums = async (artistId, limit = 12) => {
  const data = await getJson(
    `${DEEZER_BASE}/artist/${artistId}/albums?limit=${limit}`,
    `artist-albums:${artistId}:${limit}`
  );
  return (data.data || []).map(mapAlbum);
};

const getAlbum = async (albumId) => {
  const data = await getJson(`${DEEZER_BASE}/album/${albumId}`, `album:${albumId}`);
  const tracks = (data.tracks?.data || []).map(mapTrack);
  await enrichWithYoutube(tracks);
  return {
    id: String(data.id),
    title: data.title,
    cover: data.cover_big || data.cover_medium || data.cover_small || null,
    releaseDate: data.release_date,
    nbTracks: data.nb_tracks,
    artist: data.artist?.name,
    artistId: data.artist?.id ? String(data.artist.id) : null,
    tracks,
  };
};

const getRelatedArtists = async (artistId, limit = 8) => {
  const data = await getJson(
    `${DEEZER_BASE}/artist/${artistId}/related?limit=${limit}`,
    `artist-related:${artistId}:${limit}`
  );
  return (data.data || []).map((a) => ({
    id: String(a.id),
    name: a.name,
    picture: a.picture_medium || a.picture_small || a.picture || null,
  }));
};

// Curated list of well-known artists resolved from Deezer by name search.
// Used by the dashboard "Your Favorite Artists" row.
const getCuratedArtists = async (names) => {
  const list = Array.isArray(names) && names.length ? names : ['J. Cole', 'Teddy Afro', 'Dawit Tsige', 'Burna Boy', 'Wizkid', 'The Weeknd', 'Rihanna'];
  const normalize = (s) => s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');

  const results = await Promise.all(
    list.map(async (name) => {
      try {
        const data = await getJson(
          `${DEEZER_BASE}/search/artist?q=${encodeURIComponent(name)}&limit=1`,
          `artist-search:${name}:1`
        );
        const a = data.data?.[0];
        // Only accept a match that actually looks like the requested artist,
        // otherwise Deezer returns unrelated fuzzy matches (e.g. "Teddy Karo" for "Teddy Afro").
        const matchOk = a && (normalize(a.name) === normalize(name) || normalize(a.name).includes(normalize(name)) || normalize(name).includes(normalize(a.name)));
        if (!a || !matchOk) return null;
        return {
          artistId: String(a.id),
          artist: a.name,
          artistPicture: a.picture_big || a.picture_medium || a.picture || null,
        };
      } catch {
        return null;
      }
    })
  );

  const matched = results.filter(Boolean);
  const missing = list.length - matched.length;
  if (missing <= 0) return matched;

  // Backfill missing artists with real, popular artists from the chart so the row stays full.
  try {
    const chart = await getChart(Math.max(20, missing * 3));
    const seen = new Set(matched.map((m) => m.artistId));
    for (const t of chart) {
      if (t.artistId && !seen.has(t.artistId)) {
        matched.push({
          artistId: String(t.artistId),
          artist: t.artist,
          artistPicture: t.artistPicture || null,
        });
        seen.add(t.artistId);
        if (matched.length >= list.length) break;
      }
    }
  } catch {
    // ignore backfill failure
  }

  return matched;
};

// Chart-based recommendations (works without a user account)
const getRecommendations = async (limit = 12) => {
  const data = await getJson(
    `${DEEZER_BASE}/chart/0/tracks?limit=${limit}`,
    `recommendations:${limit}`
  );
  return (data.data || []).map(mapTrack);
};

// Public Deezer chart (top tracks) for the dashboard home feed
const getChart = async (limit = 20) => {
  const data = await getJson(
    `${DEEZER_BASE}/chart/0/tracks?limit=${limit}`,
    `chart:${limit}`
  );
  const tracks = (data.data || []).map(mapTrack);
  return tracks;
};

// Lyrics from LRCLIB (free, no key) - synced lyrics if available
const getLyrics = async (trackTitle, artistName) => {
  if (!trackTitle || !artistName) return null;
  try {
    const url = `${LRCLIB_BASE}/search?track_name=${encodeURIComponent(trackTitle)}&artist_name=${encodeURIComponent(artistName)}`;
    const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 5000);
    if (!res.ok) return null;
    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;
    const best = results[0];
    return {
      source: 'lrclib',
      synced: Boolean(best.syncedLyrics),
      plainLyrics: best.plainLyrics || null,
      syncedLyrics: best.syncedLyrics || null,
    };
  } catch {
    return null;
  }
};

module.exports = {
  searchTracks,
  getTrack,
  getFullPlayback,
  getArtist,
  getArtistTopTracks,
  getArtistAlbums,
  getAlbum,
  getRelatedArtists,
  getCuratedArtists,
  getRecommendations,
  getChart,
  getLyrics,
  findYoutubeVideo,
};
