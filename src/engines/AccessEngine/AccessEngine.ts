import App from '../../App'
import User from '../../models/User'
import Club from '../../models/Club'
import UserClubRole from '../../models/UserClubRole'
import ClubApp from '../../models/ClubApp'
import ClubRole from '../../models/ClubRole'
import ClubRoleToken from '../../models/ClubRoleToken'

export class AccessEngine {
  readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  async isMember(user: User, club: Club) {
    return await this.app.m.countBy(UserClubRole, {
      enabled: true,
      user: {id: user.id},
      club: {id: club.id},
    }) > 0;
  }

  async hasAccessToApp(user: User, clubApp: ClubApp) {

    //todo: get rig of first request

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
