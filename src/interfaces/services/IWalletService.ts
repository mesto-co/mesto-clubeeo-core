import {ITokenContract, IUserWallet} from '../../logic/TokenOwnershipLogic'

export interface IWalletService {
  syncWalletTokenAmount(userWallet: IUserWallet, tokenContract: ITokenContract): Promise<number>;
}
