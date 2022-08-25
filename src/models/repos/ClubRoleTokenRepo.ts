import {BaseService} from '../../services/BaseService'
import ClubRoleToken from '../ClubRoleToken'
import {FindOptionsRelations} from 'typeorm/find-options/FindOptionsRelations'

export default class ClubRoleTokenRepo extends BaseService {
  async findByClub(club: { id: number }, relations: FindOptionsRelations<ClubRoleToken> = {}) {
    return await this.app.m.find(ClubRoleToken, {
      where: {
        clubRole: {
          club: {id: club.id},
        },
      },
      relations,
    })
  }

  async findByClubWithTokenContract(club: { id: number }) {
    return await this.findByClub(
      club, {
        clubRole: true,
        tokenContract: true,
      }
    );
  }

  // return await this.app.m
  //   .createQueryBuilder(ClubRoleToken, 'clubRoleToken')
  //   .leftJoin("clubRoleToken.clubRole", "clubRole")
  //   .leftJoinAndSelect("clubRoleToken.tokenContract", "tokenContract")
  //   .where('clubRole.clubId = :clubId', {clubId: club.id})
  //   .getMany();
}


