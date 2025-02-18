import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId, OneToMany,
  Unique,
} from 'typeorm';

import Club from './Club'
import MemberRole from './MemberRole'
import ClubAppRole from '../engines/AppsEngine/models/ClubAppRole'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
@Unique(['name', 'club'])
export default class ClubRole {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String, default: ''})
  name: string;

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: ClubRole) => self.club)
  clubId: string

  @OneToMany(() => MemberRole, userClubRole => userClubRole.clubRole)
  userClubRoles: MemberRole[];

  @OneToMany(() => ClubAppRole, clubAppRole => clubAppRole.clubRole)
  clubAppRoles: ClubAppRole[];

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
