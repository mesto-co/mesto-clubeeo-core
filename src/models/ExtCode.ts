import {
  Column,
  CreateDateColumn,
  Entity, ManyToOne,
  PrimaryGeneratedColumn, RelationId,
  UpdateDateColumn,
} from 'typeorm'

import {Index} from 'typeorm/index'
import User from './User'
import Club from './Club'
import ClubExt from './ClubExt'
import {ExtService} from '../lib/enums'

export enum ExtCodeTypes {
  login = 'login',
  verify = 'verify',
  activation = 'activation',
}

@Entity()
export default class ExtCode {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => User)
  user: User
  @RelationId((self: ExtCode) => self.user)
  userId: number;

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: ExtCode) => self.club)
  clubId: number;

  @ManyToOne(type => ClubExt)
  clubExt: ClubExt
  @RelationId((self: ExtCode) => self.clubExt)
  clubExtId: number;

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
