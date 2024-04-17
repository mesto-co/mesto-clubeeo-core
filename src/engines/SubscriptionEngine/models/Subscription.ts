import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId, Index, Column,
} from 'typeorm/index';
import PaymentProvider from './PaymentProvider'
import User from '../../../models/User'
import Member from '../../../models/Member'
import Club from '../../../models/Club'
import {ClubeeoPrimaryColumn} from '../../../lib/modelCommon'

@Entity()
@Index(['user', 'club'], {unique: true})
export default class Subscription {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: 'boolean', nullable: false, default: true})
  @Index({})
  enabled: boolean;

  @ManyToOne(type => User)
  user: User;
  @RelationId((self: Subscription) => self.user)
  userId: string;

  @ManyToOne(type => Member)
  member: Member;
  @RelationId((self: Subscription) => self.member)
  memberId: string;

  @ManyToOne(() => Club)
  club: Club;
  @RelationId((self: Subscription) => self.club)
  clubId: string;

  @ManyToOne(() => PaymentProvider)
  paymentProvider: PaymentProvider;
  @RelationId((self: Subscription) => self.paymentProvider)
  paymentProviderId: string;

  @Column({type: String})
  @Index()
  subscriptionExtId: string;

  // @Column({
  //   type: 'json',
  //   array: false,
  //   default: () => "'{}'",
  //   nullable: false,
  // })
  // data: Record<string, any>;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
