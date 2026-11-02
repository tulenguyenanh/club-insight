# Club Insights

A dashboard that shows a club host how their club is doing: **active players**, **sessions held** and the
**no-show rate** for any dates they choose, each compared with the period just before. Every number has its
definition next to it and opens onto the players or sessions behind it.

Next.js 16 (App Router) · TypeScript · SQLite (better-sqlite3) · SWR · Recharts · Tailwind · Vitest

## Run it

Needs Node 22 or later.

```bash
npm install
npm run dev        # seeds SQLite from data/*.csv, then serves http://localhost:3000
```

| Command                             | What it does                                                    |
| ----------------------------------- | --------------------------------------------------------------- |
| `npm test`                          | All 194 tests (Vitest); `npm run test:watch` while working      |
| `npm run test:coverage`             | The same, with a V8 coverage report                             |
| `npm run seed`                      | Rebuilds `data/club-insights.db` from the CSVs (safe to re-run) |
| `npm run build && npm start`        | Production build and server                                     |
| `npm run lint`, `npm run typecheck` | ESLint, `tsc`                                                   |

"Now" is pinned to **Monday 5 October 2026, 09:00 in Ho Chi Minh City**, as the brief asks. Override it with
`CLUB_INSIGHTS_NOW=2026-09-01T12:00:00+07:00`, or set it to an empty string to use the real clock.

## The numbers

| Number                              | Definition (also shown on screen, and sent by the API)                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Active players**                  | Different people with at least one booking they didn't cancel, at a session that went ahead, where they weren't marked as a no-show. Where attendance wasn't taken we assume they came.                      |
| **Sessions held**                   | Sessions that started in the period and weren't cancelled by the club. Cancelled sessions are shown separately.                                                                                              |
| **No-show rate**                    | No-shows ÷ kept bookings, **counting only sessions where attendance was taken**. If none was taken, the rate is _unknown_, never 0. The screen always says how many sessions and bookings it couldn't check. |
| **Active players per week** (chart) | The active-players rule applied to each Monday–Sunday week in the club's time zone. The period before is drawn in grey for comparison.                                                                       |

## Decisions where the brief was silent

- **No-shows are a rate, not a count.** Attendance was taken at only 104 of the 186 sessions held, and the share varies
  week to week, so comparing raw counts between periods would mostly measure how often the host took
  attendance. The count is shown next to the rate, with the coverage ("taken at 11 of 20 sessions, 113
  bookings unchecked").
- **Unknown attendance counts as "played"** for active players. Requiring `attended = true` would ignore
  734 of the 1,733 kept bookings (42%). Players marked absent are not counted.
- **Cancelled bookings are never no-shows**, however late. Late cancellation is a separate signal (see next steps).
- **Presets are whole weeks.** "Last 4 weeks" means the last four complete Monday–Sunday weeks, so it never
  includes the half-finished current week and the numbers don't move as it fills in. Custom dates are allowed;
  weeks only partly inside them are drawn faded and labelled "partial".
- **The comparison period** is the same number of days immediately before. It is **withheld** when that period
  starts before the club's first session, where it would be partly empty and make growth look larger than it is.
  The screen explains why.
- **Days and weeks are in the club's time zone, and so is every time shown**, whatever the viewer's own time
  zone. This matters: "Early Bird Monday" starts at 05:30 Monday in HCMC, which is still Sunday in UTC.
  Bucketing by UTC would move it into the wrong week and change the weekly numbers.
- **"New" players** are those whose first session at the club falls in the period. I don't use
  `joined_club_at`, because joining isn't playing (32 bookings were even made before the joining date).
- **The new club** gets an onboarding page instead of a row of zeros. It explains what will appear and asks the
  host to take attendance, since without it no-shows stay unknown.
- **Validation:** ranges can't end after today at the club and are limited to 366 days. CSV rows are validated
  while seeding, so a bad export fails loudly with its file and line number.
- Two pairs of players share a name. Lists are keyed by player id, and the "first session here" column helps
  tell them apart.

## How it's built

```
data/                 CSV exports (the seed reads these)
scripts/seed.ts       CLI: CSV -> SQLite
src/
  domain/             Pure business rules. No framework, no I/O.
    attendance.ts       kept booking, attendance (attended / no_show / unknown)
    sessions.ts         held, cancelled, which day a session belongs to
    period.ts           presets, previous period, Monday-Sunday weeks
    time-zone.ts        calendar day <-> instant in a time zone
    metrics/            one file per number, plus their definitions
  contracts/api.ts    JSON contract shared by the web app (and the mobile app)
  server/
    repositories/       ports (interfaces) + SQLite adapters
    services/           application services: resolve a report's scope, compute, map to DTOs
    http/               query parsing, error -> JSON mapping
    container.ts        composition root: the only place concrete classes are chosen
  app/                Next.js routing only: thin pages and route handlers
  ui/                 React: views per screen, reusable components, hooks, API client
tests/                mirrors src/: domain, server, api, ui (see Tests)
```

- **Dependencies point inward.** `domain` imports nothing from the app. Services depend on repository
  _interfaces_, and `container.ts` wires in SQLite. Tests swap in an in-memory database and a fixed clock.
- **One rule, one place.** "Held", "kept" and "no-show" are each defined once in `domain` and reused by
  every metric, list and chart, so the drill-downs always add up to the headline numbers. An integration test
  checks exactly that.
- **The screens only use the JSON API**, through a typed client (`ui/lib/api-client.ts`). Every response
  carries its period, comparison period, `asOf`, the club's time zone and each metric's definition, so a mobile
  client can render the same screens without re-deriving anything.
- **Route handlers are a few lines each**: parse input, call a service, `respond()`.

### API

All `GET`, JSON. Range: `?range=last-4-weeks|last-8-weeks|last-13-weeks|last-26-weeks` (default `last-4-weeks`)
or `?from=YYYY-MM-DD&to=YYYY-MM-DD`. Errors: `{ "error": { "code", "message" } }` with 400 or 404.

```
/api/clubs                                     clubs, with "today" and first session day
/api/clubs/:clubId                             one club
/api/clubs/:clubId/summary                     the three numbers, previous values, change, definitions
/api/clubs/:clubId/weekly                      active players per week, previous period included
/api/clubs/:clubId/active-players              the players behind "active players"
/api/clubs/:clubId/sessions                    every session in the range
/api/clubs/:clubId/no-shows                    players with no-shows + attendance coverage
/api/clubs/:clubId/sessions/:sessionId         one session's roster with attendance
```

## Tests

`npm test` runs 194 tests in about 3 seconds. Coverage is 97% of lines and 86% of branches; Next.js page shells
are excluded because they only wrap a view. Test files mirror `src/`, in two Vitest projects: `*.test.ts` runs in
Node, and `*.test.tsx` runs in jsdom with Testing Library.

| Layer                                       | What it covers                                                                                                                                                                                                                                                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/domain`                              | One file per module, on hand-built sessions and bookings: calendar, time zones (including 23- and 25-hour days where clocks change), periods, session and attendance rules, and each metric.                                                                                                    |
| `tests/server`                              | Seeding (types, unique ids, references between files, a rejected export leaving old data intact), SQLite repositories (window edges, no rows leaking between clubs), period resolution, comparison fairness, HTTP error mapping, config, and drill-downs on a small club you can check by hand. |
| `tests/server/insights-against-csv.test.ts` | The real CSVs in memory, checked against figures computed **independently** by a separate script: 89 active players, 20 sessions, 15 no-shows in 151 checked bookings, weekly 37, 36, 45 and 44.                                                                                                |
| `tests/api`                                 | Every route handler called the way Next.js calls it: status codes, JSON shape, 400 and 404 bodies, and the `/` redirect.                                                                                                                                                                        |
| `tests/ui`                                  | Formatting in the club's time zone, the API client, the range picker and metric card, and **whole screens** rendered against the real API. Their `fetch` is answered in-process by the route handlers over SQLite, so the UI and the API can't drift apart.                                     |

The number most likely to be wrong is the **no-show rate**: every shortcut (blank = attended, blank = no-show,
counting cancellations, dividing by all bookings) gives a believable but wrong answer, and
`tests/domain/metrics/no-shows.test.ts` pins down each one. The other high-risk area is **time zones**: the 05:30
Monday session is still Sunday in UTC.

### How the tests were written

Changes to behaviour go **red, then green, then refactor**:

1. Write a test that states the rule and watch it fail for the expected reason.
2. Make the smallest change that passes it.
3. Tidy up with the whole suite green.

Each fix is committed together with its test, and the commit message records the red and the green. The
fixes found this way:

- `?from=2026-13-01` crashed the API with a 500 and broke the page. It is now a 400.
- A broken reference in the CSVs gave SQLite's bare `FOREIGN KEY constraint failed`. The seed now names the file,
  line and value.
- A no-show rate up 0.04 points showed as a red "+0.0 pts". It now reads "No change".
- The API client threw a `TypeError` on an unexpected error body. Network loss now gives a readable message.

Tests that describe behaviour already in place were checked a different way: breaking each business rule on
purpose must make them fail. Eight rules were broken this way, one at a time, including counting no-shows as
active, using UTC days, and letting unchecked bookings into the rate. Each broke between 1 and 21 tests, and no
broken rule went unnoticed.

## What I'd do next

1. **Late cancellations and "who stopped coming"**: the two other things hosts ask about. Both are derivable
   from the data already loaded.
2. **Push aggregation into SQL or pre-compute it.** Each request loads the club's session history and computes
   in TypeScript. That keeps the rules in one tested place and is instant at this size (195 sessions), but
   wouldn't hold for years of data or many clubs. I'd keep the domain functions as the reference and add a
   test that checks the SQL against them.
3. **A versioned, documented API** (OpenAPI generated from the contract types) and HTTP caching keyed on club,
   range and data version, before the mobile app depends on it.
4. **Auth**: replace the club switcher with the host's own clubs.
5. **Browser tests** (Playwright) for the main flows, and an accessibility audit of the chart's keyboard path.
6. **Nudge hosts to take attendance**, since that is what turns "unknown" into a real number.
