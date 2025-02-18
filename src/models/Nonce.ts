import {
  Column,
  CreateDateColumn,
  Entity,
  Index,

  UpdateDateColumn,
} from 'typeorm';
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class Nonce {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String})
  @Index({unique: true})
  nonce: string;

  @Column({type: Boolean, default: false})
  verified: boolean;

  @Column({type: String, default: ''})
  @Index()
  address: string;

  @Column({type: String, default: ''})
  protocol: string;

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
