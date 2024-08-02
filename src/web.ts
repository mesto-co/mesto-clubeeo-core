import "reflect-metadata";
import {AppEnv} from "./appEnv";
import App from './App';
import router from './router';
import {taskProcessingDaemon} from './daemons/TaskProcessingDaemon/taskProcessingDaemon'
import discordDaemon from './clubApps/DiscordApp/discordDaemon'
import { coreWebInit, coreWebRun } from "./core/coreWeb";

process.env.TZ = 'UTC';

const env = AppEnv.getInstance()

async function main() {
  const app = new App(env);

  await app.init();
  router(app);
  await app.run();
}

main().catch(error => console.error(error));
