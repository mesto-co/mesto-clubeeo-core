import { env } from './../appEnv';
import "reflect-metadata";
import {createConnection} from "typeorm";
import {AppEnv} from '../appEnv'
import App from '../App'
import Club from '../models/Club'
import ClubApp from '../engines/AppsEngine/models/ClubApp'



async function main() {
  const env = AppEnv.getInstance();
  const app = new App(env);

  await app.init();

  await install(app);
}

main().catch(error => console.error(error));

const install = async (app: App) => {
  const env = app.Env;

  const clubName = env.defaultClub[0].toUpperCase() + env.defaultClub.slice(1);
  const { value: clubeeoClub } = await app.em.findOneOrCreateBy(Club, {slug: env.defaultClub}, {name: clubName});

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
