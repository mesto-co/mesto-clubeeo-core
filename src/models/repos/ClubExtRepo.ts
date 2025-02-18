import {BaseService} from '../../services/BaseService'
import ClubExt from '../ClubExt'
import {FindOptionsWhere} from 'typeorm/find-options/FindOptionsWhere'
import {DeepPartial} from 'typeorm/common/DeepPartial'
import {IClubExtRepo} from '../../interfaces/repos'
import {ExtServicesEnum} from '../../lib/enums'

export default class ClubExtRepo extends BaseService implements IClubExtRepo {
  async findByExtId(extId: string, service: ExtServicesEnum, relations: {}, where: FindOptionsWhere<ClubExt> = {}) {
    const clubExt = await this.app.m.findOne(ClubExt, {
      where: {
        ...where,
        extId,
        service,
      },
      relations,
    });

    return clubExt;
  }

  async findOrCreate(
    where: {
      extId: string,
      service: ExtServicesEnum,
      club: {id: string}
    },
    data: DeepPartial<ClubExt> = {}
  ): Promise<{value: ClubExt, isCreated: boolean}> {
    return await this.app.em.findOneOrCreateBy(ClubExt, {...where, club: {id: where.club.id}}, data) as {value: ClubExt, isCreated: boolean};
  }
}
