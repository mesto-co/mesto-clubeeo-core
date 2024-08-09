import CoreSettings from "./core/CoreSettings";

export default class AppSettings extends CoreSettings {
  get dataSourceSettings() {
    return {
      ...super.dataSourceSettings,
      entities: [
        __dirname + "/models/*.ts",
        __dirname + "/engines/SubscriptionEngine/models/*.ts",
        __dirname + "/engines/AppEngine/models/*.ts",
        __dirname + "/engines/MotionEngine/models/*.ts",
        __dirname + "/engines/TranslationEngine/models/*.ts",
      ],
    };
  }
}