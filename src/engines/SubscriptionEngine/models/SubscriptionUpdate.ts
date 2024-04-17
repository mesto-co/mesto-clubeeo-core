import {
  CreateDateColumn,
  Entity,

  ManyToOne,
  RelationId, Index, Column,
} from 'typeorm/index';

import Subscription from './Subscription'
import PaymentProvider from './PaymentProvider'
import PaymentProviderEvent from './PaymentProviderEvent'
import Club from '../../../models/Club'
import {ClubeeoPrimaryColumn} from '../../../lib/modelCommon'

@Entity()
export default class SubscriptionUpdate {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => Subscription)
  subscription: Subscription;
  @RelationId((self: SubscriptionUpdate) => self.subscription)
  subscriptionId: string;

  @ManyToOne(() => Club)
  club: Club;
  @RelationId((self: SubscriptionUpdate) => self.club)
  clubId: string;

  @ManyToOne(() => PaymentProvider)
  paymentProvider: PaymentProvider;
  @RelationId((self: SubscriptionUpdate) => self.paymentProvider)
  paymentProviderId: string;

  @ManyToOne(() => PaymentProviderEvent)
  paymentProviderEvent: PaymentProviderEvent;
  @RelationId((self: SubscriptionUpdate) => self.paymentProviderEvent)
  paymentProviderEventId: string;

  @Column({type: String})
  @Index()
  subscriptionExtId: string;

  @Column({type: String})
  @Index()
  updateExtId: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  state: Record<string, any>;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

}
