import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne, OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm'
import Club from './Club'
import ClubRoleToken from './ClubRoleToken'
import ClubAppRole from './ClubAppRole'

@Entity()
export default class ClubApp {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Club)
  club: Club
  @RelationId((self: ClubApp) => self.club)
  clubId: number

  @Column({type: String})
  title: string;

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
  config: object;

  @OneToMany(() => ClubAppRole, clubAppRole => clubAppRole.clubApp)
  clubAppRoles: ClubAppRole[];

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
