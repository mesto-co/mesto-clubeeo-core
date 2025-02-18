import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId,
} from 'typeorm/index';

import Club from './Club'
import User from './User'
import Event from './Event'
import Trigger from './Trigger'
import ClubApp from '../engines/AppsEngine/models/ClubApp'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

export enum TaskState {
  pending,
  done,
  processing,
  failed,
}

@Entity()
export default class Task {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String})
  taskType: string; // creates task with type

  @Column({type: Number, default: 0})
  state: TaskState;

  @ManyToOne(type => ClubApp)
  clubApp: ClubApp
  @RelationId((self: Task) => self.clubApp)
  clubAppId: string

  @ManyToOne(type => Event)
  event: Event
  @RelationId((self: Task) => self.event)
  eventId: string

  @ManyToOne(type => Trigger)
  trigger: Trigger
  @RelationId((self: Task) => self.trigger)
  triggerId: string

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: Task) => self.club)
  clubId: string

  @ManyToOne(type => User)
  user: User
  @RelationId((self: Task) => self.user)
  userId: string

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  data: Record<string, any>;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  result: Record<string, any>;

  @Column({type: 'timestamp', nullable: true})
  lockedAt: Date;

  @Column({type: 'timestamp', nullable: true})
  errorAt: Date;

  @Column({type: 'timestamp', nullable: true})
  doneAt: Date;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
