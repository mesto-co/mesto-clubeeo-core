import "reflect-metadata";
import {createConnection, IsNull} from "typeorm";
import {AppEnv} from "./appEnv";
import App from './App';
import router from './router';
import {taskProcessingDaemon} from './daemons/TaskProcessingDaemon/taskProcessingDaemon'
import MemberRole from './models/MemberRole'
import MemberBadge from './models/MemberBadge'
import discordDaemon from './clubApps/DiscordApp/discordDaemon'

process.env.TZ = 'UTC';

const env = AppEnv.getInstance()

createConnection({
  type: env.databaseType as 'postgres',
  host: env.databaseHost,
  port: env.databasePort,
  username: env.databaseUser,
  password: env.databasePassword,
  database: env.databaseName,
  ssl: env.databaseSsl,
  entities: [
    __dirname + "/models/*.ts",
    __dirname + "/engines/SubscriptionEngine/models/*.ts",
    __dirname + "/engines/AppEngine/models/*.ts",
    __dirname + "/engines/MotionEngine/models/*.ts",
  ],
  synchronize: true,
}).then(async connection => {

  const app = new App(connection, env);

  // const memberRoles = await app.m.findBy(MemberRole, {
  //   member: IsNull(),
  // });
  // for (const memberRole of memberRoles) {
  //   const {value: member} = await app.repos.member.findOrCreate({
  //     user: {id: memberRole.userId},
  //     club: {id: memberRole.clubId},
  //   });
  //   memberRole.member = member;
  //   await app.m.save(memberRole);
  // }

  // const memberBadges = await app.m.findBy(MemberBadge, {
  //   member: IsNull(),
  // });
  // for (const memberBadge of memberBadges) {
  //   const {value: member} = await app.repos.member.findOrCreate({
  //     user: {id: memberBadge.userId},
  //     club: {id: memberBadge.clubId},
  //   });
  //   memberBadge.member = member;
  //   await app.m.save(memberBadge);
  // }

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

}).catch(error => console.log(error));
