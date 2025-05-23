import { ClubeeoPrimaryColumn } from '../../../lib/modelCommon';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';


@Entity()
export default class ListType {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String})
  @Index({unique: true})
  slug: string;

  @Column({type: String})
  name: string;

  @Column({type: String, default: '', nullable: false})
  hint: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  data: Record<string, string>;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}


