import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId,
} from 'typeorm/index';

import Club from './Club'
import Post from './Post'
import ClubExt from './ClubExt'
import ClubApp from '../engines/AppEngine/models/ClubApp'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class Posted {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String, default: ''})
  text: string;

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: Posted) => self.club)
  clubId: string

  @ManyToOne(type => ClubApp)
  clubApp: ClubApp
  @RelationId((self: Posted) => self.clubApp)
  clubAppId: string

  @ManyToOne(type => Post)
  post: Post
  @RelationId((self: Posted) => self.post)
  postId: string

  @ManyToOne(type => ClubExt)
  clubExt: ClubExt
  @RelationId((self: Posted) => self.clubExt)
  clubExtId: string

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
