import { gql } from 'graphql-tag';
import { MemberProfiles } from './MemberProfiles';
import { MestoApp } from '../../App';
import Club from '../../models/Club';
import Member from '../../models/Member';
import User from '../../models/User';
import MemberProfile from './models/MemberProfile';

const typeDefs = gql`
  type Project {
    name: String!
    link: String
    description: String!
    stage: String!
    status: String!
    logo: String
    pitchDeck: String
    videoPitch: String
    website: String
    category: String!
    tags: [String!]!
    market: String!
    needs: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  input ProjectInput {
    name: String!
    link: String
    description: String!
    stage: String!
    status: String!
    logo: String
    pitchDeck: String
    videoPitch: String
    website: String
    category: String!
    tags: [String!]!
    market: String!
    needs: [String!]!
  }

  type Workplace {
    organization: String!
    position: String!
    startDate: String!
    endDate: String!
    current: Boolean!
    skills: [String!]!
  }

  input WorkplaceInput {
    organization: String!
    position: String!
    startDate: String!
    endDate: String!
    current: Boolean!
    skills: [String!]!
  }

  type Education {
    institution: String!
    degree: String!
    startYear: String!
    endYear: String!
  }

  input EducationInput {
    institution: String!
    degree: String!
    startYear: String!
    endYear: String!
  }

  type UserProfile {
    id: ID!
    memberId: String!
    userId: String!
    name: String!
    headline: String!
    aboutMe: String!
    location: String!
    projects: [Project!]!
    socialLinks: JSON!
    professions: [String!]!
    industries: [String!]!
    skills: [String!]!
    workplaces: [Workplace!]!
    education: [Education!]!
    communityGoals: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  input ProfileUpdateInput {
    name: String!
    headline: String
    aboutMe: String
    location: String
    projects: [ProjectInput!]
    socialLinks: JSON
    professions: [String!]
    industries: [String!]
    skills: [String!]
    workplaces: [WorkplaceInput!]
    education: [EducationInput!]
    communityGoals: [String!]
  }

  type PaginatedUserProfiles {
    items: [UserProfile!]!
    total: Int!
    page: Int!
    pageSize: Int!
    hasMore: Boolean!
  }

  input PaginationInput {
    page: Int = 1
    pageSize: Int = 20
  }

  extend type Club {
    memberProfileSearch(query: String!, pagination: PaginationInput): PaginatedUserProfiles!
    memberProfileGet(profileId: ID!): UserProfile!
    memberRoles: JSON!
  }

  extend type Mutation {
    memberProfileUpdate(input: ProfileUpdateInput!): UserProfile!
    memberProfileApply: Boolean!
  }
`;

interface ICtx {
  app: MestoApp;
  user: User;
  club: Club;
  member: Member;
  canOrFail: (resource: string, action: string, obj?: any) => Promise<boolean>;
}

const resolvers = (memberProfiles: MemberProfiles) => ({
  Club: {
    memberProfileSearch: async (
      club: Club,
      { 
        query, 
        pagination = { page: 1, pageSize: 20 } 
      }: {
        query: string; 
        pagination?: { page: number; pageSize: number; }
      },
      {canOrFail}: ICtx
    ) => {
      // todo: use club & user ctx
      await canOrFail('MemberProfile', 'search');

      const items = await memberProfiles.service.searchMembers(query, pagination);
      return {
        items,
        total: items.length,
        page: pagination.page,
        pageSize: pagination.pageSize,
        hasMore: pagination.pageSize === items.length
      };
    },
    memberProfileGet: async (
      club: Club,
      { profileId }: { profileId: string },
      { canOrFail, member }: ICtx
    ) => {
      let profile;
      if (profileId === 'my') {
        profile = await memberProfiles.service.fetchMemberProfileByMemberId(member.id);
      } else {
        profile = await memberProfiles.service.getMemberProfile(profileId);
      }
      await canOrFail('MemberProfile', 'read', profile);
      return profile;
    },
    memberRoles: async (club: Club, _: any, {app, member, user, canOrFail}: ICtx) => {
      await canOrFail('MemberRole', 'index', {memberId: member.id});
      const accessService = app.engines.access.service;
      const roles = await accessService.getRolesMap({member, user, hub: club}, ['applicant', 'member', 'guest', 'rejected']);
      return roles;
    }
  },
  UserProfile: {
    userId: async (profile: MemberProfile, _: any, { app }: ICtx) => {
      if (!profile.member) {
        // Load member directly by memberId
        profile.member = await app.m.findOneBy(Member, { id: profile.memberId });
      }
      return profile.member.userId;
    },
  },
  Mutation: {
    memberProfileUpdate: async (
      _: any,
      { input }: { input: any },
      { app, member, canOrFail }: ICtx
    ) => {
      const { value: profile, isCreated } = await app.em.findOneOrInitBy(MemberProfile, {
        member: {id: member.id}
      }, {});

      await canOrFail('MemberProfile', 'update', profile);

      // Validate dates in workplaces
      if (input.workplaces) {
        input.workplaces = input.workplaces.map((workplace: any) => ({
          ...workplace,
          startDate: workplace.startDate ? new Date(workplace.startDate).toISOString().split('T')[0] : '',
          endDate: workplace.current ? '' : workplace.endDate ? new Date(workplace.endDate).toISOString().split('T')[0] : ''
        }));
      }

      // Validate years in education
      if (input.education) {
        input.education = input.education.map((edu: any) => ({
          ...edu,
          startYear: edu.startYear?.toString() || '',
          endYear: edu.endYear?.toString() || ''
        }));
      }

      Object.assign(profile, input);

      return await memberProfiles.service.updateMemberProfile(profile);
    },

    memberProfileApply: async (
      _: any,
      __: any,
      { app, member, club, user, canOrFail }: ICtx
    ) => {
      const { value: profile, isCreated } = await app.em.findOneOrInitBy(MemberProfile, {
        member: {id: member.id}
      }, {});

      await canOrFail('MemberProfile', 'update', profile);
      
      const accessService = app.engines.access.service;
      const roles = await accessService.getRolesMap({member, user, hub: club}, ['applicant', 'member', 'guest', 'rejected']);

      if (roles.member) throw new Error('Already a member');
      if (roles.applicant) throw new Error('Already applied');
      if (roles.rejected) throw new Error('Your previous application was rejected');

      await accessService.addRole({member, user, hub: club}, 'applicant');

      // const extUser = await app.m.findOneBy(UserExt, {user: {id: member.userId}, service: 'tg'});
      // await app.engines.telegram.bot.telegram.sendMessage(extUser.extId, `📝 Вы подали заявку на вступление в Место.`);

      return true;
    }
  }
});

export const memberProfilesGraphql = (memberProfiles: MemberProfiles) => ({
  typeDefs,
  resolvers: resolvers(memberProfiles),
});
