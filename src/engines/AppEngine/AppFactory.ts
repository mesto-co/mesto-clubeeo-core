import fromEntries from 'fromentries'
import App from '../../App'
import Club from '../../models/Club'
import {IAction, IActionProp, IAppConfig, IConfigProp, IEvent, IEventProp} from '../../interfaces/IClubApp'
import PageApp from '../../clubApps/StaticContentApp/PageApp'
import BasicApp from '../../clubApps/BasicApp/BaseApp'
import ClubApp from './models/ClubApp'
import {appRegistry} from './AppRegistry'

export class AppFactory {
  readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  async getAppConfig(appItem: IAppConfig, club: Club, clubApp: ClubApp | null) {
    const $ = {
      club, clubApp, m: this.app.m,
    }

    const computedEntries: Array<[string, IConfigProp<string>]> = [];
    for(const [k, prop] of Object.entries(appItem?.config?.props || {}) as Array<[string, IConfigProp<string>]>) {
      const result = {...prop};

      // evaluate values if function is given
      if (typeof prop.values === 'function') {
        result.values = await prop.values($);
      }

      // attach default value from app DB settings
      if (clubApp) {
        result['value'] = clubApp.config[k];
      }

      // use default from app config
      if (!result['value']) {
        result['value'] = typeof prop.default === 'function' ? prop.default({app: clubApp}) : prop.default;
      }

      result['view'] = typeof prop.view === 'function' ? (prop.view($, result) || "") : result['value'];

      computedEntries.push([k, result]);
    }
    return fromEntries(computedEntries);
  }

  async getAppEvents(appItem: IAppConfig, club: Club, clubApp: ClubApp | null) {
    const $ = {
      club, clubApp, m: this.app.m,
    }

    const computedEvents: Array<[string, IEvent<string>]> = [];
    for(const [eventK, event] of Object.entries(appItem?.events || {}) as Array<[string, IEvent<string>]>) {
      const computedProps: Array<[string, IEventProp<string>]> = [];

      for(const [propK, prop] of Object.entries(event.props || {}) as Array<[string, IEventProp<string>]>) {
        const result = {...prop};

        // evaluate values if function is given
        if (typeof prop.values === 'function') {
          result.values = await prop.values($);
        }

        computedProps.push([propK, result]);
      }

      computedEvents.push([eventK, {
        ...event,
        props: fromEntries(computedProps),
      }]);
    }

    return fromEntries(computedEvents);
  }

  async getAppActions(appItem: IAppConfig, club: Club, clubApp: ClubApp | null) {
    const $ = {
      club, clubApp, m: this.app.m,
    }

    const computedActions: Array<[string, IAction<string>]> = [];
    for(const [eventK, action] of Object.entries(appItem?.actions || {}) as Array<[string, IAction<string>]>) {
      const computedProps: Array<[string, IActionProp<string>]> = [];

      for(const [propK, prop] of Object.entries(action.props || {}) as Array<[string, IActionProp<string>]>) {
        const result = {...prop};

        // evaluate values if function is given
        if (typeof prop.values === 'function') {
          result.values = await prop.values($);
        }

        computedProps.push([propK, result]);
      }

      computedActions.push([eventK, {
        ...action,
        props: fromEntries(computedProps),
      }]);
    }

    return fromEntries(computedActions);
  }

  async getApp(appKey: string, club: Club, clubApp: ClubApp | null) {
    const registryApp = appRegistry[appKey];
    const appItem = {
      ...registryApp,
      events: await this.getAppEvents(registryApp, club, clubApp),
      actions: await this.getAppActions(registryApp, club, clubApp),
    }
    const computedConfig = await this.getAppConfig(appItem, club, clubApp);

    return {
      ...appItem,
      config: {
        ...(appItem?.config || {}),
        computed: computedConfig,
      }
    };
  }

  getRegistry(club: Club) {
    return Object.entries(appRegistry).map(([k,v]) => (
      {
        key: v.key,
        name: v.name,
        description: v.description,
        coverImg: v.coverImg,
        version: v.version,
        tags: v.tags,
      }
    ));
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
