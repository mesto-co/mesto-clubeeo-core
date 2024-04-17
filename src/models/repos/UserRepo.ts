import UserExt from '../../models/UserExt';
import User from '../../models/User'
import {ExtService} from '../../lib/enums'
import Club from '../../models/Club'
import {IEntityId} from '../../lib/common'
import {FindOptionsWhere} from 'typeorm/find-options/FindOptionsWhere'
import {ILike} from 'typeorm'
import {BaseService} from '../../services/BaseService'
import {FindOptionsRelations} from 'typeorm/find-options/FindOptionsRelations'
import {DeepPartial} from 'typeorm/common/DeepPartial'

export interface ISomeUserData {
  screenName?: string, firstName?: string, lastName?: string,
  first_name?: string, last_name?: string, username?: string,
  language_code?: string,
}

export default class UserRepo extends BaseService {

  async findById(id: string) {
    return await this.app.m.findOneBy(User, {id});
  }

  async findByIdOrFail(id: string) {
    return await this.app.m.findOneByOrFail(User, {id});
  }

  async loadBy(entity: {userId: string, user?: User}) {
    if (entity.user?.id && entity.user?.createdAt) return entity.user;
    return await this.findById(entity.userId);
  }

  async findUserByExtId(service: ExtService, extId: string | number) {
    const userExt = await this.app.m.findOne(UserExt, {
      where: {service, extId: String(extId), enabled: true},
      order: {id: 'DESC'},
      relations: ['user'],
    });

    return userExt?.user;
  }

  async findUserByExt(userExt: UserExt) {
    return this.findById(userExt.userId);
  }

  async create(plainObject: DeepPartial<User>) {
    return await this.app.em.createAndSave(User, plainObject);
  }

  genScreenName(data: ISomeUserData) {
    return [data.firstName || data.first_name, data.lastName || data.last_name].filter(v=>v).join(' ')
      || data.screenName || data.username;
  }

  async defaultScreenName(user: User, data: ISomeUserData) {
    if (!user.screenName) {
      const screenName = this.genScreenName(data);

      if (screenName) {
        await this.app.m.update(User,
          {id: user.id, screenName: ''},
          {screenName},
        )
      }
    }
  }

  /**
   * @deprecated use member repo instead
   */
  async findWithRolesAndBadges(opts: {user: User | IEntityId, club: Club | IEntityId}) {
    const user = await this.app.m.findOne(User, {
      where: {
        id: opts.user.id,
        userClubRoles: {
          club: {id: opts.club.id},
          enabled: true,
        },
        badges: {
          club: {id: opts.club.id},
        }
      },
      relations: {
        userClubRoles: {
          clubRole: true,
          clubRoleToken: {
            clubRole: true,
          }
        },
        badges: {
          clubBadge: true,
        }
      }
    }) || await this.app.m.findOneByOrFail(User,{id: opts.user.id});

    user.userClubRoles ||= [];
    user.badges ||= [];

    return user;
  }

  async search(club: Club | IEntityId, opts: {searchWallet?: string, searchName?: string, page?: number, take?: number} = {}, relations?: FindOptionsRelations<User>) {
    const {searchWallet, searchName, page: pageArg, take: takeArg} = opts;

    const userWhere: FindOptionsWhere<User> = {
      userClubRoles: {
        club: {id: club.id},
        // enabled: true,
      }
    };
    if (searchWallet && searchWallet.length >= 4) {
      userWhere.wallets = {
        address: ILike(searchWallet + '%'),
      }
    }
    if (searchName && searchName.length >= 3) {
      userWhere.screenName = ILike(searchName + '%');
    }

    const memberWhere: FindOptionsWhere<User> = {
      memberships: {
        club: {id: club.id},
        enabled: true,
      }
    };
    if (searchWallet && searchWallet.length >= 4) {
      memberWhere.wallets = {
        address: ILike(searchWallet + '%'),
      }
    }
    if (searchName && searchName.length >= 3) {
      memberWhere.screenName = ILike(searchName + '%');
    }

    const take = takeArg || 250;
    const page = pageArg || 1;
    const skip = (page - 1)*take;

    const [users, usersCount] = await this.app.m.findAndCount(User, {
      where: [userWhere, memberWhere],
      relations: {
        userClubRoles: true,
        userExts: true,
        ...relations,
      },
      order: {
        id: 'DESC',
      },
      take,
      skip,
    });

    return {
      items: users,
      count: usersCount,
    };
  }

  async getOrLoad(entity: User | IEntityId) {
    if ('createdAt' in entity) return entity;
    return await this.app.m.findOneBy(User, {id: entity.id});
  }
}
