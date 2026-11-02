import type { Club } from "@/domain/model";
import type { Database } from "../db/connection";
import type { ClubRepository } from "./types";

interface ClubRow {
  id: string;
  name: string;
  time_zone: string;
  created_on: string;
}

const SELECT_CLUB = "SELECT id, name, time_zone, created_on FROM clubs";

export class SqliteClubRepository implements ClubRepository {
  constructor(private readonly db: Database) {}

  async list(): Promise<Club[]> {
    const rows = this.db.prepare<[], ClubRow>(`${SELECT_CLUB} ORDER BY created_on, name`).all();
    return rows.map(toClub);
  }

  async findById(clubId: string): Promise<Club | null> {
    const row = this.db.prepare<[string], ClubRow>(`${SELECT_CLUB} WHERE id = ?`).get(clubId);
    return row ? toClub(row) : null;
  }
}

function toClub(row: ClubRow): Club {
  return { id: row.id, name: row.name, timeZone: row.time_zone, createdOn: row.created_on };
}
