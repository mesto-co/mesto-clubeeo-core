import App from '../../App'
import UserExt from '../../models/UserExt'
import ClubExt from '../../models/ClubExt'
import ClubApp from '../../models/ClubApp'
import User from '../../models/User'
import Club from '../../models/Club'
import {DiscordClubAppContext} from './DiscordClubAppContext'
import {ExtService} from '../../lib/enums'

export async function discordClubUserContextFactory(app: App, discordUserId: string, discordClubId: string) {
  const userExt = await app.m.findOneOrFail(UserExt, {
    where: {
      service: ExtService.discord,
      extId: discordUserId,
    },
    relations: {
      user: true,
    },
  });
  const clubExt = await app.m.findOneOrFail(ClubExt, {
    where: {
      service: ExtService.discord,
      extId: discordClubId,
    },
    relations: {
      club: true,
    },
  });
  const user = userExt.user;
  const club = clubExt.club;

  let clubApp = await app.m.findOneBy(ClubApp, {
    club: {id: club.id},
    appName: 'discord',
  });
  if (!clubApp) {
    clubApp = app.m.create(ClubApp, {
      club,
      appName: 'discord',
      config: {}
    });
  }

  return new DiscordClubUserContext(app, {
    userExt,
    user,
    clubExt,
    club,
    clubApp,
  });
}

export class DiscordClubUserContext {
  readonly app: App;
  readonly userExt: UserExt;
  readonly user: User;
  readonly clubExt: ClubExt;
  readonly club: Club;
  readonly clubApp: ClubApp;
  readonly discordClubApp: DiscordClubAppContext;

  constructor(app: App, opts: {
    userExt: UserExt,
    user: User,
    clubExt: ClubExt,
    club: Club,
    clubApp: ClubApp,
  }) {
    this.app = app;
    this.userExt = opts.userExt;
    this.user = opts.user;
    this.clubExt = opts.clubExt;
    this.club = opts.club;
    this.clubApp = opts.clubApp;
    this.discordClubApp = app.contexts.discordClubApp(this.club, this.clubApp, this.clubExt);
  }


}
