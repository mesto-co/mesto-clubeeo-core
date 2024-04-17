import "reflect-metadata";
import {createConnection} from "typeorm";
import {AppEnv} from '../appEnv'
import App from '../App'
import Club from '../models/Club'
import ClubApp from '../engines/AppEngine/models/ClubApp'

const env = AppEnv.getInstance()

process.env.TZ = 'UTC';

createConnection({
  type: "postgres",
  host: env.databaseHost,
  port: env.databasePort,
  username: env.databaseUser,
  password: env.databasePassword,
  database: env.databaseName,
  entities: [
    __dirname + "/../models/*.ts",
  ],
  synchronize: true,
}).then(async connection => {

  const app = new App(connection, env);

  await install(app);
}).catch(error => console.log(error));

const install = async (app: App) => {
  const { value: clubeeoClub } = await app.em.findOneOrCreateBy(Club, {slug: 'clubeeo'}, {name: 'Clubeeo'});

  const clubeeoPostsApp = await app.em.createOrUpdateBy(ClubApp, {
    club: {id: clubeeoClub.id},
    appSlug: 'reactions',
    appName: 'posts',
  }, {
    title: 'reactions',
    config: {autoRoleOnReaction: 'reacted', publicView: true},
  });

  clubeeoClub.settings.clubPostsCarouselAppId = clubeeoPostsApp.id;
  clubeeoClub.settings.near = {enabled:  true}
  await app.m.save(clubeeoClub);
}
