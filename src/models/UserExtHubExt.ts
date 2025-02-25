import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import User from './User'
import UserExt from './UserExt'
import HubExt from './ClubExt'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';
import {TExtServices} from '../lib/enums'

@Entity()
export default class UserExtHubExt {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: Boolean, default: true})
  enabled: boolean;

  @ManyToOne(type => User)
  user: User;
  @RelationId((self: UserExtHubExt) => self.user)
  userId: string

  @ManyToOne(type => UserExt)
  userExt: UserExt;
  @RelationId((self: UserExtHubExt) => self.userExt)
  userExtId: string

  @ManyToOne(type => HubExt)
  hubExt: HubExt;
  @RelationId((self: UserExtHubExt) => self.hubExt)
  hubExtId: string

  @Column({type: String, nullable: true})
  @Index()
  username: string;

  @Column({type: String})
  @Index()
  service: TExtServices | string;

  @Column({type: String})
  @Index()
  extId: string;

  @Column({type: String, nullable: true})
  @Index()
  lang: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  data: object;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  debugData: object;

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
