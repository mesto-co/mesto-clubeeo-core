import App from '../../App';
import { AppEnv } from '../../appEnv';
import discordAppRoutes from './api/discordAppRoutes'
import discord, {Intents} from 'discord.js'


export class DiscordContainer {
  readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  get Env(): AppEnv {
    return this.app.Env;
  }

  protected _Discord: discord.Client;
  get Discord(): discord.Client {
    return this._Discord || (this._Discord = new discord.Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES,
      ]
    }));
  }

  get discordAppRoutes() {
    return discordAppRoutes(this);
  }

}
