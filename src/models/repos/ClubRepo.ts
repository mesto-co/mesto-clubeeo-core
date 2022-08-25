import {BaseService} from '../../services/BaseService'
import ClubExt from '../ClubExt'
import Club from '../Club'
import {ExtService} from '../../lib/enums'

export default class ClubRepo extends BaseService {
  async findByExtId(extId: string, service: ExtService) {
    const clubExt = await this.app.m.findOne(ClubExt, {
      where: {
        extId,
        service,
      },
      relations: {
        club: true
      }
    });

    return clubExt?.club;
  }

  async findById(id: number) {
    return await this.app.m.findOneBy(Club, {id});
  }

  async findByIdOrFail(id: number) {
    return await this.app.m.findOneByOrFail(Club, {id});
  }
}
