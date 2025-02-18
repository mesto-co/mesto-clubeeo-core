import {
  Entity,
  ManyToOne,
  RelationId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Member } from '../../../models/Member';
import { ClubeeoPrimaryColumn } from '../../../lib/modelCommon';

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
  stage: '' | 'idea' | 'mvp' | 'first_sales' | 'invested' | 'operating_business';
  status: '' | 'active' | 'paused' | 'closed' | 'available';
  logo?: string;
  pitchDeck?: string;
  videoPitch?: string;
  website?: string;
  category: string;
  tags: string[];
  market: string;
  needs: string[];
  createdAt: Date;
  updatedAt: Date;
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
  headline: string;

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

  @Column({ type: "tsvector", nullable: true })
  search_vector: string;

  @Column({
    array: true,
    type: String,
    default: () => 'ARRAY[]::VARCHAR[]',
    nullable: false,
  })
  communityGoals: string[];

  // DB auto insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
