"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, ExternalLink } from "lucide-react";

interface Props {
  leadId: string;
  scoreId: string;
  onSuccess?: (url: string) => void;
}

export function GenerateReportButton({ leadId, scoreId, onSuccess }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleGenerate() {
    if (status === "loading") return;
    setStatus("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/generate-report-internal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          score_id: scoreId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Generation failed");
      }

      setReportUrl(data.report_url);
      setStatus("done");
      onSuccess?.(data.report_url);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }

  if (status === "done" && reportUrl) {
    return (
      <a
        href={reportUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md bg-brand-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-primary-hover"
      >
        <FileText className="h-3.5 w-3.5" />
        View Generated Report
        <ExternalLink className="h-3 w-3 opacity-70" />
      </a>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={status === "loading"}
        className="inline-flex items-center gap-1.5 rounded-md border border-brand-primary px-3 py-1.5 text-xs font-medium text-brand-primary transition hover:bg-brand-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating report…
          </>
        ) : (
          <>
            <FileText className="h-3.5 w-3.5" />
            Generate Report
          </>
        )}
      </button>
      {status === "error" && errorMsg && (
        <span className="text-xs text-brand-danger">{errorMsg}</span>
      )}
    </div>
  );
}
