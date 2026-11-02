import type { ChangeDto } from "@/contracts/api";
import { formatChange, type ChangeKind } from "../lib/format";
import { ArrowIcon } from "./primitives";

interface ChangeIndicatorProps {
  change: ChangeDto;
  kind: ChangeKind;
  higherIsBetter: boolean;
}

/** Signed change with an arrow. Colour says good or bad, the arrow and sign say which way. */
export function ChangeIndicator({ change, kind, higherIsBetter }: ChangeIndicatorProps) {
  if (change.absolute === 0) return <span className="text-sm font-medium text-ink-2">No change</span>;

  const up = change.absolute > 0;
  const good = up === higherIsBetter;
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${good ? "text-good" : "text-bad"}`}>
      <ArrowIcon direction={up ? "up" : "down"} className="size-3.5" />
      {formatChange(change, kind)}
      <span className="sr-only">{good ? "(better)" : "(worse)"}</span>
    </span>
  );
}
