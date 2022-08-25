import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  RelationId, OneToMany,
} from 'typeorm/index';

import Club from './Club'
import ClubRoleToken from './ClubRoleToken'
import UserClubRole from './UserClubRole'
import ClubAppRole from './ClubAppRole'

@Entity()
export default class ClubRole {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String, default: ''})
  name: string;

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: ClubRole) => self.club)
  clubId: number

  @OneToMany(() => ClubRoleToken, clubRoleToken => clubRoleToken.clubRole)
  clubRoleTokens: ClubRoleToken[];

  @OneToMany(() => UserClubRole, userClubRole => userClubRole.clubRole)
  userClubRoles: UserClubRole[];

  @OneToMany(() => ClubAppRole, clubAppRole => clubAppRole.clubRole)
  clubAppRoles: ClubAppRole[];

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
