import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import Club from './Club'
import User from './User'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon'

@Entity()
export default class ClubFormApplication {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => Club)
  club: Club;
  @RelationId((self: ClubFormApplication) => self.club)
  clubId: string;

  @ManyToOne(type => User, {nullable: true})
  user: User;
  @RelationId((self: ClubFormApplication) => self.user)
  userId: string;

  @Column({type: String, default: ''})
  formType: string;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
