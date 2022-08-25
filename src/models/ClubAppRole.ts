import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import ClubRole from './ClubRole'
import ClubApp from './ClubApp'

@Entity()
export default class ClubAppRole {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => ClubApp)
  clubApp: ClubApp;
  @RelationId((self: ClubAppRole) => self.clubApp)
  clubAppId: number;

  @ManyToOne(type => ClubRole)
  clubRole: ClubRole;
  @RelationId((self: ClubAppRole) => self.clubRole)
  clubRoleId: number;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
