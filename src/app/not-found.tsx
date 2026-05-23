import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated text-text-muted">
          <Compass className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold text-text-primary">Page not found</h1>
        <p className="text-sm text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist. Maybe head back to the dashboard?
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-hover"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
