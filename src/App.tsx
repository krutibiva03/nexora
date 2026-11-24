import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  Award,
  Compass,
  FolderKanban,
  Globe,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import { AICareerCompanion } from './components/AICareerCompanion';
import { AchievementVault } from './components/AchievementVault';
import { CommunityDiscover } from './components/CommunityDiscover';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FloatingNavbar, NavSectionKey } from './components/FloatingNavbar';
import { IdentityStudio } from './components/IdentityStudio';
import { LandingView } from './components/LandingView';
import { ProgressDashboard } from './components/ProgressDashboard';
import { ProjectGalaxy } from './components/ProjectGalaxy';
import { PublicProfileView } from './components/PublicProfileView';
import { SkillUniverse } from './components/SkillUniverse';
import { UniverseBackground } from './components/UniverseBackground';
import { DEMO_ACCOUNTS } from './data/demoWorkspace';
import { auth, googleProvider } from './firebase';
import {
  createAchievement,
  createProject,
  createSkill,
  deleteAchievement,
  deleteProject,
  deleteSkill,
  ensureUserInitialized,
  fetchPublicCommunitySnapshot,
  logUserActivity,
  subscribeUserWorkspace,
  syncProfileCounters,
  toggleSkillGoalProgress,
  updateAchievement,
  updateDeveloperProfile,
  updateProject,
  updateSkill,
} from './services/firestoreService';
import {
  AchievementItem,
  ActivityLog,
  DeveloperProfile,
  ProjectItem,
  SkillItem,
  WorkspaceSection,
} from './types/nexora';

const NAV_ITEMS: Array<{
  id: WorkspaceSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Progress Dashboard', icon: LayoutDashboard },
  { id: 'identity', label: 'Identity Studio', icon: UserIcon },
  { id: 'skills', label: 'Skill Universe', icon: Layers },
  { id: 'projects', label: 'Project Galaxy', icon: FolderKanban },
  { id: 'achievements', label: 'Achievement Vault', icon: Award },
  { id: 'companion', label: 'AI Companion', icon: Sparkles },
  { id: 'discover', label: 'Community Discover', icon: Compass },
  { id: 'public-profile', label: 'Public Profile', icon: Globe },
];

function NexoraApp() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [entryMode, setEntryMode] = useState<'landing' | 'demo' | 'discover' | 'public-view'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('u')) return 'public-view';
    return 'landing';
  });
  const [requestedHandle, setRequestedHandle] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('u')?.trim().toLowerCase() || null;
  });

  const [section, setSection] = useState<WorkspaceSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  const [demoProfile, setDemoProfile] = useState<DeveloperProfile>(() => DEMO_ACCOUNTS[0].profile);
  const [demoSkills, setDemoSkills] = useState<SkillItem[]>(() => DEMO_ACCOUNTS[0].skills);
  const [demoProjects, setDemoProjects] = useState<ProjectItem[]>(() => DEMO_ACCOUNTS[0].projects);
  const [demoAchievements, setDemoAchievements] = useState<AchievementItem[]>(
    () => DEMO_ACCOUNTS[0].achievements
  );
  const [demoActivities, setDemoActivities] = useState<ActivityLog[]>(() => DEMO_ACCOUNTS[0].activities);

  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityFirestore, setCommunityFirestore] = useState<{
    profiles: DeveloperProfile[];
    skills: SkillItem[];
    projects: ProjectItem[];
    achievements: AchievementItem[];
  }>({ profiles: [], skills: [], projects: [], achievements: [] });

  const [inspectedDeveloper, setInspectedDeveloper] = useState<DeveloperProfile | null>(null);

  const refreshCommunity = useCallback(async () => {
    setCommunityLoading(true);
    try {
      const snap = await fetchPublicCommunitySnapshot();
      setCommunityFirestore(snap);
    } catch {
      // Non-fatal on empty public datasets
    } finally {
      setCommunityLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCommunity();
  }, [refreshCommunity]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (user) {
        setWorkspaceLoading(true);
        setWorkspaceError(null);
        try {
          await ensureUserInitialized(user);
        } catch (err) {
          setWorkspaceError(err instanceof Error ? err.message : 'Unable to initialize workspace.');
        } finally {
          setWorkspaceLoading(false);
        }
      } else {
        setProfile(null);
        setSkills([]);
        setProjects([]);
        setAchievements([]);
        setActivities([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !authUser) return;
    setWorkspaceLoading(true);
    let initialized = false;
    const unsub = subscribeUserWorkspace(authUser.uid, {
      onProfile: (p) => {
        setProfile(p);
        if (!initialized) {
          initialized = true;
          setWorkspaceLoading(false);
        }
      },
      onSkills: (s) => setSkills(s),
      onProjects: (p) => setProjects(p),
      onAchievements: (a) => setAchievements(a),
      onActivities: (act) => setActivities(act),
      onError: (err) => {
        setWorkspaceError(err.message);
        setWorkspaceLoading(false);
      },
    });
    return () => unsub();
  }, [authReady, authUser]);

  useEffect(() => {
    if (!authUser || !profile) return;
    const completed = skills.filter((s) => s.goalCompleted).length;
    if (
      profile.skillsCount !== skills.length ||
      profile.projectsCount !== projects.length ||
      profile.achievementsCount !== achievements.length ||
      profile.goalsCompletedCount !== completed
    ) {
      void syncProfileCounters(authUser.uid, {
        skillsCount: skills.length,
        projectsCount: projects.length,
        achievementsCount: achievements.length,
        goalsCompletedCount: completed,
      }).catch(() => {
        // Ignore transient sync conflicts
      });
    }
  }, [authUser, profile, skills, projects, achievements]);

  const isDemoMode = !authUser && entryMode === 'demo';
  const activeProfile = authUser ? profile : demoProfile;
  const activeSkills = authUser ? skills : demoSkills;
  const activeProjects = authUser ? projects : demoProjects;
  const activeAchievements = authUser ? achievements : demoAchievements;
  const activeActivities = authUser ? activities : demoActivities;

  const mergedCommunity = useMemo(() => {
    const demoProfiles = DEMO_ACCOUNTS.map((d) => d.profile);
    const demoAllSkills = DEMO_ACCOUNTS.flatMap((d) => d.skills);
    const demoAllProjects = DEMO_ACCOUNTS.flatMap((d) => d.projects);
    const demoAllAchievements = DEMO_ACCOUNTS.flatMap((d) => d.achievements);

    const existingIds = new Set(communityFirestore.profiles.map((p) => p.userId));
    const profilesCombined = [
      ...communityFirestore.profiles,
      ...demoProfiles.filter((d) => !existingIds.has(d.userId)),
    ];

    return {
      profiles: profilesCombined,
      skills: [...communityFirestore.skills, ...demoAllSkills],
      projects: [...communityFirestore.projects, ...demoAllProjects],
      achievements: [...communityFirestore.achievements, ...demoAllAchievements],
    };
  }, [communityFirestore]);

  const urlMatchedProfile = useMemo(() => {
    if (!requestedHandle) return null;
    if (profile && profile.handle === requestedHandle) return profile;
    return mergedCommunity.profiles.find((p) => p.handle === requestedHandle) || null;
  }, [requestedHandle, profile, mergedCommunity.profiles]);

  async function handleSignIn() {
    setAuthError(null);
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setEntryMode('landing');
      setRequestedHandle(null);
      setSection('dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in could not be completed.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError(msg);
      }
    } finally {
      setSigningIn(false);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    setEntryMode('landing');
    setInspectedDeveloper(null);
    setSection('dashboard');
  }

  async function handleSaveProfile(
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
  ) {
    if (authUser) {
      await updateDeveloperProfile(authUser.uid, data);
      await logUserActivity(authUser.uid, 'profile', 'Updated Identity Studio profile', `@${data.handle}`);
      void refreshCommunity();
    } else {
      setDemoProfile((prev) => ({ ...prev, ...data }));
      setDemoActivities((prev) => [
        {
          id: `demo-act-${Date.now()}`,
          userId: demoProfile.userId,
          type: 'profile',
          title: 'Updated Demo Identity Studio profile',
          detail: `@${data.handle}`,
          timestampLabel: 'Just now',
        },
        ...prev,
      ]);
    }
  }

  async function handleCreateSkill(input: Omit<SkillItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    if (authUser) {
      await createSkill(authUser.uid, input);
      await logUserActivity(authUser.uid, 'skill', `Added skill: ${input.name}`, `${input.category} · ${input.proficiency}%`);
      void refreshCommunity();
    } else {
      const item: SkillItem = {
        ...input,
        id: `demo-skill-${Date.now()}`,
        userId: demoProfile.userId,
      };
      setDemoSkills((prev) => [item, ...prev]);
      setDemoActivities((prev) => [
        {
          id: `demo-act-${Date.now()}`,
          userId: demoProfile.userId,
          type: 'skill',
          title: `Added skill: ${input.name}`,
          detail: `${input.category} · ${input.proficiency}%`,
          timestampLabel: 'Just now',
        },
        ...prev,
      ]);
    }
  }

  async function handleUpdateSkill(
    id: string,
    input: Omit<SkillItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) {
    if (authUser) {
      await updateSkill(id, input);
      await logUserActivity(authUser.uid, 'skill', `Updated skill: ${input.name}`, `${input.proficiency}% mastery`);
      void refreshCommunity();
    } else {
      setDemoSkills((prev) => prev.map((s) => (s.id === id ? { ...s, ...input } : s)));
    }
  }

  async function handleToggleGoal(skill: SkillItem) {
    const nextCompleted = !skill.goalCompleted;
    const nextProficiency = nextCompleted ? Math.max(skill.proficiency, skill.goalTarget) : skill.proficiency;
    if (authUser) {
      await toggleSkillGoalProgress(skill.id, nextProficiency, nextCompleted);
      await logUserActivity(
        authUser.uid,
        'goal',
        nextCompleted ? `Completed learning goal: ${skill.name}` : `Reopened goal: ${skill.name}`,
        `Proficiency ${nextProficiency}%`
      );
    } else {
      setDemoSkills((prev) =>
        prev.map((s) =>
          s.id === skill.id
            ? { ...s, goalCompleted: nextCompleted, proficiency: nextProficiency }
            : s
        )
      );
    }
  }

  async function handleDeleteSkill(skill: SkillItem) {
    if (authUser) {
      await deleteSkill(skill.id);
      await logUserActivity(authUser.uid, 'skill', `Removed skill: ${skill.name}`);
      void refreshCommunity();
    } else {
      setDemoSkills((prev) => prev.filter((s) => s.id !== skill.id));
    }
  }

  async function handleCreateProject(input: Omit<ProjectItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    if (authUser) {
      await createProject(authUser.uid, input);
      await logUserActivity(authUser.uid, 'project', `Published project: ${input.title}`, input.category);
      void refreshCommunity();
    } else {
      const item: ProjectItem = {
        ...input,
        id: `demo-proj-${Date.now()}`,
        userId: demoProfile.userId,
      };
      setDemoProjects((prev) => [item, ...prev]);
      setDemoActivities((prev) => [
        {
          id: `demo-act-${Date.now()}`,
          userId: demoProfile.userId,
          type: 'project',
          title: `Published project: ${input.title}`,
          detail: input.category,
          timestampLabel: 'Just now',
        },
        ...prev,
      ]);
    }
  }

  async function handleUpdateProject(
    id: string,
    input: Omit<ProjectItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) {
    if (authUser) {
      await updateProject(id, input);
      await logUserActivity(authUser.uid, 'project', `Updated project: ${input.title}`, input.category);
      void refreshCommunity();
    } else {
      setDemoProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...input } : p)));
    }
  }

  async function handleDeleteProject(project: ProjectItem) {
    if (authUser) {
      await deleteProject(project.id);
      await logUserActivity(authUser.uid, 'project', `Deleted project: ${project.title}`);
      void refreshCommunity();
    } else {
      setDemoProjects((prev) => prev.filter((p) => p.id !== project.id));
    }
  }

  async function handleCreateAchievement(
    input: Omit<AchievementItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) {
    if (authUser) {
      await createAchievement(authUser.uid, input);
      await logUserActivity(authUser.uid, 'achievement', `Added achievement: ${input.title}`, input.issuer);
      void refreshCommunity();
    } else {
      const item: AchievementItem = {
        ...input,
        id: `demo-ach-${Date.now()}`,
        userId: demoProfile.userId,
      };
      setDemoAchievements((prev) => [item, ...prev]);
      setDemoActivities((prev) => [
        {
          id: `demo-act-${Date.now()}`,
          userId: demoProfile.userId,
          type: 'achievement',
          title: `Added achievement: ${input.title}`,
          detail: input.issuer,
          timestampLabel: 'Just now',
        },
        ...prev,
      ]);
    }
  }

  async function handleUpdateAchievement(
    id: string,
    input: Omit<AchievementItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) {
    if (authUser) {
      await updateAchievement(id, input);
      await logUserActivity(authUser.uid, 'achievement', `Updated achievement: ${input.title}`, input.issuer);
      void refreshCommunity();
    } else {
      setDemoAchievements((prev) => prev.map((a) => (a.id === id ? { ...a, ...input } : a)));
    }
  }

  async function handleDeleteAchievement(item: AchievementItem) {
    if (authUser) {
      await deleteAchievement(item.id);
      await logUserActivity(authUser.uid, 'achievement', `Removed achievement: ${item.title}`);
      void refreshCommunity();
    } else {
      setDemoAchievements((prev) => prev.filter((a) => a.id !== item.id));
    }
  }

  function handlePublicNavSelect(key: NavSectionKey) {
    if (key === 'home') {
      window.history.replaceState({}, '', '/');
      setRequestedHandle(null);
      setEntryMode('landing');
      return;
    }
    if (key === 'explore') {
      window.history.replaceState({}, '', '/');
      setRequestedHandle(null);
      setEntryMode('demo');
      setSection('dashboard');
      return;
    }
    if (key === 'skills') {
      setEntryMode('demo');
      setSection('skills');
      return;
    }
    if (key === 'projects') {
      setEntryMode('demo');
      setSection('projects');
      return;
    }
    if (key === 'community') {
      window.history.replaceState({}, '', '/');
      setRequestedHandle(null);
      setEntryMode('discover');
      return;
    }
    if (key === 'companion') {
      setEntryMode('demo');
      setSection('companion');
    }
  }

  // Animated Loading Screen
  if (!authReady) {
    return (
      <div className="relative min-h-screen bg-[#070306] text-[#D8C7CE] flex items-center justify-center p-6 overflow-hidden">
        <UniverseBackground variant="landing" />
        <div className="relative z-10 text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-[#F45B84]/45 animate-orbit-fast" />
            <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#6E1233] via-[#F45B84] to-[#D9C6EC] shadow-[0_0_24px_rgba(244,91,132,0.65)]" />
          </div>
          <p className="font-display text-xl font-bold tracking-[0.2em] nexora-gradient-text">
            NEXORA
          </p>
          <p className="text-xs text-[#9E8490]">Initializing digital workspace...</p>
        </div>
      </div>
    );
  }

  // Shareable external public profile view (?u=<handle>) when not inside workspace
  if (!authUser && entryMode === 'public-view') {
    const target = urlMatchedProfile;
    const targetSkills = target
      ? target.userId === profile?.userId
        ? skills
        : mergedCommunity.skills.filter((s) => s.userId === target.userId)
      : [];
    const targetProjects = target
      ? target.userId === profile?.userId
        ? projects
        : mergedCommunity.projects.filter((p) => p.userId === target.userId)
      : [];
    const targetAchievements = target
      ? target.userId === profile?.userId
        ? achievements
        : mergedCommunity.achievements.filter((a) => a.userId === target.userId)
      : [];

    return (
      <div className="relative min-h-screen bg-[#070306] text-[#FAF4F6] overflow-x-hidden">
        <UniverseBackground variant="discover" />
        <FloatingNavbar
          activeNav="community"
          onSelectNav={handlePublicNavSelect}
          onAuthAction={handleSignIn}
          authLabel="Sign In"
          signingIn={signingIn}
        />
        <main className="relative z-10 max-w-[1200px] mx-auto px-6 pt-28 pb-16">
          <PublicProfileView
            profile={target}
            skills={targetSkills}
            projects={targetProjects}
            achievements={targetAchievements}
            isOwnProfile={false}
            onBack={() => {
              window.history.replaceState({}, '', '/');
              setRequestedHandle(null);
              setEntryMode('discover');
            }}
          />
        </main>
      </div>
    );
  }

  // Public Community Discover view (before signing in)
  if (!authUser && entryMode === 'discover') {
    return (
      <div className="relative min-h-screen bg-[#070306] text-[#FAF4F6] overflow-x-hidden">
        <UniverseBackground variant="discover" />
        <FloatingNavbar
          activeNav="community"
          onSelectNav={handlePublicNavSelect}
          onAuthAction={handleSignIn}
          authLabel="Sign In"
          signingIn={signingIn}
        />
        <main className="relative z-10 max-w-[1280px] mx-auto px-6 pt-28 pb-16">
          <CommunityDiscover
            profiles={mergedCommunity.profiles}
            skills={mergedCommunity.skills}
            projects={mergedCommunity.projects}
            achievements={mergedCommunity.achievements}
            loading={communityLoading}
            onSelectDeveloper={(dev) => {
              setRequestedHandle(dev.handle);
              setEntryMode('public-view');
            }}
          />
        </main>
      </div>
    );
  }

  // Landing view when unauthenticated and not in Demo Workspace
  if (!authUser && entryMode === 'landing') {
    return (
      <LandingView
        onSignIn={handleSignIn}
        onEnterDemo={(initialSection) => {
          setEntryMode('demo');
          setSection(initialSection || 'dashboard');
        }}
        onOpenDiscover={() => setEntryMode('discover')}
        signingIn={signingIn}
        authError={authError}
      />
    );
  }

  // Full Multi-Module SaaS Workspace (Authenticated User OR Clearly-Labeled Demo Workspace)
  const viewingExternalProfile = section === 'public-profile' && inspectedDeveloper !== null;
  const publicTarget = viewingExternalProfile ? inspectedDeveloper : activeProfile;
  const publicSkills = viewingExternalProfile
    ? mergedCommunity.skills.filter((s) => s.userId === inspectedDeveloper.userId)
    : activeSkills;
  const publicProjects = viewingExternalProfile
    ? mergedCommunity.projects.filter((p) => p.userId === inspectedDeveloper.userId)
    : activeProjects;
  const publicAchievements = viewingExternalProfile
    ? mergedCommunity.achievements.filter((a) => a.userId === inspectedDeveloper.userId)
    : activeAchievements;

  return (
    <div className="relative min-h-screen bg-[#070306] text-[#FAF4F6] flex overflow-x-hidden">
      <UniverseBackground variant={section === 'discover' ? 'discover' : 'workspace'} />

      {/* Desktop Glass Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 border-r border-rose-200/10 bg-[#100409]/88 backdrop-blur-xl">
        <div className="px-6 py-5 border-b border-rose-200/10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setInspectedDeveloper(null);
              setSection('dashboard');
            }}
            className="flex items-center gap-2.5 whitespace-nowrap cursor-pointer"
          >
            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6E1233] via-[#C83E88] to-[#F45B84] flex items-center justify-center shadow-[0_0_16px_rgba(244,91,132,0.45)]">
              <span className="w-2 h-2 rounded-full bg-[#FAF4F6]" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-[#FAF4F6]">
              NEXORA
            </span>
          </button>
          <span className="text-[11px] font-mono text-[#F8A5BE]">
            {isDemoMode ? 'DEMO' : 'LIVE'}
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Workspace navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id !== 'public-profile') {
                    setInspectedDeveloper(null);
                  }
                  setSection(item.id);
                }}
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'text-[#FAF4F6]'
                    : 'text-[#9E8490] hover:text-[#FAF4F6] hover:bg-white/[0.04]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="workspace-nav-pill"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#6E1233]/50 to-[#F45B84]/15 border border-rose-300/30"
                  />
                )}
                <Icon
                  className={`relative z-10 w-4 h-4 shrink-0 ${
                    active ? 'text-[#F8A5BE]' : 'text-[#9E8490]'
                  }`}
                />
                <span className="relative z-10 truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-rose-200/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#0B0307] border border-rose-300/20 flex items-center justify-center shrink-0">
              {activeProfile?.avatarUrl ? (
                <img
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.displayName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-[#9E8490]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#FAF4F6] truncate">
                {activeProfile?.displayName || 'Builder'}
              </p>
              <p className="text-[11px] font-mono text-[#F8A5BE] truncate">
                @{activeProfile?.handle || 'handle'}
              </p>
            </div>
          </div>

          {authUser ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-rose-200/15 hover:bg-white/[0.06] text-xs font-medium text-[#D8C7CE] hover:text-[#FAF4F6] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={signingIn}
                className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] text-xs font-semibold text-[#FAF4F6] transition-all cursor-pointer"
              >
                {signingIn ? 'Signing in...' : 'Sign In with Google'}
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('landing')}
                className="w-full px-3 py-1.5 rounded-xl text-xs text-[#9E8490] hover:text-[#FAF4F6] transition-colors cursor-pointer"
              >
                Back to Landing
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Context Bar */}
        <header className="sticky top-0 z-20 border-b border-rose-200/10 bg-[#070306]/80 backdrop-blur-xl">
          <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 rounded-xl border border-rose-200/15 text-[#D8C7CE] hover:bg-white/[0.06] cursor-pointer"
              >
                <Menu className="w-4 h-4" />
              </button>
              <span className="lg:hidden font-display text-base font-bold text-[#FAF4F6]">NEXORA</span>
              <span className="hidden lg:inline text-xs text-[#9E8490] truncate">
                Workspace / <span className="text-[#FAF4F6]">{NAV_ITEMS.find((n) => n.id === section)?.label}</span>
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isDemoMode && (
                <span className="hidden sm:inline text-xs text-amber-300/90 font-medium">
                  Demo Account (Session-local preview)
                </span>
              )}
              {authUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setInspectedDeveloper(null);
                    setSection('public-profile');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200/15 bg-white/[0.04] hover:bg-white/[0.09] text-xs font-medium text-[#FAF4F6] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-[#F8A5BE]" />
                  My Public Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] text-xs font-semibold text-[#FAF4F6] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {signingIn ? 'Signing in...' : 'Sign In'}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Drawer Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden bg-black/80 backdrop-blur-sm flex"
            >
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.22 }}
                className="w-72 max-w-[85vw] bg-[#100409] border-r border-rose-200/10 p-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-[#FAF4F6]">NEXORA</span>
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Close navigation menu"
                      className="p-1.5 rounded-lg text-[#9E8490] hover:text-[#FAF4F6] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <nav className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = section === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (item.id !== 'public-profile') setInspectedDeveloper(null);
                            setSection(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium cursor-pointer ${
                            active
                              ? 'bg-[#6E1233]/45 text-[#FAF4F6] border border-rose-300/30'
                              : 'text-[#D8C7CE] hover:bg-white/[0.05]'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-4 border-t border-rose-200/10 space-y-2">
                  {authUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        void handleSignOut();
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-rose-200/15 text-xs font-medium text-[#D8C7CE] cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          void handleSignIn();
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] text-xs font-semibold text-[#FAF4F6] cursor-pointer"
                      >
                        Sign In with Google
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setEntryMode('landing');
                        }}
                        className="w-full px-3 py-1.5 rounded-xl text-xs text-[#9E8490] hover:text-[#FAF4F6] cursor-pointer"
                      >
                        Back to Landing
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
              <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Module Viewport with Animated Section Transitions */}
        <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {workspaceError && (
            <div role="alert" className="mb-6 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {workspaceError}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {section === 'dashboard' && (
                <ProgressDashboard
                  profile={activeProfile}
                  skills={activeSkills}
                  projects={activeProjects}
                  achievements={activeAchievements}
                  activities={activeActivities}
                  isDemoMode={isDemoMode}
                  loading={workspaceLoading}
                  onNavigate={(target) => {
                    if (target !== 'public-profile') setInspectedDeveloper(null);
                    setSection(target);
                  }}
                  onToggleGoal={handleToggleGoal}
                />
              )}

              {section === 'identity' && (
                <IdentityStudio
                  profile={activeProfile}
                  isDemoMode={isDemoMode}
                  onSaveProfile={handleSaveProfile}
                  onOpenPublicProfile={() => {
                    setInspectedDeveloper(null);
                    setSection('public-profile');
                  }}
                />
              )}

              {section === 'skills' && (
                <SkillUniverse
                  skills={activeSkills}
                  onCreateSkill={handleCreateSkill}
                  onUpdateSkill={handleUpdateSkill}
                  onToggleGoal={handleToggleGoal}
                  onDeleteSkill={handleDeleteSkill}
                />
              )}

              {section === 'projects' && (
                <ProjectGalaxy
                  profile={activeProfile}
                  projects={activeProjects}
                  isDemoMode={isDemoMode}
                  onCreateProject={handleCreateProject}
                  onUpdateProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                />
              )}

              {section === 'achievements' && (
                <AchievementVault
                  profile={activeProfile}
                  achievements={activeAchievements}
                  isDemoMode={isDemoMode}
                  onCreateAchievement={handleCreateAchievement}
                  onUpdateAchievement={handleUpdateAchievement}
                  onDeleteAchievement={handleDeleteAchievement}
                />
              )}

              {section === 'companion' && (
                <AICareerCompanion
                  profile={activeProfile}
                  skills={activeSkills}
                  projects={activeProjects}
                  achievementsCount={activeAchievements.length}
                  isDemoMode={isDemoMode}
                  onLogAIActivity={
                    authUser
                      ? (title, detail) => {
                          void logUserActivity(authUser.uid, 'ai', title, detail);
                        }
                      : undefined
                  }
                  onSignInRequest={handleSignIn}
                />
              )}

              {section === 'discover' && (
                <CommunityDiscover
                  profiles={mergedCommunity.profiles}
                  skills={mergedCommunity.skills}
                  projects={mergedCommunity.projects}
                  achievements={mergedCommunity.achievements}
                  loading={communityLoading}
                  onSelectDeveloper={(dev) => {
                    setInspectedDeveloper(dev);
                    setSection('public-profile');
                  }}
                />
              )}

              {section === 'public-profile' && (
                <PublicProfileView
                  profile={publicTarget}
                  skills={publicSkills}
                  projects={publicProjects}
                  achievements={publicAchievements}
                  isOwnProfile={!viewingExternalProfile}
                  onBack={
                    viewingExternalProfile
                      ? () => {
                          setInspectedDeveloper(null);
                          setSection('discover');
                        }
                      : undefined
                  }
                  onEditProfile={() => setSection('identity')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating AI Career Companion Quick-Launch Orb */}
        {section !== 'companion' && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSection('companion')}
            aria-label="Open AI Career Companion"
            title="Ask AI Career Companion"
            className="hidden sm:flex fixed bottom-6 right-6 z-30 w-13 h-13 rounded-full bg-gradient-to-br from-[#6E1233] via-[#C83E88] to-[#F45B84] items-center justify-center shadow-[0_0_32px_rgba(244,91,132,0.5)] border border-rose-200/25 cursor-pointer"
          >
            <span className="absolute inset-0 rounded-full bg-[#F45B84]/35 blur-md animate-orb-pulse" />
            <Sparkles className="relative z-10 w-5 h-5 text-[#FAF4F6]" />
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <NexoraApp />
    </ErrorBoundary>
  );
}
