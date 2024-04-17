import App from '../../App'
import User from '../../models/User'
import Club from '../../models/Club'
import MemberRole from '../../models/MemberRole'
import ClubRole from '../../models/ClubRole'
import {IEntityId} from '../../lib/common'
import {EntityTarget} from 'typeorm/common/EntityTarget'
import ClubApp from '../AppEngine/models/ClubApp'
import Member from '../../models/Member'
import {appRegistry} from '../AppEngine/AppRegistry'

export class AccessEngine {
  readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  //todo: implement member-based methods

  async memberHasRole(member: Member | IEntityId, club: Club| IEntityId, roleSlug: string) {
    if (!member || !club) return false;

    const memberRole = await this.app.m.findOneBy(MemberRole, {
      member: {id: member.id},
      club: {id: club.id},
      clubRole: {
        club: {id: club.id},
        name: roleSlug,
      },
      enabled: true,
    });

    return !!memberRole;
  }

  async isMemberAdmin(member: Member | IEntityId, club: Club| IEntityId) {
    return this.memberHasRole(member, club, 'admin');
  }

  async memberHasAccessToAppObject(
    member: Member,
    clubApp: ClubApp,
    accessTo: string,
  ) {
    // todo: use @everyone role
    if (clubApp.appName === 'eth-wallet') {
      return true;
    }

    const everyoneHasAccess = await this.app.m.countBy(ClubRole, {
      club: {id: clubApp.clubId},
      name: '@everyone',
      clubAppRoles: {
        clubApp: {id: clubApp.id},
        accessTo,
      }
    }) > 0;
    if (everyoneHasAccess) return true;

    if (await this.isMemberAdmin(member, {id: clubApp.clubId})) return true;

    return await this.app.m.countBy(ClubRole, {
      club: {id: clubApp.clubId},
      clubAppRoles: {
        clubApp: {id: clubApp.id},
        accessTo,
      },
      userClubRoles: {
        club: {id: clubApp.clubId},
        member: {id: member.id},
        enabled: true,
      },
    }) > 0;
  }

  async memberHasAccessToAppPage(
    member: Member,
    clubApp: ClubApp,
    appPageName: string,
  ) {
    const accessTo = `page:${appPageName}`;
    return await this.memberHasAccessToAppObject(member, clubApp, accessTo);
  }

  async memberHasAccessToAppAction(
    member: Member,
    clubApp: ClubApp,
    appActionName: string,
  ) {
    const accessTo = `action:${appActionName}`;
    return await this.memberHasAccessToAppObject(member, clubApp, accessTo);
  }

  // async memberHasAccessToApp(member: Member, clubApp: ClubApp) {
  //   if (await this.isMemberAdmin(member, {id: clubApp.clubId})) {
  //     return true;
  //   }
  //
  //   // todo: use @everyone role
  //   if (clubApp.appName === 'eth-wallet') {
  //     return true;
  //   }
  //
  //   return await this.app.m.countBy(ClubRole, {
  //     club: {id: clubApp.clubId},
  //     clubAppRoles: {
  //       clubApp: {id: clubApp.id},
  //     },
  //     userClubRoles: {
  //       club: {id: clubApp.clubId},
  //       member: {id: member.id},
  //       enabled: true,
  //     },
  //   }) > 0;
  // }

  /**
   * @deprecated use member instead of user
   */
  async userIsMember(user: User, club: Club) {
    return await this.app.m.countBy(MemberRole, {
      enabled: true,
      user: {id: user.id},
      club: {id: club.id},
    }) > 0;
  }

  // async canGrantBadge() {
  //
  // }

  /**
   * @deprecated use member instead of user
   */
  async userHasStaticRole(user: User | IEntityId, club: Club| IEntityId, roleSlug: string) {
    if (!user || !club) return false;

    const userClubRole = await this.app.m.findOneBy(MemberRole, {
      user: {id: user.id},
      club: {id: club.id},
      clubRole: {
        club: {id: club.id},
        name: roleSlug,
      },
      enabled: true,
    });

    return !!userClubRole;
  }

  /**
   * @deprecated use member instead of user
   */
  async isUserAdmin(user: User| IEntityId, club: Club| IEntityId) {
    return this.userHasStaticRole(user, club, 'admin');
  }

  /**
   * @deprecated use member instead of user
   */
  async userCanGrant<T>(target: EntityTarget<T>, opts: {by: User| IEntityId, to: User| IEntityId, club: Club| IEntityId, what: T}) {
    if (await this.isUserAdmin(opts.by, opts.club)) return true;

    return false;
  }

  /**
   * @deprecated use member instead of user
   */
  async userCanCreate<T>(target: EntityTarget<T>, opts: {by: User| IEntityId, club: Club| IEntityId}) {
    if (await this.isUserAdmin(opts.by, opts.club)) return true;

    return false;
  }

  /**
   * @deprecated use member instead of user
   */
  async userHasAccessToApp(user: User, clubApp: ClubApp) {
    if (await this.isUserAdmin(user, {id: clubApp.clubId})) {
      return true;
    }
    //todo: get rid of first request

    if (clubApp.appName === 'eth-wallet') {
      return true;
    }

    const clubRoleTokenCount = await this.app.m.countBy(ClubRole, {
      club: {id: clubApp.clubId},
      clubAppRoles: {
        clubApp: {id: clubApp.id},
      },
      clubRoleTokens: {
        userClubRoles: {
          club: {id: clubApp.clubId},
          user: {id: user.id},
          enabled: true,
        },
      },
    });

    if (clubRoleTokenCount > 0) return true;

    return await this.app.m.countBy(ClubRole, {
      club: {id: clubApp.clubId},
      clubAppRoles: {
        clubApp: {id: clubApp.id},
      },
      userClubRoles: {
        club: {id: clubApp.clubId},
        user: {id: user.id},
        enabled: true,
      },
    }) > 0;
  }

}
