import {
  Column,
  ManyToOne,
  RelationId,
} from 'typeorm'
import UserModel from '../../domains/user/UserModel'
import {Index} from 'typeorm/index'
import {ExtService} from '../../lib/enums'
import ModelBase from '../../models/ModelBase'

export default abstract class UserExtModel<TUser extends UserModel> extends ModelBase {

  @ManyToOne(type => UserModel)
  user: TUser
  @RelationId((self: UserExtModel<TUser>) => self.user)
  userId: string

  @Column({type: String, nullable: true})
  @Index()
  username: string;

  @Column({type: String})
  @Index()
  service: ExtService;

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

  @Column({type: Boolean, default: true})
  enabled: boolean;

}
