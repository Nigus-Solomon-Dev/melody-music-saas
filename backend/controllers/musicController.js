const {
  searchTracks,
  getTrack,
  getFullPlayback,
  getArtist,
  getArtistTopTracks,
  getArtistAlbums,
  getRelatedArtists,
  getRecommendations,
  getChart,
  getLyrics,
} = require('../services/musicService');

const search = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query parameter q is required' });
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const tracks = await searchTracks(q, limit);
    res.status(200).json({ success: true, data: { tracks } });
  } catch (error) {
    console.error('Music Search Error:', error);
    res.status(500).json({ success: false, message: 'Error searching music', error: error.message });
  }
};

const track = async (req, res) => {
  try {
    const { id } = req.params;
    const trackData = await getTrack(id);
    res.status(200).json({ success: true, data: { track: trackData } });
  } catch (error) {
    console.error('Music Track Error:', error);
    res.status(404).json({ success: false, message: 'Track not found', error: error.message });
  }
};

// On-demand YouTube lookup for full playback (1 API call per play, cached 24h)
const fullPlayback = async (req, res) => {
  try {
    const { id } = req.params;
    const track = await getFullPlayback(id);
    res.status(200).json({ success: true, data: { track } });
  } catch (error) {
    console.error('Music Full Playback Error:', error);
    res.status(404).json({ success: false, message: 'Track not found', error: error.message });
  }
};

const artist = async (req, res) => {
  try {
    const { id } = req.params;
    const [artistData, topTracks, albums, related] = await Promise.all([
      getArtist(id),
      getArtistTopTracks(id),
      getArtistAlbums(id),
      getRelatedArtists(id),
    ]);
    res.status(200).json({
      success: true,
      data: { artist: artistData, topTracks, albums, related },
    });
  } catch (error) {
    console.error('Music Artist Error:', error);
    res.status(404).json({ success: false, message: 'Artist not found', error: error.message });
  }
};

const lyrics = async (req, res) => {
  try {
    const { id } = req.params;
    const trackData = await getTrack(id);
    const lyricsData = await getLyrics(trackData.title, trackData.artist);
    res.status(200).json({ success: true, data: { lyrics: lyricsData } });
  } catch (error) {
    console.error('Music Lyrics Error:', error);
    res.status(404).json({ success: false, message: 'Lyrics not found', error: error.message });
  }
};

// Pro+ only - gated by subscription plan
const recommendations = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Please login' });
    }
    const Subscription = require('../models/Subscription');
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: { $in: ['active', 'trialing'] },
    });
    const isPremium = subscription && ['pro', 'enterprise'].includes(subscription.plan);
    if (!isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Recommendations are available on Pro and Enterprise plans',
      });
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 30);
    const tracks = await getRecommendations(limit);
    res.status(200).json({ success: true, data: { tracks } });
  } catch (error) {
    console.error('Music Recommendations Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching recommendations', error: error.message });
  }
};

// Home feed: top tracks (public, no key required)
const chart = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 30);
    const tracks = await getChart(limit);
    res.status(200).json({ success: true, data: { tracks } });
  } catch (error) {
    console.error('Music Chart Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching chart', error: error.message });
  }
};

module.exports = {
  search,
  track,
  fullPlayback,
  artist,
  lyrics,
  recommendations,
  chart,
};
