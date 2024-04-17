import {
  Column,
  CreateDateColumn,
  Entity, Index, ManyToOne,
  RelationId,
  Unique,
  UpdateDateColumn,
} from 'typeorm'
import Club from './Club'
import {ClubeeoPrimaryColumn} from '../lib/modelCommon'

export interface IBadgeStyle {
  color: string
  textColor: string
}

export enum BadgeType {
  basic = 'basic', // can be granted multiple times
  // achievement = 'achievement', // can be granted once
  score = 'score', // has value (points) attached
}

@Entity()
@Unique(['club', 'slug'])
export default class ClubBadge {

  @ClubeeoPrimaryColumn()
  id: string;

  @Column({type: String, nullable: true})
  name: string;

  @Column({type: String})
  title: string;

  @Column({type: String, default: ''})
  description: string;

  @Column({type: String})
  slug: string;

  @Column({type: String, default: ''})
  img: string;

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: ClubBadge) => self.club)
  clubId: string

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  style: Partial<IBadgeStyle>;

  @Column({type: String, default: BadgeType.basic})
  @Index()
  badgeType: BadgeType;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
