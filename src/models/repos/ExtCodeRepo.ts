import {BaseService} from '../../services/BaseService'
import User from '../User'
import ExtCode, {ExtCodeTypes} from '../ExtCode'
import Club from '../Club'
import ClubExt from '../ClubExt'
import {IExtCodeRepo} from '../../interfaces/repos'
import {ExtService} from '../../lib/enums'

export default class ExtCodeRepo extends BaseService implements IExtCodeRepo {
  async fetchTgLoginCode(user: User, club: Club) {
    if (!user) return null;

    //todo: timelimits

    const {value: extCode} = await this.app.em.findOneOrCreateBy(ExtCode, {
      user: {id: user.id},
      club: {id: club.id},
      service: ExtService.tg,
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
        service: ExtService.tg,
        codeType: ExtCodeTypes.login,
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

  async createDiscordVerify(club: Club, clubExt: ClubExt, extId: string) {
    const m = this.app.m;

    if (!club) return null;

    //todo: timelimits

    const extCode = m.create(ExtCode, {
      club: {id: club.id},
      clubExt: {id: clubExt.id},
      service: ExtService.discord,
      extId,
      codeType: ExtCodeTypes.verify,
      code: this.app.nanoid(32),
      used: false,
    });
    await m.save(extCode);

    return extCode;
  }

  async findDiscordVerify(code: string) {
    const m = this.app.m;

    if (!code) return null;

    return await m.findOne(ExtCode, {
      where: {
        code,
        service: ExtService.discord,
        codeType: ExtCodeTypes.verify,
        used: false,
      },
      relations: {
        club: true,
        clubExt: true,
      },
    });
  }

  async findDiscordActivation(code: string) {
    const m = this.app.m;

    if (!code) return null;

    return await m.findOneBy(ExtCode, {
      code,
      service: ExtService.discord,
      codeType: ExtCodeTypes.activation,
      used: false,
    });
  }

  async findTelegramActivation(code: string) {
    const m = this.app.m;

    if (!code) return null;

    return await m.findOneBy(ExtCode, {
      code,
      service: ExtService.tg,
      codeType: ExtCodeTypes.activation,
      used: false,
    });
  }

  async findActivation(code: string, service: ExtService): Promise<ExtCode> {
    if (service === ExtService.tg) {
      return await this.findTelegramActivation(code);
    } else if (service === ExtService.discord) {
      return await this.findDiscordActivation(code);
    }

    throw `Unknown service: ${service}`;
  }

  async markUsed(extCode: ExtCode) {
    extCode.used = true;
    return await this.app.m.save(extCode);
  }
}
