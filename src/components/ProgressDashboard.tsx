import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  CheckCircle2,
  FolderKanban,
  Layers,
  Plus,
  Sparkles,
  Target,
  UserCheck,
} from 'lucide-react';
import {
  AchievementItem,
  ActivityLog,
  DeveloperProfile,
  ProjectItem,
  SKILL_CATEGORIES,
  SkillItem,
  WorkspaceSection,
} from '../types/nexora';
import { formatRelativeTime } from '../utils/validation';
import { AnimatedCounter, MagneticButton, RevealSection } from './MotionPrimitives';

interface ProgressDashboardProps {
  profile: DeveloperProfile | null;
  skills: SkillItem[];
  projects: ProjectItem[];
  achievements: AchievementItem[];
  activities: ActivityLog[];
  isDemoMode: boolean;
  loading: boolean;
  onNavigate: (section: WorkspaceSection) => void;
  onToggleGoal: (skill: SkillItem) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  profile,
  skills,
  projects,
  achievements,
  activities,
  isDemoMode,
  loading,
  onNavigate,
  onToggleGoal,
}) => {
  const completedGoals = useMemo(() => skills.filter((s) => s.goalCompleted), [skills]);
  const activeGoals = useMemo(() => skills.filter((s) => !s.goalCompleted), [skills]);

  const categoryBreakdown = useMemo(() => {
    return SKILL_CATEGORIES.map((category) => {
      const items = skills.filter((s) => s.category === category);
      const avg =
        items.length > 0
          ? Math.round(items.reduce((acc, item) => acc + item.proficiency, 0) / items.length)
          : 0;
      return { category, count: items.length, avg };
    });
  }, [skills]);

  const overallProficiency = useMemo(() => {
    if (skills.length === 0) return 0;
    return Math.round(skills.reduce((acc, s) => acc + s.proficiency, 0) / skills.length);
  }, [skills]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="glass-surface rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 glass-surface rounded-2xl h-80 animate-pulse" />
          <div className="lg:col-span-5 glass-surface rounded-2xl h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#F45B84]">
            {isDemoMode ? 'Demo Workspace Overview' : 'Personal Growth Overview'}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#FAF4F6] mt-1">
            Welcome back, <span className="nexora-gradient-text">{profile?.displayName || 'Builder'}</span>
          </h1>
          <p className="text-sm text-[#D8C7CE]/80 mt-1">
            {profile?.headline || 'Complete your Identity Studio profile to share your work publicly.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('skills')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200/15 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-[#FAF4F6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#F45B84]" />
            Add Skill
          </button>
          <MagneticButton
            type="button"
            onClick={() => onNavigate('projects')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] text-xs font-semibold text-[#FAF4F6] shadow-[0_8px_24px_rgba(244,91,132,0.28)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Project
          </MagneticButton>
        </div>
      </div>

      {/* 4-Column Burgundy Glass KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Skills Added',
            value: skills.length,
            sub: `${overallProficiency}% average mastery`,
            icon: Layers,
            accent: 'text-[#F45B84]',
            target: 'skills' as WorkspaceSection,
          },
          {
            label: 'Projects Created',
            value: projects.length,
            sub: `${projects.filter((p) => p.isPublic).length} public in Galaxy`,
            icon: FolderKanban,
            accent: 'text-[#F8A5BE]',
            target: 'projects' as WorkspaceSection,
          },
          {
            label: 'Certificates Uploaded',
            value: achievements.length,
            sub: `${achievements.filter((a) => Boolean(a.certificateFileUrl)).length} files attached`,
            icon: Award,
            accent: 'text-[#D9C6EC]',
            target: 'achievements' as WorkspaceSection,
          },
          {
            label: 'Learning Goals Completed',
            value: completedGoals.length,
            sub: `${activeGoals.length} active targets remaining`,
            icon: Target,
            accent: 'text-emerald-400',
            target: 'skills' as WorkspaceSection,
            total: skills.length,
          },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.label}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
              onClick={() => onNavigate(card.target)}
              className="text-left glass-surface rounded-2xl p-5 hover:border-rose-300/35 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-[#9E8490]">
                <span>{card.label}</span>
                <Icon className={`w-4 h-4 ${card.accent}`} />
              </div>
              <p className="text-3xl font-display font-bold text-[#FAF4F6] mt-3 tabular-nums">
                <AnimatedCounter value={card.value} />
                {typeof card.total === 'number' && (
                  <span className="text-base font-normal text-[#9E8490]"> / {card.total}</span>
                )}
              </p>
              <p className="text-xs text-[#D8C7CE]/75 mt-1 tabular-nums">{card.sub}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Main Mastery Orb + Learning Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <RevealSection className="lg:col-span-7 glass-surface-elevated rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#FAF4F6]">Learning Progress Visualization</h2>
              <p className="text-xs text-[#9E8490] mt-0.5">
                Domain mastery distribution across your Skill Universe categories
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('skills')}
              className="text-xs font-medium text-[#F45B84] hover:text-[#F8A5BE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Skill Universe →
            </button>
          </div>

          {skills.length === 0 ? (
            <div className="py-12 text-center space-y-3 border border-dashed border-rose-200/15 rounded-xl">
              <p className="text-sm text-[#D8C7CE]">No skills tracked yet.</p>
              <p className="text-xs text-[#9E8490] max-w-sm mx-auto">
                Add technical or leadership skills in Skill Universe to visualize your domain mastery.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('skills')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6E1233] hover:bg-[#88163F] text-xs font-medium text-[#FAF4F6] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Log First Skill
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 flex flex-col items-center justify-center py-2">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <div className="absolute inset-4 rounded-full bg-[#6E1233]/35 blur-xl" />
                  <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 relative z-10">
                    <defs>
                      <linearGradient id="nexoraBurgundyRing" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6E1233" />
                        <stop offset="52%" stopColor="#F45B84" />
                        <stop offset="100%" stopColor="#D9C6EC" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="80"
                      cy="80"
                      r="64"
                      fill="none"
                      stroke="rgba(244,91,132,0.14)"
                      strokeWidth="12"
                    />
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="64"
                      fill="none"
                      stroke="url(#nexoraBurgundyRing)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 64}
                      initial={{ strokeDashoffset: 2 * Math.PI * 64 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 64 * (1 - overallProficiency / 100) }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                    <span className="font-display text-3xl font-bold text-[#FAF4F6] tabular-nums">
                      <AnimatedCounter value={overallProficiency} suffix="%" />
                    </span>
                    <span className="text-xs text-[#9E8490]">Overall Mastery</span>
                  </div>
                </div>
                <p className="text-xs text-[#9E8490] mt-2 tabular-nums">
                  {completedGoals.length} of {skills.length} skill goals reached
                </p>
              </div>

              <div className="md:col-span-7 space-y-3.5">
                {categoryBreakdown.map((row) => (
                  <div key={row.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#FAF4F6] font-medium">{row.category}</span>
                      <span className="text-[#9E8490] font-mono tabular-nums">
                        {row.count} {row.count === 1 ? 'skill' : 'skills'} · {row.avg}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#14050C] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${row.avg}%` }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-[#6E1233] via-[#F45B84] to-[#D9C6EC]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </RevealSection>

        <RevealSection
          delay={0.08}
          className="lg:col-span-5 glass-surface rounded-2xl p-6 flex flex-col justify-between space-y-5"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#FAF4F6]">Learning Goals</h2>
                <p className="text-xs text-[#9E8490] mt-0.5">
                  Toggle milestones as you hit target proficiency
                </p>
              </div>
              <span className="text-xs font-mono text-[#D8C7CE] tabular-nums">
                {completedGoals.length}/{skills.length}
              </span>
            </div>

            {skills.length === 0 ? (
              <p className="text-xs text-[#9E8490] py-6">
                Create skills with learning targets to track goal completion here.
              </p>
            ) : (
              <div className="divide-y divide-rose-200/10 max-h-60 overflow-y-auto pr-1">
                {skills.slice(0, 6).map((skill) => (
                  <div key={skill.id} className="py-3 flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleGoal(skill)}
                      className="flex items-start gap-3 text-left group cursor-pointer"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${
                          skill.goalCompleted
                            ? 'text-emerald-400'
                            : 'text-[#6E4958] group-hover:text-[#F45B84]'
                        }`}
                      />
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            skill.goalCompleted ? 'line-through text-[#9E8490]' : 'text-[#FAF4F6]'
                          }`}
                        >
                          {skill.name}
                        </p>
                        <p className="text-xs text-[#9E8490] mt-0.5">
                          {skill.goalDescription || `Reach ${skill.goalTarget}% proficiency`}
                        </p>
                      </div>
                    </button>
                    <span className="text-xs font-mono text-[#D8C7CE] tabular-nums shrink-0">
                      {skill.proficiency}%/{skill.goalTarget}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-rose-200/10 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onNavigate('companion')}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#F8A5BE] hover:text-[#FAF4F6] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Roadmap with AI Companion
            </button>
            <button
              type="button"
              onClick={() => onNavigate('identity')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D8C7CE] hover:text-[#FAF4F6] transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Identity Studio
            </button>
          </div>
        </RevealSection>
      </div>

      {/* Recent Activity Feed */}
      <RevealSection delay={0.12} className="glass-surface rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#FAF4F6]">Recent Activity</h2>
            <p className="text-xs text-[#9E8490] mt-0.5">
              Chronological record of profile, skill, project, and certificate updates
            </p>
          </div>
          <span className="text-xs font-mono text-[#D8C7CE] tabular-nums">
            {activities.length} events
          </span>
        </div>

        {activities.length === 0 ? (
          <p className="text-sm text-[#9E8490] py-4">
            No activity recorded yet. Start by updating your Identity Studio profile or adding your first skill.
          </p>
        ) : (
          <div className="divide-y divide-rose-200/10">
            {activities.slice(0, 8).map((act) => (
              <div
                key={act.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-[#FAF4F6]">{act.title}</p>
                  {act.detail && <p className="text-xs text-[#9E8490]">{act.detail}</p>}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#9E8490] font-mono tabular-nums shrink-0">
                  <span className="capitalize text-[#F8A5BE]">{act.type}</span>
                  <span aria-hidden="true">·</span>
                  <span>{act.timestampLabel || formatRelativeTime(act.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </RevealSection>
    </div>
  );
};
