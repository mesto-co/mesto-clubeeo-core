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

  // async loadByClubUser(opts: {user: User | IEntityId, club: Club | IEntityId}) {
  //   return await this.app.m.findOneBy(Member, {
  //     club: {id: opts.club.id},
  //     user: {id: opts.user.id},
  //   });
  // };
}
