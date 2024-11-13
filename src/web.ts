import { MestoApp } from "./App";
import applicantsApp from "./apps/applicantsApp";
import memberProfilesApp from "./apps/memberProfilesApp";
import profileApp from "./apps/profileApp";
import listsApp from './apps/listsApp';
import MestoEnv from "./Env";
import { mestoRouter } from "./router";

async function main() {
  const app = new MestoApp();
  const env = app.env;

  await app.init();

  if (process.env.RUN_MIGRATIONS) {
    await app.db.runMigrations();
  }

  mestoRouter(app);

  await profileApp.attachTo(app);
  await applicantsApp.attachTo(app);
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