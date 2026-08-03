// Tier gating: given a user's plan (or none), what can they do?

const TIER_ORDER = { free: 0, basic: 1, pro: 2, enterprise: 3 };

const FEATURES = {
  fullPlayback: 2, // pro+ (YouTube full song). Below: 30s preview only
  recommendations: 2, // pro+
  offlineDownloads: 2, // pro+ (stub for Phase 4 IndexedDB)
  unlimitedPlaylists: 2, // pro+
  losslessQuality: 3, // enterprise
  lyrics: 3, // enterprise
  adFree: 1, // basic+
};

// plan: 'free' | 'basic' | 'pro' | 'enterprise' | null
export function tierOf(plan) {
  if (plan === 'pro' || plan === 'enterprise' || plan === 'basic') return plan;
  return 'free';
}

export function can(plan, feature) {
  const minTier = FEATURES[feature];
  if (minTier === undefined) return true; // unknown features are allowed
  const userTier = TIER_ORDER[tierOf(plan)] ?? 0;
  return userTier >= minTier;
}

export function planLabel(plan) {
  if (plan === 'enterprise') return 'Enterprise';
  if (plan === 'pro') return 'Pro';
  if (plan === 'basic') return 'Basic';
  return 'Free';
}

// Highest audio quality available to a tier
export function qualityFor(plan) {
  const t = tierOf(plan);
  if (t === 'enterprise') return 'Lossless';
  if (t === 'pro') return '320kbps';
  return '128kbps';
}

// Short human explanation of what a tier unlocks for playback
export function playbackLimitMessage(plan) {
  const t = tierOf(plan);
  if (t === 'pro' || t === 'enterprise') return 'Full playback enabled';
  return 'Play 30-second previews. Upgrade to Pro for full songs.';
}
