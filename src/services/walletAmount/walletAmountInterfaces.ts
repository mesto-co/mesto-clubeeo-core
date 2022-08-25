import {ITokenContract, IUserWallet} from '../../logic/TokenOwnershipLogic'

export interface IWalletAmountAdapter {
  getWalletTokenAmount(userWallet: IUserWallet, tokenContract: ITokenContract): Promise<number>
}

export interface IWalletAmountAdapterFactory {
  buildFor(params: { wallet: IUserWallet, contract: ITokenContract }): IWalletAmountAdapter
}
