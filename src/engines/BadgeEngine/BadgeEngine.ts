import App from '../../App'
import User from '../../models/User'
import ClubBadge, {BadgeType} from '../../models/ClubBadge'
import MemberBadge from '../../models/MemberBadge'
import Club from '../../models/Club'
import {BadgeEngineEvents, badgeEngineEventsFactory} from './BadgeEngineEvents'
import {Emitter} from 'mitt'
import {IEntityId} from '../../lib/common'
import {badgeTypeFactory} from './lib/badgeTypes'
import ClubRole from '../../models/ClubRole'
import Member from '../../models/Member'

export class BadgeEngine {
  readonly app: App;
  readonly events: Emitter<BadgeEngineEvents>;

  constructor(app: App) {
    this.app = app;
    this.events = badgeEngineEventsFactory(app);
  }

  async findBadgeBySlug(club: Club, badgeSlug: string) {
    return await this.app.m.findOneBy(ClubBadge, {
      club: {id: club.id},
      slug: badgeSlug,
    });
  }

  async indexBadges(club: Club) {
    return await this.app.m.find(ClubBadge, {
      where: {
        club: {id: club.id},
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async createBadgeIfNotExists(club: Club, opts: {name: string, badgeType: BadgeType, slug: string, img: string}) {
    if (!opts.slug || !opts.name) throw 'name or slug can\'t be empty';
    if (!Object.keys(BadgeType).includes(opts.badgeType)) throw 'unknown badge type';

    return await this.app.em.findOneOrCreateBy(ClubBadge, {
      club: {id: club.id},
      name: opts.name,
      title: opts.name, //todo: remove title
      img: opts.img,
      slug: opts.slug,
      badgeType: opts.badgeType,
    }, {});
  }

  async grantBadgeToMember(member: Member | IEntityId, clubBadge: ClubBadge, opts?: {value?: number}) { //todo(?): add 'reason'
    const badgeCtx = badgeTypeFactory(this.app, clubBadge);

    const {member: loadedMember, memberBadge, isCreated, isChanged} = await badgeCtx.grantBadgeToMember({
      member,
      value: opts?.value,
    });

    if (isChanged) {
      this.events.emit('badgeGranted', {
        user: {id: loadedMember.userId},
        club: clubBadge.club || {id: clubBadge.clubId},
        clubBadge,
        member,
        memberBadge,
        isCreated,
      });
    }

    return {memberBadge, clubBadge, isCreated, isChanged};
  }

  /**
   * @deprecated use grantBadgeToMember instead
   */
  async grantBadgeToUser(user: User | IEntityId, clubBadge: ClubBadge, opts?: {value?: number}) { //todo(?): add 'reason'
    const badgeCtx = badgeTypeFactory(this.app, clubBadge);

    const {member, memberBadge, isCreated, isChanged} = await badgeCtx.grantBadgeToUser({
      user,
      value: opts?.value,
    });

    if (isChanged) {
      this.events.emit('badgeGranted', {
        user,
        club: clubBadge.club || {id: clubBadge.clubId},
        clubBadge,
        member,
        memberBadge,
        isCreated,
      });
    }

    return {memberBadge, clubBadge, isCreated, isChanged};
  }

  async grantBadgeBySlug(user: User, club: Club, badgeSlug: string, opts?: {value?: number}) {
    const clubBadge = await this.findBadgeBySlug(club, badgeSlug);
    if (!clubBadge) return null;
    return await this.grantBadgeToUser(user, clubBadge, opts);
  }

  async hasBadge(user: User, badge: ClubBadge) {
    return await this.app.m.findOneBy(MemberBadge, {
      user: {id: user.id},
      club: {id: badge.clubId},
      clubBadge: {id: badge.id},
    });
  }

  async hasBadgeBySlug(user: User, club: Club, badgeSlug: string) {
    const clubBadge = await this.findBadgeBySlug(club, badgeSlug);
    if (!clubBadge) return null;
    return await this.hasBadge(user, clubBadge);
  }
}
