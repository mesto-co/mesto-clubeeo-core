import { Entity, CreateDateColumn, UpdateDateColumn, Column, RelationId, ManyToOne, Index } from 'typeorm'

import {ClubeeoPrimaryColumn} from '../lib/modelCommon';
import ClubRole from './ClubRole';
import Club from './Club';

@Entity()
@Index(['objectType', 'objectId', 'clubRole'], {unique: true})
export default class ObjectRole {

  @ClubeeoPrimaryColumn()
  id: string;
  
  @ManyToOne(() => Club)
  club: Club;
  @RelationId((self: ObjectRole) => self.club)
  clubId: number;

  @ManyToOne(() => ClubRole)
  clubRole: ClubRole;
  @RelationId((self: ObjectRole) => self.clubRole)
  clubRoleId: number;

  @Column({type: 'varchar', nullable: false})
  objectId: string;

  @Column({type: 'varchar', nullable: false})
  objectType: string;

  @Column({type: 'boolean', nullable: false, default: true})
  enabled: boolean;

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}