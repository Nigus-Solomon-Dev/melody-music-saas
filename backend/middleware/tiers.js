// Tier comparison for plan gating.
// Mirrors frontend/src/lib/features.js so both sides agree on entitlement.

const TIER_ORDER = { free: 0, basic: 1, pro: 2, enterprise: 3 };

function tierOf(plan) {
  if (plan === 'basic' || plan === 'pro' || plan === 'enterprise') return plan;
  return 'free';
}

function tierRank(plan) {
  return TIER_ORDER[tierOf(plan)] ?? 0;
}

// Returns true when `plan` is at least `minTier`.
function meetsTier(plan, minTier) {
  return tierRank(plan) >= TIER_ORDER[minTier];
}

module.exports = { tierOf, tierRank, meetsTier, TIER_ORDER };
