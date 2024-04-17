import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId, OneToMany,
} from 'typeorm/index';

import ClubRole from './ClubRole'
import TokenContract from './TokenContract'
import MemberRole from './MemberRole'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class ClubRoleToken {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => ClubRole)
  clubRole: ClubRole;
  @RelationId((self: ClubRoleToken) => self.clubRole)
  clubRoleId: string;

  @ManyToOne(type => TokenContract)
  tokenContract: TokenContract;
  @RelationId((self: ClubRoleToken) => self.tokenContract)
  tokenContractId: string;

  @OneToMany(() => MemberRole, userClubRole => userClubRole.clubRoleToken)
  userClubRoles: MemberRole[];

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
