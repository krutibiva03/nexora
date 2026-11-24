import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { MagneticButton } from './MotionPrimitives';

export type NavSectionKey =
  | 'home'
  | 'explore'
  | 'skills'
  | 'projects'
  | 'community'
  | 'companion';

interface FloatingNavbarProps {
  activeNav: NavSectionKey;
  onSelectNav: (key: NavSectionKey) => void;
  onAuthAction: () => void;
  authLabel: string;
  signingIn?: boolean;
}

const LINKS: Array<{ key: NavSectionKey; label: string }> = [
  { key: 'home', label: 'Home' },
  { key: 'explore', label: 'Explore' },
  { key: 'skills', label: 'Skills' },
  { key: 'projects', label: 'Projects' },
  { key: 'community', label: 'Community' },
  { key: 'companion', label: 'AI Companion' },
];

export const FloatingNavbar: React.FC<FloatingNavbarProps> = ({
  activeNav,
  onSelectNav,
  onAuthAction,
  authLabel,
  signingIn = false,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 transition-all duration-300">
        <div
          className={`mx-auto transition-all duration-300 ${
            scrolled
              ? 'max-w-[1240px] mt-3 mx-4 sm:mx-6 lg:mx-auto rounded-2xl bg-[#12050B]/85 backdrop-blur-xl border border-rose-300/18 shadow-[0_14px_40px_rgba(4,1,5,0.78)] px-5 py-3'
              : 'max-w-[1280px] px-6 py-4 bg-transparent border-b border-transparent'
          }`}
        >
          <div className="flex items-center justify-between gap-8">
            {/* Zone 1: Clean single-line brand wordmark */}
            <button
              type="button"
              onClick={() => onSelectNav('home')}
              className="font-display text-lg font-bold tracking-[0.14em] text-[#FAF4F6] hover:text-rose-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              NEXORA
            </button>

            {/* Zone 2: Clean typographic navigation links with animated underline */}
            <nav className="hidden lg:flex items-center gap-7" aria-label="Primary navigation">
              {LINKS.map((item) => {
                const active = activeNav === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onSelectNav(item.key)}
                    className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active ? 'text-[#FAF4F6]' : 'text-[#D8C7CE]/80 hover:text-[#FAF4F6]'
                    }`}
                  >
                    {item.label}
                    {active && (
                      <motion.span
                        layoutId="nexora-nav-underline"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-[#F45B84] via-[#C83E88] to-[#D9C6EC]"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Single primary action + Mobile trigger */}
            <div className="flex items-center gap-3 shrink-0">
              <MagneticButton
                type="button"
                disabled={signingIn}
                onClick={onAuthAction}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#C83E88] hover:from-[#88163F] hover:to-[#F45B84] disabled:opacity-60 text-xs sm:text-sm font-semibold text-[#FAF4F6] border border-rose-300/20 shadow-[0_8px_24px_rgba(110,18,51,0.45)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                {signingIn ? 'Signing in...' : authLabel}
              </MagneticButton>

              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
                className="lg:hidden p-2 rounded-xl border border-rose-200/15 bg-white/[0.04] text-[#FAF4F6] cursor-pointer"
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 inset-x-4 z-40 lg:hidden glass-surface-elevated rounded-2xl p-4 space-y-1.5"
          >
            {LINKS.map((item) => {
              const active = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onSelectNav(item.key);
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#6E1233]/45 text-[#FAF4F6] border border-rose-400/30'
                      : 'text-[#D8C7CE] hover:bg-white/[0.05]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
