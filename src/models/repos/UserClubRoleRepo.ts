import {BaseService} from '../../services/BaseService'
import ClubRoleToken from '../ClubRoleToken'
import UserClubRole from '../UserClubRole'
import User from '../User'
import Club from '../Club'
import {Equal} from 'typeorm'

export default class UserClubRoleRepo extends BaseService {
  async findOrCreate(data: {
    user: User,
    club: Club,
    clubRoleToken: ClubRoleToken,
    enabled: boolean,
  }) {
    let userClubRole: UserClubRole = await this.app.m.findOneBy(UserClubRole, {
      user: {id: data.user.id},
      club: {id: data.club.id},
      clubRoleToken: {id: data.clubRoleToken.id},
    });

    if (!userClubRole) {
      userClubRole = this.app.m.create(UserClubRole, {...data});
      await this.app.m.save(userClubRole);
    } else {
      if (data.enabled !== userClubRole.enabled) {
        userClubRole.enabled = data.enabled;
        await this.app.m.save(userClubRole);
      }
    }

    return userClubRole;
  }
}
