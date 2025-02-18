import ClubRole from "../../models/ClubRole";
import { AppMemberContext } from "./AppMemberContext";
import { TExeContainer } from "../../core/exeInterfaces";

interface IMember {
  id: string,
  clubId: string,
}

interface IClubApp {
  id: string,
  clubId: string,
}

/**
 * AppsService - contains the business logic for the AppsEngine.
 */
export class AppsService<T extends TExeContainer> {
  constructor(public c: T) {
  }

  memberCtx(member: IMember, clubApp: IClubApp) {
    return new AppMemberContext(this, member, clubApp);
  }

  async can(
    member: IMember,
    clubApp: IClubApp,
    accessTo: string,
  ) {
    if (!member?.clubId) throw new Error('Member has no clubId');
    if (!clubApp?.clubId) throw new Error('ClubApp has no clubId');

    if (member.clubId !== clubApp.clubId) {
      this.c.logger.error('Member and ClubApp are from different clubs');
      return false;
    }

    const everyoneHasAccess = await this.c.m.countBy(ClubRole, [
      {
        club: {id: clubApp.clubId},
        name: '@everyone',
        clubAppRoles: {
          clubApp: {id: clubApp.id},
          accessTo,
        }
      },
      {
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
      }
    ]);

    if (everyoneHasAccess > 0) {
      return true;
    }

    if (await this.c.engines.access.isMemberAdmin(member, {id: clubApp.clubId})) {
      return true;
    }

    return false;
  }

}