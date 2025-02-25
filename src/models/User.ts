import {
  Column,
  Entity,
  Index, ManyToOne, OneToMany,
  RelationId,
} from 'typeorm/index';
import UserExt from './UserExt'
import MemberRole from './MemberRole'
import Club from './Club'
import Member from './Member'
import MemberBadge from './MemberBadge'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';
import UserModel from '../core/domains/user/UserModel';

@Entity()
export default class User extends UserModel {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String, default: ''})
  imgUrl: string;

  @Column({type: Boolean, default: false})
  confirmed: boolean;

  @Column({nullable: true})
  @Index({unique: true})
  confirmationSecret: string;

  @Column({nullable: true})
  @Index({unique: true})
  changePasswordSecret: string;

  @Column({nullable: true})
  changePasswordCreatedAt: Date;

  @Column({type: String, default: 'en'})
  lang: string;

  @OneToMany(() => Member, rel => rel.user)
  memberships: Member[];

  @OneToMany(() => MemberRole, rel => rel.user)
  userClubRoles: MemberRole[];

  @OneToMany(() => MemberBadge, rel => rel.user)
  badges: MemberBadge[];

  @OneToMany(() => UserExt, rel => rel.user)
  userExts: UserExt[];

  @ManyToOne(() => Club)
  activeClub: Club;
  @RelationId((self: User) => self.activeClub)
  activeClubId: string;

  get avatarUrl(): string {
    return `/api/engines/telegram/userAvatar/${this.id}`;
  }

}
