import { MestoApp } from "../App";
import { ExtCode, ExtServicesEnum, fetchUserAndExtByExtId, Member, UserExt, ExtCodeTypes } from "clubeeo-core";
import MemberProfile from "../models/MemberProfile";
import { AppBuilder } from "../lib/createApp";
import { arr, obj, str, bool } from "json-schema-blocks";
import { Telegraf } from "telegraf";
import { ISignInUserResult } from "clubeeo-core/dist/clubApps/TelegramApp/TelegramBotUpdates";
import { CallbackQuery } from "telegraf/src/core/types/typegram";

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

profileApp.get('/my-profile', {}, async ({c, repo}, {ctx: {member, club}}, reply) => {
  // todo: findOneOrCreateBy - allow to pass async function as default value
  let { profile } = await repo.fetchProfileByMember(member);

  const roles = await c.engines.access.service
      .getRolesMap({member, hub: club}, ['applicant', 'member', 'guest', 'rejected']);

  return { data: profile, roles };
});

profileApp.patch('/my-profile', {
  schema: {
    body: obj({
      name: str(1),
      description: str(),
      whoami: str(),
      aboutMe: str(),
      location: str(),
      projectName: str(),
      projectAbout: str(),
      projectUrl: str(),
      projectStatuses: arr(str()),
      professions: arr(str()),
      industries: arr(str()),
      skills: arr(str()),
      workplaces: arr(str()),
      education: arr(str()),
    }, {required: ['name']}),
  }
}, async ({c, repo}, {body, query, ctx: {member, user, club}}, reply) => {
  const { profile } = await repo.fetchProfileByMember(member);
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
      .getRolesMap({member, hub: club}, ['applicant', 'member', 'guest', 'rejected']);

  return { data: profile, roles };
});

profileApp.post('/my-profile/apply', {}, async ({c, repo}, {ctx: {member, club}}, reply) => {
  const accessService = c.engines.access.service;

  const roles = await c.engines.access.service
      .getRolesMap({member, hub: club}, ['applicant', 'member', 'guest', 'rejected']);

  if (roles.member) {
    throw new Error('Already a member');
  }

  if (roles.applicant) {
    throw new Error('Already applied');
  }

  if (roles.rejected) {
    throw new Error('Your previous applcaion was rejected');
  }

  await accessService.addRole({member, hub: club}, 'applicant');

  const extUser = await c.m.findOneBy(UserExt, {user: {id: member.userId}, service: 'tg'});
  await c.engines.telegram.bot.telegram.sendMessage(extUser.extId, `📝 Вы подали заявку на вступление в Место.`);

  return { roles };
});

profileApp.onInit(async (c, $) => {
  const bot = c.engines.telegram.bot;
  const clubId = '1';

  bot.start(async (ctx) => {
    const { userExt, user, isCreated: isUserCreated } = await fetchUserAndExtByExtId(c, {extId: ctx.from.id.toString(), service: 'tg', userData: ctx.from, sourceData: ctx});
    const { value: member, isCreated: isMemberCreated } = await c.em.findOneOrCreateBy(Member, {user: {id: user.id}, club: {id: clubId}}, {});

    let isHandled = false;
    if (ctx.payload) {
      const extCode = await c.m.findOne(ExtCode, {
        where: {
          service: ExtServicesEnum.tg,
          codeType: ExtCodeTypes.login,
          code: ctx.payload,
          used: false,
        },
        relations: {user: true, club: true}
      });

      if (extCode) {
        await ctx.reply(
          await c.t('bot.signin', user.lang, {}, 'Пожалуйста, подтвердите вход в систему'),
          {
            reply_markup: {
              inline_keyboard: [
                [{text: 'Подтвердить вход', callback_data: `signin:${ctx.payload}`}],
                [{text: 'Отмена', callback_data: 'deleteMessage'}],
              ],
            },
          }
        );

        isHandled = true;
      }
    }
    
    if (!isHandled) {
      if (isUserCreated || isMemberCreated) {
        ctx.reply(`🎉 Добро пожаловать, ${user.screenName}! 👋`, {
          reply_markup: {
            inline_keyboard: [
              [{text: '📝 Заполнить профиль', web_app: {url: `${c.Env.siteUrl}/mesto/profile/edit`}}],
            ],
          },
        })
      } else {
        ctx.reply(`Привет, ${user.screenName}! 👋`, {
          reply_markup: {
            inline_keyboard: [
              [{text: '📝 Заполнить профиль', web_app: {url: `${c.Env.siteUrl}/mesto/profile/edit`}}],
            ],
          },
        });
      }
    }
  });

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

        const {userExt, user} = await fetchUserAndExtByExtId(c, {
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
  });
});

export default profileApp;
