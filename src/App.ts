import {App, EngineBase, Engines} from "clubeeo-core";
import DummyTranslationEngine from 'clubeeo-core/dist/engines/TranslationEngine/DummyTranslationEngine';
import MestoEnv from "./Env";
import MemberProfile from "./models/MemberProfile";
import { TelegramEngine } from "./engines/TelegramEngine/TelegramEngine";

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
  }

  get dataSourceSettings() {
    return {
      ...super.dataSourceSettings,
      entities: [
        'node_modules/clubeeo-core/dist/models/*.js',
        "node_modules/clubeeo-core/dist/engines/MotionEngine/models/*.ts",
        ...Object.values(this.engines.apps.models),
        ...Object.values(this.engines.translation.models),
        MemberProfile,
      ] as any,
    };
  }

  get engines() { return this.once('engines', () => new MestoEngines(this)) }
}

export class MestoEngines extends Engines {
  constructor(protected c: MestoApp) {
    super(c);

    this.enableEngines('telegram', 'translation');
  }

  get telegram() { return this.once('telegram', () => new TelegramEngine(this.c)) }

  get translation() { return this.once('translation', () => new DummyTranslationEngine()) }
}
