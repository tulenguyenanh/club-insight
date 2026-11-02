import type { ClubDto } from "@/contracts/api";
import type { Club } from "@/domain/model";
import { toLocalDate } from "@/domain/time-zone";
import type { Clock } from "../clock";
import { NotFoundError } from "../errors";
import type { ClubRepository, SessionRepository } from "../repositories/types";

export class ClubService {
  constructor(
    private readonly clubs: ClubRepository,
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
  ) {}

  async list(): Promise<ClubDto[]> {
    const asOf = this.clock.now();
    const clubs = await this.clubs.list();
    return Promise.all(clubs.map((club) => this.describe(club, asOf)));
  }

  async get(clubId: string): Promise<ClubDto> {
    return this.describe(await this.require(clubId), this.clock.now());
  }

  async require(clubId: string): Promise<Club> {
    const club = await this.clubs.findById(clubId);
    if (!club) throw new NotFoundError(`No club with id "${clubId}".`);
    return club;
  }

  /** The club as the API shows it, as of the given moment. */
  async describe(club: Club, asOf: Date): Promise<ClubDto> {
    const firstHeld = await this.sessions.findFirstHeldStart(club.id, asOf);
    return {
      ...club,
      today: toLocalDate(asOf, club.timeZone),
      firstSessionOn: firstHeld ? toLocalDate(firstHeld, club.timeZone) : null,
    };
  }
}
