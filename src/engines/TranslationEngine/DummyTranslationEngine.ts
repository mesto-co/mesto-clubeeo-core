import { ITranslationEngine } from "./TranslationTypes";

export default class DummyTranslationEngine implements ITranslationEngine {
  models = {}

  async t(code: string, lang: string, values: Record<string, string>, def?: string) {
    return def || code;
  }
}
