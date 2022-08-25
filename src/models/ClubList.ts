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

@Entity()
export default class ClubList {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Club)
  club: Club;
  @RelationId((self: ClubList) => self.club)
  clubId: number;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
