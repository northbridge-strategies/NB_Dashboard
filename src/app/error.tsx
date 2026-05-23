"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/states";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <ErrorState
        title="Something broke loading this page"
        description={
          error.digest
            ? `Reference: ${error.digest}. Refresh to try again or check System Health for related errors.`
            : "Refresh to try again or check System Health for related errors."
        }
        onRetry={reset}
      />
    </div>
  );
}
