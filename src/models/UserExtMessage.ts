import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,

  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import UserExt from './UserExt'
import User from './User'
import {UserExtMessageBatch} from './UserExtMessageBatch'
import Club from './Club'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export class UserExtMessage {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => User)
  user: User;
  @RelationId((self: UserExtMessage) => self.user)
  userId: string;

  @ManyToOne(type => UserExt)
  userExt: UserExt;
  @RelationId((self: UserExtMessage) => self.userExt)
  userExtId: string;

  @ManyToOne(type => User)
  sender: User;
  @RelationId((self: UserExtMessageBatch) => self.sender)
  senderId: string;

  @ManyToOne(type => Club)
  club: Club;
  @RelationId((self: UserExtMessage) => self.club)
  clubId: string;

  @ManyToOne(type => UserExtMessageBatch)
  batch: UserExtMessageBatch;
  @RelationId((self: UserExtMessage) => self.batch)
  batchId: string;

  @Column({type: String})
  message: string;

  @Column({type: Boolean, default: true})
  isSent: boolean;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
