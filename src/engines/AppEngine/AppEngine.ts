import App from '../../App'
import clubAppRoutes from './api/clubAppRoutes'
import ClubAppRepo from './repos/ClubAppRepo'

export default class AppEngine {
  readonly app: App;
  readonly repos: {
    clubApp: ClubAppRepo,
  }

  constructor(app: App) {
    this.app = app;
    this.repos = {
      clubApp: new ClubAppRepo(app),
    };
  }

  get api() { return clubAppRoutes(this) }

}
