import { EntityManager } from "typeorm";
import App from "../../App";
import Translation from "./models/Translation";
import { render } from 'mustache';

export interface TranslationEngineDeps {
  m: EntityManager;
}

export class TranslationEngine {
  readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  async t(code: string, lang: string, values: Record<string, string>, def?: string) {
    const translation = await this.app.m.findOne(Translation, { 
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

  render(template: string, values: Record<string, string>, defaults: Record<string, string>) {
    return render(template, Object.assign({}, defaults, values));
  }
}