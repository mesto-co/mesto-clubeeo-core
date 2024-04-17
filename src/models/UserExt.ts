import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,

  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import User from './User'
import {Index} from 'typeorm/index'
import {ExtService} from '../lib/enums'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class UserExt {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => User)
  user: User
  @RelationId((self: UserExt) => self.user)
  userId: string

  @Column({type: String})
  @Index()
  service: ExtService;

  @Column({type: String})
  @Index()
  extId: string;

  @Column({type: String, nullable: true})
  @Index()
  lang: string;

  @Column({type: String, nullable: true})
  @Index()
  username: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  data: object;

  @Column({type: Boolean, default: true})
  enabled: boolean;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
