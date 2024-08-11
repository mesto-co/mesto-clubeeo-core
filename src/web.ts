import { MestoApp } from "./App";
import MestoEnv from "./Env";
import { mestoRouter } from "./router";

async function main() {
  const env = new MestoEnv();

  const app = new MestoApp(env);

  console.log(await app.engines.translation.t('Hello, world!'));

  await app.init();

  mestoRouter(app);

  await app.run();
}

main().catch(error => console.error(error));