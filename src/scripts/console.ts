import "reflect-metadata";
import MestoEnv from "../Env";
import { MestoApp as App } from '../App';
import * as dotenv from 'dotenv';
import repl from 'repl';

dotenv.config();

process.env.TZ = 'UTC';

// Initialize app logic
(async (): Promise<void> => {
  console.log('App logic preloaded: DB connected, DI container initialized');

  const app = new App();

  await app.init();

  // await app.ds.initialize();

  // Start the interactive Node REPL with preloaded objects
  const r = repl.start({
    prompt: 'mesto-back > ',
  });

  // Expose your objects to the REPL context
  r.context.app = app;
})();
