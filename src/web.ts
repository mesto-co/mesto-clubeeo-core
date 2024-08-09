import "reflect-metadata";

import {AppEnv} from "./appEnv";
import App from './App';
import router from './router';

process.env.TZ = 'UTC';

async function main() {
  const env = AppEnv.getInstance();
  const app = new App(env);

  await app.init();
  router(app);
  await app.run();
}

main().catch(error => console.error(error));
