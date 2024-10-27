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

interface IWorkplace {
  organization: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  skills: string[];
}

interface IEducation {
  institution: string;
  degree: string;
  startYear: string;
  endYear: string;
}

// Add new interface for projects
interface IProject {
  name: string;
  link: string;
  description: string;
  statuses: string[];
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
  aboutMe: string;

  @Column({type: String, default: '', nullable: false})
  location: string;

  @Column({
    type: 'json',
    array: false,
    default: () => "'[]'",
    nullable: false,
  })
  projects: Array<IProject>;

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
    type: 'json',
    array: false,
    default: () => "'[]'",
    nullable: false,
  })
  workplaces: Array<IWorkplace>;

  @Column({
    type: 'json',
    array: false,
    default: () => "'[]'",
    nullable: false,
  })
  education: Array<IEducation>;

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
