import { EngineBase } from './../../core/lib/EngineBase';
import { ITranslationEngine } from "./TranslationTypes";

export default class DummyTranslationEngine extends EngineBase implements ITranslationEngine {
  models = {}

  async t(code: string, lang: string, values: Record<string, string>, def?: string) {
    return def || code;
  }
}
