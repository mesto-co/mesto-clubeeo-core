import {App, EngineBase, Engines} from "clubeeo-core";
import DummyTranslationEngine from 'clubeeo-core/dist/engines/TranslationEngine/DummyTranslationEngine';
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
        ...Object.values(this.engines.translation.models),
        ...Object.values(this.engines.lists.models),
        MemberProfile,
      ] as any,
    };
  }

  get engines() {
    return this.once('engines', () => new EnginesContainer(this)
      .mount('lists', Lists)
      .mount('telegram', TelegramEngine)
      .mount('translation', DummyTranslationEngine)
    );
  }
}

type EngineConstructor<C, T> = new (c: C) => T;

export class EnginesContainer<C extends App> extends Engines {
  private engines: Record<string, any> = {};

  constructor(protected c: C) {
    super(c);
  }

  mount<K extends string, T>(key: K, Engine: EngineConstructor<C, T>): this & Record<K, T> {
    Object.defineProperty(this, key, {
      get: () => {
        if (!this.engines[key]) {
          this.engines[key] = new Engine(this.c);
        }
        return this.engines[key];
      },
      enumerable: true,
      configurable: true,
    });

    this.onMounted(key);

    return this as this & Record<K, T>;
  }

  protected onMounted(key: string) {
    // automatically add to enabled engines list
    this.enableEngines(key);
  }
}
