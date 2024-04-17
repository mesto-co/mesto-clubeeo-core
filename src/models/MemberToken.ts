import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import {TChains} from '../lib/TChains'
import Wallet from './Wallet'
import {Index} from 'typeorm/index'
import Member from './Member'
import User from './User'
import Club from './Club'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export class MemberToken {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: Number})
  amount: number;

  @Column({type: String, default: ''})
  @Index()
  contractAddress: string;

  @Column({type: String})
  tokenId: string;

  @Column({type: String, default: ''})
  @Index()
  walletAddress: string;

  @Column({type: String, default: ''})
  chain: TChains;

  @ManyToOne(type => Wallet)
  wallet: Wallet
  @RelationId((self: MemberToken) => self.wallet)
  walletId: string

  // @ManyToOne(type => TokenContract)
  // tokenContract: TokenContract
  // @RelationId((self: MemberToken) => self.tokenContract)
  // tokenContractId: string

  @ManyToOne(type => Member)
  member: Member
  @RelationId((self: MemberToken) => self.member)
  memberId: string

  @ManyToOne(type => User)
  user: User;
  @RelationId((self: MemberToken) => self.user)
  userId: string;

  @ManyToOne(type => Club)
  club: Club;
  @RelationId((self: MemberToken) => self.club)
  clubId: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  data: Record<string, any>;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  metadata: Record<string, any>;

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
