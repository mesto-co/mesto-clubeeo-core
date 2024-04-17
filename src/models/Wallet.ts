import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId,
} from 'typeorm/index';

import User from './User'
import {TChains} from '../lib/TChains'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';


@Entity()
export default class Wallet {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String, default: ''})
  address: string;

  @Column({type: String, default: ''})
  chain: TChains;

  @ManyToOne(type => User)
  user: User
  @RelationId((self: Wallet) => self.user)
  userId: string

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
