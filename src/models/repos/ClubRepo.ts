import {BaseService} from '../../services/BaseService'
import ClubExt from '../ClubExt'
import Club from '../Club'
import {ExtServicesEnum} from '../../lib/enums'
import User from '../User'
import {IEntityId} from '../../lib/common'

export default class ClubRepo extends BaseService {
  async findByExtId(extId: string, service: ExtServicesEnum) {
    const clubExt = await this.app.m.findOne(ClubExt, {
      where: {
        extId,
        service,
      },
      relations: {
        club: true,
      },
    });

    return clubExt?.club;
  }

  async findById(id: string): Promise<Club | null> {
    return await this.app.m.findOneBy(Club, {id});
  }

  async findByIdOrFail(id: string): Promise<Club> {
    return await this.app.m.findOneByOrFail(Club, {id});
  }

  async findBySlug(slug: string): Promise<Club | null> {
    return await this.app.m.findOneBy(Club, {slug});
  }

  async findBySlugOrFail(slug: string): Promise<Club> {
    return await this.app.m.findOneByOrFail(Club, {slug});
  }

  async findByLocator(clubLocator: string): Promise<Club> {
    if (clubLocator.startsWith('clubId:')) {
      return this.findById(clubLocator.split('clubId:', 2)[1])
    } else if (clubLocator.startsWith('clubSlug:')) {
      return this.findBySlug(clubLocator.split('clubSlug:', 2)[1])
    }
  }

  async findByLocatorOrFail(clubLocator: string): Promise<Club> {
    if (clubLocator.startsWith('clubId:')) {
      return this.findByIdOrFail(clubLocator.split('clubId:', 2)[1])
    } else if (clubLocator.startsWith('clubSlug:')) {
      return this.findBySlugOrFail(clubLocator.split('clubSlug:', 2)[1])
    }
  }

  /**
   * Find by one of given criteria
   *
   * @param param
   */
  async findByParamOrFail(param: { clubId?: string, clubSlug?: string, clubLocator?: string }) {
    return param.hasOwnProperty('clubLocator')
      ? await this.app.repos.club.findByLocatorOrFail(param.clubLocator)
      : (param.hasOwnProperty('clubSlug')
          ? await this.app.repos.club.findBySlugOrFail(param.clubSlug)
          : await this.app.repos.club.findByIdOrFail(param.clubId)
      );
  }

  async loadBy(entity: { clubId: string, club?: Club }) {
    if (entity.club?.id && entity.club?.createdAt) return entity.club;
    return await this.findById(entity.clubId);
  }

  async getOrLoad(entity: Club | IEntityId) {
    if ('createdAt' in entity) return entity;
    return await this.app.m.findOneBy(Club, {id: entity.id});
  }
}
