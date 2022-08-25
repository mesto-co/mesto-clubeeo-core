import {BaseService} from './services/BaseService'
import {AccessEngine} from './engines/AccessEngine/AccessEngine'

export class Engines extends BaseService {

  protected _AccessEngine: AccessEngine;
  get accessEngine(): AccessEngine {
    return this._AccessEngine || (this._AccessEngine = new AccessEngine(this.app));
  }

}
