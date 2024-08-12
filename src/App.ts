import {App, Engines} from "clubeeo-core";
import DummyTranslationEngine from 'clubeeo-core/dist/engines/TranslationEngine/DummyTranslationEngine';
import MestoEnv from "./Env";
import MemberProfile from "./models/MemberProfile";

export class MestoApp extends App {
  constructor(env: MestoEnv) {
    super(env);
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
      ],
    };
  }

  get engines() { return this.once('engines', () => new MestoEngines(this)) }
}

export class MestoEngines extends Engines {
  get translation() { return this.once('translation', () => new DummyTranslationEngine()) }
}