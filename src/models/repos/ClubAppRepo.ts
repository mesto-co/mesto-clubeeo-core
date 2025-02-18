import {BaseService} from '../../services/BaseService'
import Club from '../Club'
import ClubApp from '../../engines/AppsEngine/models/ClubApp'

export default class ClubAppRepo extends BaseService {
  async findById(club: Club, appId: string): Promise<ClubApp | null> {
    return await this.app.m.findOneBy(ClubApp, {
      id: appId,
      club: {id: club.id}
    });
  }

  async findBySlug(club: Club, appSlug: string): Promise<ClubApp | null> {
    return await this.app.m.findOneBy(ClubApp, {
      appSlug,
      club: {id: club.id}
    });
  }

  async findBySlugOrFail(club: Club, appSlug: string): Promise<ClubApp | null> {
    return await this.app.m.findOneByOrFail(ClubApp, {
      appSlug,
      club: {id: club.id}
    });
  }
}
