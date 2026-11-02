"use client";

import { useState, type FormEvent } from "react";
import type { LocalDateString, RangeSelection } from "@/contracts/api";
import { PRESET_LABELS, PRESET_ORDER } from "../lib/range";

interface RangePickerProps {
  range: RangeSelection;
  /** Today at the club; custom ranges can't go past it. */
  today: LocalDateString | undefined;
  onChange: (range: RangeSelection) => void;
}

export function RangePicker({ range, today, onChange }: RangePickerProps) {
  const [customOpen, setCustomOpen] = useState(range.kind === "custom");
  const isCustom = range.kind === "custom";

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Date range" className="flex flex-wrap gap-1.5">
        {PRESET_ORDER.map((preset) => {
          const selected = range.kind === "preset" && range.preset === preset;
          return (
            <button
              key={preset}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setCustomOpen(false);
                onChange({ kind: "preset", preset });
              }}
              className={pillClass(selected)}
            >
              {PRESET_LABELS[preset]}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={isCustom}
          aria-expanded={customOpen}
          onClick={() => setCustomOpen((open) => !open)}
          className={pillClass(isCustom)}
        >
          Custom dates
        </button>
      </div>
      {customOpen && <CustomRangeForm key={rangeKey(range)} range={range} today={today} onApply={onChange} />}
    </div>
  );
}

function CustomRangeForm({
  range,
  today,
  onApply,
}: {
  range: RangeSelection;
  today: LocalDateString | undefined;
  onApply: (range: RangeSelection) => void;
}) {
  const [from, setFrom] = useState(range.kind === "custom" ? range.from : "");
  const [to, setTo] = useState(range.kind === "custom" ? range.to : (today ?? ""));
  const invalid = !from || !to || from > to;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!invalid) onApply({ kind: "custom", from, to });
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-3 text-sm"
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">From</span>
        <input
          type="date"
          required
          value={from}
          max={to || today}
          onChange={(event) => setFrom(event.target.value)}
          className="rounded-md border border-line bg-surface px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">To</span>
        <input
          type="date"
          required
          value={to}
          min={from || undefined}
          max={today}
          onChange={(event) => setTo(event.target.value)}
          className="rounded-md border border-line bg-surface px-2 py-1"
        />
      </label>
      <button
        type="submit"
        disabled={invalid}
        className="rounded-md bg-accent px-3 py-1.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Show these dates
      </button>
      <p className="basis-full text-xs text-muted">
        Compared with the same number of days just before. Dates are in the club&apos;s time zone.
      </p>
    </form>
  );
}

function rangeKey(range: RangeSelection): string {
  return range.kind === "custom" ? `${range.from}:${range.to}` : range.preset;
}

function pillClass(selected: boolean): string {
  return [
    "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
    selected
      ? "border-accent bg-accent text-white"
      : "border-line bg-surface text-ink-2 hover:border-axis hover:bg-accent-wash hover:text-ink",
  ].join(" ");
}
