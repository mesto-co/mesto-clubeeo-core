import App from '../App'
import {forbiddenError, ICtx} from './graphqlCommon'
import ClubBadge from '../models/ClubBadge'
import User from '../models/User'
import Club from '../models/Club'
import ClubRole from '../models/ClubRole'

export const clubRoleType = `
type ClubRole {
  id: ID!
  name: String!
  membersCount: Int!
}`

export const rolesMutationsSchema
  = `
createRole(clubId: ID!, roleName: String!): CreateRoleResult!`

export const rolesMutationsTypes
  = `
type CreateRoleResult {
  role: ClubRole!
  isCreated: Boolean!
}`

export const clubRolesResolvers = (app: App) => {
  return {
    roles: async (parent: Club, args, ctx: ICtx) => {
      const user = await ctx.auth.ctx.getUser();
      await app.contexts.userInClub(user, parent).requireRoleForMercurius('admin');

      return await app.m.find(ClubRole, {
        where: {club: {id: parent.id}},
        order: {id: 'ASC'},
      });
    },
  }
}

export const rolesMutations = (app: App) => {
  return {
    createRole: async (_, {clubId, roleName}, ctx: ICtx) => {
      const authUser = await ctx.auth.ctx.getUser();

      const club = await app.m.findOneByOrFail(Club, {id: clubId});

      if (!await app.engines.accessEngine.userCanCreate(ClubRole, {
        by: authUser, club,
      })) throw forbiddenError();

      const result = await app.engines.roleEngine.createRoleIfNotExists(club, roleName);

      return {
        role: result.value,
        isCreated: result.isCreated,
      };
    }
  }
}
