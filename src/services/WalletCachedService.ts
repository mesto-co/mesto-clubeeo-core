import {TChains} from '../lib/TChains'
import {ITokenContract, IUserWallet} from '../logic/TokenOwnershipLogic'
import {IWalletAmountAdapterFactory} from './walletAmount/walletAmountInterfaces'
import {AbstractChainContext} from '../chains/base/AbstractChainContext'
import {IWalletNftCreateOrUpdate, IWalletNftFindBy} from '../models/repos/repoInterfaces'
import {IWalletService} from '../interfaces/services/IWalletService'

export interface IWalletServiceDeps {
  repos: {
    walletNft: IWalletNftCreateOrUpdate & IWalletNftFindBy,
  },
  contexts: {
    chain(chain: TChains): AbstractChainContext
  }
}

export default class WalletCachedServiceService implements IWalletService{
  protected app: IWalletServiceDeps

  constructor(app: IWalletServiceDeps) {
    this.app = app
  }

  async syncWalletTokenAmount(userWallet: IUserWallet, tokenContract: ITokenContract) {
    const chain = tokenContract.chain;
    const chainContext = this.app.contexts.chain(chain);

    // normalize addresses
    const walletAddress = chainContext.normAddress(userWallet.address);
    const contractAddress = chainContext.normAddress(tokenContract.address);

    const walletNft = await this.app.repos.walletNft.findBy({
      walletAddress,
      contractAddress,
      chain,
    });

    return walletNft?.ownedAmount || 0;
  }
}
