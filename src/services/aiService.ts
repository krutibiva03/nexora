import { auth } from '../firebase';
import { AICompanionMode, DeveloperProfile, ProjectItem, SkillItem } from '../types/nexora';

export interface AIStatusResponse {
  configured: boolean;
  model: string;
}

export interface AICompanionResponse {
  reply: string;
  mode: AICompanionMode;
  model: string;
  generatedAt: string;
}

export async function fetchAIStatus(): Promise<AIStatusResponse> {
  try {
    const res = await fetch('/api/ai/status');
    if (!res.ok) return { configured: false, model: 'gemini-4-hydrogen' };
    return (await res.json()) as AIStatusResponse;
  } catch {
    return { configured: false, model: 'gemini-4-hydrogen' };
  }
}

export async function requestAICompanion(params: {
  mode: AICompanionMode;
  prompt: string;
  profile: DeveloperProfile | null;
  skills: SkillItem[];
  projects: ProjectItem[];
  achievementsCount: number;
}): Promise<AICompanionResponse> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('AUTH_REQUIRED');
  }

  const idToken = await user.getIdToken();
  const res = await fetch('/api/ai/companion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      mode: params.mode,
      prompt: params.prompt,
      context: {
        displayName: params.profile?.displayName,
        headline: params.profile?.headline,
        roleTag: params.profile?.roleTag,
        bio: params.profile?.bio,
        interests: params.profile?.interests || [],
        skills: params.skills.map((s) => ({
          name: s.name,
          category: s.category,
          proficiency: s.proficiency,
          goalTarget: s.goalTarget,
          goalDescription: s.goalDescription,
        })),
        projects: params.projects.map((p) => ({
          title: p.title,
          summary: p.summary,
          description: p.description,
          category: p.category,
          technologies: p.technologies,
        })),
        achievementsCount: params.achievementsCount,
      },
    }),
  });

  const data = (await res.json()) as Partial<AICompanionResponse> & { error?: string; message?: string };
  if (!res.ok) {
    const err = new Error(data.message || 'AI request failed.');
    (err as Error & { code?: string }).code = data.error;
    throw err;
  }

  return data as AICompanionResponse;
}

export function getDemoModeSampleReply(mode: AICompanionMode, skillNames: string[]): string {
  const topSkills = skillNames.slice(0, 3).join(', ') || 'TypeScript, React, Node.js';
  switch (mode) {
    case 'suggest-projects':
      return `[Demo Preview — Live Gemini API requires sign-in & configured server key]

Based on your current skills (${topSkills}), here are 3 portfolio projects designed to close architecture gaps:

1. Multi-Tenant Telemetry & Rate-Limiter Gateway
   • Architecture: Node.js reverse proxy + Redis sliding-window counters + React streaming dashboard
   • Milestone: Benchmark p99 overhead under 5ms at 1,000 req/s

2. Semantic Documentation Search Engine
   • Architecture: Chunked markdown indexer + vector similarity API + citation previewer
   • Milestone: Achieve sub-40ms top-5 retrieval accuracy on 500+ technical docs

3. Automated CI/CD Security Rule Verifier
   • Architecture: Static AST analyzer + test harness + SARIF report viewer
   • Milestone: Catch 100% of cross-tenant permission regressions in PR checks`;
    case 'recommend-tech':
      return `[Demo Preview — Live Gemini API requires sign-in & configured server key]

Recommended next technologies complementary to ${topSkills}:
• OpenTelemetry: End-to-end distributed tracing for backend reliability
• PostgreSQL + pgvector: Hybrid relational + vector retrieval workflows
• Playwright: Deterministic end-to-end verification for interactive web apps
• Docker Compose & GitHub Actions: Reproducible multi-service deployments`;
    case 'learning-roadmap':
      return `[Demo Preview — Live Gemini API requires sign-in & configured server key]

8-Week Structured Growth Plan:
• Weeks 1–2: Core Foundations & Testing — Lock down TypeScript strictness, unit testing, and API validation schemas.
• Weeks 3–4: Data & Auth Architecture — Design relational/document models, role-based access rules, and secure file handling.
• Weeks 5–6: Flagship Build — Ship one end-to-end project with real telemetry, error boundaries, and live deployment.
• Weeks 7–8: Review & Interview Readiness — Write an architectural case study and run timed system design drills.`;
    case 'review-project':
      return `[Demo Preview — Live Gemini API requires sign-in & configured server key]

Project Description Review:
• What works well: Clear problem statement and explicit technology stack.
• Missing depth: Quantify latency, scale, or user impact (e.g., request throughput, bundle size reduction, or test coverage).
• Suggested rewrite pattern: "[System Name] solves [specific bottleneck] using [architecture]. In benchmarks, it reduced [metric] by [X%] while enforcing [security/reliability invariant]."`;
    case 'improve-profile':
      return `[Demo Preview — Live Gemini API requires sign-in & configured server key]

Identity Studio Critique:
• Headline: Lead with your engineering focus + domain impact rather than a generic title.
• Bio: Structure into 3 crisp sentences — what you build, the systems/tools you specialize in, and what problem space you are targeting next.
• Proof alignment: Pin at least 2 public projects and 1 verified credential directly matching your headline.`;
    case 'interview-prep':
      return `[Demo Preview — Live Gemini API requires sign-in & configured server key]

Targeted Interview Drill (${topSkills}):
1. System Design Prompt: "Design a multi-tenant developer portfolio & file upload service with strict private/public isolation."
   • Evaluation criteria: Auth token verification, storage bounds, query indexing, and caching strategy.
2. Debugging Prompt: "Why might a real-time subscription throw permission errors on initial render before auth hydration finishes?"
   • Key answer: Gate listener attachment on auth readiness and clean up subscriptions on unmount.`;
    default:
      return `[Demo Preview — Live Gemini API requires sign-in & configured server key]

In live mode, the AI Career Companion uses your actual Skill Universe, Project Galaxy, and Identity Studio profile via the server-side Gemini 4 Hydrogen endpoint to generate tailored career guidance.`;
  }
}
