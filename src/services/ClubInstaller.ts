import {BaseService} from './BaseService'
import App from '../App'
import Club from '../models/Club'

type IClubFixtures = Partial<Club> & any;

export async function installClubFixtures(
  app: App, deps: {
    clubFinder: (data) => Promise<Club>
  },
  data: IClubFixtures
) {
  const club = await deps.clubFinder(data);

  club.name = data.name || club.name
  club.description = data.description || club.description
  club.welcome = data.welcome || club.welcome
  club.website = data.website || club.website
  club.buyLinks = data.buyLinks || club.buyLinks
  club.roadmap = data.roadmap || club.roadmap;

  Object.assign(club.socialLinks, data.socialLinks || {});
  Object.assign(club.style, data.style || {});
  Object.assign(club.settings, data.settings || {});

  if (data.roles) {
    // todo: assign roles
  }

  if (data.clubApps) {


    // todo: create apps
  }

  if (data.clubBadges) {
    // todo: create badges
  }

  if (data.motionTriggers) {
    // todo: create triggers
  }

  return club;
}

export class ClubInstaller extends BaseService {
  constructor(app: App) {
    super(app);
  }

  async updateBySlug(data: IClubFixtures) {
    return await installClubFixtures(this.app, {
      clubFinder: (data) => this.app.m.findOneByOrFail(Club, {slug: data.slug}),
    }, data);
  }
}
