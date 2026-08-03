'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/context/SubscriptionContext';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for casual listeners',
    price: { monthly: 10.0, annual: 100 },
    features: [
      'Ad-free listening',
      '128kbps audio quality',
      '10 playlists max',
      '1 device',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For music enthusiasts',
    price: { monthly: 29.0, annual: 290 },
    features: [
      'Everything in Basic',
      '320kbps audio quality',
      'Unlimited playlists',
      '3 devices',
      'Full song playback',
      'Offline downloads',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For teams & power users',
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
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { hasSubscription, plan: currentPlan, createSubscription } = useSubscription();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [processingPlan, setProcessingPlan] = useState(null);

  const handleStartTrial = async (planId) => {
    if (processingPlan) return;
    setProcessingPlan(planId);
    try {
      const data = await createSubscription(planId, 7, billingCycle); // 7-day trial
      if (data.url) {
        router.push(data.url);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      alert(err.message || 'Failed to start checkout');
    } finally {
      setProcessingPlan(null);
    }
  };

  if (hasSubscription) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">You&apos;re on {currentPlan} Plan</h1>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Manage your subscription or change plans from your dashboard.
          </p>
          <a href="/dashboard/settings" className="inline-block bg-[#ff6b6b] text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff6b6b]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#ff6b6b]/20 text-[#ff6b6b] text-sm font-medium mb-6">
            7-day free trial • Cancel anytime
          </span>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Simple, transparent{' '}
            <span className="text-[#ff6b6b]">pricing</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            All plans include access to millions of tracks, personalized recommendations, and cross-device sync.
          </p>
          
          <div className="flex justify-center gap-2 mb-12">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                billingCycle === 'monthly'
                  ? 'bg-[#ff6b6b] text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                billingCycle === 'annual'
                  ? 'bg-[#ff6b6b] text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Annual <span className="text-xs text-[#ff6b6b] ml-1">(2 months free)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((p) => {
              const price = billingCycle === 'monthly' ? p.price.monthly : Math.round(p.price.annual / 12);
              const totalPrice = billingCycle === 'monthly' ? p.price.monthly : p.price.annual;
              const isCurrent = hasSubscription && p.id === currentPlan;

              return (
                <article
                  key={p.id}
                  onClick={() => handleStartTrial(p.id)}
                  className={`cursor-pointer relative rounded-2xl p-8 transition-all ${
                    isCurrent
                      ? 'border-2 border-[#ff6b6b] bg-[#ff6b6b]/10 ring-2 ring-[#ff6b6b]/20'
                      : 'border border-white/10 bg-[#121212]/80 hover:border-[#ff6b6b]/30 hover:bg-[#1f1f1f]/80'
                  } ${p.popular ? 'scale-105 z-10' : ''}
                  `}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#ff6b6b] text-black text-xs font-bold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 right-3">
                      <span className="bg-gray-700 text-gray-400 text-xs font-medium px-3 py-1 rounded-full">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{p.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-white">${price}</span>
                      <span className="text-gray-400">/mo</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Billed {billingCycle === 'monthly' ? `monthly ($${p.price.monthly}/mo)` : `annually ($${p.price.annual}/yr)`}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                        <svg className="w-5 h-5 text-[#ff6b6b] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleStartTrial(p.id); }}
                    disabled={isCurrent || processingPlan !== null}
                    className={`w-full py-3 rounded-full font-bold text-sm transition ${
                      isCurrent
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-[#ff6b6b] text-black hover:scale-[1.02] hover:shadow-lg hover:shadow-[#ff6b6b]/20'
                    } ${processingPlan === p.id ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {processingPlan === p.id ? 'Processing...' : isCurrent ? 'Current Plan' : 'Start 7-day Free Trial'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Questions?</h2>
          <dl className="space-y-4 text-gray-300">
            {[
              ['Can I cancel anytime?', 'Yes, cancel anytime from your dashboard. You\'ll keep access until the end of your billing period.'],
              ['What payment methods do you accept?', 'All major credit cards, Apple Pay, Google Pay via Stripe.'],
              ['Is there a free trial?', 'Yes, all plans come with a 7-day free trial. No charge if you cancel before it ends.'],
              ['Can I switch plans later?', 'Absolutely. Upgrades take effect immediately with prorated billing. Downgrades apply at the next billing cycle.'],
              ['What happens after my trial?', 'You\'ll be automatically charged for your selected plan unless you cancel before the trial ends.'],
            ].map(([q, a], i) => (
              <div key={i} className="bg-[#1f1f1f]/80 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <dt className="font-bold text-white mb-2">{q}</dt>
                <dd className="text-gray-400">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
    </>
  );
}