import {
  Column,
  CreateDateColumn,
  Entity,

  UpdateDateColumn,
  ManyToOne,
  RelationId,
} from 'typeorm/index';

import Post from './Post'
import Club from './Club'
import User from './User'
import ClubApp from '../engines/AppsEngine/models/ClubApp'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class PostComment {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String, default: ''})
  text: string;

  @ManyToOne(type => Post)
  post: Post
  @RelationId((self: PostComment) => self.post)
  postId: string

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: PostComment) => self.club)
  clubId: string

  @ManyToOne(type => ClubApp)
  clubApp: ClubApp
  @RelationId((self: Post) => self.clubApp)
  clubAppId: string

  @ManyToOne(type => User)
  user: User
  @RelationId((self: PostComment) => self.user)
  userId: string

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
