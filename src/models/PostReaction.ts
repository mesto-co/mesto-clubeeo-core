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
import ClubApp from '../engines/AppEngine/models/ClubApp'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

export enum PostReactionTypes {
  upvote = 'upvote',
  downvote = 'downvote',
  fire = 'fire', //todo: setup in app
  heart = 'heart',
  think = 'think',
}

@Entity()
export default class PostReaction {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String})
  reaction: PostReactionTypes;

  @ManyToOne(type => Post)
  post: Post
  @RelationId((self: PostReaction) => self.post)
  postId: string

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: PostReaction) => self.club)
  clubId: string

  @ManyToOne(type => ClubApp)
  clubApp: ClubApp
  @RelationId((self: Post) => self.clubApp)
  clubAppId: string

  @ManyToOne(type => User)
  user: User
  @RelationId((self: PostReaction) => self.user)
  userId: string

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
