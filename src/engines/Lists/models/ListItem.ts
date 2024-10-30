import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  RelationId,
  Index,
} from 'typeorm';

import {env} from 'clubeeo-core';
import ListType from './ListType';

const ClubeeoPrimaryColumn = () => {
  return PrimaryGeneratedColumn(env.databasePkStrategy, env.databasePkOptions)
}

@Entity()
export default class ListItem {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => ListType)
  group: ListType;
  @RelationId((self: ListItem) => self.group)
  groupId: string;

  @Column({type: String})
  @Index()
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

  @Column({
    type: Boolean,
    default: true,
    nullable: false,
  })
  enable: boolean

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}


