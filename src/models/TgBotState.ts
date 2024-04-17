import {Column, CreateDateColumn, Entity, Index,  UpdateDateColumn} from 'typeorm';
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class TgBotState {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column('bigint')
  @Index()
  tgChatId: number;

  @Column({type: String})
  @Index()
  status: string;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
