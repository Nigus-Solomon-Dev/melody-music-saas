const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

import { getToken } from './api';

async function request(path, { method = 'GET', auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const err = new Error(data.message || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export const musicApi = {
  search: (q, limit = 20) => request(`/music/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  chart: (limit = 20) => request(`/music/chart?limit=${limit}`),
  track: (id) => request(`/music/track/${id}`),
  fullPlayback: (id) => request(`/music/track/${id}/full`, { auth: true }),
  artist: (id) => request(`/music/artist/${id}`),
  album: (id) => request(`/music/album/${id}`),
  curatedArtists: (names) => request(`/music/artists/curated${names && names.length ? `?names=${encodeURIComponent(names.join(','))}` : ''}`),
  lyrics: (id) => request(`/music/track/${id}/lyrics`, { auth: true }),
  recommendations: (limit = 12) => request(`/music/recommendations?limit=${limit}`, { auth: true }),
};
