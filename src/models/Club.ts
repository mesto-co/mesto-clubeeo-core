import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId, OneToMany,
} from 'typeorm/index';

import User from './User'
import ClubExt from './ClubExt'
import MemberRole from './MemberRole'
import {Index} from 'typeorm'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon'

export interface IClubBuyLinks {
  opensea: string
  rarible: string
}

export interface IClubRoadmap {
  entries: IClubRoadmapEntry[]
}

export interface IClubRoadmapEntry {
  title: string
  text: string
  when: string
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
  clubPostsCarouselAppId?: number
  defaultRoles?: string[]
  defaultLang?: string
}

@Entity()
export default class Club {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String, default: ''})
  name: string;

  @Column({type: String, default: ''})
  @Index({unique: true})
  slug: string;

  @ManyToOne(type => User)
  user: User
  @RelationId((self: Club) => self.user)
  userId: string

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
  roadmap: Partial<IClubRoadmap>;

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

  @OneToMany(() => MemberRole, rel => rel.club)
  userClubRoles: MemberRole[];

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
