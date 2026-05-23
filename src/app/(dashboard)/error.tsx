"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/states";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <ErrorState
      title="This page couldn't load"
      description={
        error.digest
          ? `Reference: ${error.digest}. Likely a transient Notion issue — try again.`
          : "Likely a transient Notion issue — try again."
      }
      onRetry={reset}
    />
  );
}
