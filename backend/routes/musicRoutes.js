const express = require('express');
const router = express.Router();
const { search, track, fullPlayback, artist, lyrics, recommendations, chart } = require('../controllers/musicController');
const { protect } = require('../middleware/auth');

router.get('/search', search);
router.get('/chart', chart);
router.get('/track/:id', track);
router.get('/track/:id/full', fullPlayback);
router.get('/artist/:id', artist);
router.get('/track/:id/lyrics', lyrics);
router.get('/recommendations', protect, recommendations);

module.exports = router;
