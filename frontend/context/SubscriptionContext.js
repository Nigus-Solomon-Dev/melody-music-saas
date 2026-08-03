'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { subscriptionApi } from '@/lib/api';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);

  const fetchSubscription = useCallback(async () => {
    try {
      setError(null);
      const data = await subscriptionApi.getMe();
      setSubscription(data);
    } catch (err) {
      setError(err.message);
      setSubscription({ hasSubscription: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubscription();
  }, [fetchSubscription]);

  // Keep entitlements fresh: webhooks mutate the DB (cancel, past_due, trial end)
  // after the initial load, so re-sync whenever the tab regains focus.
  useEffect(() => {
    const onFocus = () => fetchSubscription();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchSubscription();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchSubscription]);

  const createSubscription = async (plan, trialDays, billingCycle = 'monthly') => {
    const data = await subscriptionApi.create(plan, trialDays, billingCycle);
    return data;
  };

  const upgradeSubscription = async (newPlan) => {
    const data = await subscriptionApi.upgrade(newPlan);
    setSubscription((prev) => ({
      ...prev,
      hasSubscription: true,
      subscription: {
        ...(prev?.subscription || {}),
        plan: data?.plan ?? newPlan,
        status: data?.status ?? prev?.subscription?.status ?? 'active',
        currentPeriodEnd: data?.currentPeriodEnd ?? prev?.subscription?.currentPeriodEnd,
      },
    }));
    await refetch();
  };

  const cancelSubscription = async () => {
    const data = await subscriptionApi.cancel();
    setSubscription((prev) => ({
      ...prev,
      subscription: {
        ...(prev?.subscription || {}),
        cancelAtPeriodEnd: data?.subscription?.cancelAtPeriodEnd ?? true,
      },
    }));
    await refetch();
  };

  const resumeSubscription = async () => {
    const data = await subscriptionApi.resume();
    setSubscription((prev) => ({
      ...prev,
      subscription: {
        ...(prev?.subscription || {}),
        cancelAtPeriodEnd: data?.subscription?.cancelAtPeriodEnd ?? false,
      },
    }));
    await refetch();
  };

  const openBillingPortal = async () => {
    const data = await subscriptionApi.portal();
    window.location.href = data.url;
  };

  const refetch = fetchSubscription;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        error,
        createSubscription,
        upgradeSubscription,
        cancelSubscription,
        resumeSubscription,
        openBillingPortal,
        refetch,
        hasSubscription: subscription?.hasSubscription ?? false,
        plan: subscription?.subscription?.plan ?? null,
        status: subscription?.subscription?.status ?? null,
        currentPeriodEnd: subscription?.subscription?.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: subscription?.subscription?.cancelAtPeriodEnd ?? false,
        trialEnd: subscription?.subscription?.trialEnd ?? null,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}