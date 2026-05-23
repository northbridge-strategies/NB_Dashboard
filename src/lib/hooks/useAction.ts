"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type ActionState = "idle" | "pending" | "success" | "error";

/**
 * Tiny hook for write actions that POST/PATCH a JSON endpoint.
 * - Surfaces loading/error state
 * - Calls router.refresh() on success so server components re-pull tagged data
 * - Caller can pass `optimistic: () => void` to flip local state immediately
 */
export function useAction<TBody = unknown>(opts?: {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function run(
    endpoint: string,
    init: { method?: string; body?: TBody; optimistic?: () => void } = {},
  ) {
    setError(null);
    setState("pending");
    init.optimistic?.();

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: init.method ?? "POST",
        headers: init.body ? { "Content-Type": "application/json" } : undefined,
        body: init.body ? JSON.stringify(init.body) : undefined,
      });
    } catch (e) {
      const msg = (e as Error)?.message ?? "Network error";
      setState("error");
      setError(msg);
      opts?.onError?.(msg);
      return { ok: false, error: msg };
    }

    if (!res.ok) {
      let msg = `Request failed (${res.status})`;
      try {
        const j = (await res.json()) as { error?: string };
        if (j?.error) msg = j.error;
      } catch {
        // ignore
      }
      setState("error");
      setError(msg);
      opts?.onError?.(msg);
      return { ok: false, error: msg };
    }

    setState("success");
    opts?.onSuccess?.();
    startTransition(() => router.refresh());
    return { ok: true };
  }

  return { run, state, error, isPending };
}
