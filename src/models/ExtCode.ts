import {
  Column,
  CreateDateColumn,
  Entity, ManyToOne,
   RelationId,
  UpdateDateColumn,
} from 'typeorm'

import {Index} from 'typeorm/index'
import User from './User'
import Club from './Club'
import ClubExt from './ClubExt'
import {ExtService} from '../lib/enums'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

export enum ExtCodeTypes {
  login = 'login',
  loginConfirmed = 'loginConfirmed',
  verify = 'verify',
  webhook = 'webhook',
  activation = 'activation',
}

@Entity()
export default class ExtCode {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => User)
  user: User
  @RelationId((self: ExtCode) => self.user)
  userId: string;

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: ExtCode) => self.club)
  clubId: string;

  @ManyToOne(type => ClubExt)
  clubExt: ClubExt
  @RelationId((self: ExtCode) => self.clubExt)
  clubExtId: string;

  @Column({type: String})
  @Index()
  service: ExtService;

  @Column({type: String})
  @Index()
  codeType: ExtCodeTypes;

  @Column({type: String, nullable: true})
  @Index()
  code: string;

  @Column({type: String, nullable: true})
  @Index()
  extId: string;

  @Column({type: Boolean, default: false})
  used: boolean;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
