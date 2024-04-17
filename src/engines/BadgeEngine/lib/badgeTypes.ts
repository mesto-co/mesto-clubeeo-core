import User from '../../../models/User'
import {IEntityId} from '../../../lib/common'
import ClubBadge, {BadgeType} from '../../../models/ClubBadge'
import App from '../../../App'
import MemberBadge from '../../../models/MemberBadge'
import Member from '../../../models/Member'
import {DeepPartial} from 'typeorm/common/DeepPartial'
import assert from 'assert'
import {timeout} from '../../../api/auth/authRoutes'

export interface IGrantBadgeToUserOpts {
  user: User | IEntityId,
  value?: number
}

export interface IGrantBadgeToMemberOpts {
  member: Member | IEntityId,
  value?: number
}

export interface IGrantBadgeResponse {
  memberBadge: MemberBadge,
  member: Member,
  isCreated: boolean,
  isChanged: boolean,
}

export function badgeTypeFactory(app: App, clubBadge: ClubBadge) {
  switch (clubBadge.badgeType) {
    case BadgeType.basic:
      return new BasicBadgeType(app, clubBadge);
    case BadgeType.score:
      return new ScoreBadgeType(app, clubBadge);
    default:
      throw new Error(`Unknown badge type: ${clubBadge.badgeType}`);
  }
}

export abstract class AbstractBadgeType {
  app: App;
  clubBadge: ClubBadge;

  constructor(app: App, clubBadge: ClubBadge) {
    this.app = app;
    this.clubBadge = clubBadge;
  }

  /**
   * @deprecated use grantBadgeToMember instead
   */
  abstract grantBadgeToUser(opts: IGrantBadgeToUserOpts): Promise<IGrantBadgeResponse>;
  abstract grantBadgeToMember(opts: IGrantBadgeToMemberOpts): Promise<IGrantBadgeResponse>;

  protected async fetchMemberForBadge(opts: IGrantBadgeToUserOpts) {
    const {value: member} = await this.app.repos.member.findOrCreate({
      club: {id: this.clubBadge.clubId },
      user: {id: opts.user.id},
    });
    return member;
  }

  /**
   * @deprecated use findOrInitBadgeByMember instead
   */
  protected async findOrInitBadgeByUser(opts: IGrantBadgeToUserOpts, initOnlyFields: DeepPartial<MemberBadge> = {}) {
    const member = await this.fetchMemberForBadge(opts);

    const {value: memberBadge, isCreated} = await this.app.em.findOneOrInitBy(MemberBadge, {
      user: {id: opts.user.id},
      club: {id: this.clubBadge.clubId},
      clubBadge: {id: this.clubBadge.id},
    }, {
      ...initOnlyFields,
      member: {id: member.id},
    });

    // check older badges; switch to find by member later (e.g. Q3 2023)
    if (!memberBadge.member) {
      memberBadge.member = member;
    }

    return {
      memberBadge,
      isCreated,
      member,
    }
  }

  protected async findOrInitBadgeByMember(opts: IGrantBadgeToMemberOpts, initOnlyFields: DeepPartial<MemberBadge> = {}) {
    const member = await this.app.repos.member.getOrLoad(opts.member);
    assert(member.clubId === this.clubBadge.clubId, `can't grant badge to a member of another club`);

    const {value: memberBadge, isCreated} = await this.app.em.findOneOrInitBy(MemberBadge, {
      member: {id: member.id},
      club: {id: this.clubBadge.clubId},
      clubBadge: {id: this.clubBadge.id},
    }, {
      ...initOnlyFields,
      user: {id: member.userId},
    });

    return {
      memberBadge,
      isCreated,
      member,
    }
  }

  protected async assignIndex(memberBadge: MemberBadge) {
    const results: { raw: Array<{ index: number }> } = await this.app.DB
      .createQueryBuilder()
      .update(MemberBadge)
      .set({
        index: () => `(SELECT count(*) FROM "member_badge" WHERE "clubBadgeId"=${memberBadge.clubBadgeId})`,
      })
      .where(
        `"id" = ${memberBadge.id}`
        + ` AND "index" IS NULL`,
      )
      .returning('index')
      .execute();

    memberBadge.index = results.raw[0]?.index;

    return memberBadge;
  }
}

export class BasicBadgeType extends AbstractBadgeType {

  /**
   * @deprecated use grantBadgeToMember instead
   */
  async grantBadgeToUser(opts: IGrantBadgeToUserOpts): Promise<IGrantBadgeResponse> {
    const {member, memberBadge, isCreated} = await this.findOrInitBadgeByUser(opts, {
      value: 1,
    });
    await this.app.m.save(memberBadge);

    if (isCreated) await this.assignIndex(memberBadge);

    return {member, memberBadge, isCreated, isChanged: isCreated};
  }

  async grantBadgeToMember(opts: IGrantBadgeToMemberOpts): Promise<IGrantBadgeResponse> {
    const {member, memberBadge, isCreated} = await this.findOrInitBadgeByMember(opts, {
      value: 1,
    });
    await this.app.m.save(memberBadge);

    if (isCreated) await this.assignIndex(memberBadge);

    return {member, memberBadge, isCreated, isChanged: isCreated};
  }
}

export class ScoreBadgeType extends AbstractBadgeType {

  /**
   * @deprecated use grantBadgeToMember instead
   */
  async grantBadgeToUser(opts: IGrantBadgeToUserOpts): Promise<IGrantBadgeResponse> {
    const valueDiff = Number(opts?.value || 1);

    const {member, memberBadge, isCreated} = await this.findOrInitBadgeByUser(opts);

    const isChanged = valueDiff !== 0;
    if (isChanged || isCreated) {
      memberBadge.value = (memberBadge.value || 0) + valueDiff;
      await this.app.m.save(memberBadge);
    }

    if (isCreated) await this.assignIndex(memberBadge);

    return {member, memberBadge, isCreated, isChanged};
  }

  async grantBadgeToMember(opts: IGrantBadgeToMemberOpts): Promise<IGrantBadgeResponse> {
    const valueDiff = Number(opts?.value || 1);

    const {member, memberBadge, isCreated} = await this.findOrInitBadgeByMember(opts);

    const isChanged = valueDiff !== 0;
    if (isChanged || isCreated) {
      memberBadge.value = (memberBadge.value || 0) + valueDiff;
      await this.app.m.save(memberBadge);
    }

    if (isCreated) await this.assignIndex(memberBadge);

    return {member, memberBadge, isCreated, isChanged};
  }
}
