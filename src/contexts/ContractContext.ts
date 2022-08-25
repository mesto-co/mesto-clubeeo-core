import App from '../App'
import TokenContract from '../models/TokenContract'

export class ContractContext {
  readonly app: App;
  readonly contract: TokenContract;

  constructor(app: App, contract: TokenContract) {
    this.app = app;
    this.contract = contract;
  }

  get chainContext() {
    return this.app.contexts.chain(this.contract.chain);
  }

  get normAddress() {
    return this.chainContext.normAddress(this.contract.address);
  }
}
