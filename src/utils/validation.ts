import { FIELD_LIMITS, HANDLE_REGEX } from '../types/nexora';

export function sanitizeHandle(raw: string): string {
  const normalized = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, FIELD_LIMITS.handleMax);

  if (normalized.length < FIELD_LIMITS.handleMin) {
    return `dev_${Math.random().toString(36).slice(2, 7)}`;
  }
  return HANDLE_REGEX.test(normalized) ? normalized : `dev_${normalized.slice(0, 12)}`;
}

export function isValidHandle(handle: string): boolean {
  return HANDLE_REGEX.test(handle);
}

export function isValidHttpOrAssetUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/api/uploads/') || trimmed.startsWith('/src/assets/')) {
    return trimmed.length <= FIELD_LIMITS.assetUrlMax;
  }
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && trimmed.length <= FIELD_LIMITS.urlMax;
  } catch {
    return false;
  }
}

export function clampString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function parseTagList(raw: string, maxItems = FIELD_LIMITS.maxListItems): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(',')) {
    const clean = part.trim().slice(0, 36);
    if (clean && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase());
      result.push(clean);
      if (result.length >= maxItems) break;
    }
  }
  return result;
}

export function formatRelativeTime(ts: unknown): string {
  if (!ts) return 'Just now';
  let date: Date | null = null;
  if (typeof ts === 'string') {
    const parsed = new Date(ts);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    date = (ts as { toDate: () => Date }).toDate();
  }
  if (!date) return 'Just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
