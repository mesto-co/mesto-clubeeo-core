import {App, Engines, DummyTranslationEngine, TranslationEngine} from "clubeeo-core";
import MestoEnv from "./Env";
import MemberProfile from "./engines/MemberProfiles/models/MemberProfile";
import { TelegramEngine } from "./engines/TelegramEngine/TelegramEngine";
import { Lists } from "./engines/Lists/Lists";
import { MemberProfiles } from "./engines/MemberProfiles/MemberProfiles";
import { Clubs } from "clubeeo-core/dist/engines/Clubs/Clubs";
import AppsEngine from "clubeeo-core/dist/engines/AppsEngine/AppsEngine";
import { AccessEngine } from "clubeeo-core/dist/engines/AccessEngine/AccessEngine";
import { BadgeEngine } from "clubeeo-core/dist/engines/BadgeEngine/BadgeEngine";
import MotionEngine from "clubeeo-core/dist/engines/MotionEngine/MotionEngine";
import { RoleEngine } from "clubeeo-core/dist/engines/RoleEngine/RoleEngine";

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
        ...Object.values(this.engines.memberProfiles.models),
        MemberProfile,
      ] as any,
    };
  }

  get engines(): Engines & Record<'apps', AppsEngine>
      & Record<'access', AccessEngine>
      & Record<'badge', BadgeEngine>
      & Record<'hubs', Clubs>
      & Record<'motion', MotionEngine>
      & Record<'role', RoleEngine>
      & Record<'lists', Lists>
      & Record<'telegram', TelegramEngine>
      & Record<'translations', TranslationEngine>
      & Record<'memberProfiles', MemberProfiles> {
    return this.once('engines', () => Engines.buildDefault(this)
      .mount('lists', Lists)
      .mount('telegram', TelegramEngine)
      .mount('translations', DummyTranslationEngine)
      .mount('memberProfiles', MemberProfiles)
    )
  }
}
