'use client';

import { useState } from 'react';
import { signup, login } from '../lib/api';

const inputWrapClass = "flex items-center gap-3 bg-[#2a2a2a] border border-white/10 rounded-xl px-4 py-3 transition-all focus-within:border-[#ff6b6b]/50 focus-within:bg-[#2f2f2f] focus-within:shadow-[0_0_0_3px_rgba(255,107,107,0.12)]";
const inputClass = "flex-1 min-w-0 bg-transparent border-none text-white text-base outline-none placeholder-white/30 autofill-fix";

function FieldIcon({ type }) {
  if (type === 'user') {
    return (
      <svg className="w-5 h-5 flex-shrink-0 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }
  if (type === 'mail') {
    return (
      <svg className="w-5 h-5 flex-shrink-0 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="m2 7 10 6L22 7" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 flex-shrink-0 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="3" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function AuthModal({ open, mode, onClose, onToggleMode, onAuthSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const isSignup = mode === 'signup';

  function resetForm() {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
  }

  function close() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = isSignup
        ? await signup({ name, email, password })
        : await login({ email, password });
      resetForm();
      onAuthSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" onClick={close}>
      <style jsx global>{`
        .autofill-fix:-webkit-autofill,
        .autofill-fix:-webkit-autofill:hover,
        .autofill-fix:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff;
          -webkit-box-shadow: 0 0 0 1000px #2a2a2a inset;
          box-shadow: 0 0 0 1000px #2a2a2a inset;
          transition: background-color 9999s ease-out;
          caret-color: #ffffff;
        }
      `}</style>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-gradient-to-b from-[#1f1f1f] to-[#121212] w-full max-w-[600px] rounded-2xl text-center px-14 py-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_0_40px_rgba(255,107,107,0.08)] border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* soft glow accent */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#ff6b6b]/15 blur-3xl rounded-full pointer-events-none" />

        <button
          onClick={close}
          className="absolute top-3 left-3 z-10 w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[#ff6b6b] to-red-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#ff6b6b]/25">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
        </div>

        <h1 className="relative text-[32px] font-black -tracking-wider leading-[1.1] mb-7 text-white">
          {isSignup ? 'Sign up to start listening' : 'Welcome back'}
        </h1>

        <form className="text-left" onSubmit={handleSubmit}>
          {isSignup && (
            <div className="mb-4">
              <label className="block font-semibold text-sm mb-2 text-white/80" htmlFor="name">Name</label>
              <div className={inputWrapClass}>
                <FieldIcon type="user" />
                <input
                  type="text"
                  id="name"
                  placeholder="What should we call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          )}
          <div className="mb-4">
            <label className="block font-semibold text-sm mb-2 text-white/80" htmlFor="email">Email address</label>
            <div className={inputWrapClass}>
              <FieldIcon type="mail" />
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-sm mb-2 text-white/80" htmlFor="password">Password</label>
            <div className={inputWrapClass}>
              <FieldIcon type="lock" />
              <input
                type="password"
                id="password"
                placeholder={isSignup ? 'At least 6 characters' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p className="text-[#f15e6c] text-sm font-semibold mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#ff6b6b] to-red-600 text-white border-none rounded-[500px] p-3.5 text-base font-bold cursor-pointer mt-2 shadow-lg shadow-[#ff6b6b]/25 hover:scale-[1.02] hover:shadow-[#ff6b6b]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-[#b3b3b3] text-base">
          <span>{isSignup ? 'Already have an account?' : "Don't have an account?"}</span>
          <a
            className="text-white font-bold underline cursor-pointer block mt-2 hover:text-[#ff6b6b]"
            onClick={() => { setError(''); onToggleMode(); }}
          >
            {isSignup ? 'Log in' : 'Sign up for Melody'}
          </a>
        </div>
      </div>
    </div>
  );
}
