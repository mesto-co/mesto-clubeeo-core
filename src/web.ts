import { MestoApp } from "./App";
import applicantsApp from "./apps/applicantsApp";
import applicationsApp from "./apps/applicationApp";
import memberProfilesApp from "./apps/memberProfilesApp";
import profileApp from "./apps/profileApp";
import listsApp from './apps/listsApp';
import { mestoRouter } from "./router";
import { bootTelegramBot } from "./boot/telegramBotBoot";
import MemberProfile from "./engines/MemberProfiles/models/MemberProfile";
import { cronBoot } from "./boot/cronBoot";

async function main() {
  const app = new MestoApp();
  const env = app.env;

  await app.init();

  if (process.env.RUN_MIGRATIONS) {
    await app.db.runMigrations();

    const memberProfiles = await app.m.find(MemberProfile, {
      where: {
        name: ''
      },
      relations: {
        member: {
          user: true
        }
      }
    });

    for (const memberProfile of memberProfiles) {
      memberProfile.name = memberProfile?.member?.user?.screenName;
      await app.m.save(memberProfile);
      console.log(memberProfile);
    }
  }

  mestoRouter(app);

  bootTelegramBot(app);
  cronBoot(app);

  await profileApp.attachTo(app);
  await applicantsApp.attachTo(app);
  await applicationsApp.attachTo(app);
  await memberProfilesApp.attachTo(app);
  await listsApp.attachTo(app);

  await app.run();

  // Run the server
  app.router.listen({port: env.port, host: env.host}, function (err, address) {
    if (err) {
      app.logger.error({err}, 'server start failed');
      process.exit(1);
    }

    app.logger.info(`server listening on ${address}`);
  });

  // Enable graceful stop
  // process.once('SIGINT', () => bot.stop('SIGINT'))
  // process.once('SIGTERM', () => bot.stop('SIGTERM'))
}

main().catch(error => console.error(error));