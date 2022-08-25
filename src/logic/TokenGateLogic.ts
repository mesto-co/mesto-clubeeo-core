// import {ChainEnums, TokenStandardsEnum} from '../lib/chainEnums';
// import {IAppLog} from '../interfaces/common'
//
// // export interface ITokenContract {
// //   address: string
// //   chain: ChainEnums
// //   standard: TokenStandardsEnum
// // }
// //
// // export interface IUserWallet {
// //   address: string
// //   chain: ChainEnums
// // }
//
// export interface IMe {
//
// }
//
// export async function meInClubLogic(ports: {
//   app: IAppLog,
//   getMe: () => Promise<IMe>,
//   // userWalletsGetter: () => Promise<IUserWallet[]>,
//   // tokenContractGetter: () => Promise<ITokenContract>,
//   // doWalletOwnsToken: (userWallet: IUserWallet, tokenContract: ITokenContract) => Promise<boolean>,
// }) {
//   try {
//     const me = await ports.getMe();
//
//     return {
//     }
//     // const tokenContract = await ports.tokenContractGetter();
//     // const userWallets = await ports.userWalletsGetter();
//     //
//     // let doIOwn = false;
//     // for (const wallet of userWallets) {
//     //   // check if wallet owns token
//     //   doIOwn = await ports.doWalletOwnsToken(wallet, tokenContract);
//     //
//     //   // break if so
//     //   if (doIOwn) break;
//     // }
//     //
//     // return doIOwn;
//   } catch (e) {
//     ports.app.log.error(e);
//     // return false;
//   }
// }
