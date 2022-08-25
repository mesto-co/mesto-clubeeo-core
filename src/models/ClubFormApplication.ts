import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import Club from './Club'
import User from './User'

@Entity()
export default class ClubFormApplication {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Club)
  club: Club;
  @RelationId((self: ClubFormApplication) => self.club)
  clubId: number;

  @ManyToOne(type => User, {nullable: true})
  user: User;
  @RelationId((self: ClubFormApplication) => self.user)
  userId: number;

  @Column({type: String, default: ''})
  formType: string;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
