import {BaseService} from '../BaseService';
import UserExt from '../../models/UserExt';
import User from '../../models/User'
import {ExtServicesEnum} from '../../lib/enums'

export class UserRepo extends BaseService {
  async findUserByExtId(service: ExtServicesEnum, extId: string | number) {
    const userExt = await this.app.m.findOne(UserExt, {
      where: {service, extId: String(extId), enabled: true},
      order: {id: 'DESC'},
      relations: ['user'],
    });

    return userExt?.user;
  }

  async defaultScreenName(user: User, data: {screenName?: string, firstName?: string, lastName?: string}) {
    if (!user.screenName) {
      const screenName = [data.firstName, data.lastName].filter(v=>v).join(' ') || data.screenName;

      if (screenName) {
        await this.app.m.update(User,
          {id: user.id, screenName: ''},
          {screenName},
        )
      }
    }
  }
}
