import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId, Index, Column,
} from 'typeorm/index';

import User from './User'
import Club from './Club'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class Session {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => User)
  user: User;
  @RelationId((self: Session) => self.user)
  userId: string;

  @ManyToOne(() => Club)
  club: Club;
  @RelationId((self: Session) => self.club)
  clubId: string;

  @Column({type: String})
  @Index()
  sessionId: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  data: Record<string, string>;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
