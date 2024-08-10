import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  RelationId,
  Index,
} from 'typeorm';

import Club from '../../../models/Club'
import ClubApp from '../../AppsEngine/models/ClubApp'
import {ITriggerProcessor} from '../TaskBuilderInterfaces'
import {ClubeeoPrimaryColumn} from '../../../lib/modelCommon'

@Entity()
@Index(['club', 'eventType'])
export default class MotionTrigger {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String, default: ''})
  name: string;

  @Column({type: String})
  eventType: string; // triggered on

  @Column({type: String})
  actionType: string; // creates task with type

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: MotionTrigger) => self.club)
  clubId: string

  @ManyToOne(type => ClubApp)
  eventClubApp: ClubApp
  @RelationId((self: MotionTrigger) => self.eventClubApp)
  eventClubAppId: string

  @ManyToOne(type => ClubApp)
  actionClubApp: ClubApp
  @RelationId((self: MotionTrigger) => self.actionClubApp)
  actionClubAppId: string

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
