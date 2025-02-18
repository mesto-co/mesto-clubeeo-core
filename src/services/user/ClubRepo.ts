import {BaseService} from '../BaseService';
import ClubExt from '../../models/ClubExt';
import {ExtServicesEnum} from '../../lib/enums'

export class ClubRepo extends BaseService {
  async findClubByExtId(service: ExtServicesEnum, extId: string) {
    const userExt = await this.app.m.findOne(ClubExt, {
      where: {service, extId: String(extId)},
      order: {id: 'DESC'},
      relations: ['club'],
    });

    return userExt?.club;
  }
}
