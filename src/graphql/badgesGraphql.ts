import App from '../App'
import {forbiddenError, ICtx} from './graphqlCommon'
import ClubBadge from '../models/ClubBadge'
import User from '../models/User'
import Club from '../models/Club'
import ClubRole from '../models/ClubRole'

export const clubBadgeType = `
type ClubBadge {
  id: ID!
  name: String!
  slug: String!
  badgeType: String!
  img: String!
  membersCount: Int!
}`

export const badgeMutationsSchema
  = `
createBadge(clubId: ID!, badgeName: String!, badgeType: String!, slug: String!, img: String!): CreateBadgeResult!
grantBadge(badgeId: ID!, userId: ID!): Boolean!`

export const badgesMutationsTypes
  = `
type CreateBadgeResult {
  badge: ClubBadge!
  isCreated: Boolean!
}`

export const clubBadgesResolvers = (app: App) => {
  return {
    badges: async (parent: Club, args, ctx: ICtx) => {
      const user = await ctx.auth.ctx.getUser();
      await app.contexts.userInClub(user, parent).requireRoleForMercurius('admin');

      return await app.m.find(ClubBadge, {
        where: {club: {id: parent.id}},
        order: {id: 'ASC'},
      });
    }
  }
}

export const badgeMutations = (app: App) => {
  return {
    createBadge: async (_, {clubId, badgeName, badgeType, slug, img}, ctx: ICtx) => {
      const authUser = await ctx.auth.ctx.getUser();

      const club = await app.m.findOneByOrFail(Club, {id: clubId});

      if (!await app.engines.accessEngine.userCanCreate(ClubBadge, {
        by: authUser, club,
      })) throw forbiddenError();

      const result = await app.engines.badgeEngine
        .createBadgeIfNotExists(club, {name: badgeName, badgeType, slug, img});

      return {
        badge: result.value,
        isCreated: result.isCreated,
      };
    },
    grantBadge: async (_, {userId, badgeId}, ctx: ICtx) => {
      const authUser = await ctx.auth.ctx.getUser();

      const badge = await app.m.findOneByOrFail(ClubBadge, {id: badgeId});
      const user = await app.m.findOneByOrFail(User, {id: userId});

      if (!await app.engines.accessEngine.userCanGrant(ClubBadge, {
        what: badge, by: authUser, to: user, club: {id: badge.clubId},
      })) throw forbiddenError();

      const result = await app.engines.badgeEngine.grantBadgeToUser(user, badge);
      return result.isCreated;
    },
  }
}
