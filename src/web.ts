import { MestoApp } from "./App";
import applicantsApp from "./apps/applicantsApp";
import profileApp from "./apps/profileApp";
import MestoEnv from "./Env";
import { mestoRouter } from "./router";

async function main() {
  const env = new MestoEnv();

  const app = new MestoApp(env);

  await app.init();

  mestoRouter(app);

  await profileApp.attachTo(app);
  await applicantsApp.attachTo(app);

  await app.run();

  // Enable graceful stop
  // process.once('SIGINT', () => bot.stop('SIGINT'))
  // process.once('SIGTERM', () => bot.stop('SIGTERM'))
}

main().catch(error => console.error(error));