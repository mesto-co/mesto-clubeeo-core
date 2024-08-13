import { MestoApp } from "../App";
import { fetchUserAndExtByExtId, Member, UserExt } from "clubeeo-core";
import MemberProfile from "../models/MemberProfile";
import { AppBuilder } from "../lib/createApp";
import { arr, obj, str } from "json-schema-blocks";
import { Telegraf } from "telegraf";

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
    this.bot = c.engines.telegram.bot;
  }
}

const profileApp = new AppBuilder<MestoApp, ProfileEntity>('mesto-profile', (c) => new ProfileEntity(c));

profileApp.get('/my-profile', {}, async ({repo: actions}, {ctx: {member}}, reply) => {
  // todo: findOneOrCreateBy - allow to pass async function as default value
  let { profile } = await actions.fetchProfileByMember(member);

  return { data: profile };
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
}, async ({c, repo: actions}, {body, ctx: {member, user}}, reply) => {
  const { profile } = await actions.fetchProfileByMember(member);
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

  return { data: profile };
});

profileApp.onInit(async (c, $) => {
  const clubId = '1';

  $.bot.start(async (ctx) => {
    const {userExt, user, isCreated: isUserCreated} = await fetchUserAndExtByExtId(c, {extId: ctx.from.id.toString(), service: 'tg', userData: ctx.from, sourceData: ctx});
    const {value: member, isCreated: isMemberCreated} = await c.em.findOneOrCreateBy(Member, {user: {id: user.id}, club: {id: clubId}}, {});

    if (isUserCreated || isMemberCreated) {
      ctx.reply(`Добро пожаловать, ${user.screenName}!`, {
        reply_markup: {
          keyboard: [
            [{text: 'Заполнить профиль', web_app: {url: `${c.Env.siteUrl}/#/mesto/profile/edit`}}],
          ],
        },
      })
    } else {
      ctx.reply(`Привет, ${user.screenName}!`, {
        reply_markup: {
          keyboard: [
            [{text: 'Заполнить профиль', web_app: {url: `${c.Env.siteUrl}/#/mesto/profile/edit`}}],
          ],
        },
      });
    }
  });

});

export default profileApp;
