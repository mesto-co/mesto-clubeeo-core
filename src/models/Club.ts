import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  RelationId, OneToMany,
} from 'typeorm/index';

import User from './User'
import ClubExt from './ClubExt'
import UserClubRole from './UserClubRole'
import {Index} from 'typeorm'

export interface IClubBuyLinks {
  opensea: string
  rarible: string
}

export interface IClubSocialLinks {
  telegram: string
  discord: string
  instagram: string
  twitter: string
  etherscan: string
  web: string
}

export interface IClubStyle {
  color: string
  textColor: string
  primaryColor: string
  primaryTextColor: string
  font: string
  socialColor: string
  socialTextColor: string
  heroImg: string
  logoImg: string
}

export interface IClubSettings {
  eth?: {
    enabled: boolean
  }
  near?: {
    enabled: boolean,
  }
}

@Entity()
export default class Club {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String, default: ''})
  name: string;

  @Column({type: String, default: ''})
  @Index({unique: true})
  slug: string;

  @ManyToOne(type => User)
  user: User
  @RelationId((self: Club) => self.user)
  userId: number

  @OneToMany(() => ClubExt, clubExt => clubExt.club)
  clubExts: ClubExt[];

  @Column({type: String, default: ''})
  description: string;

  @Column({type: String, default: ''})
  welcome: string;

  @Column({type: String, default: ''})
  website: string;

  // cached
  @Column({type: Number, nullable: true})
  itemsCount: number;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  buyLinks: Partial<IClubBuyLinks>;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  socialLinks: Partial<IClubSocialLinks>;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  style: Partial<IClubStyle>;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  settings: Partial<IClubSettings>;

  @OneToMany(() => UserClubRole, rel => rel.club)
  userClubRoles: UserClubRole[];

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
