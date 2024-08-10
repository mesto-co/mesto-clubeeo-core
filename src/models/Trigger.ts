import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId,
} from 'typeorm/index';

import Club from './Club'
import {Index} from 'typeorm'
import {ITriggerProcessor} from '../engines/MotionEngine/TaskBuilderInterfaces'
import ClubApp from '../engines/AppsEngine/models/ClubApp'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon';

@Entity()
@Index(['club', 'eventType'])
export default class Trigger {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String, default: ''})
  name: string;

  @Column({type: String})
  eventType: string; // triggered on

  @Column({type: String})
  taskType: string; // creates task with type

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: Trigger) => self.club)
  clubId: string

  @ManyToOne(type => ClubApp)
  eventClubApp: ClubApp
  @RelationId((self: Trigger) => self.eventClubApp)
  eventClubAppId: string

  @ManyToOne(type => ClubApp)
  taskClubApp: ClubApp
  @RelationId((self: Trigger) => self.taskClubApp)
  taskClubAppId: string

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  eventProps: Record<string, any>;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  actionProps: Record<string, any>;

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
  processor: ITriggerProcessor;

  @Column({type: Boolean, default: true})
  enabled: boolean;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
