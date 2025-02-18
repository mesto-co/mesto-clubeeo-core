import {
  Column,
  CreateDateColumn,
  Entity,

  UpdateDateColumn,
  ManyToOne,
  RelationId,
} from 'typeorm/index';

import Club from '../../../models/Club';
import User from '../../../models/User';
import Event from '../../../models/Event';
import ClubApp from '../../AppsEngine/models/ClubApp';
import Member from '../../../models/Member'
import MotionTrigger from './MotionTrigger'
import {ClubeeoPrimaryColumn} from '../../../lib/modelCommon'

export enum MotionActionState {
  pending,
  done,
  processing,
  failed,
}

@Entity()
export default class MotionAction {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String})
  actionType: string; // creates task with type

  // @Column({type: String})
  // @Index()
  // appName: string;

  @Column({type: Number, default: 0})
  state: MotionActionState;

  @ManyToOne(type => ClubApp)
  clubApp: ClubApp
  @RelationId((self: MotionAction) => self.clubApp)
  clubAppId: string

  @ManyToOne(type => Event)
  event: Event
  @RelationId((self: MotionAction) => self.event)
  eventId: string

  @ManyToOne(type => MotionTrigger)
  trigger: MotionTrigger
  @RelationId((self: MotionAction) => self.trigger)
  triggerId: string

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: MotionAction) => self.club)
  clubId: string

  @ManyToOne(type => User)
  user: User
  @RelationId((self: MotionAction) => self.user)
  userId: string

  @ManyToOne(type => Member)
  member: Member
  @RelationId((self: MotionAction) => self.member)
  memberId: string

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  data: Record<string, any>;

  @ManyToOne(type => ClubApp)
  actionClubApp: ClubApp
  @RelationId((self: MotionAction) => self.actionClubApp)
  actionClubAppId: string

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
