import {BaseService} from '../../services/BaseService'
import User from '../User'
import ExtCode, {ExtCodeTypes} from '../ExtCode'
import Club from '../Club'
import {IExtCodeRepo} from '../../interfaces/repos'
import {ExtServicesEnum} from '../../lib/enums'

export default class ExtCodeRepo extends BaseService implements IExtCodeRepo {
  async fetchTgLoginCode(user: User, club: Club) {
    // if (!user) return null;

    //todo: timelimits

    const {value: extCode} = await this.app.em.findOneOrCreateBy(ExtCode, {
      user: user ? {id: user.id} : null,
      club: {id: club.id},
      service: ExtServicesEnum.tg,
      codeType: ExtCodeTypes.login,
      used: false,
    }, {
      code: this.app.nanoid(32),
    });

    return extCode.code;
  }

  async useTgLoginCode(code: string) {
    if (!code) return null;

    const extCode = await this.app.m.findOne(ExtCode, {
      where: {
        code,
        service: ExtServicesEnum.tg,
        codeType: ExtCodeTypes.loginConfirmed,
        used: false,
      },
      // relations: {
      //   user: true,
      // }
    });
    if (extCode) {
      await this.app.m.update(ExtCode, {id: extCode.id}, {used: true});
    }

    return extCode;
  }

  async findTelegramActivation(code: string) {
    const m = this.app.m;

    if (!code) return null;

    return await m.findOneBy(ExtCode, {
      code,
      service: ExtServicesEnum.tg,
      codeType: ExtCodeTypes.activation,
      used: false,
    });
  }

  async findActivation(code: string, service: ExtServicesEnum): Promise<ExtCode> {
    if (service === ExtServicesEnum.tg) {
      return await this.findTelegramActivation(code);
    }

    throw `Unknown service: ${service}`;
  }

  async markUsed(extCode: ExtCode) {
    extCode.used = true;
    return await this.app.m.save(extCode);
  }
}
