import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  RelationId, Column,
} from 'typeorm/index';

import PaymentProvider from './PaymentProvider'
import {ClubeeoPrimaryColumn} from '../../../lib/modelCommon'

@Entity()
export default class PaymentProviderEvent {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(() => PaymentProvider)
  paymentProvider: PaymentProvider;
  @RelationId((self: PaymentProviderEvent) => self.paymentProvider)
  paymentProviderId: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  data: Record<string, any>;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

}
