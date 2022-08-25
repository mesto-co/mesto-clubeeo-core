import {ITokenContract, IUserWallet} from '../../logic/TokenOwnershipLogic'
import {
  chainToMoralisChainMap,
  IMoralisWalletAmountServiceDeps,
  MoralisWalletAmountAdapter,
} from './MoralisWalletAmountAdapter'
import {IWalletAmountAdapterFactory} from './walletAmountInterfaces'
import {EvmChainsEnum, NearChainsEnum} from '../../lib/TChains'
import {NearWalletAmountAdapter} from './NearWalletAmountAdapter'

export type IWalletAmountFactoryDeps = IMoralisWalletAmountServiceDeps;

export class WalletAmountFactory implements IWalletAmountAdapterFactory {
  protected app: IWalletAmountFactoryDeps

  constructor(app: IWalletAmountFactoryDeps) {
    this.app = app
  }

  buildFor(params: { wallet: IUserWallet, contract: ITokenContract }) {
    // const chainContext = this.app.chainContext(chain);

    const moralisWalletChain = chainToMoralisChainMap.get(params.wallet.chain as EvmChainsEnum);
    const moralisContractChain = chainToMoralisChainMap.get(params.contract.chain as EvmChainsEnum);
    if (moralisContractChain) {
      if (moralisWalletChain) {
        return new MoralisWalletAmountAdapter(this.app)
      }
    }

    if (params.contract.chain in NearChainsEnum) {
      return new NearWalletAmountAdapter(this.app)
    }

    throw new Error(`Can't find Wallet Amount Adapter for chains wallet:"${params.wallet.chain}" contract:"${params.contract.chain}"`);
  }
}
