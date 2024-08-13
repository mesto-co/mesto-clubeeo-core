import { MestoApp } from "../App";
import Member from "clubeeo-core/dist/models/Member";
import MemberProfile from "../models/MemberProfile";
import UserExt from "clubeeo-core/dist/models/UserExt";
import { ExtService } from "clubeeo-core/dist/core/lib/enums";
import _ from "lodash";
import { AppBuilder } from "../lib/createApp";
import { arr, obj, str } from "json-schema-blocks";

const profileApp = new AppBuilder<MestoApp>('mesto-profile');

profileApp.get('/my-profile', {}, async (c, {ctx: {member, user}}, reply) => {
  // todo: findOneOrCreateBy - allow to pass async function as default value
  let profile = await c.m.findOneBy(MemberProfile, {member: {id: member.id}});
  // const {value: profile, isCreated} = await c.em.findOneOrCreateBy(MemberProfile, {member: {id: member.id}}, {});
  if (!profile) {
    // todo: UserExt model, allow string for service
    const tgUser = await c.m.findOneBy<UserExt>(UserExt, {id: user.id, service: ExtService.tg});
    // todo: getters/helpers in tg engine
    const tgFromData = tgUser.data?.from || {};
    await c.em.createAndSave(MemberProfile, {
      name: [tgFromData.first_name, tgFromData.last_name].filter(Boolean).join(' ') || tgFromData.username || tgFromData.id,
      member: {id: member.id},
    });
  }

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
}, async (c, req, reply) => {
  const clubId = req.params.clubId as string;

  const {user} = await c.auth.getUserContext(req as any);
  const member = await c.m.findOneByOrFail<Member>(Member, {user: {id: user.id}, club: {id: clubId}});

  const profile = await c.m.findOneByOrFail(MemberProfile, {member: {id: member.id}});

  const allowedKeys = [
    'name', 'description', 'whoami', 'aboutMe', 'location',
    'projectName', 'projectAbout', 'projectUrl', 'projectStatuses',
    'professions', 'industries', 'skills', 'workplaces', 'education',
  ];
  Object.assign(profile, _.pick(req.body, allowedKeys));
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

export default profileApp;
