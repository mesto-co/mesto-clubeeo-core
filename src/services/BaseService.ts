import App from '../App'

export class BaseService {
  protected app: App

  constructor(app: App) {
    this.app = app
  }
}
