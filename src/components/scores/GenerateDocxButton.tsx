"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Loader2, ExternalLink } from "lucide-react";

interface Props {
  leadId: string;
  scoreId: string;
}

export function GenerateDocxButton({ leadId, scoreId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [docxUrl, setDocxUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleGenerate() {
    if (status === "loading") return;
    setStatus("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/generate-report-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, score_id: scoreId }),
      });

      const data = await res.json() as { success?: boolean; docx_url?: string; error?: string };

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Generation failed");
      }

      setDocxUrl(data.docx_url ?? null);
      setStatus("done");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }

  if (status === "done" && docxUrl) {
    return (
      <a
        href={docxUrl}
        target="_blank"
        rel="noreferrer"
        download
        className="inline-flex items-center gap-1.5 rounded-md border border-brand-success/40 bg-brand-success/10 px-3 py-1.5 text-xs font-medium text-brand-success transition hover:bg-brand-success/20"
      >
        <FileDown className="h-3.5 w-3.5" />
        Download Document
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
        className="inline-flex items-center gap-1.5 rounded-md border border-brand-primary/40 bg-brand-primary/10 px-3 py-1.5 text-xs font-medium text-brand-primary transition hover:bg-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating document…
          </>
        ) : (
          <>
            <FileDown className="h-3.5 w-3.5" />
            Generate Document Report
          </>
        )}
      </button>
      {status === "error" && errorMsg && (
        <span className="text-xs text-brand-danger">{errorMsg}</span>
      )}
    </div>
  );
}
