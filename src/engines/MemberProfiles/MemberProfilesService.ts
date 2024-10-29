import { MestoApp as App } from "../../App";
import MemberProfile from "./models/MemberProfile";

export class MemberProfilesService {
  constructor(protected c: App) {
  }

  async searchMembers(query: string): Promise<MemberProfile[]> {
    return await this.c.db
        .getRepository(MemberProfile)
        .createQueryBuilder("memberProfile")
        .where("memberProfile.search_vector @@ plainto_tsquery(:query)", { query })
        .getMany();
  }

  async updateSearchVector(memberId: string) {
    await this.c.db
      .createQueryBuilder()
      .update(MemberProfile)
      .set({
          search_vector: () => `
              to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(aboutMe, '')) ||
              to_tsvector('russian', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(aboutMe, ''))
          `
      })
      .where("id = :id", { id: memberId })
      .execute();
  }
}
