import "reflect-metadata";
import {AppEnv} from "./appEnv";
import App from './App';
import router from './router';
import {taskProcessingDaemon} from './daemons/TaskProcessingDaemon/taskProcessingDaemon'
import discordDaemon from './clubApps/DiscordApp/discordDaemon'

process.env.TZ = 'UTC';

const env = AppEnv.getInstance()

async function main() {
  const app = new App(env);
  await app.init();

  router(app);

  if (env.workers.legacyTasks) {
    // cron(app);
    taskProcessingDaemon(app);
  }

  if (env.workers.motion) {
    app.engines.motionEngine.runDaemon();
  }

  if (env.workers.discord) {
    discordDaemon(app.DiscordContainer);
  }
}

main().catch(error => console.error(error));
