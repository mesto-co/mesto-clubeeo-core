import App from '../../App'
import {ClubAppContext} from '../../contexts/ClubAppContext'
import {notificationsThreadName} from './procedures/common'
import ClubExt from '../../models/ClubExt'
import assert from 'assert'
import {ExtService} from '../../lib/enums'

export class DiscordClubAppContext {
  readonly app: App;
  readonly clubAppContext: ClubAppContext;
  readonly clubExt: ClubExt;

  constructor(app: App, clubAppContext: ClubAppContext, clubExt: ClubExt) {
    this.app = app;
    this.clubAppContext = clubAppContext;
    this.clubExt = clubExt;
  }

  get notificationsThreadName() {
    return this.clubAppContext.getConfigVal('notificationsThreadName', notificationsThreadName);
  }

  async postNotification(message: string) {
    const guild = await this.getGuild({clubExt: this.clubExt});
    const channel = guild.channels.cache.find((v) => v.name === this.notificationsThreadName);
    if (channel && channel.type === 'GUILD_TEXT') {
      await channel.send({
        content: message,
      });
    } else {
      this.logWarn(`Notification thread "${this.notificationsThreadName}" is not found`, {guild});
    }
  }

  async getGuild(opts: { clubExt: ClubExt }) {
    let result = this.getCachedGuild(opts);
    if (!result) {
      const guildId = this.getClubExtGuildId(opts);
      result = await this.app.Discord.guilds.fetch(guildId);
    }
    return result;
  }

  getClubExtGuildId(opts: { clubExt: ClubExt }) {
    assert(opts.clubExt.service === ExtService.discord, `clubExt.service === ${ExtService.discord} is expected, but ${opts.clubExt.service} given in DiscordApp#changeUserState`);
    return opts.clubExt.extId;
  }

  getCachedGuild(opts: { clubExt: ClubExt }) {
    const guildId = this.getClubExtGuildId(opts);
    return this.app.Discord.guilds.cache.find(v => v.id === guildId);
  }

  logWarn(message: string, data = {}) {
    this.app.log.warn(
      `${message} for ClubExt#${this.clubExt.id}`,
      {
        data: {
          clubExt: this.clubExt,
          ...data,
        },
      },
    );
  }
}
