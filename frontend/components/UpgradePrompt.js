'use client';

import { useRouter } from 'next/navigation';
import { useSubscription } from '@/context/SubscriptionContext';

const PLAN_NAMES = { basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise' };

export default function UpgradePrompt({ feature, requiredPlan = 'pro', compact = false }) {
  const router = useRouter();
  const { plan } = useSubscription();
  const target = PLAN_NAMES[requiredPlan] || PLAN_NAMES.pro;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border border-[#ff6b6b]/25 bg-[#ff6b6b]/5 ${
        compact ? 'px-3 py-2' : 'px-4 py-3'
      }`}
    >
      <p className={`text-[#b3b3b3] ${compact ? 'text-[11px]' : 'text-sm'}`}>
        <span className="text-white font-medium">{feature}</span> is available on the {target} plan.
      </p>
      <button
        onClick={() => router.push('/dashboard/settings')}
        className={`flex-shrink-0 rounded-full bg-[#ff6b6b] text-black font-bold transition hover:scale-105 active:scale-95 ${
          compact ? 'px-3 py-1.5 text-[11px]' : 'px-5 py-2.5 text-xs'
        }`}
      >
        Upgrade to {target}
      </button>
    </div>
  );
}
