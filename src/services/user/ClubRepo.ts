import {BaseService} from '../BaseService';
import ClubExt from '../../models/ClubExt';
import {ExtService} from '../../lib/enums'

export class ClubRepo extends BaseService {
  async findClubByExtId(service: ExtService, extId: string | number) {
    const userExt = await this.app.m.findOne(ClubExt, {
      where: {service, extId: String(extId)},
      order: {id: 'DESC'},
      relations: ['club'],
    });

    return userExt?.club;
  }
}
