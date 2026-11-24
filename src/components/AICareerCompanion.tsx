import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  Compass,
  FileSearch,
  Layers,
  Send,
  Sparkles,
  Terminal,
  UserCheck,
} from 'lucide-react';
import { SANCTUARY_VISUAL_URL } from '../data/demoWorkspace';
import {
  AIStatusResponse,
  fetchAIStatus,
  getDemoModeSampleReply,
  requestAICompanion,
} from '../services/aiService';
import { AICompanionMode, DeveloperProfile, ProjectItem, SkillItem } from '../types/nexora';
import { MagneticButton } from './MotionPrimitives';

interface AICareerCompanionProps {
  profile: DeveloperProfile | null;
  skills: SkillItem[];
  projects: ProjectItem[];
  achievementsCount: number;
  isDemoMode: boolean;
  onLogAIActivity?: (title: string, detail: string) => void;
  onSignInRequest: () => void;
}

interface CompanionTurn {
  id: string;
  role: 'user' | 'assistant';
  mode: AICompanionMode;
  content: string;
  isDemoOutput?: boolean;
  model?: string;
}

const MODE_PRESETS: Array<{
  mode: AICompanionMode;
  label: string;
  description: string;
  defaultPrompt: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    mode: 'suggest-projects',
    label: 'Suggest Projects',
    description: 'Recommend builds tailored to your skills',
    defaultPrompt:
      'Suggest 3 high-impact portfolio projects based on my current skills and learning goals.',
    icon: Layers,
  },
  {
    mode: 'recommend-tech',
    label: 'Recommend Technologies',
    description: 'Identify high-leverage next tools to learn',
    defaultPrompt:
      'Which technologies should I learn next to complement my current stack and target roles?',
    icon: Compass,
  },
  {
    mode: 'learning-roadmap',
    label: 'Learning Roadmap',
    description: 'Generate an 8-week milestone plan',
    defaultPrompt:
      'Build a realistic 8-week learning roadmap with weekly deliverables based on my Skill Universe.',
    icon: Sparkles,
  },
  {
    mode: 'review-project',
    label: 'Review Project Copy',
    description: 'Critique and sharpen project descriptions',
    defaultPrompt:
      'Review my project summaries and descriptions and suggest concrete architectural improvements.',
    icon: FileSearch,
  },
  {
    mode: 'improve-profile',
    label: 'Improve Profile',
    description: 'Audit Identity Studio bio & positioning',
    defaultPrompt:
      'Audit my Identity Studio headline, bio, and interests and suggest improvements for technical recruiters.',
    icon: UserCheck,
  },
  {
    mode: 'interview-prep',
    label: 'Interview Prep',
    description: 'Targeted system design & coding drills',
    defaultPrompt:
      'Give me 3 targeted technical interview questions based on my stack and explain what strong answers cover.',
    icon: Terminal,
  },
];

const SUGGESTED_CHIPS = [
  'Suggest a weekend AI systems project',
  'Critique my strongest portfolio project',
  'Create an 8-week backend mastery plan',
  'Run a system design mock interview',
];

export const AICareerCompanion: React.FC<AICareerCompanionProps> = ({
  profile,
  skills,
  projects,
  achievementsCount,
  isDemoMode,
  onLogAIActivity,
  onSignInRequest,
}) => {
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [activeMode, setActiveMode] = useState<AICompanionMode>('suggest-projects');
  const [prompt, setPrompt] = useState(MODE_PRESETS[0].defaultPrompt);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [turns, setTurns] = useState<CompanionTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAIStatus().then(setAiStatus);
  }, []);

  const canUseLiveAI = !isDemoMode && Boolean(aiStatus?.configured);

  function selectPreset(preset: (typeof MODE_PRESETS)[number]) {
    setActiveMode(preset.mode);
    if (preset.mode === 'review-project' && projects.length > 0) {
      const target = projects.find((p) => p.id === selectedProjectId) || projects[0];
      setPrompt(
        `Review my project "${target.title}": Summary: "${target.summary}". Description: "${target.description || 'N/A'}". Technologies: ${target.technologies.join(', ')}.`
      );
    } else {
      setPrompt(preset.defaultPrompt);
    }
    setError(null);
  }

  async function submitPromptText(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);

    const userTurn: CompanionTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      mode: activeMode,
      content: trimmed,
    };
    setTurns((prev) => [...prev, userTurn]);

    if (!canUseLiveAI) {
      setLoading(true);
      setTimeout(() => {
        const sample = getDemoModeSampleReply(
          activeMode,
          skills.map((s) => s.name)
        );
        setTurns((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            mode: activeMode,
            content: sample,
            isDemoOutput: true,
          },
        ]);
        setLoading(false);
      }, 450);
      return;
    }

    setLoading(true);
    try {
      const res = await requestAICompanion({
        mode: activeMode,
        prompt: trimmed,
        profile,
        skills,
        projects,
        achievementsCount,
      });
      setTurns((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          mode: activeMode,
          content: res.reply,
          isDemoOutput: false,
          model: res.model,
        },
      ]);
      onLogAIActivity?.(`Used AI Career Companion (${activeMode})`, trimmed.slice(0, 120));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reach AI Career Companion.';
      setError(
        msg === 'AUTH_REQUIRED' ? 'Please sign in with Google to run live Gemini requests.' : msg
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submitPromptText(prompt);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#F45B84]">
            AI Career Companion
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#FAF4F6] mt-1">
            Obsidian Sanctuary & Career Strategist
          </h1>
          <p className="text-sm text-[#D8C7CE]/80 mt-1">
            Context-aware guidance powered by your Skill Universe, Project Galaxy, and Identity Studio via Gemini.
          </p>
        </div>

        <div className="text-xs font-mono text-[#F8A5BE] shrink-0">
          {aiStatus === null
            ? 'Checking backend AI status...'
            : canUseLiveAI
              ? `Live Gemini Ready · ${aiStatus.model}`
              : isDemoMode
                ? 'Demo Preview Mode (Sign in for live AI)'
                : 'Demo Mode (Server Gemini key unavailable)'}
        </div>
      </div>

      {/* Honest Demo Mode Banner */}
      {!canUseLiveAI && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/35 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-100">
                {isDemoMode
                  ? 'Demo Workspace Mode Active'
                  : 'Live Gemini API Key Not Configured on Server'}
              </p>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                {isDemoMode
                  ? 'Responses below are clearly labeled Demo Previews. Sign in with Google to query the live server-side Gemini API with your real developer profile.'
                  : 'Set GEMINI_API_KEY in the server Secrets panel to enable live Gemini responses. Submitting now shows a clearly labeled Demo Preview.'}
              </p>
            </div>
          </div>
          {isDemoMode && (
            <button
              type="button"
              onClick={onSignInRequest}
              className="px-4 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/30 text-xs font-semibold text-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In for Live AI
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sanctuary Visual Core + Workflows */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="glass-surface-elevated rounded-2xl overflow-hidden relative">
            <div className="relative h-32">
              <img
                src={SANCTUARY_VISUAL_URL}
                alt="Nocturnal obsidian sanctuary"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#16050D] via-[#16050D]/45 to-transparent" />
            </div>
            <div className="p-5 pt-0 -mt-7 relative z-10 flex items-center gap-4">
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <motion.span
                  animate={{
                    scale: loading ? [1, 1.24, 1] : [1, 1.1, 1],
                    opacity: loading ? [0.55, 0.9, 0.55] : [0.35, 0.65, 0.35],
                  }}
                  transition={{ duration: loading ? 1.2 : 3.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#6E1233] via-[#F45B84] to-[#D9C6EC] blur-md"
                />
                <span className="absolute inset-0 rounded-full border border-rose-300/40 animate-orbit-fast" />
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#6E1233] to-[#F45B84] flex items-center justify-center shadow-[0_0_24px_rgba(244,91,132,0.5)]">
                  <Sparkles className="w-4 h-4 text-[#FAF4F6]" />
                </div>
              </div>
              <div className="min-w-0 pt-4">
                <p className="text-sm font-semibold text-[#FAF4F6]">NEXORA Career Guide</p>
                <p className="text-xs text-[#D8C7CE] mt-0.5">
                  {loading
                    ? 'Synthesizing tailored strategy...'
                    : `${skills.length} skills · ${projects.length} projects indexed`}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-surface rounded-2xl p-4 space-y-1.5">
            <p className="text-xs font-medium text-[#9E8490] px-2 pb-1">Companion Workflows</p>
            {MODE_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const active = activeMode === preset.mode;
              return (
                <button
                  key={preset.mode}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#6E1233]/45 to-[#2A0A19]/40 border border-rose-300/35 text-[#FAF4F6]'
                      : 'border border-transparent hover:bg-white/[0.04] text-[#D8C7CE]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      active ? 'text-[#F45B84]' : 'text-[#9E8490]'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium leading-tight">{preset.label}</p>
                    <p className="text-xs text-[#9E8490] mt-0.5">{preset.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right: Burgundy Glass Chat Interface */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="lg:col-span-8 glass-surface-elevated rounded-2xl p-6 flex flex-col justify-between min-h-[560px] space-y-5"
        >
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[460px] pr-1">
            {turns.length === 0 ? (
              <div className="py-12 text-center space-y-5">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[#F45B84]/25 blur-xl animate-orb-pulse" />
                  <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#6E1233] via-[#C83E88] to-[#F45B84] flex items-center justify-center shadow-[0_0_32px_rgba(244,91,132,0.35)]">
                    <Sparkles className="w-6 h-6 text-[#FAF4F6]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-base font-semibold text-[#FAF4F6]">
                    Ready to map your next engineering leap
                  </p>
                  <p className="text-xs text-[#9E8490] max-w-md mx-auto">
                    Select a workflow on the left, click a suggested prompt below, or ask any career or technical interview question.
                  </p>
                </div>

                {/* Suggested Prompt Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {SUGGESTED_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setPrompt(chip);
                        void submitPromptText(chip);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-rose-300/20 bg-white/[0.03] hover:bg-[#6E1233]/40 hover:border-rose-300/40 text-xs font-medium text-[#FAF4F6] transition-all cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {turns.map((turn) => (
                  <motion.div
                    key={turn.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`rounded-2xl p-4 space-y-2 ${
                      turn.role === 'user'
                        ? 'bg-gradient-to-br from-[#6E1233]/40 to-[#2A0A19]/45 border border-rose-300/25 ml-8'
                        : 'bg-[#0D0408]/88 border border-rose-200/10 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-[#9E8490]">
                      <span className="font-medium text-[#FAF4F6]">
                        {turn.role === 'user' ? 'You' : 'NEXORA Career Companion'}
                      </span>
                      <span className="font-mono text-[#F8A5BE]">
                        {turn.isDemoOutput ? 'Demo Preview' : turn.model || turn.mode}
                      </span>
                    </div>
                    <div className="text-sm text-[#FAF4F6]/90 whitespace-pre-wrap leading-relaxed">
                      {turn.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Animated Typing Indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-[#0D0408]/90 border border-rose-300/20 px-4 py-3.5 mr-4 flex items-center gap-3 w-fit"
              >
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{
                        duration: 0.75,
                        repeat: Infinity,
                        delay: dot * 0.15,
                        ease: 'easeInOut',
                      }}
                      className="w-2 h-2 rounded-full bg-[#F45B84]"
                    />
                  ))}
                </div>
                <span className="text-xs text-[#D8C7CE]">
                  Analyzing workspace & generating guidance...
                </span>
              </motion.div>
            )}
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-rose-500/35 bg-rose-950/60 px-4 py-2.5 text-xs text-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="pt-4 border-t border-rose-200/10 space-y-3">
            {activeMode === 'review-project' && projects.length > 0 && (
              <div className="flex items-center gap-3">
                <label htmlFor="review-proj-select" className="text-xs text-[#9E8490] whitespace-nowrap">
                  Target Project:
                </label>
                <select
                  id="review-proj-select"
                  value={selectedProjectId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedProjectId(id);
                    const target = projects.find((p) => p.id === id);
                    if (target) {
                      setPrompt(
                        `Review my project "${target.title}": Summary: "${target.summary}". Description: "${target.description || 'N/A'}". Technologies: ${target.technologies.join(', ')}.`
                      );
                    }
                  }}
                  className="flex-1 rounded-xl border border-rose-200/15 bg-[#0D0408] px-3 py-1.5 text-xs text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask for a learning roadmap, project critique, or interview drill..."
                className="flex-1 rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
              />
              <MagneticButton
                type="submit"
                disabled={loading || !prompt.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] disabled:opacity-60 text-xs font-semibold text-[#FAF4F6] shadow-[0_8px_24px_rgba(244,91,132,0.28)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {canUseLiveAI ? 'Ask Companion' : 'Run Demo Preview'}
              </MagneticButton>
            </div>
          </form>
        </motion.section>
      </div>
    </div>
  );
};
