'use client';

import { useSubscription } from '@/context/SubscriptionContext';

const PLAN_LABELS = {
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const PLAN_COLORS = {
  basic: 'bg-gray-600',
  pro: 'bg-[#ff6b6b] text-black',
  enterprise: 'bg-purple-600',
};

export default function SubscriptionCard() {
  const { hasSubscription, plan, status, currentPeriodEnd, cancelAtPeriodEnd, trialEnd, loading, resumeSubscription, refetch, openBillingPortal } = useSubscription();

  const handleResume = async () => {
    try {
      await resumeSubscription();
      await refetch();
    } catch (err) {
      alert(err.message || 'Failed to resume subscription');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'â€”';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((new Date(trialEnd) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const statusColors = {
    active: 'text-white',
    trialing: 'text-blue-400',
    past_due: 'text-yellow-400',
    canceled: 'text-red-400',
    incomplete: 'text-gray-400',
    incomplete_expired: 'text-red-400',
    unpaid: 'text-red-400',
    paused: 'text-gray-400',
  };

  if (loading) {
    return (
      <div className="bg-[#1f1f1f]/80 backdrop-blur-sm rounded-xl p-6 border border-white/10 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-6"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="bg-[#1f1f1f]/80 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-xl font-bold text-white mb-2">No Active Subscription</h3>
        <p className="text-gray-400 mb-6 max-w-xs mx-auto">
          Unlock full playback, offline downloads, and higher quality audio.
        </p>
        <a href="/pricing" className="inline-block bg-[#ff6b6b] text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition">
          View Plans
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1f1f1f]/90 to-[#121212]/90 backdrop-blur-sm rounded-xl p-6 border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff6b6b]/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${PLAN_COLORS[plan] || 'bg-gray-600'}`}>
            {PLAN_LABELS[plan] || plan}
          </span>
          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'text-gray-400'}`}>
            {status.replace('_', ' ')}
          </span>
        </div>
        {cancelAtPeriodEnd && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-500/30">
            Cancels {formatDate(currentPeriodEnd)}
          </span>
        )}
        {status === 'trialing' && daysLeft !== null && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-500/30">
            {daysLeft} day{daysLeft === 1 ? '' : 's'} left in trial
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-black/30 rounded-lg p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
            {status === 'trialing' ? 'Trial Ends' : 'Renews'}
          </p>
          <p className="text-xs font-bold text-white truncate px-0.5">{formatDate(status === 'trialing' ? trialEnd : currentPeriodEnd)}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Status</p>
          <p className={`text-xs font-bold truncate px-0.5 ${statusColors[status] || 'text-white'}`}>
            {status.replace('_', ' ')}
          </p>
        </div>
        <div className="bg-black/30 rounded-lg p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Plan</p>
          <p className="text-xs font-bold text-white capitalize truncate px-0.5">{plan}</p>
        </div>
      </div>

      {cancelAtPeriodEnd && (
        <div className="mt-5 pt-5 border-t border-white/10 flex justify-center">
          <button
            onClick={handleResume}
            className="px-6 py-2.5 rounded-full bg-[#ff6b6b] text-black text-sm font-bold hover:scale-105 hover:shadow-lg hover:shadow-[#ff6b6b]/20 transition"
          >
            Resume Subscription
          </button>
        </div>
      )}

      {status === 'past_due' && (
        <div className="mt-5 pt-5 border-t border-white/10">
          <p className="text-sm text-yellow-400 text-center mb-4">
            Your latest payment failed. Update your payment method to keep your subscription active.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => openBillingPortal()}
              className="px-6 py-2.5 rounded-full bg-[#ff6b6b] text-black text-sm font-bold hover:scale-105 hover:shadow-lg hover:shadow-[#ff6b6b]/20 transition"
            >
              Update Payment Method
            </button>
          </div>
        </div>
      )}
    </div>
  );
}