import { MestoApp as App } from "../../App";
import MemberProfile from "./models/MemberProfile";

export class MemberProfilesService {
  constructor(protected c: App) {
  }

  async searchMembers(query: string): Promise<MemberProfile[]> {
    return await this.c.db
        .getRepository(MemberProfile)
        .createQueryBuilder("memberProfile")
        .leftJoinAndSelect("memberProfile.member", "member")
        .leftJoinAndSelect("member.memberRoles", "memberRoles")
        .leftJoinAndSelect("memberRoles.clubRole", "clubRole")
        .where("memberProfile.search_vector @@ plainto_tsquery(:query)", { query })
        .andWhere("clubRole.name = :roleName", { roleName: 'member' })
        .andWhere("memberRoles.enabled = true")
        .getMany();
  }

  async updateSearchVector(memberId: string) {
    await this.c.db
      .createQueryBuilder()
      .update(MemberProfile)
      .set({
          search_vector: () => `(
              WITH search_text AS (
                SELECT 
                  coalesce(name, '') || ' ' || 
                  coalesce(headline, '') || ' ' || 
                  coalesce(aboutMe, '') || ' ' || 
                  coalesce(location, '') || ' ' || 
                  coalesce(array_to_string(professions, ' '), '') || ' ' || 
                  coalesce(array_to_string(industries, ' '), '') || ' ' || 
                  coalesce(array_to_string(skills, ' '), '') || ' ' ||
                  coalesce(workplaces::text, '') || ' ' ||
                  coalesce(array_to_string(communityGoals, ' '), '') || ' ' ||
                  coalesce(education::text, '') as text
              )
              SELECT 
                to_tsvector('english', (SELECT text FROM search_text)) ||
                to_tsvector('russian', (SELECT text FROM search_text))
          )`
      })
      .where("id = :id", { id: memberId })
      .execute();
  }
}
