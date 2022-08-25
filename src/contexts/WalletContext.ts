import App from '../App'
import Wallet from '../models/Wallet'

export class WalletContext {
  readonly app: App;
  readonly wallet: Wallet;

  constructor(app: App, wallet: Wallet) {
    this.app = app;
    this.wallet = wallet;
  }

  get chainContext() {
    return this.app.contexts.chain(this.wallet.chain);
  }

  get normAddress() {
    return this.chainContext.normAddress(this.wallet.address);
  }
}
