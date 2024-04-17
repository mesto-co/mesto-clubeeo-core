import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId, OneToMany,
} from 'typeorm/index';

import Club from './Club'
import User from './User'
import ClubApp from '../engines/AppEngine/models/ClubApp'
import Task from './Task'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
export default class Event {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String})
  eventType: string; // triggered on

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: Event) => self.club)
  clubId: string

  @ManyToOne(type => ClubApp)
  clubApp: ClubApp
  @RelationId((self: Event) => self.clubApp)
  clubAppId: string

  @ManyToOne(type => User)
  user: User
  @RelationId((self: Event) => self.user)
  userId: string

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  data: Record<string, any>;

  @OneToMany(() => Task, task => task.event)
  actions: Task[];

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
