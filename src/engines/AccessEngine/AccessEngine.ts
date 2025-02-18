import {MestoApp as App} from '../../App'
import User from '../../models/User'
import Club from '../../models/Club'
import MemberRole from '../../models/MemberRole'
import ClubRole from '../../models/ClubRole'
import {IEntityId} from '../../lib/common'
import {EntityTarget} from 'typeorm/common/EntityTarget'
import ClubApp from '../AppsEngine/models/ClubApp'
import Member from '../../models/Member'
import { EngineBase } from '../../core/lib/EngineBase';
import { AccessService } from './AccessService'

export class AccessEngine extends EngineBase {
  readonly app: App;
  readonly service: AccessService<App>;

  constructor(c: App) {
    super();

    this.app = c;
    this.service = new AccessService(c);
  }

  //todo: implement member-based methods

  /**
   * 
   * @deprecated use .service
   */
  async memberHasRole(member: Member, club: Club| IEntityId, roleSlug: string) {
    const user = await this.app.m.findOneBy(User, {id: member.userId});
    return this.service.memberHasRole(member, user, club, roleSlug);
  }

  /**
   * 
   * @deprecated use .service with role
   */
  async isMemberAdmin(member: Member, club: Club| IEntityId) {
    return this.memberHasRole(member, club, 'admin');
  }

  /**
   * @deprecated use method in AppsEngine
   */
  async memberHasAccessToAppObject(
    member: Member,
    clubApp: ClubApp,
    accessTo: string,
  ) {
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

  /**
   * @deprecated use method in AppsEngine
   */
  async memberHasAccessToAppPage(
    member: Member,
    clubApp: ClubApp,
    appPageName: string,
  ) {
    const accessTo = `page:${appPageName}`;
    return await this.memberHasAccessToAppObject(member, clubApp, accessTo);
  }

  /**
   * @deprecated use method in AppsEngine
   */
  async memberHasAccessToAppAction(
    member: Member,
    clubApp: ClubApp,
    appActionName: string,
  ) {
    const accessTo = `action:${appActionName}`;
    return await this.memberHasAccessToAppObject(member, clubApp, accessTo);
  }

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
