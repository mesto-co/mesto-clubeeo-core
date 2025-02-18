import {BaseService} from '../../../services/BaseService'
import Club from '../../../models/Club'
import ClubApp from '../models/ClubApp'

export default class ClubAppRepo extends BaseService {
  async findById(clubAppId: string): Promise<ClubApp | null> {
    return await this.app.m.findOneBy(ClubApp, {
      id: clubAppId,
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

  async findByLocator(club: Club, appLocator: string): Promise<ClubApp | null> {
    const locatorSplit = appLocator.split(':', 2);
    if (locatorSplit.length !== 2) throw Error(`invalid locator: "${appLocator}"`);

    const [locatorType, locatorValue] = locatorSplit;
    if (locatorType === 'clubAppId') {
      return await this.app.m.findOneBy(ClubApp, {
        id: locatorValue,
        club: {id: club.id}
      });
    } else if (locatorType === 'clubAppSlug') {
      return await this.app.m.findOneBy(ClubApp, {
        appSlug: locatorValue,
        club: {id: club.id}
      });
    } else {
      throw Error(`unknown locator type: "${locatorType}"`);
    }
  }
}
