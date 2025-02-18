import { MestoApp as App } from "../../App";
import { EngineBase } from "../../core/lib/EngineBase";
import Club from "../../models/Club";

export interface IHub {
  id: string
}

export class Clubs extends EngineBase {
  readonly app: App;

  constructor(app: App) {
    super();

    this.app = app;
  }

  repo = {
    find: (hubId: string) => {
      return this.app.m.findOneBy(Club, {id: hubId});
    },
    findOrFail: (hubId: string) => {
      return this.app.m.findOneByOrFail(Club, {id: hubId});
    },
    findByServiceExtId: (hubExtId: string, service: string) => {
      return this.app.m.findOne(Club, {
        where: {
          clubExts: {
            extId: hubExtId,
            service,
          }
        },
        order: {
          id: 'DESC'
        }
      })
    }
  };

}
