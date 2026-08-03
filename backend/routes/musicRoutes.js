const express = require('express');
const router = express.Router();
const { search, track, fullPlayback, artist, album, curatedArtists, lyrics, recommendations, chart } = require('../controllers/musicController');
const { protect } = require('../middleware/auth');
const { requirePlan } = require('../middleware/requirePlan');

router.get('/search', search);
router.get('/chart', chart);
router.get('/track/:id', track);
router.get('/track/:id/full', protect, requirePlan('pro'), fullPlayback);
router.get('/artist/:id', artist);
router.get('/album/:id', album);
router.get('/artists/curated', curatedArtists);
router.get('/track/:id/lyrics', protect, requirePlan('enterprise'), lyrics);
router.get('/recommendations', protect, requirePlan('pro'), recommendations);

module.exports = router;
