import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import {TChains} from '../lib/TChains'
import Wallet from './Wallet'
import TokenContract from './TokenContract'
import {Index} from 'typeorm/index'
import {WalletNft} from './WalletNft'

export enum WalletNftEventsEnum {
  acquired = 'acquired',
  amountIncreased = 'amountIncreased',
  amountDecreased = 'amountDecreased',
  sold = 'sold',
  notChanged = 'notChanged',
  other = 'other',
}

@Entity()
export class WalletNftEvent {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String})
  event: WalletNftEventsEnum;

  @Column({type: Number})
  ownedAmount: number;

  @Column({type: Number, default: 0})
  previousAmount: number;

  @Column({type: String, default: ''})
  @Index()
  walletAddress: string;

  @Column({type: String, default: ''})
  @Index()
  contractAddress: string;

  @Column({type: String, default: ''})
  chain: TChains;

  @ManyToOne(type => WalletNft)
  walletNft: WalletNft
  @RelationId((self: WalletNftEvent) => self.walletNft)
  walletNftId: number

  @ManyToOne(type => Wallet)
  wallet: Wallet
  @RelationId((self: WalletNft) => self.wallet)
  walletId: number

  @ManyToOne(type => TokenContract)
  tokenContract: TokenContract
  @RelationId((self: WalletNftEvent) => self.tokenContract)
  tokenContractId: number

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
