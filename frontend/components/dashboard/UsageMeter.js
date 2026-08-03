'use client';

import { useSubscription } from '@/context/SubscriptionContext';

const TIER_LIMITS = {
  basic: { playlists: 10, devices: 1, quality: '128kbps' },
  pro: { playlists: 'âˆž', devices: 3, quality: '320kbps' },
  enterprise: { playlists: 'âˆž', devices: 10, quality: 'Lossless' },
  free: { playlists: 3, devices: 1, quality: '128kbps' },
};

const TIER_FEATURES = {
  basic: ['Ad-free', '128kbps', '10 playlists', '1 device'],
  pro: ['Everything in Basic', '320kbps', 'Unlimited playlists', '3 devices', 'Full playback', 'Offline downloads'],
  enterprise: ['Everything in Pro', 'Lossless', '10 devices', 'Team (20)', 'Analytics', 'API access', 'Full lyrics'],
  free: ['Ads', '128kbps', '3 playlists', '1 device', 'Skip limit'],
};

export default function UsageMeter() {
  const { hasSubscription, plan, subscription } = useSubscription();

  const currentPlan = hasSubscription ? plan : 'free';
  const limits = TIER_LIMITS[currentPlan] || TIER_LIMITS.free;
  const features = TIER_FEATURES[currentPlan] || TIER_FEATURES.free;

  // Mock usage data - in real app, fetch from API
  const usage = {
    playlists: subscription?.playlistsCount || 0,
    devices: subscription?.devicesCount || 0,
  };

  const getProgress = (used, limit) => {
    if (limit === 'âˆž') return 100;
    return Math.min((used / limit) * 100, 100);
  };

  const formatLimit = (limit) => (limit === 'âˆž' ? 'Unlimited' : limit);

  return (
    <div className="bg-[#1f1f1f]/80 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 002-2V5a2 2 0 012-2h2a2 2 0 002-2v4a2 2 0 012-2h2a2 2 0 002 2v4a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
        Usage Overview
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Playlists</span>
            <span className="text-white font-medium">
              {usage.playlists} / {formatLimit(limits.playlists)}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#ff6b6b] to-[#ff6b6b]/60 rounded-full transition-all duration-500"
              style={{ width: `${getProgress(usage.playlists, limits.playlists)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Devices</span>
            <span className="text-white font-medium">
              {usage.devices} / {formatLimit(limits.devices)}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#ff6b6b] to-[#ff6b6b]/60 rounded-full transition-all duration-500"
              style={{ width: `${getProgress(usage.devices, limits.devices)}%` }}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400 mb-3">Audio Quality: <span className="text-white font-medium">{limits.quality}</span></p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 text-gray-300">
                <svg className="w-3.5 h-3.5 text-[#ff6b6b] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}