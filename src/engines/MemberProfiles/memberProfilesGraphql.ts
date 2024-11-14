import { gql } from 'graphql-tag';
import { MemberProfiles } from './MemberProfiles';
import { MestoApp } from '../../App';
import { Club, Member } from 'clubeeo-core';
import MemberProfile from './models/MemberProfile';
// import { AuthContext } from 'clubeeo-core';

const typeDefs = gql`
  type Project {
    name: String!
    link: String!
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

  type Workplace {
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

  type UserProfile {
    id: ID!
    memberId: String!
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
  }  

  # type Mutation {
  #   updateUserProfile(id: ID!, name: String!, age: Int): UserProfile
  # }
`;

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
      {canOrFail}: {app: MestoApp, canOrFail: (resource: string, action: string) => Promise<boolean>}
    ) => {
      // todo: use club & user ctx
      await canOrFail('MemberProfile', 'search');

      const items = await memberProfiles.service.searchMembers(query, pagination);
      return {
        items,
        total: items.length,
        page: pagination.page,
        pageSize: pagination.pageSize,
        hasMore: (pagination.page * pagination.pageSize) < items.length
      };
    },
    memberProfileGet: async (
      club: Club,
      { profileId }: { profileId: string },
      { app, canOrFail }: { app: MestoApp, canOrFail: (resource: string, action: string) => Promise<boolean> }
    ) => {
      await canOrFail('MemberProfile', 'read');
      return await app.m.findOneByOrFail(MemberProfile, { id: profileId });
    },
  },
  // Mutation: {
  //   updateUserProfile: async (_: any, { id, name, age }: { id: string; name: string; age: number }) => {
  //     // Update and return user profile
  //   },
  // },
});

export const memberProfilesGraphql = (memberProfiles: MemberProfiles) => ({
  typeDefs,
  resolvers: resolvers(memberProfiles),
});
