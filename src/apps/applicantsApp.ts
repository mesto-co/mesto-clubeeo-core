import { MestoApp } from "../App";
import { Member, Club, MemberRole, User, UserExt } from "clubeeo-core";
import MemberProfile from "../engines/MemberProfiles/models/MemberProfile";
import { AppBuilder } from "../lib/createApp";

export class ApplicantsRepo {
  constructor(protected c: MestoApp) {}

  // Fetch paginated list of users by role
  async fetchMembersByRole(club: Club, role: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const [members, total] = await this.c.m.findAndCount(Member, {
      where: {
        enabled: true,
        memberRoles: {
          enabled: true,
          club: { id: club.id },
          clubRole: { name: role }
        }
      },
      // relations: {
      //   memberRoles: {
      //     clubRole: true,
      //   },
      // },
      order: {
        id: 'DESC',
      },
      skip: offset,
      take: limit,
    });

    for (const member of members) {
      const profile = await this.c.m.findOneBy(MemberProfile, { member: { id: member.id } });
      const user = await this.c.m.findOneBy(User, {id: member.userId});
      const userExts = await this.c.m.findBy(UserExt, {user: {id: member.userId}});
      member['profile'] = profile;
      member['rolesMap'] = await this.c.engines.access.service.getRolesMap({member, user, hub: {id: club.id}}, ['applicant', 'member', 'rejected', 'guest']);
      member['memberRoles'] = await this.c.m.find(MemberRole, {
        where: { member: { id: member.id }, club: { id: club.id }, enabled: true },
        relations: ['clubRole'],
        order: { clubRole: { name: 'ASC' } },
      });
      member['userExts'] = userExts;
    }

    return { members, total };
  }

  // Fetch user profile by user ID
  async fetchMemberProfile(memberId: string) {
    const profile = await this.c.m.findOneBy(MemberProfile, { member: { id: memberId } });
    if (!profile) {
      throw new Error('Profile not found');
    }
    return profile;
  }

  // Change user role
  async changeUserRole(memberId: string, clubId: string, newRole: string) {
    const member = await this.c.m.findOneBy(Member, { id: memberId, club: {id: clubId} });
    if (!member) {
      throw new Error('Member not found');
    }

    const user = await this.c.m.findOneBy(User, {id: member.userId});

    const rolesToRemove = ['applicant', 'member', 'rejected', 'guest'].filter(role => role !== newRole);
    for (const role of rolesToRemove) {
      await this.c.engines.access.service.removeRole({member, user, hub: {id: clubId}}, role);
    }

    await this.c.engines.access.service.addRole({member, user, hub: {id: clubId}}, newRole);
    return { newRole };
  }
}

export class ApplicantsEntity {
  repo: ApplicantsRepo;

  constructor(public c: MestoApp) {
    this.repo = new ApplicantsRepo(c);
  }
}

const applicantsApp = new AppBuilder<MestoApp, ApplicantsEntity>('mesto-applicants', (c) => new ApplicantsEntity(c));

applicantsApp.get('/members', {
  schema: {
    querystring: {
      role: { type: 'string', enum: ['applicant', 'member', 'rejected', 'guest'] },
      page: { type: 'integer', default: 1 },
      limit: { type: 'integer', default: 20 },
    },
  }
}, async ({ repo }, { query, ctx: {club} }, reply) => {
  const { role, page, limit } = query;
  const { members, total } = await repo.fetchMembersByRole(club, role, page, limit);

  return {
    data: members,
    meta: {
      total,
      page,
      limit,
    },
  };
});

applicantsApp.get('/member/:memberId/profile', {}, async ({ repo }, { params }, reply) => {
  const { memberId } = params;
  const profile = await repo.fetchMemberProfile(memberId);
  
  return { data: profile };
});

applicantsApp.patch('/member/:memberId/role', {
  schema: {
    body: {
      type: 'object',
      properties: {
        newRole: { type: 'string', enum: ['applicant', 'member', 'rejected', 'guest'] },
      },
      required: ['newRole'],
    },
  },
}, async ({ repo }, { params, body, ctx: { club } }, reply) => {
  const { memberId } = params;
  const { newRole } = body;
  const result = await repo.changeUserRole(memberId, club.id, newRole);

  return { data: result };
});

export default applicantsApp;