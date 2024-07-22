import {
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  Index, Column,
  Unique,
} from 'typeorm/index';
import {ClubeeoPrimaryColumn} from '../../../lib/modelCommon'

@Entity()
@Unique(['code', 'lang'])
export default class Translation {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String})
  @Index()
  code: string;

  @Column({type: String})
  @Index()
  lang: string;

  @Column({type: String})
  template: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  defaults: Record<string, any>;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
