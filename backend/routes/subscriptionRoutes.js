const express = require('express');
const router = express.Router();
const { createSubscription, cancelSubscription, getMySubscription, createPortalSession, upgradeSubscription,  } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

router.post('/create', protect, createSubscription);
router.delete('/cancel', protect, cancelSubscription);
router.get('/me', protect, getMySubscription);
router.post('/portal', protect, createPortalSession);
router.put('/upgrade', protect, upgradeSubscription);

module.exports = router;