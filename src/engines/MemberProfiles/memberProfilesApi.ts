import { Club, Member } from "clubeeo-core";
import { MestoApp as App } from "../../App";
import { MemberProfiles } from "./MemberProfiles";

export function memberProfilesApi(app: App, {service}: MemberProfiles) {
  return (router, opts, done) => {
    router.get('/search', async (request, reply) => {
      const {user} = await app.auth.getUserContext(request);
      if (!user) {
        throw new Error('Not authorized');
      }
      const club = await app.m.findOneByOrFail(Club, {slug: 'mesto'});
      const member = await app.m.findOneByOrFail(Member, {club: {id: club.id}, user: {id: user.id}});

      const mCtx = await app.engines.access.service.memberCtx(member, user, club);
      const isMember = await mCtx.hasRole('member');
      if (!isMember) {
        throw new Error('Not a member');
      }

      const { query } = request.query as { query: string };
      const results = await service.searchMembers(query);
      reply.send(results);
    });

    done();
  };
}