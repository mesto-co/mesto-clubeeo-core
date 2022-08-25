import App from '../App'
import User from '../models/User'
import Club from '../models/Club'
import UserClubRole from '../models/UserClubRole'
import {UserInClubRolesSync} from './UserInClubContext/UserInClubRolesSync'
import WalletCachedServiceService from '../services/WalletCachedService'
import ClubApp from '../models/ClubApp'
import {In, IsNull, Not} from 'typeorm'
import ClubRole from '../models/ClubRole'

export default class UserInClubContext {
  readonly app: App;
  readonly user: User;
  readonly club: Club;

  constructor(app: App, user: User, club: Club) {
    this.app = app;
    this.user = user;
    this.club = club;
  }

  get contextModels() {
    return {
      user: this.user,
      club: this.club,
    }
  }

  get contextModelIds() {
    return {
      user: {id: this.user.id},
      club: {id: this.club.id},
    }
  }

  get clubContext() {
    return this.app.contexts.club(this.club);
  }

  get userContext() {
    return this.app.contexts.user(this.user);
  }

  // async refreshTokens() {
  //   if (!this.user) return false;
  //
  //   const app = this.app;
  //   const clubRoleTokens = await this.app.repos
  //     .clubRoleToken.findByClubWithTokenContract(this.club);
  //
  //
  // }

  async isMember(opts?: {useCache?: boolean}) {
    if (!this.user) return false;

    const app = this.app;
    let userInClubRolesSync: UserInClubRolesSync;

    if (opts?.useCache) {
      const cachedWalletService = new WalletCachedServiceService(app);

      userInClubRolesSync = new UserInClubRolesSync({
        m: app.m,
        WalletService: cachedWalletService,
        log: app.log,
        repos: app.repos,
      }, this.user, this.club);

      return await userInClubRolesSync.roleSync();
    } else {
      userInClubRolesSync = new UserInClubRolesSync(app, this.user, this.club);
    }

    return await userInClubRolesSync.roleSync();
  }

  async hasRole(role: string) {
    const userClubRole = await this.app.m.findOneBy(UserClubRole, {
      user: {id: this.user.id},
      club: {id: this.club.id},
      clubRole: {
        club: {id: this.club.id},
        name: role,
      }
    });

    return !!userClubRole;
  }

  async requireRole(role: string) {
    if (!await this.hasRole(role)) {
      const message = `Role ${role} is required for user#${this.user.id} in club#${this.club.id}`;
      this.app.log.warn(message, {data: this.contextModelIds});
      throw message;
    }
  }

  async setRoleByName(roleName: string, opt?: {createRoleIfNotExists: boolean}) {
    let role = await this.app.m.findOneBy(ClubRole, {
      name: roleName,
      club: {id: this.club.id}
    });

    if (!role) {
      if (opt.createRoleIfNotExists) {
        role = this.app.m.create(ClubRole, {
          name: roleName,
          club: {id: this.club.id},
        });
        await this.app.m.save(role);
      } else {
        throw `Role ${roleName} is not found for club ${this.club.slug} #${this.club.id}`;
      }
    }

    let userClubRole = await this.app.m.findOneBy(UserClubRole, {
      clubRole: {id: role.id},
      user: {id: this.user.id},
      club: {id: this.club.id},
    });

    if (userClubRole) {
      if (!userClubRole.enabled) {
        userClubRole.enabled = true;
        await this.app.m.save(userClubRole);
      }
    } else {
      userClubRole = this.app.m.create(UserClubRole, {
        clubRole: {id: role.id},
        user: {id: this.user.id},
        club: {id: this.club.id},
        enabled: true,
      });
      await this.app.m.save(userClubRole);
    }

    return true;
  }

  async roles() {
    const userClubRoles = await this.app.m.find(UserClubRole, {
      where: {
        user: {id: this.user.id},
        club: {id: this.club.id},
        enabled: true,
      },
      relations: {clubRole: true, clubRoleToken: {clubRole: true}}
    });

    const roleIds = new Set<number>();

    return userClubRoles
      .map(ucr => ucr.clubRole || ucr.clubRoleToken?.clubRole)
      .filter(role => role && (roleIds.has(role.id) ? false : roleIds.add(role.id)));
  }
}
