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
import {ClubeeoPrimaryColumn} from '../lib/modelCommon'
import ClubModel from '../core/models/ClubModel';

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
export default class Club extends ClubModel<Partial<IClubSettings>> {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => User)
  user: User
  @RelationId((self: Club) => self.user)
  userId: string

  @OneToMany(() => ClubExt, clubExt => clubExt.club)
  clubExts: ClubExt[];

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
  roadmap: Partial<IClubRoadmap>;

  @OneToMany(() => MemberRole, rel => rel.club)
  userClubRoles: MemberRole[];

}
