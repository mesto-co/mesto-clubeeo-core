import App from '../App'
import Wallet from '../models/Wallet'
import TokenContract from '../models/TokenContract'

export class ContractWalletContext {
  readonly app: App;
  readonly contract: TokenContract;
  readonly wallet: Wallet;

  constructor(app: App, contract: TokenContract, wallet: Wallet) {
    this.app = app;
    this.contract = contract;
    this.wallet = wallet;
  }

  get chainContext() {
    return this.app.contexts.chain(this.contract.chain);
  }

  //todo: assert chains

  get contractContext() {
    return this.app.contexts.contract(this.contract);
  }

  get walletContext() {
    return this.app.contexts.wallet(this.wallet);
  }

  async sync() {
    return await this.app.WalletService.syncWalletTokenAmount(this.wallet, this.contract);
  }
}
