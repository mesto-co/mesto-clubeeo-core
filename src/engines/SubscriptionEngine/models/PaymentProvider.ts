import {
  CreateDateColumn,
  Entity,

  UpdateDateColumn,
  Index, Column,
} from 'typeorm/index';
import {ClubeeoPrimaryColumn} from '../../../lib/modelCommon'


export enum PaymentProviders {
  manual = 'manual',
  paddle = 'paddle',
}

@Entity()
export default class PaymentProvider {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String})
  @Index()
  provider: PaymentProviders;

  @Column({type: String})
  @Index({unique: true})
  providerKey: PaymentProviders;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  config: Record<string, any>;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
