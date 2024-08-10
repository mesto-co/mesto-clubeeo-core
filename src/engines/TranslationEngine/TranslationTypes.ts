import { EntityTarget } from "typeorm";

export interface ITranslationEngine {

  models: Record<string, EntityTarget<any>>;

  t(code: string, lang: string, values: Record<string, string>, def?: string): Promise<string>;

}
