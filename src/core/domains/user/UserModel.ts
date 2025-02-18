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

  @Column({type: String, nullable: true})
  password: string;

  @Column({type: String, nullable: true})
  screenName: string;

  @Column({type: String, nullable: true})
  timezone: string;

  @Column({type: String, default: 'en'})
  lang: string;

}
