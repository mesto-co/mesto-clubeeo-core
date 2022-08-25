import "reflect-metadata";
import {createConnection} from "typeorm";
import {Env} from "./env";
import App from './App';
import router from './router';
import cron from './cron';

const env = Env.getInstance()

process.env.TZ = 'UTC';

createConnection({
  type: "postgres",
  host: env.databaseHost,
  port: env.databasePort,
  username: env.databaseUser,
  password: env.databasePassword,
  database: env.databaseName,
  entities: [
    __dirname + "/models/*.ts",
  ],
  synchronize: true,
}).then(async connection => {

  const app = new App(connection, env);

  router(app);

  if (env.runWorker) {
    cron(app);
  }
}).catch(error => console.log(error))
