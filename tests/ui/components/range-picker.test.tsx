import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RangePicker } from "@/ui/components/range-picker";

const TODAY = "2026-10-05";

describe("RangePicker", () => {
  it("marks the selected preset and reports a new choice", () => {
    const onChange = vi.fn();
    render(<RangePicker range={{ kind: "preset", preset: "last-4-weeks" }} today={TODAY} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "Last 4 weeks" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Last 13 weeks" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "preset", preset: "last-13-weeks" });
  });

  it("opens custom dates ending today, and won't let them run past today", () => {
    render(<RangePicker range={{ kind: "preset", preset: "last-4-weeks" }} today={TODAY} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Custom dates" }));

    const to = screen.getByLabelText("To") as HTMLInputElement;
    expect(to.value).toBe(TODAY);
    expect(to.max).toBe(TODAY);
  });

  it("applies custom dates", () => {
    const onChange = vi.fn();
    render(<RangePicker range={{ kind: "preset", preset: "last-4-weeks" }} today={TODAY} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Custom dates" }));

    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-09-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Show these dates" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "custom", from: "2026-09-01", to: TODAY });
  });

  it("won't apply dates that run backwards", () => {
    const onChange = vi.fn();
    render(
      <RangePicker
        range={{ kind: "custom", from: "2026-09-20", to: "2026-09-10" }}
        today={TODAY}
        onChange={onChange}
      />,
    );

    const apply = screen.getByRole("button", { name: "Show these dates" }) as HTMLButtonElement;
    expect(apply.disabled).toBe(true);
    fireEvent.click(apply);
    expect(onChange).not.toHaveBeenCalled();
  });
});
