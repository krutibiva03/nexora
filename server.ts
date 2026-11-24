import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = process.cwd();
const UPLOADS_ROOT = path.resolve(ROOT_DIR, 'uploads');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

interface FirebaseAppletConfig {
  projectId: string;
}

function loadFirebaseProjectId(): string {
  try {
    const configPath = path.resolve(ROOT_DIR, 'firebase-applet-config.json');
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as FirebaseAppletConfig;
    return parsed.projectId || '';
  } catch {
    return '';
  }
}

const FIREBASE_PROJECT_ID = loadFirebaseProjectId();
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

interface VerifiedAuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

async function verifyFirebaseBearerToken(authHeader: string | undefined): Promise<VerifiedAuthUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ') || !FIREBASE_PROJECT_ID) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    const uid = typeof payload.sub === 'string' ? payload.sub : '';
    const email = typeof payload.email === 'string' ? payload.email : '';
    const emailVerified = payload.email_verified === true;
    if (!uid || !/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) {
      return null;
    }
    return { uid, email, emailVerified };
  } catch {
    return null;
  }
}

function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key !== 'MY_GEMINI_API_KEY' && key.length > 10);
}

function getGeminiClient(): GoogleGenAI | null {
  if (!isGeminiConfigured()) return null;
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const ALLOWED_FOLDERS = new Set(['avatars', 'projects', 'certificates']);
const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};
const EXT_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
};
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // 3 MB

type CompanionMode =
  | 'suggest-projects'
  | 'recommend-tech'
  | 'learning-roadmap'
  | 'review-project'
  | 'improve-profile'
  | 'interview-prep'
  | 'chat';

const VALID_MODES = new Set<CompanionMode>([
  'suggest-projects',
  'recommend-tech',
  'learning-roadmap',
  'review-project',
  'improve-profile',
  'interview-prep',
  'chat',
]);

interface CompanionContext {
  displayName?: string;
  headline?: string;
  roleTag?: string;
  bio?: string;
  interests?: string[];
  skills?: Array<{ name: string; category: string; proficiency: number; goalTarget: number; goalDescription?: string }>;
  projects?: Array<{ title: string; summary: string; description?: string; category: string; technologies: string[] }>;
  achievementsCount?: number;
}

function buildSystemInstruction(mode: CompanionMode): string {
  const base =
    'You are the NEXORA AI Career Companion, an authoritative, practical engineering mentor and technical career strategist. Give concrete, structured, actionable advice tailored to the developer context provided. Avoid generic fluff, keep formatting clean with clear headings and bullet points, and ground every recommendation in real engineering practice.';

  switch (mode) {
    case 'suggest-projects':
      return `${base} Focus on proposing 3 high-impact portfolio projects calibrated to bridge the user's current skills and target goals, including architecture overview, core stack, and measurable milestones.`;
    case 'recommend-tech':
      return `${base} Analyze skill gaps and adjacent industry demand to recommend 4–5 high-leverage technologies or tools to learn next, explaining why each complements their current stack.`;
    case 'learning-roadmap':
      return `${base} Generate a realistic, phased 8-week learning roadmap (Weeks 1-2, 3-4, 5-6, 7-8) with weekly deliverables, concepts to master, and verification checkpoints.`;
    case 'review-project':
      return `${base} Provide a candid, constructive engineering critique of the specified project description: highlight strengths, point out missing technical depth or architectural metrics, and provide a polished rewrite.`;
    case 'improve-profile':
      return `${base} Audit the developer's Identity Studio profile (headline, bio, skill positioning, project alignment) and offer specific rewrites and positioning advice for recruiters and collaborators.`;
    case 'interview-prep':
      return `${base} Conduct targeted technical interview preparation based on the user's stack and prompt: provide realistic system design/coding/behavioral questions, what interviewers evaluate, and structured answer frameworks.`;
    default:
      return base;
  }
}

async function startServer() {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });

  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Health & AI availability check (never exposes API keys)
  app.get('/api/ai/status', (_req, res) => {
    res.json({
      configured: isGeminiConfigured(),
      model: 'gemini-4-hydrogen',
    });
  });

  // Secure AI Career Companion endpoint
  app.post('/api/ai/companion', async (req, res) => {
    const authUser = await verifyFirebaseBearerToken(req.headers.authorization);
    if (!authUser || !authUser.emailVerified) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Sign in with a verified account to use live AI Career Companion.',
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_NOT_CONFIGURED',
        message: 'Gemini API key is not configured on the server.',
      });
      return;
    }

    const body = req.body as { mode?: unknown; prompt?: unknown; context?: unknown };
    const mode = typeof body?.mode === 'string' && VALID_MODES.has(body.mode as CompanionMode)
      ? (body.mode as CompanionMode)
      : 'chat';
    const userPrompt = typeof body?.prompt === 'string' ? body.prompt.trim().slice(0, 3000) : '';

    if (!userPrompt) {
      res.status(400).json({
        error: 'INVALID_PROMPT',
        message: 'Please provide a prompt or question for the AI Career Companion.',
      });
      return;
    }

    const ctx = (body?.context && typeof body.context === 'object' ? body.context : {}) as CompanionContext;
    const contextSummary = JSON.stringify({
      displayName: typeof ctx.displayName === 'string' ? ctx.displayName.slice(0, 80) : undefined,
      headline: typeof ctx.headline === 'string' ? ctx.headline.slice(0, 140) : undefined,
      roleTag: typeof ctx.roleTag === 'string' ? ctx.roleTag.slice(0, 60) : undefined,
      bio: typeof ctx.bio === 'string' ? ctx.bio.slice(0, 600) : undefined,
      interests: Array.isArray(ctx.interests) ? ctx.interests.slice(0, 12) : [],
      skills: Array.isArray(ctx.skills) ? ctx.skills.slice(0, 25) : [],
      projects: Array.isArray(ctx.projects) ? ctx.projects.slice(0, 12) : [],
      achievementsCount: typeof ctx.achievementsCount === 'number' ? ctx.achievementsCount : 0,
    });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Developer Workspace Context:\n${contextSummary}\n\nRequest Mode: ${mode}\nUser Request:\n${userPrompt}`,
        config: {
          systemInstruction: buildSystemInstruction(mode),
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        res.status(502).json({
          error: 'EMPTY_RESPONSE',
          message: 'The AI model returned an empty response. Please try again.',
        });
        return;
      }

      res.json({
        reply,
        mode,
        model: 'gemini-4-hydrogen',
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reach Gemini API.';
      console.error('Gemini API error:', message);
      res.status(502).json({
        error: 'GEMINI_UPSTREAM_ERROR',
        message: 'Unable to generate response from Gemini API right now. Please verify your server API key configuration.',
      });
    }
  });

  // Secure authenticated file upload endpoint (avatars, project images, certificates)
  app.post('/api/uploads', async (req, res) => {
    const authUser = await verifyFirebaseBearerToken(req.headers.authorization);
    if (!authUser || !authUser.emailVerified) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required to upload files.',
      });
      return;
    }

    const body = req.body as {
      folder?: unknown;
      mimeType?: unknown;
      fileName?: unknown;
      dataBase64?: unknown;
    };

    const folder = typeof body?.folder === 'string' ? body.folder : '';
    const mimeType = typeof body?.mimeType === 'string' ? body.mimeType : '';
    const rawData = typeof body?.dataBase64 === 'string' ? body.dataBase64 : '';

    if (!ALLOWED_FOLDERS.has(folder)) {
      res.status(400).json({ error: 'INVALID_FOLDER', message: 'Invalid upload destination folder.' });
      return;
    }

    const ext = MIME_TO_EXT[mimeType];
    if (!ext) {
      res.status(400).json({
        error: 'UNSUPPORTED_FILE_TYPE',
        message: 'Supported formats: PNG, JPEG, WebP, or PDF (certificates).',
      });
      return;
    }

    if ((folder === 'avatars' || folder === 'projects') && mimeType === 'application/pdf') {
      res.status(400).json({
        error: 'INVALID_IMAGE_TYPE',
        message: 'Avatars and project previews must be PNG, JPEG, or WebP images.',
      });
      return;
    }

    const cleanedBase64 = rawData.replace(/^data:[^;]+;base64,/, '').trim();
    if (!cleanedBase64) {
      res.status(400).json({ error: 'EMPTY_FILE', message: 'File payload is empty.' });
      return;
    }

    const buffer = Buffer.from(cleanedBase64, 'base64');
    if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
      res.status(400).json({
        error: 'FILE_TOO_LARGE',
        message: 'File must be between 1 byte and 3 MB.',
      });
      return;
    }

    const targetDir = path.resolve(UPLOADS_ROOT, authUser.uid, folder);
    if (!targetDir.startsWith(UPLOADS_ROOT + path.sep)) {
      res.status(400).json({ error: 'INVALID_PATH', message: 'Invalid upload path.' });
      return;
    }

    fs.mkdirSync(targetDir, { recursive: true });
    const safeFileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const resolvedFilePath = path.resolve(targetDir, safeFileName);
    if (!resolvedFilePath.startsWith(targetDir + path.sep)) {
      res.status(400).json({ error: 'INVALID_PATH', message: 'Invalid resolved file path.' });
      return;
    }

    fs.writeFileSync(resolvedFilePath, buffer);
    const originalName = typeof body?.fileName === 'string'
      ? body.fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
      : safeFileName;

    res.status(201).json({
      url: `/api/uploads/${authUser.uid}/${folder}/${safeFileName}`,
      fileName: originalName,
      mimeType,
      size: buffer.length,
    });
  });

  // Serve uploaded assets with strict path confinement
  app.get('/api/uploads/:uid/:folder/:filename', (req, res) => {
    const { uid, folder, filename } = req.params;
    if (
      !/^[a-zA-Z0-9_-]{1,128}$/.test(uid) ||
      !ALLOWED_FOLDERS.has(folder) ||
      !/^[a-zA-Z0-9._-]{1,128}$/.test(filename)
    ) {
      res.status(400).json({ error: 'INVALID_REQUEST' });
      return;
    }

    const resolvedPath = path.resolve(UPLOADS_ROOT, uid, folder, filename);
    if (!resolvedPath.startsWith(UPLOADS_ROOT + path.sep) || !fs.existsSync(resolvedPath)) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    const ext = path.extname(filename).slice(1).toLowerCase();
    const contentType = EXT_TO_MIME[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(resolvedPath);
  });

  // Vite dev middleware vs static production build
  const isProduction = process.env.NODE_ENV === 'production' && fs.existsSync(DIST_DIR);
  if (isProduction) {
    app.use(express.static(DIST_DIR));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(DIST_DIR, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NEXORA server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start NEXORA server:', error);
  process.exit(1);
});
