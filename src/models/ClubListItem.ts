import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import ClubList from './ClubList'
import User from './User'
import Wallet from './Wallet'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class ClubListItem {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => ClubList)
  clubList: ClubList;
  @RelationId((self: ClubListItem) => self.clubList)
  clubListId: string;

  @ManyToOne(type => User)
  user: User;
  @RelationId((self: ClubListItem) => self.user)
  userId: string;

  @ManyToOne(type => Wallet)
  wallet: Wallet;
  @RelationId((self: ClubListItem) => self.wallet)
  walletId: string;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
