import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  RelationId,
} from 'typeorm/index';

import User from './User'
import {TChains} from '../lib/TChains'


@Entity()
export default class Wallet {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String, default: ''})
  address: string;

  @Column({type: String, default: ''})
  chain: TChains;

  @ManyToOne(type => User)
  user: User
  @RelationId((self: Wallet) => self.user)
  userId: number

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
