import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import ClubList from './ClubList'
import User from './User'
import Wallet from './Wallet'

@Entity()
export default class ClubListItem {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => ClubList)
  clubList: ClubList;
  @RelationId((self: ClubListItem) => self.clubList)
  clubListId: number;

  @ManyToOne(type => User)
  user: User;
  @RelationId((self: ClubListItem) => self.user)
  userId: number;

  @ManyToOne(type => Wallet)
  wallet: Wallet;
  @RelationId((self: ClubListItem) => self.wallet)
  walletId: number;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
