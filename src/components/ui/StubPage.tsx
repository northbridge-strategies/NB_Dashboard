import { Construction } from "lucide-react";

export function StubPage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated">
        <Construction className="h-5 w-5 text-text-muted" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-text-primary">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-text-secondary">
        {description ?? "Coming soon — wired up in a later milestone."}
      </p>
    </div>
  );
}
