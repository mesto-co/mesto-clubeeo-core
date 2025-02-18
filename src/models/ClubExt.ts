import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import {Index} from 'typeorm/index'
import Club from './Club'
import {TExtServices} from './../lib/enums'
import ClubApp from '../engines/AppsEngine/models/ClubApp'
import {ClubeeoPrimaryColumn} from './../lib/modelCommon'

@Entity()
export default class ClubExt {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: ClubExt) => self.club)
  clubId: string

  @ManyToOne(type => ClubApp)
  clubApp: ClubApp
  @RelationId((self: ClubExt) => self.clubApp)
  clubAppId: string

  @Column({type: String})
  @Index()
  service: TExtServices | string;

  @Column({type: String})
  @Index()
  extId: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  cached: object;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  debugData: object;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
