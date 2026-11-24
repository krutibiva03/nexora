export const SKILL_CATEGORIES = [
  'Frontend',
  'Backend',
  'AI & ML',
  'Cloud & DevOps',
  'Systems & Security',
  'Design & Leadership',
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];
export type SkillKind = 'technical' | 'non-technical';

export const PROJECT_CATEGORIES = [
  'AI & ML',
  'Web Platform',
  'Developer Tools',
  'Systems',
  'Mobile',
  'Open Source',
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const ACHIEVEMENT_CATEGORIES = [
  'Certification',
  'Hackathon',
  'Open Source',
  'Academic',
  'Publication',
  'Award',
] as const;

export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];

export type ActivityType = 'skill' | 'project' | 'achievement' | 'goal' | 'profile' | 'ai';

export type WorkspaceSection =
  | 'dashboard'
  | 'identity'
  | 'skills'
  | 'projects'
  | 'achievements'
  | 'companion'
  | 'discover'
  | 'public-profile';

export type AICompanionMode =
  | 'suggest-projects'
  | 'recommend-tech'
  | 'learning-roadmap'
  | 'review-project'
  | 'improve-profile'
  | 'interview-prep'
  | 'chat';

export const FIELD_LIMITS = {
  handleMin: 2,
  handleMax: 40,
  displayNameMax: 80,
  headlineMax: 140,
  bioMax: 1200,
  locationMax: 80,
  roleTagMax: 60,
  urlMax: 300,
  assetUrlMax: 500,
  maxListItems: 12,
  skillNameMax: 60,
  goalDescMax: 240,
  projectTitleMax: 100,
  projectSummaryMax: 220,
  projectDescMax: 2500,
  achievementTitleMax: 120,
  issuerMax: 100,
  issuedDateMax: 30,
  credentialIdMax: 100,
  achievementDescMax: 1000,
  fileNameMax: 160,
  activityTitleMax: 140,
  activityDetailMax: 260,
} as const;

export const HANDLE_REGEX = /^[a-z0-9_-]{2,40}$/;

export interface DeveloperProfile {
  userId: string;
  handle: string;
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  location: string;
  roleTag: string;
  interests: string[];
  githubUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
  twitterUrl: string;
  isPublic: boolean;
  skillsCount: number;
  projectsCount: number;
  achievementsCount: number;
  goalsCompletedCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemoAccount?: boolean;
}

export interface SkillItem {
  id: string;
  userId: string;
  name: string;
  category: SkillCategory;
  kind: SkillKind;
  proficiency: number;
  goalTarget: number;
  goalDescription: string;
  goalCompleted: boolean;
  isPublic: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ProjectItem {
  id: string;
  userId: string;
  authorName: string;
  authorHandle: string;
  title: string;
  summary: string;
  description: string;
  category: ProjectCategory;
  technologies: string[];
  imageUrl: string;
  githubUrl: string;
  liveUrl: string;
  isPublic: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AchievementItem {
  id: string;
  userId: string;
  authorName: string;
  authorHandle: string;
  title: string;
  issuer: string;
  category: AchievementCategory;
  issuedDate: string;
  credentialId: string;
  credentialUrl: string;
  certificateFileUrl: string;
  certificateFileName: string;
  description: string;
  isPublic: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  detail: string;
  createdAt?: unknown;
  timestampLabel?: string;
}

export interface DemoAccountBundle {
  profile: DeveloperProfile;
  skills: SkillItem[];
  projects: ProjectItem[];
  achievements: AchievementItem[];
  activities: ActivityLog[];
}
