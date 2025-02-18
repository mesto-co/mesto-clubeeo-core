import {FindOptionsWhere} from 'typeorm/find-options/FindOptionsWhere'
import {DeepPartial} from 'typeorm/common/DeepPartial'
import ClubExt from '../models/ClubExt'
import ExtCode from '../models/ExtCode'
import {ExtServicesEnum} from '../lib/enums'

export interface IClubExtRepo_FindByExtId {
  findByExtId(
    extId: string,
    service: ExtServicesEnum,
    relations: {},
    where: FindOptionsWhere<ClubExt>
  ): Promise<ClubExt>
}

export interface IClubExtRepo_FindOrCreate {
  findOrCreate(
    where: {
      extId: string,
      service: ExtServicesEnum,
      club: {id: string}
    },
    data: DeepPartial<ClubExt> | null
  ): Promise<{value: ClubExt, isCreated: boolean}>
}

export type IClubExtRepo = IClubExtRepo_FindOrCreate & IClubExtRepo_FindByExtId;

export interface IExtCodeRepo_MarkUsed {
  markUsed(extCode: ExtCode)
}

export interface IExtCodeRepo_FindActivation {
  findActivation(code: string, service: ExtServicesEnum): Promise<ExtCode>
}

export type IExtCodeRepo = IExtCodeRepo_MarkUsed & IExtCodeRepo_FindActivation;
