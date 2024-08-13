import { MestoApp } from "./App";
import profileApp from "./apps/profileApp";
import MestoEnv from "./Env";
import { mestoRouter } from "./router";

async function main() {
  const env = new MestoEnv();

  const app = new MestoApp(env);

  await app.init();

  mestoRouter(app);

  profileApp.attachTo(app);

  await app.run();
}

main().catch(error => console.error(error));