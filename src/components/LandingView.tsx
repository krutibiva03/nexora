import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Award, Compass, FolderGit2, Layers, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import {
  HERO_VISUAL_URL,
  KYOTO_HORIZON_URL,
  SANCTUARY_VISUAL_URL,
} from '../data/demoWorkspace';
import { WorkspaceSection } from '../types/nexora';
import { FloatingNavbar, NavSectionKey } from './FloatingNavbar';
import { ImageReveal, MagneticButton, RevealSection, TiltCard } from './MotionPrimitives';
import { ParticleWordmarkCanvas } from './ParticleWordmarkCanvas';
import { ThreeCoreCanvas } from './ThreeCoreCanvas';
import { UniverseBackground } from './UniverseBackground';

interface LandingViewProps {
  onSignIn: () => void;
  onEnterDemo: (initialSection?: WorkspaceSection) => void;
  onOpenDiscover: () => void;
  signingIn: boolean;
  authError: string | null;
}

const MORPH_PHRASES = [
  'Your Potential. Your Universe.',
  'Beyond Code. Beyond Limits.',
  'Build Identity. Master Craft.',
];

export const LandingView: React.FC<LandingViewProps> = ({
  onSignIn,
  onEnterDemo,
  onOpenDiscover,
  signingIn,
  authError,
}) => {
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: heroSectionRef,
    offset: ['start start', 'end start'],
  });
  const backdropY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const backdropOpacity = useTransform(scrollYProgress, [0, 1], [0.52, 0.16]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % MORPH_PHRASES.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  function handleNavSelect(key: NavSectionKey) {
    if (key === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (key === 'explore') {
      document.getElementById('discover-platform')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (key === 'skills') {
      onEnterDemo('skills');
      return;
    }
    if (key === 'projects') {
      onEnterDemo('projects');
      return;
    }
    if (key === 'community') {
      onOpenDiscover();
      return;
    }
    if (key === 'companion') {
      onEnterDemo('companion');
    }
  }

  return (
    <div className="relative min-h-screen bg-[#070306] text-[#FAF4F6] flex flex-col overflow-x-hidden">
      <UniverseBackground variant="landing" />

      <FloatingNavbar
        activeNav="home"
        onSelectNav={handleNavSelect}
        onAuthAction={onSignIn}
        authLabel="Sign In"
        signingIn={signingIn}
      />

      <main className="relative z-10 flex-1">
        {/* 1. Full-Screen Immersive Hero with Japanese Twilight Backdrop, Particle Typography & 3D Core */}
        <section
          ref={heroSectionRef}
          className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden"
        >
          {/* Atmospheric Japanese Mountain Twilight Scrim */}
          <motion.div
            style={{ y: backdropY, opacity: backdropOpacity }}
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            <img
              src={HERO_VISUAL_URL}
              alt="Twilight mountain horizon"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
          <div
            className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#070306]/80 via-[#16050D]/72 to-[#070306]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#070306]/92 via-[#070306]/58 to-[#12040A]/40"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-[1280px] w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Editorial & Particle Typography */}
            <div className="lg:col-span-6 space-y-6">
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#F45B84]">
                Multi-User Developer Growth & Identity Platform
              </p>

              {/* Oversized Particle-Based NEXORA Reveal */}
              <div className="space-y-1">
                <ParticleWordmarkCanvas text="NEXORA" />

                {/* Morphing Editorial Statement */}
                <div className="min-h-[3.25rem] sm:min-h-[3.75rem] flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.h1
                      key={MORPH_PHRASES[phraseIndex]}
                      initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="font-display font-bold tracking-tight nexora-gradient-text animate-glitch-subtle"
                      style={{ fontSize: 'clamp(1.75rem, 3.4vw, 2.75rem)', textWrap: 'balance' }}
                    >
                      {MORPH_PHRASES[phraseIndex]}
                    </motion.h1>
                  </AnimatePresence>
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.14 }}
                className="text-base md:text-lg text-[#D8C7CE] leading-relaxed max-w-xl"
              >
                Build your identity. Discover your potential. Grow beyond limits. One unified space
                for students, engineers, and AI learners to map skills, curate projects, store
                verified credentials, and navigate careers with Gemini intelligence.
              </motion.p>

              {authError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/35 bg-rose-950/50 px-4 py-3 text-sm text-rose-100"
                >
                  {authError}
                </div>
              )}

              {/* Primary & Secondary Actions */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <MagneticButton
                  type="button"
                  onClick={() => onEnterDemo('dashboard')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#6E1233] via-[#9E1A43] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] text-sm font-semibold text-[#FAF4F6] border border-rose-300/25 shadow-[0_12px_36px_rgba(244,91,132,0.3)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Explore NEXORA</span>
                  <ArrowRight className="w-4 h-4" />
                </MagneticButton>

                <button
                  type="button"
                  onClick={() =>
                    document.getElementById('discover-platform')?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-rose-200/20 bg-[#1A0610]/60 hover:bg-[#2A0A19]/80 hover:border-rose-300/40 text-sm font-medium text-[#FAF4F6] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Discover the Platform
                </button>

                <button
                  type="button"
                  onClick={onSignIn}
                  disabled={signingIn}
                  className="text-sm font-medium text-[#D9C6EC] hover:text-[#FAF4F6] underline underline-offset-4 decoration-rose-400/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {signingIn ? 'Connecting Google...' : 'Sign in with Google'}
                </button>
              </div>

              <div className="pt-5 border-t border-rose-200/10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#9E8490]">
                <span>Multi-user Firestore isolation</span>
                <span aria-hidden="true">·</span>
                <span>Shareable public profiles</span>
                <span aria-hidden="true">·</span>
                <span>Server-side Gemini career guidance</span>
              </div>
            </div>

            {/* Right Interactive Three.js 3D Digital Core */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[540px]">
                <div
                  className="absolute inset-10 rounded-full bg-gradient-to-tr from-[#6E1233]/35 via-[#F45B84]/18 to-[#D9C6EC]/15 blur-3xl pointer-events-none"
                  aria-hidden="true"
                />
                <ThreeCoreCanvas />
                <p className="text-center text-[11px] font-mono text-[#9E8490] mt-2">
                  Interactive 3D Core · Drag to orbit
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Atmospheric Japanese Pavilion Chapter + Floating Interactive Module Panels */}
        <section
          id="discover-platform"
          className="relative py-20 md:py-28 border-t border-rose-200/10"
        >
          <div className="max-w-[1280px] mx-auto px-6 space-y-12">
            <RevealSection className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7 space-y-3">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#F45B84]">
                  01 · Architectural Environment
                </p>
                <h2
                  className="font-display text-3xl md:text-4xl font-bold text-[#FAF4F6]"
                  style={{ textWrap: 'balance' }}
                >
                  Every dimension of your technical growth, composed with calm precision.
                </h2>
              </div>
              <p className="lg:col-span-5 text-sm md:text-base text-[#D8C7CE] leading-relaxed">
                Inspired by nocturnal architecture and focused studio craft—each NEXORA module opens
                directly into your persistent developer workspace.
              </p>
            </RevealSection>

            {/* Full-Bleed Atmospheric Composition with Floating Interactive Panels */}
            <RevealSection className="relative rounded-3xl overflow-hidden border border-rose-200/15 shadow-[0_28px_80px_rgba(4,1,5,0.85)]">
              <div className="relative min-h-[460px] md:min-h-[520px] flex flex-col justify-end">
                <ImageReveal
                  src={KYOTO_HORIZON_URL}
                  alt="Minimalist lakeside pavilion at burgundy dusk"
                  className="absolute inset-0 w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070306] via-[#12040A]/65 to-[#070306]/25 pointer-events-none" />

                <div className="relative z-10 p-6 md:p-10 grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                  {/* Asymmetric Marquee Panel: Identity Studio */}
                  <div className="md:col-span-6">
                    <TiltCard glowColor="rgba(244, 91, 132, 0.28)" className="rounded-2xl">
                      <button
                        type="button"
                        onClick={() => onEnterDemo('identity')}
                        className="w-full text-left glass-surface-elevated rounded-2xl p-6 md:p-7 space-y-3 hover:border-rose-400/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs text-[#D9C6EC]">
                          <span className="font-mono">01. Identity Studio</span>
                          <UserCheck className="w-4 h-4 text-[#F45B84]" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#FAF4F6]">
                          Shareable Developer Identity & Privacy Control
                        </h3>
                        <p className="text-sm text-[#D8C7CE] leading-relaxed">
                          Upload portraits, author your headline and bio, curate social links, and
                          publish clean public URLs with per-item visibility boundaries.
                        </p>
                        <span className="inline-block text-xs font-semibold text-[#F45B84] pt-1">
                          Open Identity Studio →
                        </span>
                      </button>
                    </TiltCard>
                  </div>

                  {/* Floating Right Pair: Skill Universe + Project Galaxy */}
                  <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <TiltCard glowColor="rgba(217, 198, 236, 0.25)" className="rounded-2xl h-full">
                      <button
                        type="button"
                        onClick={() => onEnterDemo('skills')}
                        className="w-full h-full text-left glass-surface rounded-2xl p-5 space-y-3 hover:border-rose-300/35 transition-colors flex flex-col justify-between cursor-pointer"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-[#D9C6EC]">
                            <span className="font-mono">02. Skill Universe</span>
                            <Layers className="w-4 h-4 text-[#F45B84]" />
                          </div>
                          <h3 className="text-base font-semibold text-[#FAF4F6]">
                            Planetary Capability Galaxy
                          </h3>
                          <p className="text-xs text-[#D8C7CE] leading-relaxed">
                            Track technical & leadership proficiency with orbiting skill planets and
                            target milestones.
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-[#F8A5BE]">
                          Explore Skills →
                        </span>
                      </button>
                    </TiltCard>

                    <TiltCard glowColor="rgba(244, 91, 132, 0.25)" className="rounded-2xl h-full">
                      <button
                        type="button"
                        onClick={() => onEnterDemo('projects')}
                        className="w-full h-full text-left glass-surface rounded-2xl p-5 space-y-3 hover:border-rose-300/35 transition-colors flex flex-col justify-between cursor-pointer"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-[#D9C6EC]">
                            <span className="font-mono">03. Project Galaxy</span>
                            <FolderGit2 className="w-4 h-4 text-[#F45B84]" />
                          </div>
                          <h3 className="text-base font-semibold text-[#FAF4F6]">
                            3D Interactive Project Worlds
                          </h3>
                          <p className="text-xs text-[#D8C7CE] leading-relaxed">
                            Showcase engineering builds with uploaded visuals, stack tags, and live
                            repository links.
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-[#F8A5BE]">
                          Explore Projects →
                        </span>
                      </button>
                    </TiltCard>
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* 3. Asymmetric Split: Achievement Vault + Obsidian Sanctuary AI Companion */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <RevealSection delay={0.06} className="lg:col-span-5 flex">
                <TiltCard glowColor="rgba(244, 91, 132, 0.26)" className="w-full rounded-2xl">
                  <button
                    type="button"
                    onClick={() => onEnterDemo('achievements')}
                    className="w-full h-full text-left glass-surface rounded-2xl p-7 md:p-8 flex flex-col justify-between space-y-6 hover:border-rose-300/35 transition-colors cursor-pointer"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-[#D9C6EC]">
                        <span className="font-mono">04. Achievement Vault</span>
                        <Award className="w-5 h-5 text-[#F45B84]" />
                      </div>
                      <h3 className="font-display text-2xl font-bold text-[#FAF4F6]">
                        Digital Certificate & Milestone Gallery
                      </h3>
                      <p className="text-sm text-[#D8C7CE] leading-relaxed">
                        Securely upload PDF or image certificates, organize hackathon honors and
                        research publications, and inspect credentials inside an interactive gallery.
                      </p>
                    </div>
                    <div className="pt-4 border-t border-rose-200/10 flex items-center justify-between text-xs">
                      <span className="text-[#9E8490]">PDF & Image Previews · Public Curation</span>
                      <span className="font-semibold text-[#F45B84]">Open Vault →</span>
                    </div>
                  </button>
                </TiltCard>
              </RevealSection>

              <RevealSection delay={0.12} className="lg:col-span-7 flex">
                <TiltCard glowColor="rgba(217, 198, 236, 0.25)" className="w-full rounded-2xl">
                  <button
                    type="button"
                    onClick={() => onEnterDemo('companion')}
                    className="w-full h-full text-left glass-surface-elevated rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 hover:border-rose-300/40 transition-colors cursor-pointer"
                  >
                    <div className="sm:col-span-5 relative min-h-[210px]">
                      <img
                        src={SANCTUARY_VISUAL_URL}
                        alt="Nocturnal obsidian sanctuary with rose mist"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#18070F]/85 hidden sm:block" />
                    </div>
                    <div className="sm:col-span-7 p-7 flex flex-col justify-between space-y-5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-[#D9C6EC]">
                          <span className="font-mono">05. AI Career Companion</span>
                          <Sparkles className="w-4 h-4 text-[#F45B84]" />
                        </div>
                        <h3 className="font-display text-2xl font-bold text-[#FAF4F6]">
                          Gemini Career Intelligence
                        </h3>
                        <p className="text-sm text-[#D8C7CE] leading-relaxed">
                          Generate 8-week learning roadmaps, critique project architecture, refine
                          your developer bio, and run targeted technical interview drills.
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#F8A5BE]">
                        Launch AI Companion →
                      </span>
                    </div>
                  </button>
                </TiltCard>
              </RevealSection>
            </div>
          </div>
        </section>

        {/* 4. Multi-User Community Invitation */}
        <section className="max-w-[1280px] mx-auto px-6 pb-20">
          <RevealSection className="glass-surface-elevated rounded-3xl p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-[#F8A5BE]">
                <ShieldCheck className="w-4 h-4" />
                <span>Multi-User SaaS Platform</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-[#FAF4F6]">
                Discover students, AI learners & engineers building in public
              </h2>
              <p className="text-sm text-[#D8C7CE]">
                Search public profiles by skill and technology stack, or sign in with Google to
                launch your own persistent workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onOpenDiscover}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-rose-200/20 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium text-[#FAF4F6] transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#F45B84]" />
                Browse Community
              </button>
              <MagneticButton
                type="button"
                onClick={onSignIn}
                disabled={signingIn}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] text-sm font-semibold text-[#FAF4F6] shadow-[0_8px_28px_rgba(244,91,132,0.28)] cursor-pointer"
              >
                {signingIn ? 'Signing in...' : 'Get Started Free'}
              </MagneticButton>
            </div>
          </RevealSection>
        </section>
      </main>

      <footer className="relative z-10 border-t border-rose-200/10 py-8 bg-[#050205]/90">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9E8490]">
          <p className="font-medium text-[#D8C7CE]">NEXORA — Beyond Code. Beyond Limits.</p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={onOpenDiscover}
              className="hover:text-[#FAF4F6] transition-colors cursor-pointer"
            >
              Community Discover
            </button>
            <button
              type="button"
              onClick={() => onEnterDemo('dashboard')}
              className="hover:text-[#FAF4F6] transition-colors cursor-pointer"
            >
              Demo Workspace
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="hover:text-[#FAF4F6] transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
