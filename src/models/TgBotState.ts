import {Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';

@Entity()
export default class TgBotState {

  @PrimaryGeneratedColumn()
  id: number;

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
