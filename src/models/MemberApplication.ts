import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
  Index
} from 'typeorm/index';

import User from './User';
import Club from './Club';
import Member from './Member';
import { ClubeeoPrimaryColumn } from '../lib/modelCommon';

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum CommunityType {
  LAB = 'lab',
  PRO = 'pro',
  COUNCIL = 'council',
  KITCHEN = 'kitchen'
}

@Entity()
@Index(['user', 'club'], { unique: true })
export default class MemberApplication {
  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(() => User)
  user: User;
  @RelationId((self: MemberApplication) => self.user)
  userId: string;

  @ManyToOne(() => Club)
  club: Club;
  @RelationId((self: MemberApplication) => self.club)
  clubId: string;

  @ManyToOne(() => Member, { nullable: true })
  member: Member;
  @RelationId((self: MemberApplication) => self.member)
  memberId: string;

  @Column({ type: 'varchar', default: ApplicationStatus.PENDING })
  status: ApplicationStatus;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  city: string;

  @Column({ type: 'text' })
  about: string;

  @Column({ type: 'text' })
  goals: string;

  @Column({ type: 'varchar', length: 50 })
  communityType: CommunityType;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  socialLinks: string[];

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  additionalData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 