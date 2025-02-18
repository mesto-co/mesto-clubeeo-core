import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId,
} from 'typeorm/index';

import Club from './Club'
import User from './User'
import ClubApp from '../engines/AppsEngine/models/ClubApp'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';
import Member from './Member'

@Entity()
export default class Post {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String, default: ''})
  text: string;

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: Post) => self.club)
  clubId: string

  @ManyToOne(type => ClubApp)
  clubApp: ClubApp
  @RelationId((self: Post) => self.clubApp)
  clubAppId: string

  @ManyToOne(type => Member)
  author: Member
  @RelationId((self: Post) => self.author)
  authorId: string

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}

export interface IPostEdit {
  text: string
  clubId: string
  clubAppId: string
}
