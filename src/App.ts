import {App, Engines, DummyTranslationEngine, TranslationEngine, EnginesContainerBase} from "clubeeo-core";
import MestoEnv from "./Env";
import MemberProfile from "./engines/MemberProfiles/models/MemberProfile";
import { TelegramEngine } from "./engines/TelegramEngine/TelegramEngine";
import { Lists } from "./engines/Lists/Lists";
import { MemberProfiles } from "./engines/MemberProfiles/MemberProfiles";
import { AppsEngine, Clubs, AccessEngine, BadgeEngine, MotionEngine, RoleEngine } from "clubeeo-core";
import { fileStorageEngine } from "./engines/FileStorageEngine/FileStorageEngine";

export class MestoApp extends App {
  constructor(env: MestoEnv) {
    super(env);
  }

  async init() {
    await super.init();

    // await this.engines.callEachEngine('init');
    for (const engineName of this.engines.enabledEngines) {
      if ('init' in this.engines[engineName]) {
        await this.engines[engineName].init();
      }
    }
  }

  async run() {
    this.logger.info('Running MestoApp');

    await super.run();

    // await this.engines.callEachEngine('run');

    for (const engineName of this.engines.enabledEngines) {
      if ('run' in this.engines[engineName]) {
        await this.engines[engineName].run();
      }
    }

    console.log(this.engines.enabledEngines);
  }

  get dataSourceSettings() {
    return {
      ...super.dataSourceSettings,
      entities: [
        'node_modules/clubeeo-core/dist/models/*.js',
        "node_modules/clubeeo-core/dist/engines/MotionEngine/models/*.ts",
        ...Object.values(this.engines.apps.models),
        ...Object.values(this.engines.translations.models),
        ...Object.values(this.engines.lists.models),
        ...Object.values(this.engines.memberProfiles.models),
        // ...Object.values(this.engines.motion.models),
        // ...Object.values(this.engines.fileStorage.models),
        MemberProfile,
      ] as any,
    };
  }

  // get engines(): Engines & Record<'apps', AppsEngine>
  //     & Record<'access', AccessEngine>
  //     & Record<'badge', BadgeEngine>
  //     & Record<'hubs', Clubs>
  //     & Record<'motion', MotionEngine>
  //     & Record<'role', RoleEngine>
  //     & Record<'lists', Lists>
  //     & Record<'telegram', TelegramEngine>
  //     & Record<'translations', TranslationEngine>
  //     & Record<'memberProfiles', MemberProfiles> {
  //   return this.once('engines', () => Engines.buildDefault(this)
  //     .mount('lists', Lists)
  //     .mount('telegram', TelegramEngine)
  //     .mount('translations', DummyTranslationEngine)
  //     .mount('memberProfiles', MemberProfiles)
  //   )
  // }

  get engines() {
    // return Engines.buildDefault(this);
    return this.once('engines', () => {
      const engines = {
        apps: new AppsEngine(this),
        access: new AccessEngine(this),
        badge: new BadgeEngine(this),
        hubs: new Clubs(this),
        motion: new MotionEngine(this),
        role: new RoleEngine(this),
        lists: new Lists(this),
        telegram: new TelegramEngine(this),
        translations: new TranslationEngine(this),
        memberProfiles: new MemberProfiles(this),
        fileStorage: fileStorageEngine(this),
      }

      engines.enabledEngines = Object.keys(engines);

      return engines;
    });
  }
}

// class FileStorageEngine<TApp extends MestoApp> {
//   constructor(c: TApp) {
//     return fileStorageEngine(c);
//   }
// }
