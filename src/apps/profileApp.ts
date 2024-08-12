import { MestoApp } from "../App";
import Member from "clubeeo-core/dist/models/Member";
import MemberProfile from "../models/MemberProfile";
import UserExt from "clubeeo-core/dist/models/UserExt";
import { ExtService } from "clubeeo-core/dist/core/lib/enums";
import _ from "lodash";
import { createApp } from "../lib/createApp";

const profileApp = createApp<MestoApp>('mesto-profile', {
  routes: (c, r) => {
    r.get('/my-profile', async (req, reply) => {
      const clubId = req.query['clubId'] as string;

      const {user} = await c.auth.getUserContext(req as any);
      const member = await c.m.findOneByOrFail<Member>(Member, {user: {id: user.id}, club: {id: clubId}});

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

    r.post('/my-profile', async (req, reply) => {
      const clubId = req.query['clubId'] as string;

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
  },
});

export default profileApp;
