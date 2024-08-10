import App from '../App'
import Club from '../models/Club'
import Wallet from '../models/Wallet'
import User from '../models/User'
import MemberRole from '../models/MemberRole'
import ClubRoleToken from '../models/ClubRoleToken'
import TokenContract from '../models/TokenContract'
import ClubRole from '../models/ClubRole'
import assert from 'assert'
import {UserInClubRolesSync} from '../contexts/UserInClubContext/UserInClubRolesSync'
import UserExt from '../models/UserExt'
import ClubExt from '../models/ClubExt'
import {ExtService} from '../lib/enums'
import mercurius from 'mercurius'
import ErrorWithProps = mercurius.ErrorWithProps
import {StatusCodes} from 'http-status-codes'
import {ICtx} from './graphqlCommon'
import {badgeMutations, clubBadgesResolvers} from './badgesGraphql'
import {clubRolesResolvers, rolesMutations} from './rolesGraphql'
import MemberBadge from '../models/MemberBadge'
import ClubApp from '../engines/AppsEngine/models/ClubApp'

export const graphqlResolvers = (app: App) => ({
  Query: {
    clubs: async (_, obj, ctx: ICtx) => {
      const user = await ctx.auth.ctx.getUser();
      if (!user) throw new ErrorWithProps('User is not authorized', {}, StatusCodes.UNAUTHORIZED);

      const clubs = await app.m.find(Club, {
        where: {
          userClubRoles: {
            user: {id: user.id},
            enabled: true,
          },
        },
        order: {id: 'ASC'},
      });

      return clubs;
    },
    club: async (_, obj, ctx: ICtx, info) => {
      const {slug} = obj;
      return await app.m.findOneOrFail(Club, {
        where: {slug},
        relations: {
          userClubRoles: {
            user: true,
            clubRoleToken: true,
          },
        },
      });
    },
    clubApp: async (_, obj, ctx: ICtx, info) => {
      const user = await ctx.auth.ctx.getUserOrFail();

      const {appSlug} = obj;
      const clubApp = await app.m.findOneOrFail(ClubApp, {
        where: {appSlug},
      });

      await app.engines.accessEngine.userHasAccessToApp(user, clubApp);
    },
    me: async (_, obj, ctx: ICtx) => {
      const user = await ctx.auth.ctx.getUser();

      return {
        loggedIn: !!user,
      };
    },
    users: async (_, obj) => {
      const users = await app.m.find(User, {order: {id: 'DESC'}});
      return users;
    },
    userClubRoles: async (_, obj) => {
      return await app.m.find(MemberRole, {
        order: {id: 'DESC'},
      });
    },
    wallets: async (_, obj) => {
      const wallets = await app.m.find(Wallet, {order: {id: 'DESC'}});
      return wallets;
    },
  },
  Club: {
    users: async (parent: Club, args, ctx: ICtx) => {
      const user = await ctx.auth.ctx.getUser();
      await app.contexts.userInClub(user, parent).requireRoleForMercurius('admin');

      return await app.repos.user.search(parent, args);
    },
    meInClub: async (club: Club, args, ctx: ICtx) => {
      try {
        const user = await ctx.auth.ctx.getUser();
        const userInClub = app.contexts.userInClub(user, club);
        if (!user) {
          return {
            loggedIn: false,
            screenName: '',
            mainWallet: {},
            isMember: false,
            isAdmin: false,
            isPlatformAdmin: false,
            menu: {
              items: await userInClub.getMenuItems(),
            },
          }
        }
        const userCtx = app.contexts.user(user);

        const isAdmin = await userInClub.hasRole('admin');
        const isPlatformAdmin = await userCtx.isPlatformAdmin();

        return {
          loggedIn: !!user,
          screenName: user.screenName || `id${user.id}`,
          // mainWallet: await app.m.findOneBy(Wallet, {user: {id: user.id}}),
          isMember: await userInClub.isMember({useCache: true}),
          isAdmin,
          isPlatformAdmin,
          isPremium: Boolean(club.settings['isPremium']),
          // roles: await userInClub.roles(),
          menu: {
            items: await userInClub.getMenuItems(),
          },
        }
      } catch (e) {
        console.log(e)
        app.log.error(e.message, {data: {error: e.toString()}})
      }
    },
    ...clubRolesResolvers(app),
    ...clubBadgesResolvers(app),
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
  ClubRole: {
    membersCount: async (parent: ClubRole, obj, ctx: ICtx, info) => {
      const staticCount = await app.m.countBy(MemberRole, {
        enabled: true,
        clubRole: {id: parent.id},
      });

      const dynamicCount = await app.m.countBy(MemberRole, {
        enabled: true,
        clubRoleToken: {
          clubRole: {id: parent.id},
        },
      });

      return staticCount + dynamicCount;
    },
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
  ClubBadge: {
    membersCount: async (parent: ClubRole, obj, ctx: ICtx, info) => {
      const count = await app.m.countBy(MemberBadge, {
        clubBadge: {id: parent.id},
      });

      return count;
    },
  },
  User: {
    wallets: async (user: User, args, {client, reply}) => {
      return await app.m.find(Wallet, {
        where: {user: {id: user.id}},
      });
    },
    memberInClub: async (user: User, obj, ctx: ICtx, info) => {
      const {slug} = obj;

      const club = await app.m.findOneByOrFail(Club, {
        slug,
      });

      const {value: member} = await app.repos.member.findOrCreate({
        club: {id: club.id},
        user: {id: user.id},
      });

      return member;
    },
    rolesInClub: async (user: User, obj, ctx: ICtx, info) => {
      const {slug} = obj;
      const userClubRoles = await app.m.find(MemberRole, {
        where: {
          club: {slug},
          user: {id: user.id},
          enabled: true,
        },
        relations: {
          clubRole: true,
          clubRoleToken: {
            clubRole: true,
          },
        },
      });

      return userClubRoles;
    },
  },
  UserExt: {
    getAccount: async (userExt: UserExt, args, {client, reply}) => {
      if (userExt.service === ExtService.tg) {
        const name = userExt.data['from']?.['username'] || '';
        return {
          link: name ? `https://t.me/${name}` : '',
          name
        }
      }
    }
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
    createClub: async (_, {id, input}, ctx: ICtx) => {
      const user = await ctx.auth.ctx.getUser();

      const club = app.m.create(Club, {
        name: input.name,
        slug: input.slug,
        description: input.description,
        socialLinks: input.socialLinks,
        user: {id: user.id},
      });
      await app.m.save(club);

      await app.contexts.userInClub(user, club).fetchMember();

      await app.engines.roleEngine.grantRoleToUserBySlug(user, club, 'admin', {createIfNotExists: true});

      await app.contexts.user(user).setActiveClub(club);

      return club;
    },
    saveClub: async (_, {id, input}, ctx: ICtx) => {
      const club = await app.m.findOneByOrFail(Club, {id});
      const userInClub = await ctx.auth.ctx.userInClubContext(club);
      assert(await userInClub.hasRole('admin'), '"admin" role is required')

      // Object.assign(club, data);
      club.name = input.name;
      club.description = input.description;
      club.socialLinks = input.socialLinks;
      if (input.heroImg) club.style.heroImg = input.heroImg;
      if (input.logoImg) club.style.logoImg = input.logoImg;

      if (input.roadmap) {
        // if (!club.roadmap.entries) club.roadmap.entries = [];
        club.roadmap = input.roadmap;
      }

      await app.m.save(club);
      return club;
    },
    syncUserClub: async (_, {clubId, userId}, ctx: ICtx) => {
      const club = await app.m.findOneByOrFail(Club, {id: clubId});
      const user = await app.m.findOneByOrFail(User, {id: userId});

      const userInClubRolesSync = new UserInClubRolesSync(app, user, club);
      return await userInClubRolesSync.roleSync();
    },

    ...badgeMutations(app),
    ...rolesMutations(app),
  },
});


// const requireRoleByClubId = async (ctx: ICtx, role: string, clubId: string) => {
//   const user = await ctx.auth.ctx.getUser();
//   const club = await app.m.findOneByOrFail(Club, {id});
//   const userInClub = app.contexts.userInClub(user, club);
//   assert(await userInClub.hasRole('admin'), '"admin" role is required')
// });


// https://wanjohi.vercel.app/2021/04/30/Solving-GraphQL-N-1-problem-in-fastify-with-loaders-and-conditional-queries/
