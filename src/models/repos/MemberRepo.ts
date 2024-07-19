import User from '../../models/User'
import Club from '../../models/Club'
import {IEntityId} from '../../lib/common'
import {BaseService} from '../../services/BaseService'
import Member from '../Member'
import {nanoid} from 'nanoid'

export default class MemberRepo extends BaseService {

  async findById(id: string) {
    return await this.app.m.findOneBy(Member, {id});
  }

  async findOrCreate(opts: {club: Club | IEntityId, user: User | IEntityId}) {
    return this.app.em.findOneOrCreateBy<Member>(Member,{
      club: {id: opts.club.id},
      user: {id: opts.user.id},
    }, {
      enabled: true,
    });
  }

  async getOrLoad(entity: Member | IEntityId) {
    if ('createdAt' in entity) return entity;
    return await this.findById(entity.id);
  }

  async findByLocator(locator: string, club: Club | IEntityId): Promise<Member> {
    const parsedLocator = this.parseMemberLocator(locator);

    if ('userId' in parsedLocator) {
      const user = await this.app.repos.user.findById(parsedLocator.userId);
      const {value: member} = await this.findOrCreate({user, club});
      member.user = user;
      return member;
    } else if ('memberId' in parsedLocator) {
      const member = await this.app.m.findOne(Member, {
        where: {id: parsedLocator.memberId, club: {id: club.id}},
        relations: {user: true},
      });
      return member;
    }
  }

  parseMemberLocator(memberLocator: string) {
    if (memberLocator.startsWith('userId:')) {
      const userId = memberLocator.split('userId:', 2)[1];
      return {userId};
    } else if (memberLocator.startsWith('memberId:')) {
      const memberId = memberLocator.split('memberId:', 2)[1];
      return {memberId};
    } else {
      throw new Error('Invalid member locator: ' + memberLocator);
    }
  }

  // async loadByClubUser(opts: {user: User | IEntityId, club: Club | IEntityId}) {
  //   return await this.app.m.findOneBy(Member, {
  //     club: {id: opts.club.id},
  //     user: {id: opts.user.id},
  //   });
  // };
}
