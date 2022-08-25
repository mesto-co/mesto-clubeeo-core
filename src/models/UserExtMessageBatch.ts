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
import Club from './Club'

@Entity()
export class UserExtMessageBatch {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => User)
  sender: User;
  @RelationId((self: UserExtMessageBatch) => self.sender)
  senderId: number;

  @ManyToOne(type => Club)
  club: Club;
  @RelationId((self: UserExtMessageBatch) => self.club)
  clubId: number;

  @Column({type: String})
  message: string;

  @Column({type: Boolean, default: true})
  isSent: boolean;

  @Column({type: Number, default: 0})
  counter: number;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  data: object;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
