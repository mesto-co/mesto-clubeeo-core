import {MestoApp as App} from '@/App'
import clubAppRoutes from './api/clubAppRoutes'
import ClubApp from './models/ClubApp';
import ClubAppProp from './models/ClubAppProp';
import ClubAppRole from './models/ClubAppRole';
import ClubAppRepo from './repos/ClubAppRepo'
import { EngineBase } from '../../core/lib/EngineBase';
import { AppsService } from './AppsService';
import { appRegistry } from './AppsRegistry';
import { IAppConfig } from './IClubApp';

export default class AppsEngine extends EngineBase {
  readonly type = 'engine';
  readonly app: App;
  readonly service: AppsService<App>;
  readonly repos: {
    clubApp: ClubAppRepo,
  }
  readonly registry: Record<string, IAppConfig>;

  constructor(app: App) {
    super();

    this.app = app;
    this.service = new AppsService(app as any);
    this.repos = {
      clubApp: new ClubAppRepo(app),
    };
    this.registry = appRegistry;
  }

  models = {
    ClubApp,
    ClubAppProp,
    ClubAppRole,
  }

  get api() { return clubAppRoutes(this) }

  apiConfig = {prefix: '/club/:clubSlug/app'}

}
