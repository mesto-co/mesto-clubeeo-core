import {BaseService} from '../../services/BaseService'
import ClubRoleToken from '../ClubRoleToken'
import MemberRole from '../MemberRole'
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
    let userClubRole: MemberRole = await this.app.m.findOneBy(MemberRole, {
      user: {id: data.user.id},
      club: {id: data.club.id},
      clubRoleToken: {id: data.clubRoleToken.id},
    });

    if (!userClubRole) {
      userClubRole = this.app.m.create(MemberRole, {...data});
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
