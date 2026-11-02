import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChangeIndicator } from "@/ui/components/change-indicator";

describe("ChangeIndicator", () => {
  it("calls more active players better", () => {
    render(<ChangeIndicator change={{ absolute: 1, relative: 1 / 88 }} kind="count" higherIsBetter />);

    expect(screen.getByText(/\+1 \(\+1%\)/)).toBeTruthy();
    expect(screen.getByText("(better)")).toBeTruthy();
  });

  it("calls a rising no-show rate worse, in percentage points", () => {
    render(<ChangeIndicator change={{ absolute: 0.0072, relative: null }} kind="rate" higherIsBetter={false} />);

    expect(screen.getByText(/\+0\.7 pts/)).toBeTruthy();
    expect(screen.getByText("(worse)")).toBeTruthy();
  });

  it("calls a falling no-show rate better", () => {
    render(<ChangeIndicator change={{ absolute: -0.031, relative: null }} kind="rate" higherIsBetter={false} />);

    expect(screen.getByText(/−3\.1 pts/)).toBeTruthy();
    expect(screen.getByText("(better)")).toBeTruthy();
  });

  it("says no change when nothing changed", () => {
    render(<ChangeIndicator change={{ absolute: 0, relative: 0 }} kind="count" higherIsBetter />);

    expect(screen.getByText("No change")).toBeTruthy();
  });

  it("says no change when the change rounds to zero at the precision shown, rather than a red +0.0", () => {
    render(<ChangeIndicator change={{ absolute: 0.0004, relative: null }} kind="rate" higherIsBetter={false} />);

    expect(screen.getByText("No change")).toBeTruthy();
    expect(screen.queryByText("(worse)")).toBeNull();
  });
});
