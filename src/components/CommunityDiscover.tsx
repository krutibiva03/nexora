import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Award, Code2, Compass, ExternalLink, Search, User } from 'lucide-react';
import {
  AchievementItem,
  DeveloperProfile,
  ProjectItem,
  SkillItem,
} from '../types/nexora';
import { TiltCard } from './MotionPrimitives';

interface CommunityDiscoverProps {
  profiles: DeveloperProfile[];
  skills: SkillItem[];
  projects: ProjectItem[];
  achievements: AchievementItem[];
  loading: boolean;
  onSelectDeveloper: (profile: DeveloperProfile) => void;
}

export const CommunityDiscover: React.FC<CommunityDiscoverProps> = ({
  profiles,
  skills,
  projects,
  achievements,
  loading,
  onSelectDeveloper,
}) => {
  const [tab, setTab] = useState<'developers' | 'projects' | 'achievements'>('developers');
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredProfiles = useMemo(() => {
    if (!normalizedQuery) return profiles;
    return profiles.filter((p) => {
      const userSkills = skills.filter((s) => s.userId === p.userId).map((s) => s.name.toLowerCase());
      return (
        p.displayName.toLowerCase().includes(normalizedQuery) ||
        p.handle.toLowerCase().includes(normalizedQuery) ||
        p.headline.toLowerCase().includes(normalizedQuery) ||
        p.interests.some((i) => i.toLowerCase().includes(normalizedQuery)) ||
        userSkills.some((s) => s.includes(normalizedQuery))
      );
    });
  }, [profiles, skills, normalizedQuery]);

  const filteredProjects = useMemo(() => {
    if (!normalizedQuery) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(normalizedQuery) ||
        p.summary.toLowerCase().includes(normalizedQuery) ||
        p.category.toLowerCase().includes(normalizedQuery) ||
        p.technologies.some((t) => t.toLowerCase().includes(normalizedQuery)) ||
        p.authorName.toLowerCase().includes(normalizedQuery)
    );
  }, [projects, normalizedQuery]);

  const filteredAchievements = useMemo(() => {
    if (!normalizedQuery) return achievements;
    return achievements.filter(
      (a) =>
        a.title.toLowerCase().includes(normalizedQuery) ||
        a.issuer.toLowerCase().includes(normalizedQuery) ||
        a.category.toLowerCase().includes(normalizedQuery) ||
        a.authorName.toLowerCase().includes(normalizedQuery)
    );
  }, [achievements, normalizedQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#F45B84]">
            Community Discover
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#FAF4F6] mt-1">
            Explore Public Builders, Projects & Credentials
          </h1>
          <p className="text-sm text-[#D8C7CE]/80 mt-1">
            Search across public NEXORA profiles by skill or technology. Sample profiles are clearly labeled as Demo Accounts.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#9E8490] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills, React, Rust, AI..."
            className="w-full rounded-xl border border-rose-200/15 bg-[#12040A]/85 pl-10 pr-3.5 py-2.5 text-sm text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
          />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#12040A]/90 border border-rose-200/15 w-fit">
        {(
          [
            { id: 'developers', label: `Developers (${filteredProfiles.length})` },
            { id: 'projects', label: `Projects (${filteredProjects.length})` },
            { id: 'achievements', label: `Achievements (${filteredAchievements.length})` },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === item.id
                ? 'bg-gradient-to-r from-[#6E1233] to-[#F45B84] text-[#FAF4F6] shadow-[0_6px_18px_rgba(244,91,132,0.25)]'
                : 'text-[#9E8490] hover:text-[#FAF4F6]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-surface rounded-2xl h-56 animate-pulse" />
          ))}
        </div>
      ) : tab === 'developers' ? (
        filteredProfiles.length === 0 ? (
          <div className="glass-surface rounded-2xl p-12 text-center space-y-2">
            <Compass className="w-7 h-7 text-[#9E8490] mx-auto" />
            <p className="text-sm text-[#D8C7CE]">No public developers match "{query}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((dev, idx) => {
              const devSkills = skills.filter((s) => s.userId === dev.userId).slice(0, 4);
              return (
                <motion.div
                  key={dev.userId}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                >
                  <TiltCard glowColor="rgba(244, 91, 132, 0.28)" className="h-full rounded-2xl">
                    <article className="h-full glass-surface rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-rose-300/35 transition-colors">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0B0307] border border-rose-200/15 flex items-center justify-center shrink-0">
                            {dev.avatarUrl ? (
                              <img
                                src={dev.avatarUrl}
                                alt={dev.displayName}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-[#9E8490]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-[#9E8490]">
                              {dev.isDemoAccount ? 'Demo Account' : 'Verified Member'}
                              {dev.location ? ` · ${dev.location}` : ''}
                            </p>
                            <h2 className="text-base font-semibold text-[#FAF4F6] truncate mt-0.5">
                              {dev.displayName}
                            </h2>
                            <p className="text-xs font-mono text-[#F8A5BE] truncate">@{dev.handle}</p>
                          </div>
                        </div>

                        <p className="text-sm text-[#D8C7CE] line-clamp-2 leading-relaxed">
                          {dev.headline || dev.bio || 'Building in public on NEXORA.'}
                        </p>

                        {devSkills.length > 0 && (
                          <p className="text-xs font-mono text-[#D9C6EC]/90">
                            {devSkills.map((s) => s.name).join(' · ')}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-rose-200/10 flex items-center justify-between">
                        <span className="text-xs text-[#9E8490] font-mono tabular-nums">
                          {dev.skillsCount || devSkills.length} skills · {dev.projectsCount || 0} projects
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectDeveloper(dev)}
                          className="text-xs font-semibold text-[#F8A5BE] hover:text-[#FAF4F6] transition-colors cursor-pointer"
                        >
                          View Profile →
                        </button>
                      </div>
                    </article>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        )
      ) : tab === 'projects' ? (
        filteredProjects.length === 0 ? (
          <div className="glass-surface rounded-2xl p-12 text-center">
            <p className="text-sm text-[#D8C7CE]">No public projects match "{query}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, idx) => {
              const author = profiles.find((p) => p.userId === project.userId);
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                >
                  <TiltCard glowColor="rgba(244, 91, 132, 0.25)" className="h-full rounded-2xl">
                    <article className="group h-full glass-surface rounded-2xl overflow-hidden flex flex-col justify-between hover:border-rose-300/35 transition-colors">
                      <div>
                        <div className="relative aspect-[16/10] bg-[#0B0307] border-b border-rose-200/10 overflow-hidden flex items-center justify-center">
                          {project.imageUrl ? (
                            <img
                              src={project.imageUrl}
                              alt={project.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-[#9E8490]">
                              <Code2 className="w-6 h-6 text-[#F45B84]/70" />
                              <span className="text-xs font-mono">{project.category}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#070306]/75 via-transparent to-transparent pointer-events-none" />
                        </div>
                        <div className="p-5 space-y-2.5">
                          <p className="text-xs text-[#9E8490]">
                            <span className="text-[#F8A5BE]">{project.category}</span> · by @{project.authorHandle}
                          </p>
                          <h2 className="text-base font-semibold text-[#FAF4F6] group-hover:text-[#F8A5BE] transition-colors">
                            {project.title}
                          </h2>
                          <p className="text-sm text-[#D8C7CE] line-clamp-2">{project.summary}</p>
                          {project.technologies.length > 0 && (
                            <p className="text-xs font-mono text-[#D9C6EC]/90">
                              {project.technologies.join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="px-5 py-3 border-t border-rose-200/10 flex items-center justify-between text-xs">
                        {author ? (
                          <button
                            type="button"
                            onClick={() => onSelectDeveloper(author)}
                            className="text-[#D8C7CE] hover:text-[#FAF4F6] font-medium cursor-pointer"
                          >
                            {author.displayName} →
                          </button>
                        ) : (
                          <span className="text-[#9E8490]">{project.authorName}</span>
                        )}
                        <div className="flex items-center gap-3">
                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#D8C7CE] hover:text-[#FAF4F6]"
                            >
                              Code <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#F8A5BE] hover:text-[#FAF4F6]"
                            >
                              Live <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        )
      ) : filteredAchievements.length === 0 ? (
        <div className="glass-surface rounded-2xl p-12 text-center">
          <p className="text-sm text-[#D8C7CE]">No public achievements match "{query}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAchievements.map((item, idx) => {
            const author = profiles.find((p) => p.userId === item.userId);
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.35 }}
                className="glass-surface rounded-2xl p-6 space-y-3 hover:border-rose-300/35 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-[#9E8490]">
                  <span className="text-[#F8A5BE] font-medium">
                    {item.category}
                    {item.issuedDate ? ` · ${item.issuedDate}` : ''}
                  </span>
                  <span className="font-mono">@{item.authorHandle}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-[#F45B84] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-base font-semibold text-[#FAF4F6]">{item.title}</h2>
                    <p className="text-xs text-[#D9C6EC] mt-0.5">{item.issuer}</p>
                  </div>
                </div>
                {item.description && <p className="text-sm text-[#D8C7CE]">{item.description}</p>}
                <div className="pt-2 border-t border-rose-200/10 flex items-center justify-between text-xs">
                  {author ? (
                    <button
                      type="button"
                      onClick={() => onSelectDeveloper(author)}
                      className="text-[#D8C7CE] hover:text-[#FAF4F6] font-medium cursor-pointer"
                    >
                      {author.displayName} →
                    </button>
                  ) : (
                    <span className="text-[#9E8490]">{item.authorName}</span>
                  )}
                  {item.credentialUrl && (
                    <a
                      href={item.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#F8A5BE] hover:text-[#FAF4F6]"
                    >
                      Verify <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
};
