import type { ReactNode } from "react";

/** Small presentational building blocks shared by every screen. */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-surface p-5 ${className}`}>{children}</section>;
}

export function Notice({ children, tone = "caution" }: { children: ReactNode; tone?: "caution" | "info" }) {
  const styles =
    tone === "caution" ? "border-notice-line bg-notice-bg text-notice-ink" : "border-line bg-sunken text-ink-2";
  return (
    <div role="note" className={`flex gap-2 rounded-lg border px-3 py-2 text-sm leading-snug ${styles}`}>
      <InfoIcon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "bad" }) {
  const styles = {
    neutral: "bg-sunken text-ink-2",
    accent: "bg-accent-wash text-accent-ink",
    bad: "bg-sunken text-bad",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {children}
    </span>
  );
}

export function InfoIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.25v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function ArrowIcon({ direction, className = "" }: { direction: "up" | "down"; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path
        d={direction === "up" ? "M8 13V3m0 0L3.5 7.5M8 3l4.5 4.5" : "M8 3v10m0 0l-4.5-4.5M8 13l4.5-4.5"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
