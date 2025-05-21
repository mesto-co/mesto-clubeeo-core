import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne, OneToMany,
  Unique,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'

import ClubAppRole from './ClubAppRole'
import Club from './../../../models/Club'
import {ClubeeoPrimaryColumn} from './../../../lib/modelCommon'

export interface IClubAppConfig {
  syncRoles?: Array<string>,
  autoRoleOnReaction?: string,
  publicView?: boolean,
}

@Entity()
@Unique(['club', 'appSlug'])
export default class ClubApp {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: ClubApp) => self.club)
  clubId: string

  @Column({type: String})
  title: string;

  /**
   * name (key) of app in registry
   */
  @Column({type: String})
  @Index()
  appName: string;

  @Column({type: String})
  @Index()
  appSlug: string;

  @Column({type: Number, nullable: true})
  menuIndex: number;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  config: Partial<IClubAppConfig>;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  publicConfig: any;

  @OneToMany(() => ClubAppRole, clubAppRole => clubAppRole.clubApp)
  clubAppRoles: ClubAppRole[];

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
