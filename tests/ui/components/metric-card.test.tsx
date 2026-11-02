import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { METRIC_DEFINITIONS } from "@/domain/metrics/definitions";
import { MetricCard } from "@/ui/components/metric-card";

function renderCard(overrides: Partial<ComponentProps<typeof MetricCard>> = {}) {
  render(
    <MetricCard
      definition={METRIC_DEFINITIONS["no-shows"]}
      value="9.9%"
      change={{ absolute: 0.0072, relative: null }}
      changeKind="rate"
      previous="9.2% in 10 Aug – 6 Sep 2026"
      noComparison="No comparison for these dates."
      facts={<p>15 no-shows in 151 checked bookings.</p>}
      drillDown={{ href: "/clubs/club-001/no-shows?range=last-4-weeks", label: "See who didn't show up" }}
      {...overrides}
    />,
  );
}

describe("MetricCard", () => {
  it("puts the definition next to the number", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: "No-show rate" })).toBeTruthy();
    expect(screen.getByText("9.9%")).toBeTruthy();
    expect(screen.getByText(METRIC_DEFINITIONS["no-shows"].summary)).toBeTruthy();
  });

  it("keeps the exact counting rules one click away", () => {
    renderCard();
    const details = screen.getByText("How is this counted?").closest("details")!;

    expect(details.open).toBe(false);
    fireEvent.click(screen.getByText("How is this counted?"));
    expect(details.open).toBe(true);
    for (const rule of METRIC_DEFINITIONS["no-shows"].rules) expect(screen.getByText(rule)).toBeTruthy();
  });

  it("names what the change is measured against", () => {
    renderCard();

    expect(screen.getByText("vs 9.2% in 10 Aug – 6 Sep 2026")).toBeTruthy();
    expect(screen.getByText("(worse)")).toBeTruthy();
  });

  it("says why there's no comparison instead of hiding it", () => {
    renderCard({ change: null });

    expect(screen.getByText("No comparison for these dates.")).toBeTruthy();
    expect(screen.queryByText(/^vs /)).toBeNull();
  });

  it("links to the rows behind the number", () => {
    renderCard();

    expect(screen.getByRole("link", { name: /See who didn't show up/ }).getAttribute("href")).toBe(
      "/clubs/club-001/no-shows?range=last-4-weeks",
    );
  });
});
