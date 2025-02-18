import {Column, CreateDateColumn, Entity, Index,  UpdateDateColumn} from 'typeorm';
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class TgUserState {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column('bigint')
  @Index()
  tgChatId: number;

  @Column('bigint')
  @Index()
  tgUserId: number;

  @Column({type: Boolean})
  isBanned: boolean;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
