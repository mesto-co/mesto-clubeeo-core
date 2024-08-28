import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  RelationId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import {env, Member} from 'clubeeo-core';

const ClubeeoPrimaryColumn = () => {
  return PrimaryGeneratedColumn(env.databasePkStrategy, env.databasePkOptions)
}

@Entity()
export default class MemberProfile {

  @ClubeeoPrimaryColumn()
  id: string;

  @ManyToOne(type => Member)
  member: Member;
  @RelationId((self: MemberProfile) => self.member)
  memberId: string;

  @Column({type: String, default: '', nullable: false})
  name: string;

  @Column({type: String, default: '', nullable: false})
  description: string;

  @Column({type: String, default: '', nullable: false})
  whoami: string;

  @Column({type: String, default: '', nullable: false})
  aboutMe: string;

  @Column({type: String, default: '', nullable: false})
  location: string;

  @Column({type: String, default: '', nullable: false})
  projectName: string;

  @Column({type: String, default: '', nullable: false})
  projectAbout: string;

  @Column({type: String, default: '', nullable: false})
  projectUrl: string;

  @Column({
    array: true,
    type: String,
    default: () => 'ARRAY[]::VARCHAR[]',
    nullable: false,
  })
  projectStatuses: Array<string>;

  @Column({
    type: 'json',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  socialLinks: Record<string, string>;

  @Column({
    array: true,
    type: String,
    default: () => 'ARRAY[]::VARCHAR[]',
    nullable: false,
  })
  professions: Array<string>;

  @Column({
    array: true,
    type: String,
    default: () => 'ARRAY[]::VARCHAR[]',
    nullable: false,
  })
  industries: Array<string>;

  @Column({
    array: true,
    type: String,
    default: () => 'ARRAY[]::VARCHAR[]',
    nullable: false,
  })
  skills: Array<string>;

  @Column({
    array: true,
    type: String,
    default: () => 'ARRAY[]::VARCHAR[]',
    nullable: false,
  })
  workplaces: Array<string>;

  @Column({
    array: true,
    type: String,
    default: () => 'ARRAY[]::VARCHAR[]',
    nullable: false,
  })
  education: Array<string>;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}


