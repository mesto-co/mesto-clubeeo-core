/**
 * A management application for accepting applications from users.
 * 
 * @module applicantsApp
 */

import { MestoApp } from "../App";
import Club from "../models/Club";
import Member from "../models/Member";
import MemberRole from "../models/MemberRole";
import User from "../models/User";
import UserExt from "../models/UserExt";
import MemberProfile from "../engines/MemberProfiles/models/MemberProfile";
import MemberApplication from "../models/MemberApplication";
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
      member['profile'] = {
        ...profile,
        userId: user.id,
      };
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

  // Fetch application by member ID
  async fetchMemberApplication(memberId: string, clubId: string) {
    const application = await this.c.m.findOne(MemberApplication, {
      where: { member: { id: memberId }, club: { id: clubId } },
      relations: ['user']
    });
    
    if (!application) {
      return null;
    }
    
    return application;
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
  
  // Update application status
  async updateApplicationStatus(applicationId: string, status: string, rejectionReason?: string) {
    const application = await this.c.m.findOneBy(MemberApplication, { id: applicationId });
    if (!application) {
      throw new Error('Application not found');
    }
    
    application.status = status as any;
    if (rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    
    await this.c.m.save(application);
    
    // Also update the member role based on the application status
    const member = await this.c.m.findOneBy(Member, { id: application.memberId });
    const user = await this.c.m.findOneBy(User, { id: application.userId });
    
    if (status === 'approved') {
      await this.changeUserRole(application.memberId, application.clubId, 'member');
    } else if (status === 'rejected') {
      await this.changeUserRole(application.memberId, application.clubId, 'rejected');
    }
    
    return application;
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

// New route to fetch application by member ID
applicantsApp.get('/member/:memberId/application', {}, async ({ repo }, { params, ctx: { club } }, reply) => {
  const { memberId } = params;
  const application = await repo.fetchMemberApplication(memberId, club.id);
  
  return { data: application };
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

// New route to update application status
applicantsApp.patch('/application/:applicationId/status', {
  schema: {
    body: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
        rejectionReason: { type: 'string' },
      },
      required: ['status'],
    },
  },
}, async ({ repo }, { params, body }, reply) => {
  const { applicationId } = params;
  const { status, rejectionReason } = body;
  const result = await repo.updateApplicationStatus(applicationId, status, rejectionReason);

  return { data: result };
});

export default applicantsApp;