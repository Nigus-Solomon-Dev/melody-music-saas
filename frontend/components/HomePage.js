'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import CanvasBackground from './CanvasBackground';
import Header from './Header';
import HeroSection from './HeroSection';
import ContentSection from './ContentSection';
import MusicCard from './MusicCard';
import Footer from './Footer';
import StartListeningModal from './StartListeningModal';
import AuthModal from './AuthModal';
import { musicApi } from '../lib/musicApi';
import { setToken, clearToken, getToken, getMe } from '../lib/api';
export default function HomePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [user, setUser] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsAuthOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    musicApi
      .chart(30)
      .then((data) => setTracks(data.tracks))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    getMe()
      .then((data) => {
        setUser(data.user);
        router.replace('/dashboard');
      })
      .catch(() => clearToken());
  }, [router]);

  function openAuth(mode) {
    setIsModalOpen(false);
    setAuthMode(mode);
    setIsAuthOpen(true);
  }

  function handleAuthSuccess(authData) {
    setToken(authData.token);
    setUser(authData.user);
    setIsAuthOpen(false);
    router.push('/dashboard');
  }

  function handleLogout() {
    clearToken();
    setUser(null);
  }

  function openSignupForSong() {
    setIsModalOpen(true);
  }

  return (
    <div>
      <CanvasBackground />
      <div className="fixed inset-0 bg-black/50 z-0 pointer-events-none" />

      <div className="relative z-10">
        <Header
          user={user}
          onOpenAuth={openAuth}
          onLogout={handleLogout}
          onSearchSubmit={() => setIsModalOpen(true)}
        />

        <HeroSection tracks={tracks.slice(0, 3)} onStart={() => setIsModalOpen(true)} />

        <ContentSection title="Trending Now" subtitle="What the world is listening to" id="wave-note-browse">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
                  <div className="w-full aspect-square rounded-md bg-white/10 mb-3" />
                  <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-2.5 bg-white/10 rounded w-1/2" />
                </div>
              ))
            : tracks.slice(0, 8).map((track) => (
                <MusicCard key={track.id} track={track} onClick={openSignupForSong} />
              ))}
        </ContentSection>

        <ContentSection title="Popular Albums and Singles" subtitle="Fresh drops and timeless classics" bgClass="bg-black/40">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
                  <div className="w-full aspect-square rounded-md bg-white/10 mb-3" />
                  <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-2.5 bg-white/10 rounded w-1/2" />
                </div>
              ))
            : tracks.slice(8, 16).map((track) => (
                <MusicCard key={track.id} track={track} onClick={openSignupForSong} />
              ))}
        </ContentSection>

        <ContentSection title="Radio & Mixes" subtitle="Curated stations for every mood">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
                  <div className="w-full aspect-square rounded-md bg-white/10 mb-3" />
                  <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-2.5 bg-white/10 rounded w-1/2" />
                </div>
              ))
            : tracks.slice(16, 24).map((track) => (
                <MusicCard key={track.id} track={track} onClick={openSignupForSong} />
              ))}
        </ContentSection>

        <Footer />
      </div>

      <StartListeningModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOpenAuth={openAuth}
      />

      <AuthModal
        open={isAuthOpen}
        mode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onToggleMode={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
