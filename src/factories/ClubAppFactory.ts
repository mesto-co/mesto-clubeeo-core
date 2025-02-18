import App from '../App';
import PageApp from '../clubApps/StaticContentApp/PageApp'
import Club from '../models/Club'
import ClubApp from '../engines/AppsEngine/models/ClubApp'
import BasicApp from '../clubApps/BasicApp/BaseApp'

export class ClubAppFactory {
  readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  build(clubApp: ClubApp, appName: string, club: Club, config: Record<string, any>) {
    if (appName === PageApp.appName) {
      return new PageApp({app: this.app, club, config, clubApp});
    }

    return new BasicApp({app: this.app, club, config, clubApp});
  }

  async buildBySlug(appSlug: string, club: Club) {
    const clubApp = await this.app.m.findOneByOrFail(ClubApp, {
      club: {id: club.id},
      appSlug,
    });

    return this.build(clubApp, clubApp.appName, club, clubApp.config);
  }
}
