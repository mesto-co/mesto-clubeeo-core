import {Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';

@Entity()
export default class TgUserState {

  @PrimaryGeneratedColumn()
  id: number;

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
