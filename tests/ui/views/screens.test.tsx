import { fireEvent, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fixedClock } from "@/server/clock";
import { createServices, type Services } from "@/server/container";
import { AppHeader } from "@/ui/components/app-header";
import { ActivePlayersView } from "@/ui/views/active-players-view";
import { DashboardView } from "@/ui/views/dashboard-view";
import { NoShowsView } from "@/ui/views/no-shows-view";
import { SessionDetailView } from "@/ui/views/session-detail-view";
import { SessionsView } from "@/ui/views/sessions-view";
import { databaseWith } from "../../support/csv-exports";
import { inProcessFetch } from "../../support/in-process-api";
import { renderScreen } from "../../support/render";
import { BRIEF_NOW, seededDatabase } from "../../support/seeded-database";

/*
 * Each screen is rendered against the real API: fetch is answered in-process
 * by the route handlers, backed by SQLite in memory. Only the URL (Next.js
 * navigation hooks) and the network are simulated.
 */

const api = vi.hoisted(() => ({ services: undefined as unknown }));
vi.mock("@/server/container", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/container")>()),
  services: () => api.services,
}));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => undefined,
}));

const url = vi.hoisted(() => ({
  params: {} as Record<string, string>,
  search: "",
  pathname: "/",
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useParams: () => url.params,
  useSearchParams: () => new URLSearchParams(url.search),
  usePathname: () => url.pathname,
  useRouter: () => ({ push: url.push, replace: vi.fn() }),
}));

function visit(pathname: string, search = "") {
  const [, , clubId, , sessionId] = pathname.split("/");
  url.params = sessionId ? { clubId, sessionId } : { clubId };
  url.pathname = pathname;
  url.search = search;
}

let csvServices: Services;

beforeAll(() => {
  csvServices = createServices(seededDatabase(), fixedClock(BRIEF_NOW));
});

beforeEach(() => {
  api.services = csvServices;
  url.push.mockReset();
  vi.stubGlobal("fetch", inProcessFetch);
});

describe("dashboard", () => {
  it("shows each number with what it's compared with and its definition", async () => {
    visit("/clubs/club-001");
    renderScreen(<DashboardView />);

    const players = (await screen.findByRole("heading", { name: "Active players" })).closest("section")!;
    expect(within(players).getByText("89")).toBeTruthy();
    expect(within(players).getByText(/\+1 \(\+1%\)/)).toBeTruthy();
    expect(within(players).getByText(/vs 88 in 10 Aug/)).toBeTruthy();
    expect(within(players).getByText("Different people who played at least one session in this period.")).toBeTruthy();
    expect(
      within(players)
        .getByRole("link", { name: /See the 89 players/ })
        .getAttribute("href"),
    ).toBe("/clubs/club-001/players?range=last-4-weeks");
  });

  it("says how much attendance was taken right next to the no-show rate", async () => {
    visit("/clubs/club-001");
    renderScreen(<DashboardView />);

    const noShows = (await screen.findByRole("heading", { name: "No-show rate" })).closest("section")!;
    expect(within(noShows).getByText("9.9%")).toBeTruthy();
    expect(within(noShows).getByText(/Attendance was taken at 11 of 20/)).toBeTruthy();
    expect(within(noShows).getByText(/113 bookings/)).toBeTruthy();
  });

  it("charts active players per week, with the same numbers in the table view", async () => {
    visit("/clubs/club-001");
    renderScreen(<DashboardView />);

    fireEvent.click(await screen.findByRole("button", { name: "table" }));

    const table = await screen.findByRole("table", { name: /Active players per week/ });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(8);
    expect(within(table).getAllByText("Period before")).toHaveLength(4);
    expect(rows.slice(4).map((row) => within(row).getAllByRole("cell")[1].textContent)).toEqual([
      "37",
      "36",
      "45",
      "44",
    ]);
  });

  it("keeps the club and switches the dates when a preset is chosen", async () => {
    visit("/clubs/club-001");
    renderScreen(<DashboardView />);

    fireEvent.click(await screen.findByRole("button", { name: "Last 8 weeks" }));

    expect(url.push).toHaveBeenCalledWith("/clubs/club-001?range=last-8-weeks", { scroll: false });
  });

  it("shows 'Unknown', never 0%, when attendance was never taken", async () => {
    api.services = createServices(
      databaseWith({
        sessions: ["s1,c1,Open Play,2026-09-15T12:00:00Z,120,12,scheduled,false"],
        bookings: ["b1,s1,p1,2026-09-14T10:00:00Z,booked,,"],
      }),
      fixedClock(BRIEF_NOW),
    );
    visit("/clubs/c1");
    renderScreen(<DashboardView />);

    const noShows = (await screen.findByRole("heading", { name: "No-show rate" })).closest("section")!;
    expect(within(noShows).getByText("Unknown")).toBeTruthy();
    expect(within(noShows).queryByText("0.0%")).toBeNull();
    expect(within(noShows).getByText(/Attendance wasn't taken at any of the 1 session held/)).toBeTruthy();
  });

  it("explains a missing comparison instead of showing a misleading one", async () => {
    visit("/clubs/club-001", "range=last-26-weeks");
    renderScreen(<DashboardView />);

    expect(await screen.findByText(/No comparison for these dates: the period before them starts ahead/)).toBeTruthy();
    expect(screen.queryByText("(better)")).toBeNull();
    expect(screen.queryByText("(worse)")).toBeNull();
  });

  it("gives a club with no sessions a page about what's coming, not a row of zeros", async () => {
    visit("/clubs/club-002");
    renderScreen(<DashboardView />);

    expect(await screen.findByRole("heading", { name: "No sessions yet" })).toBeTruthy();
    expect(screen.getByText(/Take attendance at every session/)).toBeTruthy();
    expect(screen.queryByText("0")).toBeNull();
  });

  it("shows the API's own message when something is wrong", async () => {
    visit("/clubs/nope");
    renderScreen(<DashboardView />);

    expect(await screen.findByText("We couldn't load this")).toBeTruthy();
    expect(screen.getByText('No club with id "nope".')).toBeTruthy();
  });
});

describe("club switcher", () => {
  it("lists both clubs and switches to the other one's dashboard, keeping the dates", async () => {
    visit("/clubs/club-001/sessions/s0001", "range=last-8-weeks");
    renderScreen(<AppHeader />);

    const select = (await screen.findByRole("combobox")) as HTMLSelectElement;
    expect([...select.options].map((option) => option.text)).toEqual([
      "Saigon Smash Pickleball",
      "Thảo Điền Tennis Club",
    ]);
    expect(select.value).toBe("club-001");

    fireEvent.change(select, { target: { value: "club-002" } });

    expect(url.push).toHaveBeenCalledWith("/clubs/club-002?range=last-8-weeks");
  });

  it("links the logo to this club's dashboard with the same dates", async () => {
    visit("/clubs/club-001/no-shows", "range=last-13-weeks");
    renderScreen(<AppHeader />);

    expect(screen.getByRole("link", { name: /Club Insights/ }).getAttribute("href")).toBe(
      "/clubs/club-001?range=last-13-weeks",
    );
  });
});

describe("drill-downs", () => {
  it("lists the active players behind the number, new ones marked", async () => {
    visit("/clubs/club-001/players");
    renderScreen(<ActivePlayersView />);

    expect(await screen.findByText("89 active players")).toBeTruthy();
    expect(screen.getByText(/22 new to the club/)).toBeTruthy();
    expect(screen.getAllByText("New")).toHaveLength(22);
  });

  it("filters sessions down to those without attendance", async () => {
    visit("/clubs/club-001/sessions");
    renderScreen(<SessionsView />);

    fireEvent.click(await screen.findByRole("button", { name: "Attendance not taken (9)" }));

    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(9);
    expect(rows.every((row) => within(row).queryByText("Not taken"))).toBe(true);
  });

  it("lists who didn't show up, and warns about sessions it couldn't check", async () => {
    visit("/clubs/club-001/no-shows");
    renderScreen(<NoShowsView />);

    expect(await screen.findByText(/15 no-shows in 151 checked bookings/)).toBeTruthy();
    expect(screen.getByText(/Attendance wasn't taken at 9 sessions of 20/)).toBeTruthy();
    expect(within(screen.getByRole("table")).getAllByRole("row").slice(1)).toHaveLength(14);
  });

  it("shows a session at the club's local time, with each booking's attendance", async () => {
    visit("/clubs/club-001/sessions/s0001");
    renderScreen(<SessionDetailView />);

    // Stored as 22:30 UTC on Sunday 4 January; at the club it is Monday 5 January, 05:30.
    expect(await screen.findByRole("heading", { name: "Early Bird Monday" })).toBeTruthy();
    expect(screen.getByText(/Mon, 5 Jan 2026, 05:30–07:00/)).toBeTruthy();
    expect(screen.getAllByText("Came").length).toBeGreaterThan(0);
  });
});
