import { fastify } from 'fastify';
import App from '../../App'
import clubAppRoutes from './api/clubAppRoutes'
import ClubApp from './models/ClubApp';
import ClubAppProp from './models/ClubAppProp';
import ClubAppRole from './models/ClubAppRole';
import ClubAppRepo from './repos/ClubAppRepo'

export default class AppsEngine {
  readonly type = 'engine';
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

  models = {
    ClubApp,
    ClubAppProp,
    ClubAppRole,
  }

  get api() { return clubAppRoutes(this) }

  apiConfig = {prefix: '/club/:clubSlug/app'}

}
