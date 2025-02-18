import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId, Index, Column,
  OneToMany,
} from 'typeorm/index';

import User from './User'
import Club from './Club'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';
import MemberRole from './MemberRole';

@Entity()
@Index(['user', 'club'], {unique: true})
export default class Member {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: 'boolean', nullable: false, default: true})
  @Index({})
  enabled: boolean;

  @ManyToOne(type => User)
  user: User;
  @RelationId((self: Member) => self.user)
  userId: string;

  @ManyToOne(() => Club)
  club: Club;
  @RelationId((self: Member) => self.club)
  clubId: string;

  @OneToMany(() => MemberRole, mr => mr.member)
  memberRoles: MemberRole[];

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  state: Record<string, any>;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}

export { Member };