import { MestoApp } from "../App";
import Member from "../models/Member";
import UserExt from "../models/UserExt";
import Club from "../models/Club";
import User from "../models/User";
import { ExtServicesEnum } from "../core/lib/enums";
import ExtCode, {ExtCodeTypes} from '../models/ExtCode';
import { fetchUserAndExtByExtId } from "../contexts/UserExtContext";
import MemberProfile from "../engines/MemberProfiles/models/MemberProfile";
import { AppBuilder } from "../lib/createApp";
import { arr, obj, str, bool } from "json-schema-blocks";
import { Telegraf } from "telegraf";
import { CallbackQuery } from "telegraf/src/core/types/typegram";

export type ISignInUserResult = { loggedIn: false } | { loggedIn: true, club: Club, user: User, prevUserExt: UserExt }

// Add these interfaces
interface IWorkplace {
  organization: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  skills: string[];
}

interface IEducation {
  institution: string;
  degree: string;
  startYear: string;
  endYear: string;
}

export class ProfileRepo {
  constructor(protected c: MestoApp) {}

  async fetchProfileByMember(member: Member | {id: string, userId: string}) {
    let isCreated = false;
    let profile = await this.c.m.findOneBy(MemberProfile, {member: {id: member.id}});

    // const {value: profile, isCreated} = await c.em.findOneOrCreateBy(MemberProfile, {member: {id: member.id}}, {});
    if (!profile) {
      // todo: UserExt model, allow string for service
      const tgUser = await this.c.m.findOneBy<UserExt>(UserExt, {id: member.userId, service: 'tg'});

      // todo: getters/helpers in tg engine
      const tgFromData = tgUser.data['from'] || {};
      await this.c.em.createAndSave(MemberProfile, {
        name: [tgFromData.first_name, tgFromData.last_name].filter(Boolean).join(' ') || tgFromData.username || tgFromData.id,
        member: {id: member.id},
      });
      isCreated = true;
    }

    return {profile, isCreated};
  }

  async fetchProfileByTgId(clubId: string, extId: string) {
    const userExt = await this.c.m.findOne<UserExt>(UserExt, {
      where: {extId: extId, service: 'tg'},
      order: {id: 'DESC'},
    });

    if (!userExt) {
      return {};
    }

    // const member = await this.c.m.findOneBy(Member, {userId: userExt.userId, clubId});

    return {
      extId,
      // ...await this.fetchProfileByMember(userExt.user),
    };
  }
}

export class ProfileEntity {
  repo: ProfileRepo;
  bot: Telegraf;

  constructor(public c: MestoApp) {
    this.repo = new ProfileRepo(c);
  }
}

const profileApp = new AppBuilder<MestoApp, ProfileEntity>('mesto-profile', (c) => new ProfileEntity(c));

profileApp.get('/my-profile', {}, async ({c, repo}, {ctx: {member, user, club}}, reply) => {
  // todo: findOneOrCreateBy - allow to pass async function as default value
  let { profile } = await repo.fetchProfileByMember(member);

  const roles = await c.engines.access.service
      .getRolesMap({member, user, hub: club}, ['applicant', 'member', 'guest', 'rejected']);

  return { data: profile, roles };
});

profileApp.patch('/my-profile', {
  schema: {
    body: obj({
      name: str(1),
      description: str(),
      aboutMe: str(),
      location: str(),
      projectName: str(),
      projectAbout: str(),
      projectUrl: str(),
      projectStatuses: arr(str()),
      professions: arr(str()),
      industries: arr(str()),
      skills: arr(str()),
      workplaces: arr(obj({
        organization: str(),
        position: str(),
        startDate: str(),
        endDate: str(),
        current: bool(),
        skills: arr(str())
      })),
      education: arr(obj({
        institution: str(),
        degree: str(),
        startYear: str(),
        endYear: str()
      })),
      socialLinks: obj({}, { additionalProperties: true })
    }, {required: ['name']}),
  }
}, async ({c, repo}, {body, query, ctx: {member, user, club}}, reply) => {
  const { profile } = await repo.fetchProfileByMember(member);
  
  // Validate dates in workplaces
  if (body.workplaces) {
    body.workplaces = body.workplaces.map((workplace: IWorkplace) => ({
      ...workplace,
      startDate: workplace.startDate ? new Date(workplace.startDate).toISOString().split('T')[0] : '',
      endDate: workplace.current ? '' : workplace.endDate ? new Date(workplace.endDate).toISOString().split('T')[0] : ''
    }));
  }

  // Validate years in education
  if (body.education) {
    body.education = body.education.map((edu: IEducation) => ({
      ...edu,
      startYear: edu.startYear?.toString() || '',
      endYear: edu.endYear?.toString() || ''
    }));
  }

  Object.assign(profile, body);
  await c.m.save(profile);

  if (user.screenName !== profile.name) {
    user.screenName = profile.name;
    await c.m.save(user);
  }

  if (member.name !== profile.name) {
    member.name = profile.name;
    await c.m.save(member);
  }

  const roles = await c.engines.access.service
      .getRolesMap({member, user, hub: club}, ['applicant', 'member', 'guest', 'rejected']);

  return { data: profile, roles };
});

profileApp.post('/my-profile/apply', {}, async ({c, repo}, {ctx: {member, club, user}}, reply) => {
  const accessService = c.engines.access.service;

  const roles = await c.engines.access.service
      .getRolesMap({member, user, hub: club}, ['applicant', 'member', 'guest', 'rejected']);

  if (roles.member) {
    throw new Error('Already a member');
  }

  if (roles.applicant) {
    throw new Error('Already applied');
  }

  if (roles.rejected) {
    throw new Error('Your previous applcaion was rejected');
  }

  await accessService.addRole({member, user, hub: club}, 'applicant');

  const extUser = await c.m.findOneBy(UserExt, {user: {id: member.userId}, service: 'tg'});
  await c.engines.telegram.bot.telegram.sendMessage(extUser.extId, `📝 Вы подали заявку на вступление в Место.`);

  return { roles };
});

profileApp.onInit(async (c, $) => {
  const bot = c.engines.telegram.bot;

  bot.action('deleteMessage', ctx => ctx.deleteMessage());

  bot.action(/^signin:(.*)$/, async ctx => {
    const [_, payload] = ctx.match;

    const signInUser = async (data: {tgUserId: number, code: string, data: CallbackQuery}): Promise<ISignInUserResult> => {
      const extCode = await c.m.findOne(ExtCode, {
        where: {
          service: ExtServicesEnum.tg,
          codeType: ExtCodeTypes.login,
          code: data.code,
          used: false,
        },
        relations: {user: true, club: true}
      });

      if (extCode) {
        extCode.used = true;
        await c.m.save(extCode);

        const club = extCode.club;

        const {userExt, user} = await fetchUserAndExtByExtId(c as any, {
          service: ExtServicesEnum.tg,
          extId: String(data.tgUserId),
          userData: data.data.from,
          sourceData: data.data,
        });

        const tgUser = data.data.from;

        //todo: process using event bus
        await c.repos.user.defaultScreenName(user, {
          screenName: tgUser.username,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
        });

        // create new loginConfirmed code
        await c.em.createAndSave(ExtCode, {
          code: extCode.code,
          user: {id: user.id},
          club: {id: extCode.clubId},
          service: ExtServicesEnum.tg,
          codeType: ExtCodeTypes.loginConfirmed,
          used: false,
        });

        // todo: remove prevUserExt
        return {loggedIn: true, club, user, prevUserExt: null};
      } else {
        c.logger.warn({data}, 'signInUser: extCode is not found');
        return {loggedIn: false};
      }
    };

    const { loggedIn } = await signInUser({tgUserId: ctx.from.id, code: payload, data: ctx.callbackQuery});

    if (loggedIn) {
      ctx.reply('👋 Вы успешно вошли в систему!\n\nТеперь вы можете вернуться на страницу браузера.');
    } else {
      ctx.reply('❌ Ошибка входа в систему. Попробуйте еще раз.');
    }

    ctx.answerCbQuery();

    ctx.deleteMessage();
  });
});

export default profileApp;
