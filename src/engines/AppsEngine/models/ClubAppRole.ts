import {
  CreateDateColumn,
  Column,
  Entity,
  ManyToOne,
  RelationId,
  UpdateDateColumn, Index,
} from 'typeorm'
import ClubRole from '../../../models/ClubRole';
import ClubApp from './ClubApp'
import {ClubeeoPrimaryColumn} from '../../../lib/modelCommon'

@Entity()
export default class ClubAppRole {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => ClubApp)
  clubApp: ClubApp;
  @RelationId((self: ClubAppRole) => self.clubApp)
  clubAppId: string;

  @ManyToOne(type => ClubRole)
  clubRole: ClubRole;
  @RelationId((self: ClubAppRole) => self.clubRole)
  clubRoleId: string;

  @Column({type: String, default: 'page:'})
  @Index()
  accessTo: string;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
