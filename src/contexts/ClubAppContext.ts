import App from '../App'
import Club from '../models/Club'
import ClubApp from '../engines/AppsEngine/models/ClubApp'

export class ClubAppContext {
  readonly app: App;
  readonly clubApp: ClubApp;
  readonly club: Club;

  constructor(app: App, club: Club, clubApp: ClubApp) {
    this.app = app;
    this.club = club;
    this.clubApp = clubApp;
  }

  getConfigVal(key: string, defaultValue: string) {
    if (key in this.clubApp.config) {
      return this.clubApp.config[key]
    } else {
      return defaultValue;
    }
  }

}
