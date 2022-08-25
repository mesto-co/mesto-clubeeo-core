import {
  Column,
  CreateDateColumn,
  Entity,
  Index, OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm/index';
import UserExt from './UserExt'
import Wallet from './Wallet'

@Entity()
export default class User {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String, nullable: true})
  @Index({unique: true})
  email: string;

  @Column({type: String, default: ''})
  screenName: string;

  @Column({type: String, default: ''})
  imgUrl: string;

  @Column({type: String, default: ''})
  password: string;

  @Column({type: Boolean, default: false})
  confirmed: boolean;

  @Column({nullable: true})
  @Index({unique: true})
  confirmationSecret: string;

  @Column({nullable: true})
  @Index({unique: true})
  changePasswordSecret: string;

  @Column({nullable: true})
  changePasswordCreatedAt: Date;

  @Column({type: String, default: ''})
  timezone: string;

  @OneToMany(() => UserExt, rel => rel.user)
  userExts: UserExt[];

  @OneToMany(() => Wallet, rel => rel.user)
  wallets: Wallet[];

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
