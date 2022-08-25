import {TChains, TokenStandardsEnum} from '../lib/TChains';
import {IAppLog} from '../interfaces/common'
import TokenContract from '../models/TokenContract'
import Wallet from '../models/Wallet'

export interface ITokenContract {
  address: string
  chain: TChains
  standard: TokenStandardsEnum
  config: ITokenContractConfig
}

export interface ITokenContractConfig {
  tokenIdPrefix?: string
}

export interface IUserWallet {
  address: string
  chain: TChains
}

// export async function doIOwnTokenLogic(ports: {
//   app: IAppLog,
//   userWalletsGetter: (chain: TChains) => Promise<IUserWallet[]>,
//   tokenContractGetter: () => Promise<ITokenContract>,
//   walletOwnsTokenCheck: (userWallet: IUserWallet, tokenContract: ITokenContract) => Promise<boolean>,
// }) {
//   try {
//     const tokenContract = await ports.tokenContractGetter();
//     const userWallets = await ports.userWalletsGetter(tokenContract.chain);
//
//     let doIOwn = false;
//     for (const wallet of userWallets) {
//       // check if wallet owns token
//       doIOwn = await ports.walletOwnsTokenCheck(wallet, tokenContract);
//
//       // break if so
//       if (doIOwn) break;
//     }
//
//     return doIOwn;
//   } catch (e) {
//     ports.app.log.error(e);
//     return false;
//   }
// }
