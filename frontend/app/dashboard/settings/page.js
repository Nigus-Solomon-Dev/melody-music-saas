'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/context/SubscriptionContext';
import { getToken, clearToken, getMe } from '../../../lib/api';
import CanvasBackground from '../../../components/CanvasBackground';
import SubscriptionCard from '../../../components/dashboard/SubscriptionCard';
import PlanSelector from '../../../components/dashboard/PlanSelector';
import BillingPortalButton from '../../../components/dashboard/BillingPortalButton';
import UsageMeter from '../../../components/dashboard/UsageMeter';

export default function SettingsPage() {
  const router = useRouter();
  const { hasSubscription, cancelAtPeriodEnd, cancelSubscription } = useSubscription();
  const [user, setUser] = useState(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await cancelSubscription();
      setCancelModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/');
      return;
    }
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        clearToken();
        router.replace('/');
      })
      .finally(() => setAuthLoading(false));
  }, [router]);

  if (authLoading) {
    return (
      <div className="relative min-h-screen flex flex-col">
        <CanvasBackground />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#ff6b6b] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white/70 font-medium text-sm">Checking your session…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col select-none overflow-hidden font-sans bg-black">
      <CanvasBackground />

      <style jsx global>{`
        @import url('https://fonts.cdnfonts.com/css/circular-std-book');
        body { font-family: 'Circular Std', -apple-system, BlinkMacSystemFont, sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
      `}</style>

      {/* HEADER */}
      <header className="h-16 px-3 sm:px-6 flex items-center justify-between gap-2 flex-shrink-0 bg-black/50 backdrop-blur-sm text-white z-10 relative border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff6b6b] to-red-700 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white truncate">Settings &amp; Billing</h1>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-xs font-bold text-white bg-gradient-to-r from-[#ff6b6b] to-red-600 px-4 py-2 rounded-full shadow-md shadow-[#ff6b6b]/25 hover:scale-105 hover:shadow-[#ff6b6b]/40 transition"
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto custom-scrollbar z-10 relative px-6 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: subscription status + usage */}
          <div className="flex flex-col gap-4">
            <SubscriptionCard />
            <UsageMeter />
          </div>

          {/* Right: plan management + account */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#1f1f1f]/80 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-2">Plan Management</h3>
              <p className="text-sm text-gray-400 mb-6">
                Upgrade, downgrade, or manage your billing. Plan changes follow your billing cycle.
              </p>
              <div className="flex flex-col gap-3">
                {hasSubscription ? (
                  <button
                    onClick={() => setPlanModalOpen(true)}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-[#ff6b6b] to-red-600 text-white font-bold text-sm shadow-md shadow-[#ff6b6b]/25 hover:scale-[1.02] hover:shadow-[#ff6b6b]/40 transition"
                  >
                    Change Plan
                  </button>
                ) : (
                  <a
                    href="/pricing"
                    className="w-full py-3 rounded-full bg-gradient-to-r from-[#ff6b6b] to-red-600 text-white font-bold text-sm shadow-md shadow-[#ff6b6b]/25 hover:scale-[1.02] hover:shadow-[#ff6b6b]/40 transition text-center block"
                  >
                    View Plans
                  </a>
                )}
                <BillingPortalButton className="w-full justify-center" />
                {hasSubscription && !cancelAtPeriodEnd && (
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className={`w-full py-3 rounded-full border border-red-500/40 text-red-400 font-bold text-sm transition hover:bg-red-500/10 hover:scale-[1.02]`}
                  >
                    Cancel Subscription
                  </button>
                )}
                {hasSubscription && cancelAtPeriodEnd && (
                  <p className="text-center text-xs text-yellow-400">
                    Your subscription is set to cancel at the end of the billing period.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-[#1f1f1f]/80 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Account</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Name</dt>
                  <dd className="text-white font-medium">{user?.name || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Email</dt>
                  <dd className="text-white font-medium">{user?.email || '—'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>

      {planModalOpen && (
        <PlanSelector
          onClose={() => setPlanModalOpen(false)}
          onSuccess={() => setPlanModalOpen(false)}
        />
      )}

      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] rounded-2xl border border-red-500/30 max-w-md w-full overflow-hidden shadow-2xl shadow-black/60">
            <div className="bg-gradient-to-r from-[#ff6b6b]/20 to-red-600/5 px-6 py-5 flex items-center gap-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.75-3L13.75 4a2 2 0 00-3.5 0L3.25 16a2 2 0 001.75 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cancel your subscription?</h3>
                <p className="text-sm text-gray-400">This action can be undone before the period ends.</p>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-300 leading-relaxed mb-2">
                Are you sure you want to cancel? You will <span className="text-white font-medium">keep full access until the end of the billing period</span>, then lose Pro features like full song playback.
              </p>
              <p className="text-xs text-gray-500 mb-6">
                You can resume your subscription anytime before your period ends.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={() => setCancelModalOpen(false)}
                  disabled={canceling}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-white bg-white/10 hover:bg-white/20 transition"
                >
                  Keep my plan
                </button>
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-[#ff6b6b] to-red-600 text-white shadow-md shadow-[#ff6b6b]/25 transition ${
                    canceling ? 'opacity-50 cursor-wait' : 'hover:scale-105 hover:shadow-[#ff6b6b]/40'
                  }`}
                >
                  {canceling ? 'Canceling…' : 'Yes, cancel subscription'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
