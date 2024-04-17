import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import Club from './Club'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class ClubList {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => Club)
  club: Club;
  @RelationId((self: ClubList) => self.club)
  clubId: string;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
