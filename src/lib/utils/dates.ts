/** Returns a Date N days ago at start of UTC day. */
export function daysAgo(n: number, ref: Date = new Date()): Date {
  const d = new Date(ref);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

export function toISO(d: Date): string {
  return d.toISOString();
}

export function startOfMonthYYYYMM(ref: Date = new Date()): string {
  const yyyy = ref.getUTCFullYear();
  const mm = String(ref.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

/** Human-readable relative time. "2m ago", "3h ago", "yesterday", "Mar 12". */
export function formatRelative(iso: string, ref: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = ref.getTime() - then.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day}d ago`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function daysBetween(aISO: string, bISO: string = new Date().toISOString()): number {
  return Math.floor((new Date(bISO).getTime() - new Date(aISO).getTime()) / 86_400_000);
}
