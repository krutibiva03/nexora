import React, { useEffect, useRef } from 'react';

interface ParticleWordmarkCanvasProps {
  text?: string;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  phase: number;
  smokeDrift: number;
}

const PALETTE = [
  '250, 244, 246', // Warm White
  '244, 91, 132',  // Rose Pink
  '200, 62, 136',  // Soft Magenta
  '217, 198, 236', // Subtle Lavender
  '158, 26, 67',   // Dark Wine Red
];

export const ParticleWordmarkCanvas: React.FC<ParticleWordmarkCanvasProps> = ({
  text = 'NEXORA',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: Particle[] = [];
    let animId = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    let glitchTimer = 0;

    const sampleWordmark = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(280, Math.floor(rect.width));
      height = Math.max(96, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const off = document.createElement('canvas');
      off.width = width;
      off.height = height;
      const octx = off.getContext('2d');
      if (!octx) return;

      const fontSize = Math.min(Math.max(width * 0.21, 52), 132);
      octx.clearRect(0, 0, width, height);
      octx.fillStyle = '#ffffff';
      octx.textAlign = 'left';
      octx.textBaseline = 'middle';
      octx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
      octx.fillText(text, 4, height / 2 + 2);

      const imageData = octx.getImageData(0, 0, width, height).data;
      const step = width < 480 ? 3 : 2;
      const nextParticles: Particle[] = [];

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const alphaByte = imageData[(y * width + x) * 4 + 3];
          if (alphaByte > 128) {
            const scatter = reducedMotion ? 0 : Math.max(width, 400) * 0.45;
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * scatter;
            const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            nextParticles.push({
              x: reducedMotion ? x : x + Math.cos(angle) * dist,
              y: reducedMotion ? y : y + Math.sin(angle) * dist * 0.5,
              tx: x,
              ty: y,
              vx: 0,
              vy: 0,
              size: Math.random() * 1.45 + 0.75,
              color,
              alpha: Math.random() * 0.35 + 0.65,
              phase: Math.random() * Math.PI * 2,
              smokeDrift: Math.random() * 0.7 + 0.3,
            });
          }
        }
      }

      // Cap count cleanly for 60fps smoothness across devices
      const maxParticles = width < 640 ? 1100 : 2400;
      if (nextParticles.length > maxParticles) {
        const stride = nextParticles.length / maxParticles;
        const sampled: Particle[] = [];
        for (let i = 0; i < nextParticles.length; i += stride) {
          sampled.push(nextParticles[Math.floor(i)]);
        }
        particles = sampled;
      } else {
        particles = nextParticles;
      }
    };

    sampleWordmark();

    const drawFrame = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      glitchTimer += 1;
      const isGlitchPulse = !reducedMotion && glitchTimer % 260 > 248;
      const t = now * 0.0014;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!reducedMotion) {
          // Spring attraction toward target letter glyph
          const dxTarget = p.tx - p.x;
          const dyTarget = p.ty - p.y;
          p.vx += dxTarget * 0.085;
          p.vy += dyTarget * 0.085;

          // Subtle smoke drift wave
          p.vx += Math.sin(t + p.phase) * 0.045 * p.smokeDrift;
          p.vy += Math.cos(t * 0.8 + p.phase) * 0.035 * p.smokeDrift;

          // Interactive cursor dispersion
          if (finePointer) {
            const dxMouse = p.x - pointerX;
            const dyMouse = p.y - pointerY;
            const distSq = dxMouse * dxMouse + dyMouse * dyMouse;
            if (distSq < 3600 && distSq > 1) {
              const dist = Math.sqrt(distSq);
              const force = (60 - dist) / 60;
              p.vx += (dxMouse / dist) * force * 3.8;
              p.vy += (dyMouse / dist) * force * 3.8;
            }
          }

          // Subtle glitch slice offset
          if (isGlitchPulse && Math.abs(p.ty - height * 0.48) < 18) {
            p.x += (Math.random() - 0.5) * 3.5;
          }

          p.vx *= 0.78;
          p.vy *= 0.78;
          p.x += p.vx;
          p.y += p.vy;
        }

        const shimmer = reducedMotion ? 1 : 0.82 + 0.18 * Math.sin(t * 2 + p.phase);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha * shimmer})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      if (!reducedMotion) {
        animId = requestAnimationFrame(drawFrame);
      }
    };

    animId = requestAnimationFrame(drawFrame);

    const onPointerMove = (e: PointerEvent) => {
      if (!finePointer) return;
      const rect = canvas.getBoundingClientRect();
      pointerX = e.clientX - rect.left;
      pointerY = e.clientY - rect.top;
    };

    const onPointerLeave = () => {
      pointerX = -9999;
      pointerY = -9999;
    };

    const resizeObserver = new ResizeObserver(() => {
      sampleWordmark();
      if (reducedMotion) {
        drawFrame(performance.now());
      }
    });
    resizeObserver.observe(container);

    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[108px] sm:h-[132px] md:h-[156px] select-none ${className}`}
    >
      <span className="sr-only">{text}</span>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block w-full h-full cursor-crosshair"
      />
    </div>
  );
};
