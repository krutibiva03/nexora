import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Award, Check, Code2, Copy, ExternalLink, Globe, Lock, MapPin, User } from 'lucide-react';
import {
  AchievementItem,
  DeveloperProfile,
  ProjectItem,
  SkillItem,
} from '../types/nexora';

interface PublicProfileViewProps {
  profile: DeveloperProfile | null;
  skills: SkillItem[];
  projects: ProjectItem[];
  achievements: AchievementItem[];
  isOwnProfile: boolean;
  onBack?: () => void;
  onEditProfile?: () => void;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  profile,
  skills,
  projects,
  achievements,
  isOwnProfile,
  onBack,
  onEditProfile,
}) => {
  const [copied, setCopied] = useState(false);

  if (!profile) {
    return (
      <div className="glass-surface rounded-2xl p-12 text-center space-y-3">
        <User className="w-8 h-8 text-[#9E8490] mx-auto" />
        <p className="text-base font-semibold text-[#FAF4F6]">Developer Profile Not Found</p>
        <p className="text-sm text-[#D8C7CE]/80">
          This profile may be private or the handle does not exist.
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6E1233] hover:bg-[#88163F] text-xs font-medium text-[#FAF4F6] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return
          </button>
        )}
      </div>
    );
  }

  if (!profile.isPublic && !isOwnProfile) {
    return (
      <div className="glass-surface rounded-2xl p-12 text-center space-y-3">
        <Lock className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="text-base font-semibold text-[#FAF4F6]">This Profile Is Private</p>
        <p className="text-sm text-[#D8C7CE]/80">
          @{profile.handle} has restricted public visibility for their profile.
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6E1233] hover:bg-[#88163F] text-xs font-medium text-[#FAF4F6] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Discover
          </button>
        )}
      </div>
    );
  }

  const publicSkills = skills.filter((s) => s.isPublic);
  const publicProjects = projects.filter((p) => p.isPublic);
  const publicAchievements = achievements.filter((a) => a.isPublic);

  const shareUrl = `${window.location.origin}/?u=${encodeURIComponent(profile.handle)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200/15 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-[#D8C7CE] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
          <span className="text-xs text-[#9E8490]">
            {profile.isDemoAccount ? 'Demo Account Public Profile' : 'Shareable Public Profile'}
            {!profile.isPublic && isOwnProfile ? ' · Currently Private (Only visible to you)' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200/20 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-[#FAF4F6] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#F8A5BE]" />}
            {copied ? 'Link Copied' : 'Copy Share Link'}
          </button>
          {isOwnProfile && onEditProfile && (
            <button
              type="button"
              onClick={onEditProfile}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] text-xs font-semibold text-[#FAF4F6] shadow-[0_8px_22px_rgba(244,91,132,0.25)] transition-all cursor-pointer"
            >
              Edit in Identity Studio
            </button>
          )}
        </div>
      </div>

      {/* Hero Profile Header */}
      <section className="glass-surface-elevated rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#0B0307] border border-rose-300/25 flex items-center justify-center shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-[#9E8490]" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#9E8490]">
                <span className="font-mono text-[#F8A5BE]">@{profile.handle}</span>
                {profile.roleTag && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{profile.roleTag}</span>
                  </>
                )}
                {profile.location && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {profile.location}
                    </span>
                  </>
                )}
              </div>

              <h1 className="font-display text-2xl md:text-3xl font-bold text-[#FAF4F6]">
                {profile.displayName}
              </h1>

              {profile.headline && (
                <p className="text-sm md:text-base text-[#F8E7ED]">{profile.headline}</p>
              )}

              {profile.bio && (
                <p className="text-sm text-[#D8C7CE] leading-relaxed max-w-2xl pt-1">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 text-xs font-medium shrink-0">
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#D8C7CE] hover:text-[#FAF4F6]"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#D8C7CE] hover:text-[#FAF4F6]"
              >
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {profile.websiteUrl && (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#F8A5BE] hover:text-[#FAF4F6]"
              >
                <Globe className="w-3 h-3" />
                <span>Website</span>
              </a>
            )}
          </div>
        </div>

        {profile.interests.length > 0 && (
          <div className="pt-4 border-t border-rose-200/10 flex flex-wrap items-center gap-2 text-xs text-[#9E8490]">
            <span className="text-[#D8C7CE] font-medium">Focus Areas:</span>
            <span className="font-mono text-[#D9C6EC]">{profile.interests.join(' · ')}</span>
          </div>
        )}
      </section>

      {/* Public Skills */}
      <section className="glass-surface rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#FAF4F6]">Skill Universe</h2>
          <span className="text-xs font-mono text-[#9E8490] tabular-nums">
            {publicSkills.length} public skills
          </span>
        </div>

        {publicSkills.length === 0 ? (
          <p className="text-sm text-[#9E8490]">No public skills listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicSkills.map((skill) => (
              <div
                key={skill.id}
                className="rounded-xl border border-rose-200/10 bg-[#0D0408]/75 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs text-[#9E8490]">
                  <span>{skill.category}</span>
                  <span className="font-mono text-[#F8A5BE] tabular-nums">{skill.proficiency}%</span>
                </div>
                <p className="text-sm font-semibold text-[#FAF4F6]">{skill.name}</p>
                <div className="h-1.5 w-full rounded-full bg-[#240916] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6E1233] via-[#F45B84] to-[#D9C6EC]"
                    style={{ width: `${skill.proficiency}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Public Projects */}
      <section className="glass-surface rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#FAF4F6]">Project Galaxy</h2>
          <span className="text-xs font-mono text-[#9E8490] tabular-nums">
            {publicProjects.length} public projects
          </span>
        </div>

        {publicProjects.length === 0 ? (
          <p className="text-sm text-[#9E8490]">No public projects published yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {publicProjects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-rose-200/10 bg-[#0D0408]/75 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/9] bg-[#070306] border-b border-rose-200/10 overflow-hidden flex items-center justify-center">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Code2 className="w-7 h-7 text-[#F45B84]/55" />
                    )}
                  </div>
                  <div className="p-5 space-y-2.5">
                    <p className="text-xs text-[#F8A5BE] font-medium">{project.category}</p>
                    <h3 className="text-base font-semibold text-[#FAF4F6]">{project.title}</h3>
                    <p className="text-sm text-[#D8C7CE] leading-relaxed">{project.summary}</p>
                    {project.description && (
                      <p className="text-xs text-[#9E8490] leading-relaxed">{project.description}</p>
                    )}
                    {project.technologies.length > 0 && (
                      <p className="text-xs font-mono text-[#D9C6EC]/90">
                        {project.technologies.join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
                {(project.githubUrl || project.liveUrl) && (
                  <div className="px-5 py-3 border-t border-rose-200/10 flex items-center gap-4 text-xs font-medium">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#D8C7CE] hover:text-[#FAF4F6]"
                      >
                        GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#F8A5BE] hover:text-[#FAF4F6]"
                      >
                        Live Demo <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Public Achievements */}
      <section className="glass-surface rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#FAF4F6]">Achievement Vault</h2>
          <span className="text-xs font-mono text-[#9E8490] tabular-nums">
            {publicAchievements.length} public credentials
          </span>
        </div>

        {publicAchievements.length === 0 ? (
          <p className="text-sm text-[#9E8490]">No public achievements displayed yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicAchievements.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-rose-200/10 bg-[#0D0408]/75 p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-[#9E8490]">
                  <span className="text-[#F8A5BE] font-medium">
                    {item.category}
                    {item.issuedDate ? ` · ${item.issuedDate}` : ''}
                  </span>
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
                <div className="flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-[#F45B84] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#FAF4F6]">{item.title}</p>
                    <p className="text-xs text-[#D9C6EC]">{item.issuer}</p>
                  </div>
                </div>
                {item.description && (
                  <p className="text-xs text-[#D8C7CE] leading-relaxed">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
};
