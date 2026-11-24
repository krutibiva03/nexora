import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Edit3, Plus, Sparkles, Trash2, X } from 'lucide-react';
import {
  FIELD_LIMITS,
  SKILL_CATEGORIES,
  SkillCategory,
  SkillItem,
  SkillKind,
} from '../types/nexora';
import { MagneticButton } from './MotionPrimitives';

interface SkillUniverseProps {
  skills: SkillItem[];
  onCreateSkill: (input: Omit<SkillItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateSkill: (id: string, input: Omit<SkillItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onToggleGoal: (skill: SkillItem) => Promise<void>;
  onDeleteSkill: (skill: SkillItem) => Promise<void>;
}

const PLANET_PALETTE = [
  '#F45B84', // Rose Pink
  '#C83E88', // Soft Magenta
  '#D9C6EC', // Subtle Lavender
  '#FB7185', // Warm Coral Rose
  '#9E1A43', // Dark Wine Red
  '#F4A7BE', // Silk Blush
  '#E11D48', // Crimson
  '#EAB308', // Warm Amber Gold
];

function getSkillColor(skill: SkillItem, idx: number): string {
  let hash = idx;
  for (let i = 0; i < skill.name.length; i++) {
    hash = (hash * 31 + skill.name.charCodeAt(i)) % 997;
  }
  return PLANET_PALETTE[hash % PLANET_PALETTE.length];
}

export const SkillUniverse: React.FC<SkillUniverseProps> = ({
  skills,
  onCreateSkill,
  onUpdateSkill,
  onToggleGoal,
  onDeleteSkill,
}) => {
  const [kindFilter, setKindFilter] = useState<'all' | SkillKind>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SkillCategory>('all');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Frontend');
  const [kind, setKind] = useState<SkillKind>('technical');
  const [proficiency, setProficiency] = useState(65);
  const [goalTarget, setGoalTarget] = useState(90);
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCompleted, setGoalCompleted] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      if (kindFilter !== 'all' && s.kind !== kindFilter) return false;
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      return true;
    });
  }, [skills, kindFilter, categoryFilter]);

  const planetNodes = useMemo(() => {
    const cx = 250;
    const cy = 210;
    return filteredSkills.map((skill, index) => {
      const catIndex = SKILL_CATEGORIES.indexOf(skill.category);
      const baseAngle =
        ((catIndex >= 0 ? catIndex : index) / SKILL_CATEGORIES.length) * Math.PI * 2 - Math.PI / 2;
      const spread = ((index % 5) - 2) * 0.24;
      const angle = baseAngle + spread;
      const distance = 68 + (100 - skill.proficiency) * 1.05;
      const x = cx + Math.cos(angle) * distance;
      const y = cy + Math.sin(angle) * distance;
      const radius = 10 + Math.round(skill.proficiency / 11);
      const color = getSkillColor(skill, index);
      return {
        skill,
        x,
        y,
        radius,
        color,
        ringTilt: (index % 3) * 18 - 18,
      };
    });
  }, [filteredSkills]);

  const selectedSkill = useMemo(() => {
    return skills.find((s) => s.id === selectedSkillId) || filteredSkills[0] || null;
  }, [skills, filteredSkills, selectedSkillId]);

  const selectedColor = useMemo(() => {
    if (!selectedSkill) return '#F45B84';
    const node = planetNodes.find((p) => p.skill.id === selectedSkill.id);
    return node?.color || '#F45B84';
  }, [selectedSkill, planetNodes]);

  function openCreateModal() {
    setEditingSkill(null);
    setName('');
    setCategory('Frontend');
    setKind('technical');
    setProficiency(65);
    setGoalTarget(90);
    setGoalDescription('');
    setGoalCompleted(false);
    setIsPublic(true);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(skill: SkillItem) {
    setEditingSkill(skill);
    setName(skill.name);
    setCategory(skill.category);
    setKind(skill.kind);
    setProficiency(skill.proficiency);
    setGoalTarget(skill.goalTarget);
    setGoalDescription(skill.goalDescription);
    setGoalCompleted(skill.goalCompleted);
    setIsPublic(skill.isPublic);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Skill name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim().slice(0, FIELD_LIMITS.skillNameMax),
        category,
        kind,
        proficiency,
        goalTarget,
        goalDescription: goalDescription.trim().slice(0, FIELD_LIMITS.goalDescMax),
        goalCompleted,
        isPublic,
      };
      if (editingSkill) {
        await onUpdateSkill(editingSkill.id, payload);
      } else {
        await onCreateSkill(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save skill.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#F45B84]">
            Skill Universe
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#FAF4F6] mt-1">
            Interactive Planetary Capability Galaxy
          </h1>
          <p className="text-sm text-[#D8C7CE]/80 mt-1">
            Each capability orbits in crimson-rose depth—select any planet to inspect mastery or complete milestones.
          </p>
        </div>

        <MagneticButton
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] text-xs font-semibold text-[#FAF4F6] shadow-[0_8px_24px_rgba(244,91,132,0.28)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Skill Planet
        </MagneticButton>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#14050B]/90 border border-rose-200/10">
          {(['all', 'technical', 'non-technical'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                kindFilter === k
                  ? 'bg-gradient-to-r from-[#6E1233] to-[#C83E88] text-[#FAF4F6]'
                  : 'text-[#9E8490] hover:text-[#FAF4F6]'
              }`}
            >
              {k === 'all' ? 'All Skills' : k === 'technical' ? 'Technical' : 'Non-Technical'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-[#6E1233]/45 text-[#FAF4F6] border border-rose-300/30'
                : 'text-[#9E8490] hover:text-[#FAF4F6] hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            All Domains
          </button>
          {SKILL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#6E1233]/45 text-[#FAF4F6] border border-rose-300/30'
                  : 'text-[#9E8490] hover:text-[#FAF4F6] hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Galaxy + Glassmorphism Planet Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 glass-surface rounded-2xl p-6 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-base font-semibold text-[#FAF4F6]">Orbital Skill Galaxy</h2>
              <p className="text-xs text-[#9E8490]">
                Closer orbit indicates higher mastery · Hover & click planets to explore
              </p>
            </div>
            <span className="text-xs font-mono text-[#F8A5BE] tabular-nums">
              {filteredSkills.length} planets
            </span>
          </div>

          <div className="rounded-xl bg-[#070206] border border-rose-300/12 p-2 overflow-hidden relative">
            <svg
              viewBox="0 0 500 420"
              className="w-full h-auto max-h-[400px]"
              role="img"
              aria-label="Interactive Skill Universe Galaxy"
            >
              <defs>
                <radialGradient id="galaxyBurgundyCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F45B84" stopOpacity="0.85" />
                  <stop offset="48%" stopColor="#6E1233" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#070206" stopOpacity="0" />
                </radialGradient>
                {planetNodes.map(({ skill, color }) => (
                  <radialGradient key={`grad-${skill.id}`} id={`planet-${skill.id}`} cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#FAF4F6" stopOpacity="0.92" />
                    <stop offset="42%" stopColor={color} stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#14040A" stopOpacity="0.96" />
                  </radialGradient>
                ))}
              </defs>

              <circle cx="250" cy="210" r="84" fill="url(#galaxyBurgundyCore)" />

              {[58, 108, 158].map((r, idx) => (
                <circle
                  key={r}
                  cx="250"
                  cy="210"
                  r={r}
                  fill="none"
                  stroke="rgba(244, 91, 132, 0.14)"
                  strokeDasharray={idx === 1 ? '5 5' : undefined}
                />
              ))}

              {SKILL_CATEGORIES.map((cat, idx) => {
                const angle = (idx / SKILL_CATEGORIES.length) * Math.PI * 2 - Math.PI / 2;
                const x2 = 250 + Math.cos(angle) * 176;
                const y2 = 210 + Math.sin(angle) * 176;
                const lx = 250 + Math.cos(angle) * 192;
                const ly = 210 + Math.sin(angle) * 192;
                return (
                  <g key={cat}>
                    <line x1="250" y1="210" x2={x2} y2={y2} stroke="rgba(244, 91, 132, 0.1)" />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#D8C7CE"
                      fontSize="9.5"
                      fontWeight="500"
                    >
                      {cat}
                    </text>
                  </g>
                );
              })}

              <circle cx="250" cy="210" r="18" fill="rgba(110, 18, 51, 0.45)" stroke="#F45B84" strokeWidth="1.4" />
              <circle cx="250" cy="210" r="6.5" fill="#FAF4F6" />

              {planetNodes.map(({ skill, x, y, radius, color, ringTilt }, idx) => {
                const isSelected = selectedSkill?.id === skill.id;
                const isHovered = hoveredId === skill.id;
                return (
                  <motion.g
                    key={skill.id}
                    onClick={() => setSelectedSkillId(skill.id)}
                    onMouseEnter={() => setHoveredId(skill.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    animate={{
                      y: [0, idx % 2 === 0 ? -3.5 : 3.5, 0],
                    }}
                    transition={{
                      duration: 4.5 + (idx % 3),
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="cursor-pointer"
                  >
                    <line
                      x1="250"
                      y1="210"
                      x2={x}
                      y2={y}
                      stroke={isSelected || isHovered ? color : 'rgba(216,199,206,0.14)'}
                      strokeWidth={isSelected ? 1.5 : 0.9}
                    />

                    {(isSelected || isHovered) && (
                      <circle
                        cx={x}
                        cy={y}
                        r={radius + 7}
                        fill="none"
                        stroke={color}
                        strokeOpacity="0.6"
                        strokeWidth="1.5"
                      />
                    )}

                    <ellipse
                      cx={x}
                      cy={y}
                      rx={radius + 6}
                      ry={Math.max(3, radius * 0.34)}
                      transform={`rotate(${ringTilt} ${x} ${y})`}
                      fill="none"
                      stroke={color}
                      strokeOpacity={isSelected ? 0.85 : 0.4}
                      strokeWidth="1.2"
                    />

                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered && !isSelected ? radius + 2 : radius}
                      fill={`url(#planet-${skill.id})`}
                      stroke={isSelected ? '#FAF4F6' : 'rgba(250,244,246,0.28)'}
                      strokeWidth={isSelected ? 1.8 : 0.8}
                    />

                    <text
                      x={x}
                      y={y + radius + 14}
                      textAnchor="middle"
                      fill={isSelected ? '#FAF4F6' : '#E8D6DE'}
                      fontSize="10"
                      fontWeight={isSelected ? '700' : '500'}
                    >
                      {skill.name.length > 18 ? `${skill.name.slice(0, 17)}…` : skill.name}
                    </text>
                  </motion.g>
                );
              })}
            </svg>
          </div>
        </section>

        {/* Glassmorphism Planet Inspector Panel */}
        <section className="lg:col-span-5 glass-surface-elevated rounded-2xl p-6 flex flex-col justify-between space-y-5 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedSkill ? (
              <motion.div
                key={selectedSkill.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-5 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className="w-5 h-5 rounded-full mt-1 shrink-0"
                        style={{
                          background: `radial-gradient(circle at 35% 30%, #FAF4F6, ${selectedColor})`,
                          boxShadow: `0 0 18px ${selectedColor}`,
                        }}
                      />
                      <div>
                        <p className="text-xs text-[#9E8490]">
                          {selectedSkill.category} ·{' '}
                          {selectedSkill.kind === 'technical' ? 'Technical' : 'Non-Technical'} ·{' '}
                          {selectedSkill.isPublic ? 'Public' : 'Private'}
                        </p>
                        <h2 className="text-xl font-semibold text-[#FAF4F6] mt-0.5">
                          {selectedSkill.name}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(selectedSkill)}
                        aria-label={`Edit ${selectedSkill.name}`}
                        className="p-2 rounded-lg border border-rose-200/15 hover:bg-white/[0.08] text-[#D8C7CE] hover:text-[#FAF4F6] transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSkill(selectedSkill)}
                        aria-label={`Delete ${selectedSkill.name}`}
                        className="p-2 rounded-lg border border-rose-200/15 hover:border-rose-500/40 hover:bg-rose-500/10 text-[#D8C7CE] hover:text-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Animated Progress Indicator */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#D8C7CE]">Current Proficiency</span>
                      <span className="font-mono text-[#FAF4F6] tabular-nums">
                        {selectedSkill.proficiency}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#14050C] overflow-hidden">
                      <motion.div
                        key={`bar-${selectedSkill.id}-${selectedSkill.proficiency}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedSkill.proficiency}%` }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${selectedColor}, #D9C6EC)`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#9E8490]">
                      <span>Target Milestone</span>
                      <span className="font-mono tabular-nums">{selectedSkill.goalTarget}%</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#0D0408]/85 border border-rose-200/10 p-4 space-y-2">
                    <p className="text-xs font-medium text-[#F8A5BE] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Learning Goal
                    </p>
                    <p className="text-sm text-[#FAF4F6] leading-relaxed">
                      {selectedSkill.goalDescription ||
                        `Reach ${selectedSkill.goalTarget}% mastery in ${selectedSkill.name}.`}
                    </p>
                  </div>
                </div>

                <MagneticButton
                  type="button"
                  onClick={() => onToggleGoal(selectedSkill)}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedSkill.goalCompleted
                      ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25'
                      : 'bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] text-[#FAF4F6] shadow-[0_8px_24px_rgba(244,91,132,0.28)]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedSkill.goalCompleted
                    ? 'Goal Completed (Click to Reopen)'
                    : 'Mark Learning Goal Completed'}
                </MagneticButton>
              </motion.div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <p className="text-sm text-[#D8C7CE]">No skill planets match this filter.</p>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6E1233] hover:bg-[#88163F] text-xs font-medium text-[#FAF4F6] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Skill
                </button>
              </div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* Skills Matrix Cards */}
      <section className="glass-surface rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#FAF4F6]">Planetary Skill Catalog</h2>
          <span className="text-xs font-mono text-[#9E8490] tabular-nums">
            {filteredSkills.length} total
          </span>
        </div>

        {filteredSkills.length === 0 ? (
          <p className="text-sm text-[#9E8490] py-6">
            Add skills to populate your Skill Universe galaxy.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill, idx) => {
              const color = getSkillColor(skill, idx);
              const isSelected = selectedSkill?.id === skill.id;
              return (
                <motion.div
                  key={skill.id}
                  layout
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedSkillId(skill.id)}
                  className={`rounded-xl border p-4 space-y-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-rose-400/45 bg-[#6E1233]/25'
                      : 'border-rose-200/10 bg-[#0D0409]/75 hover:border-rose-200/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                      />
                      <div>
                        <p className="text-xs text-[#9E8490]">
                          {skill.category} · {skill.kind === 'technical' ? 'Tech' : 'Non-Tech'}
                        </p>
                        <h3 className="text-sm font-semibold text-[#FAF4F6] mt-0.5">{skill.name}</h3>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#F8A5BE] tabular-nums">
                      {skill.proficiency}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-[#19070F] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${skill.proficiency}%`,
                        background: `linear-gradient(90deg, ${color}, #D9C6EC)`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#9E8490]">
                    <span className="truncate">
                      {skill.goalCompleted ? 'Goal completed' : `Target ${skill.goalTarget}%`}
                    </span>
                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => openEditModal(skill)}
                        className="text-[#9E8490] hover:text-[#FAF4F6] cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSkill(skill)}
                        className="text-[#9E8490] hover:text-rose-300 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Animated Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22 }}
              className="max-w-lg w-full glass-surface-elevated rounded-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#FAF4F6]">
                  {editingSkill ? 'Edit Skill Planet' : 'Add Skill Planet & Goal'}
                </h2>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close modal"
                  className="p-1.5 rounded-lg text-[#9E8490] hover:text-[#FAF4F6] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-950/60 px-3 py-2 text-xs text-rose-100">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="skill-name" className="block text-xs font-medium text-[#D8C7CE]">
                    Skill Name *
                  </label>
                  <input
                    id="skill-name"
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.skillNameMax}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="TypeScript, PyTorch, Technical Writing..."
                    className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="skill-category" className="block text-xs font-medium text-[#D8C7CE]">
                      Domain Category
                    </label>
                    <select
                      id="skill-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SkillCategory)}
                      className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                    >
                      {SKILL_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="skill-kind" className="block text-xs font-medium text-[#D8C7CE]">
                      Skill Classification
                    </label>
                    <select
                      id="skill-kind"
                      value={kind}
                      onChange={(e) => setKind(e.target.value as SkillKind)}
                      className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                    >
                      <option value="technical">Technical</option>
                      <option value="non-technical">Non-Technical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <label htmlFor="skill-proficiency" className="text-[#D8C7CE] font-medium">
                        Proficiency
                      </label>
                      <span className="font-mono text-[#F8A5BE] tabular-nums">{proficiency}%</span>
                    </div>
                    <input
                      id="skill-proficiency"
                      type="range"
                      min={0}
                      max={100}
                      value={proficiency}
                      onChange={(e) => setProficiency(Number(e.target.value))}
                      className="w-full accent-[#F45B84]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <label htmlFor="skill-target" className="text-[#D8C7CE] font-medium">
                        Goal Target
                      </label>
                      <span className="font-mono text-[#D9C6EC] tabular-nums">{goalTarget}%</span>
                    </div>
                    <input
                      id="skill-target"
                      type="range"
                      min={0}
                      max={100}
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(Number(e.target.value))}
                      className="w-full accent-[#D9C6EC]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="skill-goal-desc" className="block text-xs font-medium text-[#D8C7CE]">
                    Learning Goal Milestone
                  </label>
                  <input
                    id="skill-goal-desc"
                    type="text"
                    maxLength={FIELD_LIMITS.goalDescMax}
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    placeholder="Build and benchmark a production service..."
                    className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-[#D8C7CE] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={goalCompleted}
                      onChange={(e) => setGoalCompleted(e.target.checked)}
                      className="rounded border-rose-200/20 bg-[#0D0408] text-[#F45B84]"
                    />
                    Mark learning goal completed
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs text-[#D8C7CE] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="rounded border-rose-200/20 bg-[#0D0408] text-[#F45B84]"
                    />
                    Show on public profile
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-200/10">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-rose-200/15 text-xs font-medium text-[#D8C7CE] hover:text-[#FAF4F6] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] disabled:opacity-60 text-xs font-semibold text-[#FAF4F6] cursor-pointer"
                  >
                    {saving ? 'Saving...' : editingSkill ? 'Save Changes' : 'Add Skill'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
