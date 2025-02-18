import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,

  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import User from './User'
import Club from './Club'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export class UserExtMessageBatch {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => User)
  sender: User;
  @RelationId((self: UserExtMessageBatch) => self.sender)
  senderId: string;

  @ManyToOne(type => Club)
  club: Club;
  @RelationId((self: UserExtMessageBatch) => self.club)
  clubId: string;

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
