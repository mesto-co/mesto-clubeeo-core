import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  RelationId, OneToMany,
} from 'typeorm/index';

import ClubRole from './ClubRole'
import TokenContract from './TokenContract'
import UserClubRole from './UserClubRole'

@Entity()
export default class ClubRoleToken {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => ClubRole)
  clubRole: ClubRole;
  @RelationId((self: ClubRoleToken) => self.clubRole)
  clubRoleId: number;

  @ManyToOne(type => TokenContract)
  tokenContract: TokenContract;
  @RelationId((self: ClubRoleToken) => self.tokenContract)
  tokenContractId: number;

  @OneToMany(() => UserClubRole, userClubRole => userClubRole.clubRoleToken)
  userClubRoles: UserClubRole[];

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
