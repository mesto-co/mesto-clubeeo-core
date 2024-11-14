import { MestoApp as App } from "../../App";
import MemberProfile from "./models/MemberProfile";

export class MemberProfilesService {
  constructor(protected c: App) {
  }

  private sanitizeProfile(profile: MemberProfile): MemberProfile {
    return {
      ...profile,
      projects: profile.projects?.map(project => ({
        ...project,
        name: project.name || '',
        link: project.link || '',
        description: project.description || '',
        stage: project.stage || '',
        status: project.status || '',
        category: project.category || '',
        market: project.market || '',
        tags: project.tags || [],
        needs: project.needs || []
      })) || [],
      professions: profile.professions || [],
      industries: profile.industries || [],
      skills: profile.skills || [],
      workplaces: profile.workplaces || [],
      education: profile.education || [],
      communityGoals: profile.communityGoals || []
    };
  }

  async searchMembers(query: string, pagination?: { page: number; pageSize: number }): Promise<MemberProfile[]> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const queryBuilder = this.c.db
        .getRepository(MemberProfile)
        .createQueryBuilder("memberProfile")
        .leftJoinAndSelect("memberProfile.member", "member")
        .leftJoinAndSelect("member.memberRoles", "memberRoles")
        .leftJoinAndSelect("memberRoles.clubRole", "clubRole")
        .andWhere("clubRole.name = :roleName", { roleName: 'member' })
        .andWhere("memberRoles.enabled = true");

    if (query.trim()) {
      queryBuilder
        .andWhere("memberProfile.search_vector @@ plainto_tsquery(:query)", { query })
    } else {
      queryBuilder.orderBy("memberProfile.updatedAt", "DESC");
    }

    const profiles = await queryBuilder
        .skip(offset)
        .take(pageSize)
        .getMany();

    return profiles.map(profile => this.sanitizeProfile(profile));
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

  async getMemberProfile(profileId: string): Promise<MemberProfile> {
    const profile = await this.c.db
      .getRepository(MemberProfile)
      .findOneByOrFail({ id: profileId });

    return this.sanitizeProfile(profile);
  }

  async getMemberProfileByMemberId(memberId: string): Promise<MemberProfile> {
    const profile = await this.c.db
      .getRepository(MemberProfile)
      .findOneByOrFail({ member: { id: memberId } });

    return this.sanitizeProfile(profile);
  }

  async updateMemberProfile(profile: MemberProfile): Promise<MemberProfile> {
    await this.c.db.getRepository(MemberProfile).save(profile);
    await this.updateSearchVector(profile.id);
    return this.sanitizeProfile(profile);
  }
}
