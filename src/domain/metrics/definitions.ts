/**
 * What each number means, in the host's words. This is the single source:
 * the API sends it with every number so the web and mobile screens show the
 * same definition, and it must stay in step with the rules in `attendance.ts`
 * and `sessions.ts`.
 */
export type MetricKey = "active-players" | "sessions-held" | "no-shows" | "weekly-active-players";

export interface MetricDefinition {
  key: MetricKey;
  label: string;
  /** One sentence, shown next to the number. */
  summary: string;
  /** The exact counting rules, shown when the host asks "how is this counted?". */
  rules: readonly string[];
  higherIsBetter: boolean;
}

export const METRIC_DEFINITIONS = {
  "active-players": {
    key: "active-players",
    label: "Active players",
    summary: "Different people who played at least one session in this period.",
    rules: [
      "Each player counts once, however many sessions they played.",
      "Played means they had a booking they didn't cancel, at a session that went ahead.",
      "Bookings marked as no-shows don't count. Where attendance wasn't taken, we assume the player came.",
      "New players are those whose first session at the club falls in this period.",
    ],
    higherIsBetter: true,
  },
  "sessions-held": {
    key: "sessions-held",
    label: "Sessions held",
    summary: "Sessions that went ahead in this period.",
    rules: [
      "A session belongs to the day it starts, in the club's local time.",
      "Sessions the club cancelled are not counted. They are shown separately.",
      "Sessions that haven't started yet are not counted.",
    ],
    higherIsBetter: true,
  },
  "no-shows": {
    key: "no-shows",
    label: "No-show rate",
    summary: "Share of bookings where the player didn't turn up, at sessions where attendance was taken.",
    rules: [
      "A no-show is a booking the player didn't cancel, but they were marked absent.",
      "Only sessions where attendance was taken are counted. At the others, no-shows are unknown, not zero.",
      "Cancelled bookings are never no-shows, however late they were cancelled.",
    ],
    higherIsBetter: false,
  },
  "weekly-active-players": {
    key: "weekly-active-players",
    label: "Active players per week",
    summary: "Active players counted separately for each Monday-to-Sunday week.",
    rules: [
      "Same rule as Active players, applied one week at a time.",
      "A player who plays in three weeks counts once in each of them, so weeks don't add up to the period total.",
      "Weeks run Monday to Sunday in the club's local time.",
      "A week only partly inside the chosen dates counts only those days, and is marked as partial.",
    ],
    higherIsBetter: true,
  },
} as const satisfies Record<MetricKey, MetricDefinition>;
