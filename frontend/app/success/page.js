'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSubscription } from '@/context/SubscriptionContext';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch, hasSubscription, plan } = useSubscription();
  const [status, setStatus] = useState('checking'); // checking, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    const verifySubscription = async () => {
      if (!sessionId) {
        setStatus('error');
        setMessage('No session ID found. Please try again.');
        return;
      }

      try {
        await refetch();
        if (hasSubscription) {
          setStatus('success');
          setMessage('Your subscription is now active!');
          return;
        }

        // Subscription might take a moment to appear via webhook
        setStatus('checking');
        setMessage('Verifying your subscription...');

        // Poll a few times
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 2000));
          await refetch();
          if (hasSubscription) {
            setStatus('success');
            setMessage('Your subscription is now active!');
            return;
          }
        }

        setStatus('error');
        setMessage('Subscription not detected yet. Please check your dashboard in a moment.');
      } catch {
        setStatus('error');
        setMessage('Failed to verify subscription. Please check your dashboard.');
      }
    };

    verifySubscription();
  }, [searchParams, refetch, hasSubscription]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 border-4 border-[#ff6b6b] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Verifying Subscription</h1>
          <p className="text-gray-400">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {status === 'success' ? (
          <>
            <div className="w-20 h-20 bg-[#ff6b6b]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to {plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Premium'}!</h1>
            <p className="text-gray-400 mb-8">{message}</p>
            <a
              href="/dashboard"
              className="inline-block bg-[#ff6b6b] text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition"
            >
              Go to Dashboard
            </a>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
            <p className="text-gray-400 mb-8">{message}</p>
            <div className="flex gap-4 justify-center">
              <a
                href="/pricing"
                className="inline-block bg-gray-800 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-700 transition"
              >
                Try Again
              </a>
              <a
                href="/dashboard"
                className="inline-block border border-gray-600 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-800 transition"
              >
                Check Dashboard
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-[#ff6b6b] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold">Verifying Subscription</h1>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}