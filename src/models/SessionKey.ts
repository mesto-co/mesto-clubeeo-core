import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  RelationId, Index, Column,
} from 'typeorm/index';

import User from './User'
import Club from './Club'
import Session from './Session'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
@Index(['club', 'key', 'value'])
export default class SessionKey {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => User)
  user: User;
  @RelationId((self: SessionKey) => self.user)
  userId: string;

  @ManyToOne(() => Club)
  club: Club;
  @RelationId((self: SessionKey) => self.club)
  clubId: string;

  @ManyToOne(() => Session)
  session: SessionKey;
  @RelationId((self: SessionKey) => self.session)
  sessionId: string;

  @Column({type: String})
  key: string;

  @Column({type: String})
  value: string;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

}
