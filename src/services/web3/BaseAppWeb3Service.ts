import AppWeb3 from './AppWeb3'

export class BaseAppWeb3Service {
  protected appWeb3: AppWeb3;

  constructor(appWeb3: AppWeb3) {
    this.appWeb3 = appWeb3;
  }
}
