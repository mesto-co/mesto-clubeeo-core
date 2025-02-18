import { MestoApp } from '../App'

export class BaseService {
  protected app: MestoApp

  constructor(app: MestoApp) {
    this.app = app
  }
}
