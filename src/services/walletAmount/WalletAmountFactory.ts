import {ITokenContract, IUserWallet} from '../../logic/TokenOwnershipLogic'
import {IWalletAmountAdapterFactory} from './walletAmountInterfaces'
import {NearChainsEnum} from '../../lib/TChains'
import {INearWalletAmountServiceDeps, NearWalletAmountAdapter} from './NearWalletAmountAdapter'

export class WalletAmountFactory implements IWalletAmountAdapterFactory {
  protected app: INearWalletAmountServiceDeps

  constructor(app: INearWalletAmountServiceDeps) {
    this.app = app
  }

  buildFor(params: { wallet: IUserWallet, contract: ITokenContract }) {
    if (params.contract.chain in NearChainsEnum) {
      return new NearWalletAmountAdapter(this.app)
    }

    throw new Error(`Can't find Wallet Amount Adapter for chains wallet:"${params.wallet.chain}" contract:"${params.contract.chain}"`);
  }
}
