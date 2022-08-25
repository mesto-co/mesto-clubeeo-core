import App from '../App'
import Club from '../models/Club'
import Wallet from '../models/Wallet'
import User from '../models/User'
import {AuthContext} from '../contexts/AuthContext'
import UserClubRole from '../models/UserClubRole'
import ClubRoleToken from '../models/ClubRoleToken'
import TokenContract from '../models/TokenContract'
import ClubRole from '../models/ClubRole'
import assert from 'assert'
import {UserInClubRolesSync} from '../contexts/UserInClubContext/UserInClubRolesSync'
import DiscordApp from '../clubApps/DiscordApp/DiscordApp'
import UserExt from '../models/UserExt'
import ClubExt from '../models/ClubExt'
import ClubApp from '../models/ClubApp'
import {ExtService} from '../lib/enums'
import {timeout} from '../api/auth/authRoutes'

interface ICtx {
  auth: {
    ctx: AuthContext
  },
}

export const graphqlResolvers = (app: App) => ({
  Query: {
    clubs: async (_, obj, ctx: ICtx) => {
      console.log(await ctx.auth.ctx.getUser());
      const user = await ctx.auth.ctx.getUser();

      const clubs = await app.m.find(Club, {
        where: {
          userClubRoles: {
            user: {id: user.id}
          }
        },
        order: {id: 'DESC'}
      });
      return clubs;
    },
    club: async (_, obj, ctx: ICtx, info) => {
      console.log(await ctx.auth.ctx.getUser());

      const { slug } = obj;
      return await app.m.findOneOrFail(Club, {
        where: {slug},
        relations: {
          userClubRoles: {
            user: true,
            clubRoleToken: true
          }
        }
      });
    },
    users: async (_, obj) => {
      const users = await app.m.find(User, {order: {id: 'DESC'}});
      return users;
    },
    userClubRoles: async (_, obj) => {
      return await app.m.find(UserClubRole, {
        order: {id: 'DESC'},
      });
    },
    wallets: async (_, obj) => {
      const wallets = await app.m.find(Wallet, {order: {id: 'DESC'}});
      return wallets;
    },
  },
  Club: {
    users: async (parent: Club, args, {client, reply}) => {
      const userClubRoles = await app.m.find(UserClubRole, {
        where: {club: {id: parent.id}},
        relations: {
          user: true,
          clubRoleToken: true
        }
      });

      const ids = new Set<number>();
      return userClubRoles
        .filter(ucr => ucr.enabled)
        .map(ucr => ucr.user)
        .filter(u => ids.has(u.id) ? false : ids.add(u.id));
    },
    meInClub: async (club: Club, args, ctx: ICtx) => {
      try {
        const user = await ctx.auth.ctx.getUser();
        if (!user) {
          return {
            loggedIn: false,
            screenName: '',
            mainWallet: {},
            isMember: false,
            isAdmin: false,
            isPlatformAdmin: false,
          }
        }
        const userCtx = app.contexts.user(user);
        const userInClub = app.contexts.userInClub(user, club);

        return {
          loggedIn: !!user,
          screenName: user.screenName || `id${user.id}`,
          mainWallet: await app.m.findOneBy(Wallet, {user: {id: user.id}}),
          isMember: await userInClub.isMember({useCache: true}),
          isAdmin: await userInClub.hasRole('admin'),
          isPlatformAdmin: await userCtx.isPlatformAdmin(),
        }
      } catch (e) {
        console.log(e)
        app.log.error(e.message, {data: {error: e.toString()}})
      }
    },
    // userInClub: async (club: Club, args, ctx: ICtx) => {
    //   const user = await ctx.auth.ctx.getUser();

      // const userCtx = app.contexts.user(user);
      // const userInClub = app.contexts.userInClub(user, club);
      //
      // return {
      //   loggedIn: !!user,
      //   isMember: await userInClub.isMember({useCache: true}),
      //   isAdmin: await userInClub.hasRole('admin'),
      //   isPlatformAdmin: await userCtx.isPlatformAdmin(),
      // }
    // },
  },
  ClubRoleToken: {
    tokenContract: async (parent: ClubRoleToken, args, {client, reply}) => {
      return await app.m.findOneBy(TokenContract, {
        id: parent.tokenContractId,
      });
    },
    clubRole: async (parent: ClubRoleToken, args, {client, reply}) => {
      return await app.m.findOneBy(ClubRole, {
        id: parent.clubRoleId,
      });
    },
  },
  User: {
    wallets: async (user: User, args, {client, reply}) => {
      return await app.m.find(Wallet, {
        where: {user: {id: user.id}},
      });
    },
    rolesInClub: async (user: User, obj, ctx: ICtx, info) => {
      const { slug } = obj;
      const userClubRoles = await app.m.find(UserClubRole, {
        where: {
          club: {slug},
          user: {id: user.id},
          enabled: true,
        },
        relations: {
          clubRole: true,
          clubRoleToken: {
            clubRole: true
          }
        }
      });

      return userClubRoles;
    },
  },
  Wallet: {
    chainNorm: (wallet: Wallet, args, {client, reply}) => {
      return {
        eth: 'ethereum',
        near: 'NEAR',
        near_testnet: 'NEAR testnet',
        near_betanet: 'NEAR betanet',
      }[wallet.chain] || wallet.chain.replace('_', ' ')
    },
  },
  Mutation: {
    createClub: async (_, { id, input }, ctx: ICtx) => {
      const user = await ctx.auth.ctx.getUser();

      const club = app.m.create(Club, {
        name: input.name,
        slug: input.slug,
        description: input.description,
        socialLinks: input.socialLinks,
        user: {id: user.id}
      });
      await app.m.save(club);

      const userInClub = await ctx.auth.ctx.userInClubContext(club);
      await userInClub.setRoleByName('admin', {createRoleIfNotExists: true});

      return club;
    },
    saveClub: async (_, { id, input }, ctx: ICtx) => {
      const club = await app.m.findOneByOrFail(Club, {id});
      const userInClub = await ctx.auth.ctx.userInClubContext(club);
      assert(await userInClub.hasRole('admin'), '"admin" role is required')

      // Object.assign(club, data);
      club.name = input.name;
      club.description = input.description;
      club.socialLinks = input.socialLinks;
      await app.m.save(club);
      return club;
    },
    syncUserClub: async (_, { clubId, userId }, ctx: ICtx) => {
      const club = await app.m.findOneByOrFail(Club, {id: clubId});
      const user = await app.m.findOneByOrFail(User, {id: userId});

      const userInClubRolesSync = new UserInClubRolesSync(app, user, club);
      return await userInClubRolesSync.roleSync();
    },
    syncUserClubDiscord: async (_, { clubId, userId }, ctx: ICtx) => {
      const club = await app.m.findOneByOrFail(Club, {id: clubId});
      const user = await app.m.findOneByOrFail(User, {id: userId});

      const userInClubContext = app.contexts.userInClub(user, club);
      const isMember = await userInClubContext.isMember();

      const discordApp = new DiscordApp({app});

      const clubExt = await app.m.findOneBy(ClubExt, {
        club: {id: club.id},
        service: ExtService.discord,
      })

      const userExt = await app.m.findOneBy(UserExt, {
        user: {id: user.id},
        service: ExtService.discord,
        enabled: true,
      });

      let isChanged: Boolean;
      if (isMember) {
        const roles = await userInClubContext.roles();
        for (let role of roles) {
          isChanged = await discordApp.enableUser({
            userExt,
            clubExt,
            role: role.name,
          });
        }

        // fallback
        if (roles.length === 0) {
          isChanged = await discordApp.enableUser({
            userExt,
            clubExt,
          });

          app.log.warn(`user is a member, but don't have certain roles: fallback to syncing "holder" role to Discord`)
        }
      } else {
        isChanged = await discordApp.disableUser({
          userExt,
          clubExt,
        });
      }

      return isChanged;
    },
  }
});


// const requireRoleByClubId = async (ctx: ICtx, role: string, clubId: number) => {
//   const user = await ctx.auth.ctx.getUser();
//   const club = await app.m.findOneByOrFail(Club, {id});
//   const userInClub = app.contexts.userInClub(user, club);
//   assert(await userInClub.hasRole('admin'), '"admin" role is required')
// });


// https://wanjohi.vercel.app/2021/04/30/Solving-GraphQL-N-1-problem-in-fastify-with-loaders-and-conditional-queries/
