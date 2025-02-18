import App from '../App'
import User from '../models/User'
import Club from '../models/Club'
import MemberRole from '../models/MemberRole'
import {UserInClubRolesSync} from './UserInClubContext/UserInClubRolesSync'
import {In, IsNull, Not} from 'typeorm'
import {StatusCodes} from 'http-status-codes'
import mercurius from 'mercurius'
import MemberBadge from '../models/MemberBadge'
import Member from '../models/Member'
import {FindOptionsWhere} from 'typeorm/find-options/FindOptionsWhere'
import ClubApp from '../engines/AppsEngine/models/ClubApp'
import ClubRole from '../models/ClubRole'

export default class UserInClubContext {
  readonly app: App;
  readonly user: User;
  readonly club: Club;
  public member: Member;

  constructor(app: App, user: User, club: Club, opts?: {member?: Member}) {
    this.app = app;
    this.user = user;
    this.club = club;
    this.member = opts?.member;
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

  async fetchMember() {
    if (this.member) {
      return {
        isCreated: false,
        value: this.member,
      }
    }

    if (!this.user || !this.club) return { value: null, isCreated: false };

    const result = await this.app.repos.member.findOrCreate({
      user: {id: this.user.id},
      club: {id: this.club.id},
    });

    this.member = result.value;

    if (result.isCreated) {
      await this.assignDefaultRoles();
    } else {
      // ensure one of the required roles is assigned (one of default roles, @member or admin)
      const hasRequiredRole = await this.hasOneOfRoles(...this.defaultRoleNames, '@member', 'admin');
      if (!hasRequiredRole) {
        await this.assignDefaultRoles();
      }
    }

    return result;
  }

  /**
   * @deprecated
   */
  async isMember(opts?: { useCache?: boolean, forceSync?: boolean }) {
    if (!this.user) return false;

    const app = this.app;
    let userInClubRolesSync: UserInClubRolesSync;

    // check static roles

    let result = false;
    return await this.hasAnyStaticRole();
  }

  //todo: add to engine
  async hasAnyStaticRole() {
    const userClubRole = await this.app.m.findOneBy(MemberRole, {
      user: {id: this.user.id},
      club: {id: this.club.id},
      clubRole: {
        club: {id: this.club.id},
      },
      enabled: true,
    });

    return !!userClubRole;
  }

  async hasRole(role: string) {
    if (!this.user?.id || !this.club?.id) return false;

    const memberRoleCount = await this.app.m.countBy(MemberRole, {
      user: {id: this.user.id},
      club: {id: this.club.id},
      clubRole: {
        club: {id: this.club.id},
        name: role,
      },
      enabled: true,
    });

    return memberRoleCount > 0;
  }

  async hasOneOfRoles(...roles: string[]) {
    if (!this.user?.id || !this.club?.id) return false;

    const membeRoleCount = await this.app.m.countBy(MemberRole, {
      user: {id: this.user.id},
      club: {id: this.club.id},
      clubRole: {
        club: {id: this.club.id},
        name: In(roles),
      },
      enabled: true,
    });

    return membeRoleCount > 0;
  }

  async canViewMemberData(opts: {member: Member}) {
    // deny on club mismatch
    if (opts.member.clubId !== this.club.id) return false;

    if (await this.hasRole('admin')) return true;
    if (opts.member.userId === this.user.id) return true;

    return false;
  }

  async assertCanViewMemberData(opts: {member: Member}) {
    if (!await this.canViewMemberData(opts)) {
      throw new Error('Access to member data denied');
    }
  }

  async requireRole(role: string) {
    if (!await this.hasRole(role)) {
      const message = `Role ${role} is required for user#${this.user.id} in club#${this.club.id}`;
      this.app.log.warn(message, {data: this.contextModelIds});
      throw message;
    }
  }

  async requireRoleForMercurius(role: string) {
    if (!await this.hasRole(role)) {
      const message = `Role ${role} is required for user#${this.user.id} in club#${this.club.id}`;
      this.app.log.warn(message, {data: this.contextModelIds});

      throw new mercurius.ErrorWithProps('User is not authorized', {}, StatusCodes.UNAUTHORIZED);
    }
  }

  async assignDefaultRoles() {
    if (!this.user || !this.club) throw new Error('User or club is not set');

    const defaultRoleNames = this.defaultRoleNames;

    const defaultRoles = await this.app.m.find(ClubRole, {
      where: {
        club: {id: this.club.id},
        name: In(defaultRoleNames),
      },
    });

    for (const role of defaultRoles) {
      await this.app.em.createOrLazyUpdateBy(MemberRole, {
        user: {id: this.user.id},
        club: {id: this.club.id},
        member: {id: this.member.id},
        clubRole: {id: role.id},
      }, {
        enabled: true,
      });
    }
  }

  async roles() {
    if (!this.user || !this.club) return [];

    const userClubRoles = await this.app.m.find(MemberRole, {
      where: {
        user: {id: this.user.id},
        club: {id: this.club.id},
        enabled: true,
      },
      order: {id: 'DESC'},
      relations: {clubRole: true},
    });

    const roleIds = new Set<string>();

    return userClubRoles
      .map(ucr => ucr.clubRole)
      .filter(role => role && (roleIds.has(role.id) ? false : roleIds.add(role.id)));
  }

  async getMenuItems(): Promise<Array<IAppMenuItem>> {
    const clubAppsWhere: FindOptionsWhere<ClubApp> = {
      club: {id: this.club.id},
      menuIndex: Not(IsNull()),
    }

    // if (!await this.isMember({useCache: true})) {
    //   const clubApps = await this.app.m.find(ClubApp, {
    //     where: {
    //       ...clubAppsWhere,
    //       clubAppRoles: {
    //         clubRole: {
    //           name: In(['@everyone']),
    //         },
    //       }
    //     },
    //     relations: {
    //       clubAppRoles: {
    //         clubRole: true
    //       }
    //     },
    //     order: {menuIndex: 'ASC'},
    //   });
    //
    //   return clubApps.map(clubApp => {
    //     return {
    //       appSlug: clubApp.appSlug,
    //       appName: clubApp.appName,
    //       title: clubApp.title,
    //       icon: '',
    //       roles: clubApp.clubAppRoles,
    //     }
    //   })
    // }

    if (!await this.hasRole('admin')) {
      // hide not available items if not admin
      const roles = await this.roles();

      clubAppsWhere.clubAppRoles = {
        clubRole: {
          name: In([...roles.map(role => role.name), '@everyone']),
        },
      };
    }

    const clubApps = await this.app.m.find(ClubApp, {
      where: clubAppsWhere,
      relations: {
        clubAppRoles: {
          clubRole: true
        }
      },
      order: {menuIndex: 'ASC'},
    });

    return clubApps.map(clubApp => {
      return {
        appSlug: clubApp.appSlug,
        appName: clubApp.appName,
        title: clubApp.title,
        icon: '',
        roles: clubApp.clubAppRoles,
      }
    })
  }

  async getBadges() {
    return await this.app.m.find(MemberBadge, {
      where: {
        club: {id: this.club.id},
        user: {id: this.user.id},
      },
      order: {id: 'DESC'},
      relations: {
        clubBadge: true,
      },
    })
  }

  async joinDate() {
    const dates = [];

    const member = await this.app.m.findOne(Member, {
      where: {
        club: {id: this.club.id},
        user: {id: this.user.id},
      },
    });
    if (member) dates.push(member.createdAt);

    const earliestBadge = await this.app.m.findOne(MemberBadge, {
      where: {
        club: {id: this.club.id},
        user: {id: this.user.id},
      },
      order: {id: 'ASC'}
    });
    if (earliestBadge) dates.push(earliestBadge.createdAt);

    const earliestRole = await this.app.m.findOne(MemberRole, {
      where: {
        club: {id: this.club.id},
        user: {id: this.user.id},
      },
      order: {id: 'ASC'}
    });
    if (earliestRole) dates.push(earliestRole.createdAt);

    return new Date(Math.min(...dates));
  }

  get lang() {
    return this.user.lang || this.club.settings.defaultLang || this.app.Env.defaultLang;
  }

  get defaultRoleNames() {
    return this.club.settings.defaultRoles || ['@guest'];
  }
}

export interface IAppMenuItem {
  appSlug: string,
  appName: string,
  title: string,
  icon: string,
}

