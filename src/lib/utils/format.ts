export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number | null | undefined, fractionDigits = 0): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Pretty-print a Notion "Month" value (`YYYY-MM`) as a long human label.
 *   "2026-04" -> "April 2026"
 * Falls back to the original on parse failure.
 */
export function formatMonthYear(yyyymm: string | null | undefined): string {
  if (!yyyymm) return "—";
  const m = /^(\d{4})-(\d{2})$/.exec(yyyymm.trim());
  if (!m) return yyyymm;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  if (Number.isNaN(year) || month < 0 || month > 11) return yyyymm;
  // Construct a Date in UTC at noon to dodge DST edge cases.
  const d = new Date(Date.UTC(year, month, 1, 12));
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/**
 * Pretty-print a US phone number. Strips the +1 prefix and groups digits.
 * Falls back to the original string for non-US/unparseable numbers.
 *   "+1 630-796-1627"  -> "(630) 796-1627"
 *   "16307961627"       -> "(630) 796-1627"
 *   "+44 20 7946 0958" -> "+44 20 7946 0958" (untouched)
 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    const d = digits.slice(1);
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

/**
 * Two-letter initials. Extracted here so every avatar component renders
 * consistent fallbacks regardless of the calling page.
 */
export function initials(source: string | null | undefined): string {
  if (!source) return "?";
  const parts = source.trim().split(/\s+|@|\./).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
