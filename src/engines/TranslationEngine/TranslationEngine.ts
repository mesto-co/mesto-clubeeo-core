import { EngineBase } from './../../core/lib/EngineBase';
import { EntityManager } from "typeorm";
import { MestoApp as App } from "../../App";
import Translation from "./models/Translation";
import { render } from 'mustache';
import { ITranslationEngine } from "./TranslationTypes";

export interface TranslationEngineDeps {
  m: EntityManager;
}

export default class TranslationEngine extends EngineBase implements ITranslationEngine {
  readonly app: App;

  constructor(app: App) {
    super();

    this.app = app;
  }

  models = {
    Translation,
  }

  async t(code: string, lang: string, values: Record<string, string>, def?: string) {
    const translation = await this.app.m.findOne(this.models.Translation, { 
      where: {code, lang}
    });
    if (!translation) {
      if (def === undefined) {
        return code;
      } else {
        return this.render(def, values, {});
      }
    } else {
      return this.render(translation.template, values, translation.defaults);
    }
  }

  protected render(template: string, values: Record<string, string>, defaults: Record<string, string>) {
    return render(template, Object.assign({}, defaults, values));
  }
}
