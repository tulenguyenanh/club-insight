import { attendanceOf, countsAsPlayed, keptBookings } from "../attendance";
import type { Session } from "../model";
import { heldSessions } from "../sessions";

/** One player's record across a set of sessions: the rows behind "active players" and "no-shows". */
export interface PlayerActivity {
  playerId: string;
  playerName: string;
  sessionsPlayed: number;
  noShows: number;
  /** Kept bookings at sessions where attendance was taken. */
  checkedBookings: number;
  lastPlayedAt: Date | null;
  lastNoShowAt: Date | null;
}

export function summarisePlayers(sessions: readonly Session[], asOf: Date): PlayerActivity[] {
  const byPlayer = new Map<string, PlayerActivity>();

  for (const session of heldSessions(sessions, asOf)) {
    for (const booking of keptBookings(session)) {
      const player = byPlayer.get(booking.playerId) ?? emptyActivity(booking.playerId, booking.playerName);
      const attendance = attendanceOf(session, booking);

      if (countsAsPlayed(session, booking)) {
        player.sessionsPlayed += 1;
        player.lastPlayedAt = latest(player.lastPlayedAt, session.startsAt);
      }
      if (attendance !== "unknown") player.checkedBookings += 1;
      if (attendance === "no_show") {
        player.noShows += 1;
        player.lastNoShowAt = latest(player.lastNoShowAt, session.startsAt);
      }
      byPlayer.set(booking.playerId, player);
    }
  }

  return [...byPlayer.values()];
}

function emptyActivity(playerId: string, playerName: string): PlayerActivity {
  return {
    playerId,
    playerName,
    sessionsPlayed: 0,
    noShows: 0,
    checkedBookings: 0,
    lastPlayedAt: null,
    lastNoShowAt: null,
  };
}

function latest(current: Date | null, candidate: Date): Date {
  return current === null || candidate > current ? candidate : current;
}
