import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import UserExt from './UserExt'
import User from './User'
import {UserExtMessageBatch} from './UserExtMessageBatch'
import Club from './Club'

@Entity()
export class UserExtMessage {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => User)
  user: User;
  @RelationId((self: UserExtMessage) => self.user)
  userId: number;

  @ManyToOne(type => UserExt)
  userExt: UserExt;
  @RelationId((self: UserExtMessage) => self.userExt)
  userExtId: number;

  @ManyToOne(type => User)
  sender: User;
  @RelationId((self: UserExtMessageBatch) => self.sender)
  senderId: number;

  @ManyToOne(type => Club)
  club: Club;
  @RelationId((self: UserExtMessage) => self.club)
  clubId: number;

  @ManyToOne(type => UserExtMessageBatch)
  batch: UserExtMessageBatch;
  @RelationId((self: UserExtMessage) => self.batch)
  batchId: number;

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
