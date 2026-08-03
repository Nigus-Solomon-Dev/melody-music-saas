'use client';

import { useEffect, useRef } from 'react';

const TOTAL_FRAMES = 300;

export default function CanvasBackground({ scrollRef = null, darker = false, dim = false }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const frameRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const scrollEl = scrollRef?.current;

    function setSize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    setSize();
    window.addEventListener('resize', () => { setSize(); drawFrame(frameRef.current); });

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/images/ezgif-frame-${String(i).padStart(3, '0')}.jpg`;
      img.onload = () => { if (i === 1) drawFrame(0); };
      imagesRef.current.push(img);
    }

    function drawFrame(index) {
      const img = imagesRef.current[index];
      if (!img || !img.complete || !img.naturalWidth) return;
      const { width: cw, height: ch } = canvas;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - sw) / 2, (ch - sh) / 2, sw, sh);
    }

    let targetFrame = 0;
    let currentFrame = 0;

    function onScroll() {
      let maxScroll;
      let progress;
      if (scrollEl) {
        maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
        progress = maxScroll > 0 ? Math.min(scrollEl.scrollTop / maxScroll, 1) : 0;
      } else {
        maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        progress = Math.min(window.scrollY / maxScroll, 1);
      }
      targetFrame = Math.round(progress * (TOTAL_FRAMES - 1));
    }

    function animate() {
      currentFrame += (targetFrame - currentFrame) * 0.15;
      const frame = Math.round(currentFrame);
      if (frame !== frameRef.current) {
        frameRef.current = frame;
        drawFrame(frame);
      }
      rafRef.current = requestAnimationFrame(animate);
    }

    if (scrollEl) {
      scrollEl.addEventListener('scroll', onScroll, { passive: true });
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', onScroll);
      } else {
        window.removeEventListener('scroll', onScroll);
      }
      cancelAnimationFrame(rafRef.current);
    };
  }, [scrollRef]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-0"
        style={darker ? { filter: 'blur(8px) brightness(0.45) saturate(0.85)' } : dim ? { filter: 'brightness(0.8) saturate(0.95)' } : undefined}
      />
      {darker && <div className="fixed inset-0 z-0 bg-black/40 pointer-events-none" />}
      {dim && <div className="fixed inset-0 z-0 bg-black/25 pointer-events-none" />}
    </>
  );
}
