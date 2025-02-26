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

// Add this interface above the ClubExt class
interface ClubExtCached {
  chatInviteLink?: string;
  isForum?: boolean;
  generalTopicId?: number | null;
  name?: string;
}

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
  cached: ClubExtCached;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  debugData: object;

  @Column({ type: Boolean, default: false })
  removed: boolean;

  @Column({ type: Boolean, default: false })
  isAdmin: boolean;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
