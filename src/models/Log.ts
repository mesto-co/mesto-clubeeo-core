import {
  Column,
  CreateDateColumn,
  Entity, Index,
} from 'typeorm/index';
import {ILoggerLevels} from 'bricks-ts-logger'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export class Log {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String, nullable: false})
  @Index()
  level: ILoggerLevels;

  @Column({type: String, default: ''})
  message: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  data: object;

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date

}
