import {
  Column,
  Entity,
  ManyToOne,
} from 'typeorm'
import User from './User'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';
import UserExtModel from '../core/domains/userExt/UserExtModel';

@Entity()
export default class UserExt extends UserExtModel<User> {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: Boolean, default: true})
  enabled: boolean;

  @ManyToOne(type => User)
  user: User;

}
