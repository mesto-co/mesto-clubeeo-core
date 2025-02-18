import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  RelationId, Index,
} from 'typeorm/index';

import User from './User'
import Club from './Club'
import ClubRole from './ClubRole'

@Entity()
export default class UserClubRole {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'boolean', nullable: false, default: false})
  @Index({})
  enabled: boolean;

  @ManyToOne(type => User)
  user: User;
  @RelationId((self: UserClubRole) => self.user)
  userId: number;

  @ManyToOne(() => Club)
  club: Club;
  @RelationId((self: UserClubRole) => self.club)
  clubId: number;

  @ManyToOne(() => ClubRole)
  clubRole: ClubRole;
  @RelationId((self: UserClubRole) => self.clubRole)
  clubRoleId: number;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
