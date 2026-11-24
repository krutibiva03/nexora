import React, { useEffect, useRef, useState } from 'react';

interface UniverseBackgroundProps {
  variant?: 'landing' | 'workspace' | 'discover';
}

export const UniverseBackground: React.FC<UniverseBackgroundProps> = ({ variant = 'workspace' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [enableDesktopEffects, setEnableDesktopEffects] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEnableDesktopEffects(finePointer && !reducedMotion);

    if (!finePointer || reducedMotion) return;

    let rafId = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setCursorPos({ x: e.clientX, y: e.clientY });
      });
    };
    const onLeave = () => setCursorPos(null);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // Warm rose & midnight ember atmospheric particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 28 : 58;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    interface Mote {
      x: number;
      y: number;
      r: number;
      alpha: number;
      vx: number;
      vy: number;
      hue: string;
    }

    const hues = ['244, 91, 132', '250, 244, 246', '217, 198, 236', '200, 62, 136'];
    const motes: Mote[] = Array.from({ length: particleCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.4,
      alpha: Math.random() * 0.4 + 0.12,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.08 - 0.05,
      hue: hues[i % hues.length],
    }));

    let animId = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const m of motes) {
        if (!reducedMotion) {
          m.x += m.vx;
          m.y += m.vy;
          if (m.x < 0) m.x = width;
          if (m.x > width) m.x = 0;
          if (m.y < 0) m.y = height;
          if (m.y > height) m.y = 0;
        }
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${m.hue}, ${m.alpha})`;
        ctx.fill();
      }
      if (!reducedMotion) {
        animId = requestAnimationFrame(draw);
      }
    };

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      if (reducedMotion) draw();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Deep Burgundy & Midnight Black Base Atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background:
            variant === 'landing'
              ? 'radial-gradient(ellipse 85% 60% at 50% -10%, rgba(110, 18, 51, 0.38), transparent 70%), radial-gradient(ellipse 65% 50% at 88% 20%, rgba(244, 91, 132, 0.14), transparent 65%), linear-gradient(180deg, #070306 0%, #16050D 52%, #070306 100%)'
              : variant === 'discover'
                ? 'radial-gradient(ellipse 75% 50% at 18% 0%, rgba(110, 18, 51, 0.28), transparent 65%), radial-gradient(ellipse 60% 50% at 85% 15%, rgba(217, 198, 236, 0.10), transparent 65%), #070306'
                : 'radial-gradient(ellipse 75% 55% at 75% -12%, rgba(110, 18, 51, 0.26), transparent 65%), radial-gradient(ellipse 55% 45% at 8% 92%, rgba(244, 91, 132, 0.10), transparent 65%), #070306',
        }}
      />

      {/* Subtle Masked Architectural Grid */}
      <div
        className="absolute inset-0 nexora-grid-bg opacity-40"
        style={{
          maskImage: 'radial-gradient(ellipse 85% 75% at 50% 30%, black 35%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 75% at 50% 30%, black 35%, transparent 100%)',
        }}
      />

      {/* Slowly Breathing Ambient Burgundy & Rose Orbs */}
      <div className="absolute -top-36 -left-24 w-[480px] h-[480px] rounded-full bg-[#6E1233]/28 blur-[140px] animate-orb-pulse" />
      <div
        className="absolute top-1/3 -right-28 w-[420px] h-[420px] rounded-full bg-[#F45B84]/12 blur-[140px] animate-orb-pulse"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute -bottom-36 left-1/3 w-[380px] h-[380px] rounded-full bg-[#D9C6EC]/08 blur-[150px] animate-orb-pulse"
        style={{ animationDelay: '3.4s' }}
      />

      {/* Atmospheric Particles Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-75" />

      {/* Subtle Desktop-Only Cursor Glow */}
      {enableDesktopEffects && cursorPos && (
        <div
          className="fixed w-[400px] h-[400px] rounded-full transition-opacity duration-300"
          style={{
            left: cursorPos.x - 200,
            top: cursorPos.y - 200,
            background:
              'radial-gradient(circle, rgba(244, 91, 132, 0.09) 0%, rgba(110, 18, 51, 0.06) 42%, transparent 72%)',
          }}
        />
      )}
    </div>
  );
};
