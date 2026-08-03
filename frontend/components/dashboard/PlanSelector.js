'use client';

import { useState } from 'react';
import { useSubscription } from '@/context/SubscriptionContext';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: { monthly: 10.0, annual: 100 },
    features: [
      'Ad-free listening',
      '128kbps audio quality',
      '10 playlists max',
      '1 device',
    ],
    limits: { playlists: 10, devices: 1, quality: '128kbps' },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 29.0, annual: 290 },
    features: [
      'Everything in Basic',
      '320kbps audio quality',
      'Unlimited playlists',
      '3 devices',
      'Full song playback',
      'Offline downloads',
    ],
    limits: { playlists: 'âˆž', devices: 3, quality: '320kbps' },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 99.0, annual: 990 },
    features: [
      'Everything in Pro',
      'Lossless audio quality',
      '10 devices',
      'Team members (up to 20)',
      'Advanced analytics',
      'API access',
      'Priority support',
      'Full song lyrics',
    ],
    limits: { playlists: 'âˆž', devices: 10, quality: 'Lossless' },
  },
];

const CURRENT_PLAN_ORDER = { basic: 0, pro: 1, enterprise: 2 };

export default function PlanSelector({ onClose, onSuccess }) {
  const { plan: currentPlan, upgradeSubscription, loading: upgradeLoading } = useSubscription();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);

  const handleSelectPlan = (planId) => {
    if (planId === currentPlan) return;
    setSelectedPlan(planId);
  };

  const handleConfirm = async (planId) => {
    if (!planId || planId === currentPlan) return;
    setProcessingPlan(planId);
    try {
      await upgradeSubscription(planId);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Upgrade failed:', err);
      alert(err.message || 'Failed to change plan');
    } finally {
      setProcessingPlan(null);
    }
  };

  if (upgradeLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-[#1f1f1f] rounded-xl p-8 w-full max-w-md animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1f1f] rounded-xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Change Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                billingCycle === 'monthly'
                  ? 'bg-[#ff6b6b] text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                billingCycle === 'annual'
                  ? 'bg-[#ff6b6b] text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Annual <span className="text-xs text-[#ff8a8a] ml-1">(2 months free)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((p) => {
              const price = billingCycle === 'monthly' ? p.price.monthly : Math.round(p.price.annual / 12);
              const totalPrice = billingCycle === 'monthly' ? p.price.monthly : p.price.annual;
              const isCurrent = p.id === currentPlan;
              const isSelected = p.id === selectedPlan;
              const disabled = isCurrent;
              // Determine per-card if this plan is an upgrade or downgrade from current
              const cardIsUpgrade = CURRENT_PLAN_ORDER[p.id] > CURRENT_PLAN_ORDER[currentPlan];
              const cardIsDowngrade = CURRENT_PLAN_ORDER[p.id] < CURRENT_PLAN_ORDER[currentPlan];

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPlan(p.id)}
                  className={`relative rounded-xl p-6 transition-all cursor-pointer ${
                    disabled
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:border-[#ff6b6b]/50'
                  } ${
                    isSelected
                      ? 'border-2 border-[#ff6b6b] bg-[#ff6b6b]/10'
                      : 'border border-white/10 bg-[#121212]/80 hover:bg-[#1f1f1f]/80'
                  } ${p.popular ? 'ring-2 ring-[#ff6b6b]/30' : ''}
                  `}
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff6b6b] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                      Most Popular
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 right-3 bg-gray-700 text-gray-400 text-xs font-medium px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-white mb-1">{p.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-white">${price}</span>
                      <span className="text-gray-400">/mo</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Billed {billingCycle === 'monthly' ? `monthly ($${p.price.monthly}/mo)` : `annually ($${p.price.annual}/yr)`}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <svg className="w-5 h-5 text-[#ff6b6b] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-white/10">
                    {disabled ? (
                      <button className="w-full py-3 rounded-full bg-gray-700 text-gray-500 font-medium cursor-not-allowed">
                        Current Plan
                      </button>
                    ) : (
<button
                      onClick={(e) => { e.stopPropagation(); handleConfirm(p.id); }}
                      disabled={processingPlan !== null}
                      className={`w-full py-3 rounded-full font-bold transition ${
                        cardIsUpgrade
                          ? 'bg-[#ff6b6b] text-black hover:scale-[1.02]'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      } ${processingPlan === p.id ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {processingPlan === p.id ? 'Processing...' : cardIsUpgrade ? `Upgrade to ${p.name}` : `Downgrade to ${p.name}`}
                    </button>
                    )}
                    {cardIsDowngrade && (
                      <p className="text-center text-xs text-yellow-400 mt-2">
                        Downgrade takes effect at end of billing period
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}