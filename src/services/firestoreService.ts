import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AchievementItem,
  ActivityLog,
  ActivityType,
  DeveloperProfile,
  FIELD_LIMITS,
  ProjectItem,
  SkillItem,
} from '../types/nexora';
import { clampInt, clampString, isValidHttpOrAssetUrl, sanitizeHandle } from '../utils/validation';

function sortByTimestampDesc<T extends { createdAt?: unknown }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const getMillis = (val: unknown): number => {
      if (!val) return 0;
      if (typeof val === 'object' && val !== null && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
        return (val as { toMillis: () => number }).toMillis();
      }
      if (typeof val === 'string') {
        const parsed = Date.parse(val);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    return getMillis(b.createdAt) - getMillis(a.createdAt);
  });
}

export async function ensureUserInitialized(user: User): Promise<void> {
  const uid = user.uid;
  const privateRef = doc(db, 'usersPrivate', uid);
  const profileRef = doc(db, 'profiles', uid);

  try {
    const privateSnap = await getDoc(privateRef);
    if (!privateSnap.exists()) {
      await setDoc(privateRef, {
        userId: uid,
        email: clampString(user.email || 'user@nexora.app', 254),
        onboardingCompleted: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `usersPrivate/${uid}`);
  }

  try {
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      const baseHandle = sanitizeHandle((user.email?.split('@')[0] || user.displayName || 'builder') + '_' + uid.slice(0, 4));
      await setDoc(profileRef, {
        userId: uid,
        handle: baseHandle,
        displayName: clampString(user.displayName || 'NEXORA Developer', FIELD_LIMITS.displayNameMax),
        headline: 'Developer & Technology Builder',
        bio: '',
        avatarUrl: isValidHttpOrAssetUrl(user.photoURL || '') ? clampString(user.photoURL || '', FIELD_LIMITS.assetUrlMax) : '',
        location: '',
        roleTag: 'Software Builder',
        interests: [],
        githubUrl: '',
        linkedinUrl: '',
        websiteUrl: '',
        twitterUrl: '',
        isPublic: true,
        skillsCount: 0,
        projectsCount: 0,
        achievementsCount: 0,
        goalsCompletedCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `profiles/${uid}`);
  }
}

export function subscribeUserWorkspace(
  uid: string,
  callbacks: {
    onProfile: (profile: DeveloperProfile | null) => void;
    onSkills: (skills: SkillItem[]) => void;
    onProjects: (projects: ProjectItem[]) => void;
    onAchievements: (achievements: AchievementItem[]) => void;
    onActivities: (activities: ActivityLog[]) => void;
    onError: (err: Error) => void;
  }
): () => void {
  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(
      doc(db, 'profiles', uid),
      (snap) => {
        callbacks.onProfile(snap.exists() ? (snap.data() as DeveloperProfile) : null);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, `profiles/${uid}`);
        } catch (err) {
          callbacks.onError(err as Error);
        }
      }
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'skills'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SkillItem, 'id'>) }));
        callbacks.onSkills(sortByTimestampDesc(list));
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'skills');
        } catch (err) {
          callbacks.onError(err as Error);
        }
      }
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'projects'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProjectItem, 'id'>) }));
        callbacks.onProjects(sortByTimestampDesc(list));
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'projects');
        } catch (err) {
          callbacks.onError(err as Error);
        }
      }
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'achievements'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AchievementItem, 'id'>) }));
        callbacks.onAchievements(sortByTimestampDesc(list));
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'achievements');
        } catch (err) {
          callbacks.onError(err as Error);
        }
      }
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'activities'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityLog, 'id'>) }));
        callbacks.onActivities(sortByTimestampDesc(list).slice(0, 20));
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'activities');
        } catch (err) {
          callbacks.onError(err as Error);
        }
      }
    )
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}

export async function updateDeveloperProfile(
  uid: string,
  payload: Pick<
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
): Promise<void> {
  const path = `profiles/${uid}`;
  try {
    await updateDoc(doc(db, 'profiles', uid), {
      handle: sanitizeHandle(payload.handle),
      displayName: clampString(payload.displayName, FIELD_LIMITS.displayNameMax) || 'NEXORA Developer',
      headline: clampString(payload.headline, FIELD_LIMITS.headlineMax),
      bio: clampString(payload.bio, FIELD_LIMITS.bioMax),
      avatarUrl: isValidHttpOrAssetUrl(payload.avatarUrl) ? clampString(payload.avatarUrl, FIELD_LIMITS.assetUrlMax) : '',
      location: clampString(payload.location, FIELD_LIMITS.locationMax),
      roleTag: clampString(payload.roleTag, FIELD_LIMITS.roleTagMax),
      interests: payload.interests.slice(0, FIELD_LIMITS.maxListItems).map((i) => clampString(i, 36)).filter(Boolean),
      githubUrl: isValidHttpOrAssetUrl(payload.githubUrl) ? clampString(payload.githubUrl, FIELD_LIMITS.urlMax) : '',
      linkedinUrl: isValidHttpOrAssetUrl(payload.linkedinUrl) ? clampString(payload.linkedinUrl, FIELD_LIMITS.urlMax) : '',
      websiteUrl: isValidHttpOrAssetUrl(payload.websiteUrl) ? clampString(payload.websiteUrl, FIELD_LIMITS.urlMax) : '',
      twitterUrl: isValidHttpOrAssetUrl(payload.twitterUrl) ? clampString(payload.twitterUrl, FIELD_LIMITS.urlMax) : '',
      isPublic: Boolean(payload.isPublic),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncProfileCounters(
  uid: string,
  counts: {
    skillsCount: number;
    projectsCount: number;
    achievementsCount: number;
    goalsCompletedCount: number;
  }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'profiles', uid), {
      skillsCount: clampInt(counts.skillsCount, 0, 500),
      projectsCount: clampInt(counts.projectsCount, 0, 500),
      achievementsCount: clampInt(counts.achievementsCount, 0, 500),
      goalsCompletedCount: clampInt(counts.goalsCompletedCount, 0, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `profiles/${uid}`);
  }
}

export async function logUserActivity(
  uid: string,
  type: ActivityType,
  title: string,
  detail = ''
): Promise<void> {
  try {
    await addDoc(collection(db, 'activities'), {
      userId: uid,
      type,
      title: clampString(title, FIELD_LIMITS.activityTitleMax),
      detail: clampString(detail, FIELD_LIMITS.activityDetailMax),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'activities');
  }
}

export async function createSkill(
  uid: string,
  input: Omit<SkillItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    await addDoc(collection(db, 'skills'), {
      userId: uid,
      name: clampString(input.name, FIELD_LIMITS.skillNameMax),
      category: input.category,
      kind: input.kind,
      proficiency: clampInt(input.proficiency, 0, 100),
      goalTarget: clampInt(input.goalTarget, 0, 100),
      goalDescription: clampString(input.goalDescription, FIELD_LIMITS.goalDescMax),
      goalCompleted: Boolean(input.goalCompleted),
      isPublic: Boolean(input.isPublic),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'skills');
  }
}

export async function updateSkill(
  skillId: string,
  input: Omit<SkillItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'skills', skillId), {
      name: clampString(input.name, FIELD_LIMITS.skillNameMax),
      category: input.category,
      kind: input.kind,
      proficiency: clampInt(input.proficiency, 0, 100),
      goalTarget: clampInt(input.goalTarget, 0, 100),
      goalDescription: clampString(input.goalDescription, FIELD_LIMITS.goalDescMax),
      goalCompleted: Boolean(input.goalCompleted),
      isPublic: Boolean(input.isPublic),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `skills/${skillId}`);
  }
}

export async function toggleSkillGoalProgress(
  skillId: string,
  proficiency: number,
  goalCompleted: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, 'skills', skillId), {
      proficiency: clampInt(proficiency, 0, 100),
      goalCompleted: Boolean(goalCompleted),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `skills/${skillId}`);
  }
}

export async function deleteSkill(skillId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'skills', skillId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `skills/${skillId}`);
  }
}

export async function createProject(
  uid: string,
  input: Omit<ProjectItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    await addDoc(collection(db, 'projects'), {
      userId: uid,
      authorName: clampString(input.authorName, FIELD_LIMITS.displayNameMax) || 'NEXORA Developer',
      authorHandle: sanitizeHandle(input.authorHandle),
      title: clampString(input.title, FIELD_LIMITS.projectTitleMax),
      summary: clampString(input.summary, FIELD_LIMITS.projectSummaryMax),
      description: clampString(input.description, FIELD_LIMITS.projectDescMax),
      category: input.category,
      technologies: input.technologies.slice(0, FIELD_LIMITS.maxListItems).map((t) => clampString(t, 36)).filter(Boolean),
      imageUrl: isValidHttpOrAssetUrl(input.imageUrl) ? clampString(input.imageUrl, FIELD_LIMITS.assetUrlMax) : '',
      githubUrl: isValidHttpOrAssetUrl(input.githubUrl) ? clampString(input.githubUrl, FIELD_LIMITS.urlMax) : '',
      liveUrl: isValidHttpOrAssetUrl(input.liveUrl) ? clampString(input.liveUrl, FIELD_LIMITS.urlMax) : '',
      isPublic: Boolean(input.isPublic),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'projects');
  }
}

export async function updateProject(
  projectId: string,
  input: Omit<ProjectItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      authorName: clampString(input.authorName, FIELD_LIMITS.displayNameMax) || 'NEXORA Developer',
      authorHandle: sanitizeHandle(input.authorHandle),
      title: clampString(input.title, FIELD_LIMITS.projectTitleMax),
      summary: clampString(input.summary, FIELD_LIMITS.projectSummaryMax),
      description: clampString(input.description, FIELD_LIMITS.projectDescMax),
      category: input.category,
      technologies: input.technologies.slice(0, FIELD_LIMITS.maxListItems).map((t) => clampString(t, 36)).filter(Boolean),
      imageUrl: isValidHttpOrAssetUrl(input.imageUrl) ? clampString(input.imageUrl, FIELD_LIMITS.assetUrlMax) : '',
      githubUrl: isValidHttpOrAssetUrl(input.githubUrl) ? clampString(input.githubUrl, FIELD_LIMITS.urlMax) : '',
      liveUrl: isValidHttpOrAssetUrl(input.liveUrl) ? clampString(input.liveUrl, FIELD_LIMITS.urlMax) : '',
      isPublic: Boolean(input.isPublic),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
  }
}

export async function createAchievement(
  uid: string,
  input: Omit<AchievementItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    await addDoc(collection(db, 'achievements'), {
      userId: uid,
      authorName: clampString(input.authorName, FIELD_LIMITS.displayNameMax) || 'NEXORA Developer',
      authorHandle: sanitizeHandle(input.authorHandle),
      title: clampString(input.title, FIELD_LIMITS.achievementTitleMax),
      issuer: clampString(input.issuer, FIELD_LIMITS.issuerMax),
      category: input.category,
      issuedDate: clampString(input.issuedDate, FIELD_LIMITS.issuedDateMax),
      credentialId: clampString(input.credentialId, FIELD_LIMITS.credentialIdMax),
      credentialUrl: isValidHttpOrAssetUrl(input.credentialUrl) ? clampString(input.credentialUrl, FIELD_LIMITS.urlMax) : '',
      certificateFileUrl: isValidHttpOrAssetUrl(input.certificateFileUrl)
        ? clampString(input.certificateFileUrl, FIELD_LIMITS.assetUrlMax)
        : '',
      certificateFileName: clampString(input.certificateFileName, FIELD_LIMITS.fileNameMax),
      description: clampString(input.description, FIELD_LIMITS.achievementDescMax),
      isPublic: Boolean(input.isPublic),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'achievements');
  }
}

export async function updateAchievement(
  achievementId: string,
  input: Omit<AchievementItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'achievements', achievementId), {
      authorName: clampString(input.authorName, FIELD_LIMITS.displayNameMax) || 'NEXORA Developer',
      authorHandle: sanitizeHandle(input.authorHandle),
      title: clampString(input.title, FIELD_LIMITS.achievementTitleMax),
      issuer: clampString(input.issuer, FIELD_LIMITS.issuerMax),
      category: input.category,
      issuedDate: clampString(input.issuedDate, FIELD_LIMITS.issuedDateMax),
      credentialId: clampString(input.credentialId, FIELD_LIMITS.credentialIdMax),
      credentialUrl: isValidHttpOrAssetUrl(input.credentialUrl) ? clampString(input.credentialUrl, FIELD_LIMITS.urlMax) : '',
      certificateFileUrl: isValidHttpOrAssetUrl(input.certificateFileUrl)
        ? clampString(input.certificateFileUrl, FIELD_LIMITS.assetUrlMax)
        : '',
      certificateFileName: clampString(input.certificateFileName, FIELD_LIMITS.fileNameMax),
      description: clampString(input.description, FIELD_LIMITS.achievementDescMax),
      isPublic: Boolean(input.isPublic),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `achievements/${achievementId}`);
  }
}

export async function deleteAchievement(achievementId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'achievements', achievementId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `achievements/${achievementId}`);
  }
}

export async function fetchPublicCommunitySnapshot(): Promise<{
  profiles: DeveloperProfile[];
  skills: SkillItem[];
  projects: ProjectItem[];
  achievements: AchievementItem[];
}> {
  try {
    const [profSnap, skillSnap, projSnap, achSnap] = await Promise.all([
      getDocs(query(collection(db, 'profiles'), where('isPublic', '==', true))),
      getDocs(query(collection(db, 'skills'), where('isPublic', '==', true))),
      getDocs(query(collection(db, 'projects'), where('isPublic', '==', true))),
      getDocs(query(collection(db, 'achievements'), where('isPublic', '==', true))),
    ]);

    return {
      profiles: profSnap.docs.map((d) => d.data() as DeveloperProfile),
      skills: skillSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SkillItem, 'id'>) })),
      projects: sortByTimestampDesc(
        projSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProjectItem, 'id'>) }))
      ),
      achievements: sortByTimestampDesc(
        achSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AchievementItem, 'id'>) }))
      ),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'community_public');
  }
}
