import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import {Unique} from 'typeorm/index'
import Club from '../../../models/Club';
import ClubApp from './ClubApp'
import {ClubeeoPrimaryColumn} from '../../../lib/modelCommon'

export interface IClubAppConfig {
  syncRoles: Array<string>
}

@Entity()
@Unique(['clubApp', 'key'])
export default class ClubAppProp {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: ClubApp) => self.club)
  clubId: string

  @ManyToOne(type => ClubApp)
  clubApp: ClubApp
  @RelationId((self: ClubAppProp) => self.clubApp)
  clubAppId: string

  @Column({type: String})
  @Index()
  key: string;

  @Column({type: String})
  @Index()
  value: string;

  @Column({type: String})
  @Index()
  appKey: string;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
