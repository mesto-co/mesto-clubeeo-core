import {
  Column,
  CreateDateColumn,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm/index';
import ModelBase from './ModelBase';

export default abstract class UserModel extends ModelBase {

  @Column({type: String, nullable: true})
  @Index({unique: true})
  email: string;

  @Column({type: String, default: ''})
  password: string;

  @Column({type: String, default: ''})
  screenName: string;

  @Column({type: String, default: ''})
  timezone: string;

  @Column({type: String, default: ''})
  lang: string;

}
