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

@Entity()
export class WalletNft {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: Number})
  ownedAmount: number;

  @Column({type: String, default: ''})
  @Index()
  walletAddress: string;

  @Column({type: String, default: ''})
  @Index()
  contractAddress: string;

  @Column({type: String, default: ''})
  chain: TChains;

  @ManyToOne(type => Wallet)
  wallet: Wallet
  @RelationId((self: WalletNft) => self.wallet)
  walletId: number

  @ManyToOne(type => TokenContract)
  tokenContract: TokenContract
  @RelationId((self: WalletNft) => self.tokenContract)
  tokenContractId: number

  @Column({type: Date, nullable: true})
  @Index()
  changedAt: Date;

  @Column({type: Date, nullable: true})
  @Index()
  checkedAt: Date;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
