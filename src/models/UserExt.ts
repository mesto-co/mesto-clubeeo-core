import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import User from './User'
import {Index} from 'typeorm/index'
import {ExtService} from '../lib/enums'

@Entity()
export default class UserExt {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => User)
  user: User
  @RelationId((self: UserExt) => self.user)
  userId: number

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
