import { MestoApp } from "../App";
import { Member, UserExt } from "clubeeo-core";
import MemberProfile from "../engines/MemberProfiles/models/MemberProfile";
import { AppBuilder } from "../lib/createApp";

// export class ProfileRepo {
//   constructor(protected c: MestoApp) {}

//   async fetchProfileByMember(member: Member | {id: string, userId: string}) {
//     let isCreated = false;
//     let profile = await this.c.m.findOneBy(MemberProfile, {member: {id: member.id}});

//     // const {value: profile, isCreated} = await c.em.findOneOrCreateBy(MemberProfile, {member: {id: member.id}}, {});
//     if (!profile) {
//       // todo: UserExt model, allow string for service
//       const tgUser = await this.c.m.findOneBy<UserExt>(UserExt, {id: member.userId, service: 'tg'});

//       // todo: getters/helpers in tg engine
//       const tgFromData = tgUser.data['from'] || {};
//       await this.c.em.createAndSave(MemberProfile, {
//         name: [tgFromData.first_name, tgFromData.last_name].filter(Boolean).join(' ') || tgFromData.username || tgFromData.id,
//         member: {id: member.id},
//       });
//       isCreated = true;
//     }

//     return {profile, isCreated};
//   }

//   async fetchProfileByTgId(clubId: string, extId: string) {
//     const userExt = await this.c.m.findOne<UserExt>(UserExt, {
//       where: {extId: extId, service: 'tg'},
//       order: {id: 'DESC'},
//     });

//     if (!userExt) {
//       return {};
//     }

//     // const member = await this.c.m.findOneBy(Member, {userId: userExt.userId, clubId});

//     return {
//       extId,
//       // ...await this.fetchProfileByMember(userExt.user),
//     };
//   }
// }

export class MemberProfilesEntity {
  // repo: ProfileRepo;

  constructor(public c: MestoApp) {
    // this.repo = new ProfileRepo(c);
  }
}

const memberProfilesApp = new AppBuilder<MestoApp, MemberProfilesEntity>('member-profiles', (c) => new MemberProfilesEntity(c));

memberProfilesApp.get('/search', {}, async ({c}, {query: {q, show_default}, ctx}, reply) => {
  const mctx = c.engines.access.service.memberCtx(ctx.member, ctx.user, ctx.club);
  const isMember = await mctx.hasRole('member'); //todo: dynamic check
  if (!isMember) {
    throw new Error('Only members can search profiles');
  }

  let profiles = [];
  if (q) {
    profiles = await c.engines.memberProfiles.service.searchMembers(q);
  } else if (show_default === 'new') {
    profiles = await c.db.getRepository(MemberProfile).find({
      where: {
        member: {
          club: {
            id: ctx.club.id,
          },
          memberRoles: {
            enabled: true,
            clubRole: {
              name: 'member',
            },
          },
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  return { data: profiles };
});

memberProfilesApp.get('/profile/:profileId', {}, async ({c}, {params: {profileId}, ctx}, reply) => {
  const mctx = c.engines.access.service.memberCtx(ctx.member, ctx.user, ctx.club);
  const isMember = await mctx.hasRole('member'); //todo: dynamic check
  if (!isMember) {
    throw new Error('Only members can see other members\' profiles');
  }

  const profile = await c.m.findOneBy(MemberProfile, {id: profileId});
  return { data: profile };
});

export default memberProfilesApp;
