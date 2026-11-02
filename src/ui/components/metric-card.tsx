import Link from "next/link";
import type { ReactNode } from "react";
import type { ChangeDto, MetricDefinitionDto } from "@/contracts/api";
import type { ChangeKind } from "../lib/format";
import { ChangeIndicator } from "./change-indicator";
import { Definition } from "./definition";
import { Card } from "./primitives";

interface MetricCardProps {
  definition: MetricDefinitionDto;
  /** The headline, already formatted: "89", "9.9%", "Unknown". */
  value: string;
  valueIsUnknown?: boolean;
  change: ChangeDto | null;
  changeKind: ChangeKind;
  /** "88 in 10 Aug – 6 Sep 2026" */
  previous: string;
  /** Shown instead of the comparison when there is none. */
  noComparison: string;
  facts: ReactNode;
  notice?: ReactNode;
  drillDown: { href: string; label: string };
}

/**
 * One headline number with everything needed to trust it: what it is
 * compared with, its definition, and a way into the rows behind it.
 */
export function MetricCard(props: MetricCardProps) {
  const { definition, value, valueIsUnknown, change, changeKind, previous, noComparison, facts, notice, drillDown } =
    props;

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-ink-2">{definition.label}</h2>

      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <Link
            href={drillDown.href}
            tabIndex={-1}
            aria-hidden
            className={`text-4xl font-semibold tracking-tight hover:underline ${valueIsUnknown ? "text-muted" : ""}`}
          >
            {value}
          </Link>
          {change && <ChangeIndicator change={change} kind={changeKind} higherIsBetter={definition.higherIsBetter} />}
        </div>
        <p className="mt-1 text-xs text-muted">{change ? `vs ${previous}` : noComparison}</p>
      </div>

      <div className="text-sm">{facts}</div>
      {notice}

      <div className="border-t border-line pt-3">
        <Definition definition={definition} />
      </div>

      <Link
        href={drillDown.href}
        className="mt-auto inline-flex items-center gap-1 self-start rounded-md text-sm font-semibold text-accent-ink hover:underline"
      >
        {drillDown.label} <span aria-hidden>→</span>
      </Link>
    </Card>
  );
}
