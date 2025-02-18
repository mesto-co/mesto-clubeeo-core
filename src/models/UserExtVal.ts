import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
  Index,
} from 'typeorm'
import UserExt from './UserExt'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export class UserExtVal {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => UserExt)
  userExt: UserExt;
  @RelationId((self: UserExtVal) => self.userExt)
  userExtId: string;

  @Column({type: String})
  @Index()
  key: string;

  @Column({type: String})
  value: string;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
