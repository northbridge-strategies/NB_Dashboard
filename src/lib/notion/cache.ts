import "server-only";
import { unstable_cache } from "next/cache";

/**
 * Cache tags — one per Notion database.
 * Read paths use these via `cached()`; write paths invalidate them via
 * `revalidateTag()` (see lib/utils/revalidate.ts).
 */
export const TAG = {
  leads: "notion:leads",
  scores: "notion:scores",
  pipeline: "notion:pipeline",
  linkedin: "notion:linkedin",
  revenue: "notion:revenue",
  brokers: "notion:brokers",
  scraper: "notion:scraper",
  content: "notion:content",
  health: "notion:health",
  config: "notion:config",
  users: "notion:users",
  activity: "notion:activity",
  tier1: "notion:tier1",
} as const;

export type Tag = (typeof TAG)[keyof typeof TAG];

/**
 * Wraps a server function with Next.js cache. `keyParts` is unique per call shape.
 * Defaults to 30s revalidate; pass {revalidate: 10} for /health.
 *
 * Using a single function-shaped generic (instead of separate args/return) keeps
 * call-site inference correct — `unstable_cache`'s own typing widens variadic
 * args, which would otherwise break callers that pass typed numbers etc.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cached<F extends (...args: any[]) => Promise<unknown>>(
  fn: F,
  keyParts: string[],
  opts: { tags: Tag[]; revalidate?: number },
): F {
  const wrapped = unstable_cache(fn, keyParts, {
    tags: opts.tags,
    revalidate: opts.revalidate ?? 30,
  });
  return wrapped as F;
}
