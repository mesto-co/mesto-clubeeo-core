import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId, Index,
} from 'typeorm/index';

import User from './User'
import Club from './Club'
import ClubRole from './ClubRole'
import ClubRoleToken from './ClubRoleToken'
import Member from './Member'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class MemberRole {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: 'boolean', nullable: false, default: false})
  @Index({})
  enabled: boolean;

  @ManyToOne(type => User)
  user: User;
  @RelationId((self: MemberRole) => self.user)
  userId: string;

  @ManyToOne(() => Club)
  club: Club;
  @RelationId((self: MemberRole) => self.club)
  clubId: string;

  @ManyToOne(type => Member)
  member: Member
  @RelationId((self: MemberRole) => self.member)
  memberId: string

  @ManyToOne(() => ClubRole)
  clubRole: ClubRole;
  @RelationId((self: MemberRole) => self.clubRole)
  clubRoleId: string;

  @ManyToOne(() => ClubRoleToken)
  clubRoleToken: ClubRoleToken;
  @RelationId((self: MemberRole) => self.clubRoleToken)
  clubRoleTokenId: string;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
