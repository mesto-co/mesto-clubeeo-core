import {
  Column,
  Index,
} from 'typeorm/index';
import ModelBase from '../../models/ModelBase';
import { IUserModel } from './UserInterfaces';

export default abstract class UserModel extends ModelBase implements IUserModel {

  @Column({type: String, nullable: true})
  @Index({unique: true})
  email: string;

  @Column({type: String})
  password: string;

  @Column({type: String})
  screenName: string;

  @Column({type: String})
  timezone: string;

  @Column({type: String})
  lang: string;

}
