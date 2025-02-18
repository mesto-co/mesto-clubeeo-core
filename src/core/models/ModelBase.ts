import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm/index';

export interface IModelBase {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export default abstract class ModelBase implements IModelBase {

  @PrimaryGeneratedColumn('increment', {type: 'bigint'})
  id: string;

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
