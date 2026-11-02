import type { ReactNode } from "react";
import { Card } from "./primitives";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-16 text-sm text-muted">
      <span className="size-4 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorState({ error }: { error: Error }) {
  return (
    <Card className="my-8">
      <h2 className="font-semibold">We couldn&apos;t load this</h2>
      <p className="mt-1 text-sm text-ink-2">{error.message}</p>
    </Card>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-4 py-10 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-ink-2">{children}</div>}
    </div>
  );
}
