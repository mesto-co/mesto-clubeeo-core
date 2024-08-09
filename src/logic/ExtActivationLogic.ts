import {IClubExtRepo_FindOrCreate, IExtCodeRepo_FindActivation, IExtCodeRepo_MarkUsed} from '../interfaces/repos'
import {ExtService} from '../lib/enums'
import ExtCode from '../models/ExtCode'

/**
 * Generalized logic for activation code handling
 *
 * @param code
 * @param service
 * @param extId
 * @param ports
 * @param debugData
 */
export const extActivationLogic = async (code: string, service: ExtService, extId: string, ports: {
  repos: {
    clubExt: IClubExtRepo_FindOrCreate,
    extCode: IExtCodeRepo_MarkUsed & IExtCodeRepo_FindActivation,
  },
  onActivated?(extCode: ExtCode, data: {isCreated: boolean}),
  reply(text: string)
}, debugData = {}) => {
  const activation = await ports.repos.extCode.findActivation(code, service);
  if (!activation) {
    await ports.reply('Activation code is not found. Please generate a new one.');

    return false;
  }

  await ports.repos.extCode.markUsed(activation);

  const conditions = {
    club: {id: activation.clubId},
    service: service,
    extId,
  }

  const clubExt = await ports.repos.clubExt.findOrCreate(conditions, {debugData});

  if (ports.onActivated) {
    ports.onActivated(activation, {isCreated: clubExt.isCreated})
  }

  if (!clubExt.isCreated) {
    return false;
  }

  await ports.reply(`Integration is enabled`);

  return true;
}
