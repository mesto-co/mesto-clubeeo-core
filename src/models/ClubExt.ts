import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import {Index} from 'typeorm/index'
import Club from './Club'
import ClubApp from './ClubApp'
import {ExtService} from '../lib/enums'

@Entity()
export default class ClubExt {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: ClubExt) => self.club)
  clubId: number

  @ManyToOne(type => ClubApp)
  clubApp: ClubApp
  @RelationId((self: ClubExt) => self.clubApp)
  clubAppId: number

  @Column({type: String})
  @Index()
  service: ExtService;

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
