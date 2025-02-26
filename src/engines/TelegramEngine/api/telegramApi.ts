import { MestoApp as App } from "@/App";
import Club from "@/models/Club";
import Member from "@/models/Member";
import { fetchUserAndExtByExtId } from "@/contexts/UserExtContext";
import TgAppInitData from "../TgAppInitData";
import { StatusCodes } from "http-status-codes";

export function telegramApi(app: App) {
  return (router, opts, done) => {
    router.post('/:slug/webapp-login', async (req, reply) => {
      const {initData} = req.body;
      const slug = req.params.slug;

      const club = await app.m.findOneByOrFail(Club, {
        slug,
      });

      app.logger.info(`initData=${encodeURIComponent(initData)}`);

      // const tgAppInitData = new TgAppInitData(initData, bot.botToken);
      const tgAppInitData = new TgAppInitData(initData, app.engines.telegram.env.telegramToken);

      if (!tgAppInitData.isInitDataValid) {
        return reply.code(StatusCodes.FORBIDDEN).send({
          ok: false,
          error: 'Telegram WebApp initData is not valid',
        });
      }

      const userData = tgAppInitData.userData;

      const { user } = await fetchUserAndExtByExtId(
        app as any,
        { extId: userData.id.toString(), service: 'tg', userData, sourceData: tgAppInitData }
      );

      const { value: member } = await app.em.findOneOrCreateBy(Member,
        { user: {id: user.id}, club: {id: club.id} },
        {}
      );

      app.auth.logIn(user.id, req.session);

      reply.send({
        ok: true,
        userData,
        user,
        member,
        club: {
          id: club.id,
          name: club.name,
        },
      });
    });

    done();
  };
}