import {
  Column,
  CreateDateColumn,
  Entity, ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import Club from './Club'
import ClubBadge from './ClubBadge'
import User from './User'
import {Index} from 'typeorm/index'
import Member from './Member'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class MemberBadge {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: MemberBadge) => self.club)
  clubId: string

  @ManyToOne(type => ClubBadge)
  clubBadge: ClubBadge
  @RelationId((self: MemberBadge) => self.clubBadge)
  clubBadgeId: string

  @ManyToOne(type => User)
  user: User
  @RelationId((self: MemberBadge) => self.user)
  userId: string

  @ManyToOne(type => Member)
  member: Member
  @RelationId((self: MemberBadge) => self.member)
  memberId: string

  @Column({type: Number, nullable: true})
  index: number;

  @Column({type: Number, default: 0})
  @Index()
  value: number;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
