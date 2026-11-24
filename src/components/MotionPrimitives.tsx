import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

export const RevealSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ImageReveal: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.05 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      className={`overflow-hidden ${className}`}
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
};

export const AnimatedCounter: React.FC<{
  value: number;
  suffix?: string;
  className?: string;
}> = ({ value, suffix = '', className = '' }) => {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }

    const start = prevRef.current;
    const end = value;
    const duration = 550;
    const startTime = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prevRef.current = end;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className={`tabular-nums ${className}`}>
      {display}
      {suffix}
    </span>
  );
};

export const MagneticButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  ariaLabel?: string;
}> = ({ children, onClick, disabled, type = 'button', className = '', ariaLabel }) => {
  const ref = useRef<HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 20 });
  const springY = useSpring(y, { stiffness: 260, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !window.matchMedia('(pointer: fine)').matches) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const offsetX = (e.clientX - (rect.left + rect.width / 2)) * 0.16;
    const offsetY = (e.clientY - (rect.top + rect.height / 2)) * 0.16;
    x.set(Math.max(-8, Math.min(8, offsetX)));
    y.set(Math.max(-6, Math.min(6, offsetY)));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={className}
    >
      {children}
    </motion.button>
  );
};

export const TiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}> = ({ children, className = '', glowColor = 'rgba(244, 91, 132, 0.24)' }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [4.5, -4.5]), { stiffness: 240, damping: 24 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-4.5, 4.5]), { stiffness: 240, damping: 24 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 950,
      }}
      whileHover={{
        boxShadow: `0 22px 54px -18px ${glowColor}, 0 0 0 1px rgba(244, 91, 132, 0.28)`,
      }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
