import {App, Engines, DummyTranslationEngine} from "clubeeo-core";
import MestoEnv from "./Env";
import MemberProfile from "./models/MemberProfile";
import { TelegramEngine } from "./engines/TelegramEngine/TelegramEngine";
import { Lists } from "./engines/Lists/Lists";

export class MestoApp extends App {
  constructor(env: MestoEnv) {
    super(env);
  }

  async init() {
    await super.init();

    await this.engines.callEachEngine('init');
  }

  async run() {
    this.logger.info('Running MestoApp');

    await super.run();

    await this.engines.callEachEngine('run');

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
        MemberProfile,
      ] as any,
    };
  }

  get engines() {
    return this.once('engines', () => Engines.buildDefault(this)
      .mount('lists', Lists)
      .mount('telegram', TelegramEngine)
      .mount('translations', DummyTranslationEngine)
    );
  }
}
