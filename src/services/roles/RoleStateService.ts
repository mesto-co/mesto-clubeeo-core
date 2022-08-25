import App from '../../App'
import User from '../../models/User'
import Club from '../../models/Club'
import ClubRole from '../../models/ClubRole'
import assert from 'assert'
import ClubRoleToken from '../../models/ClubRoleToken'

export class RoleStateService {
  readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  async setUserClubRole(user: User, club: Club, roleValue: string | ClubRole) {
    assert(user.id, 'User is required');
    assert(club.id, 'Club is required');

    let role: ClubRole;
    if (typeof roleValue === 'string') {
      role = await this.app.m.findOneByOrFail(ClubRole, {
        club: {id: club.id},
        name: roleValue
      })
    } else {
      assert(roleValue.clubId === club.id, "Role doesn't match club");
    }

    //...
  }

  async setUserClubRoleToken(user: User, club: Club, clubRoleToken: ClubRoleToken) {
    assert(user.id, 'User is required');
    assert(club.id, 'Club is required');
    assert(clubRoleToken.id, 'ClubRoleToken is required');

    //...
  }
}
