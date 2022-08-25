import {TChains} from '../../lib/TChains';
import {WalletNft} from '../WalletNft'

export type IWalletNftCreateOrUpdate = {
  createOrUpdate(params: { walletAddress: string, contractAddress: string, chain: TChains, ownedAmount: number }): Promise<WalletNft>
}

export type IWalletNftFindBy = {
  findBy(params: { walletAddress: string, contractAddress: string, chain: TChains }): Promise<WalletNft>
}
