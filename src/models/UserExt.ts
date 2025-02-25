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
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';
import {TExtServices} from '../lib/enums'

@Entity()
export default class UserExt {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: Boolean, default: true})
  enabled: boolean;

  @ManyToOne(type => User)
  user: User;
  @RelationId((self: UserExt) => self.user)
  userId: string

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

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
