const Subscription = require('../models/Subscription');
const { meetsTier } = require('./tiers');

// Gate an endpoint behind a minimum plan tier.
// Must run AFTER `protect` so req.user is populated.
//
// Usage: router.get('/track/:id/full', protect, requirePlan('pro'), fullPlayback);
const requirePlan = (minTier, message) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Please login' });
      }

      const subscription = await Subscription.findOne({
        userId: user._id,
        status: { $in: ['active', 'trialing'] },
      });

      const plan = subscription ? subscription.plan : 'free';
      if (!meetsTier(plan, minTier)) {
        const fallback = {
          fullPlayback: 'Full playback requires a Pro plan',
          lyrics: 'Lyrics require an Enterprise plan',
          recommendations: 'Recommendations are available on Pro and Enterprise plans',
        };
        return res.status(403).json({
          success: false,
          message: message || fallback[minTier] || `This feature requires the ${minTier} plan or higher`,
          data: { plan, requiredTier: minTier },
        });
      }

      req.subscriptionPlan = plan;
      next();
    } catch (error) {
      console.error('requirePlan error:', error.message);
      return res.status(500).json({ success: false, message: 'Error checking subscription plan' });
    }
  };
};

module.exports = { requirePlan };
