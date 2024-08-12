import { MestoApp } from "./App";
import profileApp from "./apps/profileApp";
import MestoEnv from "./Env";
import { mestoRouter } from "./router";

async function main() {
  const env = new MestoEnv();

  const app = new MestoApp(env);

  await app.init();

  mestoRouter(app);

  profileApp(app);

  // app.router.get('/api/login', async (req, reply) => {
  //   app.auth.logIn('1', req['session']);
  //   return { data: 'Logged in!' };
  // });

  await app.run();
}

main().catch(error => console.error(error));