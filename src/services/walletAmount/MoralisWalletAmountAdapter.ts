import {toChecksumAddress} from '../../lib/web3helpers'
import {ITokenContract, IUserWallet} from '../../logic/TokenOwnershipLogic'
import {IMoralisGetAddressNftResult, MoralisChains} from '../external/MoralisApi'
import {EvmChainsEnum} from '../../lib/TChains'
import {IWalletAmountAdapter} from './walletAmountInterfaces'

export const chainToMoralisChainMap = new Map([
  [EvmChainsEnum.eth, MoralisChains.eth],
  [EvmChainsEnum.ropsten, MoralisChains.ropsten],
  [EvmChainsEnum.rinkeby, MoralisChains.rinkeby],
  [EvmChainsEnum.goerli, MoralisChains.goerli],
  [EvmChainsEnum.kovan, MoralisChains.kovan],

  [EvmChainsEnum.polygon, MoralisChains.polygon],
  [EvmChainsEnum.mumbai, MoralisChains.mumbai],

  [EvmChainsEnum.bsc, MoralisChains.bsc],
  [EvmChainsEnum.bsc_testnet, MoralisChains['bsc testnet']],

  [EvmChainsEnum.avalanche, MoralisChains.avalanche],
  [EvmChainsEnum.avalanche_testnet, MoralisChains['avalanche testnet']],

  [EvmChainsEnum.fantom, MoralisChains.fantom],
]);

export interface IMoralisWalletAmountServiceDeps {
  MoralisApi: {
    getAddressNftToken(walletAddress: string, chain: MoralisChains, tokenAddress: string): Promise<IMoralisGetAddressNftResult>
  },
}

export class MoralisWalletAmountAdapter implements IWalletAmountAdapter {
  protected app: IMoralisWalletAmountServiceDeps

  constructor(app: IMoralisWalletAmountServiceDeps) {
    this.app = app
  }

  async getWalletTokenAmount(userWallet: IUserWallet, tokenContract: ITokenContract) {
    const walletAddress = toChecksumAddress(userWallet.address);
    const contractAddress = toChecksumAddress(tokenContract.address);
    const chain = tokenContract.chain as EvmChainsEnum;

    const data = await this.app.MoralisApi.getAddressNftToken(
      walletAddress,
      chainToMoralisChainMap.get(chain),
      contractAddress,
    );
    let result = data.result;

    // filter tokenId by prefix (useful for OpenSea)
    const tokenIdPrefix = tokenContract.config?.tokenIdPrefix;
    if (tokenIdPrefix) {
      result = result.filter(v => v.token_id.startsWith(tokenIdPrefix));
    }

    return result.reduce(
      (memo, item) => memo + (item.amount ? Number(item.amount) : 0),
      0
    );
  }

}
