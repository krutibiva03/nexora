import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Globe, Lock, Save, Upload, User } from 'lucide-react';
import { uploadWorkspaceFile } from '../services/uploadService';
import { DeveloperProfile, FIELD_LIMITS } from '../types/nexora';
import { isValidHandle, isValidHttpOrAssetUrl, parseTagList, sanitizeHandle } from '../utils/validation';
import { MagneticButton } from './MotionPrimitives';

interface IdentityStudioProps {
  profile: DeveloperProfile | null;
  isDemoMode: boolean;
  onSaveProfile: (
    data: Pick<
      DeveloperProfile,
      | 'handle'
      | 'displayName'
      | 'headline'
      | 'bio'
      | 'avatarUrl'
      | 'location'
      | 'roleTag'
      | 'interests'
      | 'githubUrl'
      | 'linkedinUrl'
      | 'websiteUrl'
      | 'twitterUrl'
      | 'isPublic'
    >
  ) => Promise<void>;
  onOpenPublicProfile: () => void;
}

export const IdentityStudio: React.FC<IdentityStudioProps> = ({
  profile,
  isDemoMode,
  onSaveProfile,
  onOpenPublicProfile,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [headline, setHeadline] = useState('');
  const [roleTag, setRoleTag] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || '');
    setHandle(profile.handle || '');
    setHeadline(profile.headline || '');
    setRoleTag(profile.roleTag || '');
    setLocation(profile.location || '');
    setBio(profile.bio || '');
    setInterestsText((profile.interests || []).join(', '));
    setAvatarUrl(profile.avatarUrl || '');
    setGithubUrl(profile.githubUrl || '');
    setLinkedinUrl(profile.linkedinUrl || '');
    setWebsiteUrl(profile.websiteUrl || '');
    setTwitterUrl(profile.twitterUrl || '');
    setIsPublic(Boolean(profile.isPublic));
  }, [profile]);

  const shareUrl = `${window.location.origin}/?u=${encodeURIComponent(handle || profile?.handle || 'builder')}`;

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (isDemoMode) {
      const localUrl = URL.createObjectURL(file);
      setAvatarUrl(localUrl);
      return;
    }
    setUploadingAvatar(true);
    try {
      const uploaded = await uploadWorkspaceFile(file, 'avatars');
      setAvatarUrl(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedNotice(false);

    const cleanName = displayName.trim();
    const cleanHandle = sanitizeHandle(handle);

    if (!cleanName) {
      setError('Display name is required.');
      return;
    }
    if (!isValidHandle(cleanHandle)) {
      setError('Handle must be 2–40 lowercase letters, numbers, underscores, or hyphens.');
      return;
    }
    const urlChecks: Array<[string, string]> = [
      ['Avatar URL', avatarUrl],
      ['GitHub URL', githubUrl],
      ['LinkedIn URL', linkedinUrl],
      ['Website URL', websiteUrl],
      ['X / Twitter URL', twitterUrl],
    ];
    for (const [label, value] of urlChecks) {
      if (!isValidHttpOrAssetUrl(value)) {
        setError(`${label} must start with https:// or http:// (or be a valid uploaded asset).`);
        return;
      }
    }

    setSaving(true);
    try {
      await onSaveProfile({
        displayName: cleanName.slice(0, FIELD_LIMITS.displayNameMax),
        handle: cleanHandle,
        headline: headline.trim().slice(0, FIELD_LIMITS.headlineMax),
        roleTag: roleTag.trim().slice(0, FIELD_LIMITS.roleTagMax),
        location: location.trim().slice(0, FIELD_LIMITS.locationMax),
        bio: bio.trim().slice(0, FIELD_LIMITS.bioMax),
        interests: parseTagList(interestsText),
        avatarUrl: avatarUrl.trim(),
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        websiteUrl: websiteUrl.trim(),
        twitterUrl: twitterUrl.trim(),
        isPublic,
      });
      setHandle(cleanHandle);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setError('Unable to copy link automatically. Copy it from the address field.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#F45B84]">
            Identity Studio
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#FAF4F6] mt-1">
            Developer Identity & Visibility
          </h1>
          <p className="text-sm text-[#D8C7CE]/80 mt-1">
            Configure your public developer profile, links, and privacy boundary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopyShareUrl}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200/15 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-[#FAF4F6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedUrl ? 'Copied Share URL' : 'Copy Public URL'}
          </button>
          <MagneticButton
            type="button"
            onClick={onOpenPublicProfile}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] text-xs font-semibold text-[#FAF4F6] shadow-[0_8px_24px_rgba(244,91,132,0.28)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview Public Profile
          </MagneticButton>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-500/35 bg-rose-950/60 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {savedNotice && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-200">
          {isDemoMode
            ? 'Demo workspace profile updated locally for this session.'
            : 'Identity profile saved to Firestore.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-surface-elevated rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#0D0408] border border-rose-300/25 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName || 'Developer avatar'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-[#9E8490]" />
                )}
              </div>
              <div className="space-y-1.5 min-w-0">
                <p className="text-sm font-semibold text-[#FAF4F6] truncate">
                  {displayName || 'Your Name'}
                </p>
                <p className="text-xs font-mono text-[#F8A5BE] truncate">
                  @{handle || 'handle'}
                </p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200/15 bg-white/[0.04] hover:bg-white/[0.09] text-xs font-medium text-[#FAF4F6] transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="avatar-url" className="block text-xs font-medium text-[#D8C7CE]">
                Or Avatar Image URL
              </label>
              <input
                id="avatar-url"
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://... or uploaded asset path"
                className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2 text-sm text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
              />
            </div>

            <div className="pt-4 border-t border-rose-200/10 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {isPublic ? (
                    <Globe className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="text-sm font-medium text-[#FAF4F6]">
                    {isPublic ? 'Public Profile Enabled' : 'Private Profile'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPublic}
                  onClick={() => setIsPublic((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    isPublic ? 'bg-[#9E1A43]' : 'bg-[#2A101B]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-[#FAF4F6] transition-transform ${
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-[#9E8490] leading-relaxed">
                {isPublic
                  ? 'Your public profile, public skills, projects, and certificates appear in Community Discover and via your shareable URL.'
                  : 'Your profile is hidden from Community Discover and external share links.'}
              </p>
              <div className="rounded-xl bg-[#0D0408] border border-rose-200/10 px-3 py-2">
                <p className="text-[11px] text-[#9E8490] mb-0.5">Shareable Profile URL</p>
                <p className="text-xs font-mono text-[#F8A5BE] truncate">{shareUrl}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 glass-surface rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="display-name" className="block text-xs font-medium text-[#D8C7CE]">
                Full Name *
              </label>
              <input
                id="display-name"
                type="text"
                required
                maxLength={FIELD_LIMITS.displayNameMax}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-handle" className="block text-xs font-medium text-[#D8C7CE]">
                Public Handle * (lowercase, numbers, _ or -)
              </label>
              <input
                id="profile-handle"
                type="text"
                required
                maxLength={FIELD_LIMITS.handleMax}
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase())}
                placeholder="ada_systems"
                className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm font-mono text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="profile-headline" className="block text-xs font-medium text-[#D8C7CE]">
                Headline
              </label>
              <input
                id="profile-headline"
                type="text"
                maxLength={FIELD_LIMITS.headlineMax}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Full-Stack TypeScript Engineer & Applied AI Learner"
                className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="role-tag" className="block text-xs font-medium text-[#D8C7CE]">
                Focus Track
              </label>
              <input
                id="role-tag"
                type="text"
                maxLength={FIELD_LIMITS.roleTagMax}
                value={roleTag}
                onChange={(e) => setRoleTag(e.target.value)}
                placeholder="AI/ML Learner · CS Student"
                className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-location" className="block text-xs font-medium text-[#D8C7CE]">
                Location
              </label>
              <input
                id="profile-location"
                type="text"
                maxLength={FIELD_LIMITS.locationMax}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bengaluru / Remote"
                className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-bio" className="block text-xs font-medium text-[#D8C7CE]">
              Developer Bio
            </label>
            <textarea
              id="profile-bio"
              rows={4}
              maxLength={FIELD_LIMITS.bioMax}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Summarize what you build, the technologies you specialize in, and what you are currently learning..."
              className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-interests" className="block text-xs font-medium text-[#D8C7CE]">
              Interests (comma-separated, up to 12)
            </label>
            <input
              id="profile-interests"
              type="text"
              value={interestsText}
              onChange={(e) => setInterestsText(e.target.value)}
              placeholder="Distributed Systems, Applied AI, Open Source, WebGL"
              className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
            />
          </div>

          <div className="pt-4 border-t border-rose-200/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="github-url" className="block text-xs font-medium text-[#D8C7CE]">
                GitHub URL
              </label>
              <input
                id="github-url"
                type="url"
                maxLength={FIELD_LIMITS.urlMax}
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="linkedin-url" className="block text-xs font-medium text-[#D8C7CE]">
                LinkedIn URL
              </label>
              <input
                id="linkedin-url"
                type="url"
                maxLength={FIELD_LIMITS.urlMax}
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="website-url" className="block text-xs font-medium text-[#D8C7CE]">
                Website / Portfolio URL
              </label>
              <input
                id="website-url"
                type="url"
                maxLength={FIELD_LIMITS.urlMax}
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourdomain.dev"
                className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="twitter-url" className="block text-xs font-medium text-[#D8C7CE]">
                X / Social Link
              </label>
              <input
                id="twitter-url"
                type="url"
                maxLength={FIELD_LIMITS.urlMax}
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://x.com/username"
                className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-rose-200/10 flex items-center justify-end">
            <MagneticButton
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] disabled:opacity-60 text-sm font-semibold text-[#FAF4F6] shadow-[0_8px_24px_rgba(244,91,132,0.28)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Identity...' : 'Save Identity Profile'}
            </MagneticButton>
          </div>
        </div>
      </form>
    </div>
  );
};
