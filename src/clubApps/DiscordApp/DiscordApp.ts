// export class DiscordContainer {
// }


// https://discord.com/oauth2/authorize?client_id=984812480062685224&permissions=268435462&scope=bot

import discord, {Guild} from 'discord.js'
import App from '../../App'
import UserExt from '../../models/UserExt'
import ClubExt from '../../models/ClubExt'
import assert from 'assert'
import {ExtService} from '../../lib/enums'

export interface IDiscordDeps {
  app: App //for quick access; to be removed in favor of explicit deps
}

export interface IUserExternalLink {

}

// client.api.interactions(this.id, this.token).callback.post( {data: { type: 4, data: {flags:64, content: message}}  }))

export default class DiscordApp {
  readonly deps: IDiscordDeps;
  readonly discordClient: discord.Client;
  readonly discordReady: Promise<string>;

  constructor(deps: IDiscordDeps) {
    this.deps = deps;

    this.discordClient = deps.app.Discord;

    this.discordReady = new Promise((resolve, reject) => {
      this.discordClient.once('ready', () => {
        resolve('ready');
      });
    });
  }

  getAppConfig() {
  }

  // admin
  getConfig() {
  }

  setConfig() {
  }

  getDefaultConfig() {
  }

  // user

  // isAvailableForUser() {}
  // async userExternalLinks(): Array<IUserExternalLink> {
  //
  // }

  //?
  getUserConfig() {
  }

  getUserState() {
  }

  setUserState() {
  }

  async enableUser(opts: {
    // user: User,
    userExt: UserExt,
    // club: Club,
    clubExt: ClubExt,
    role?: string
  }) {
    try {
      // shortcut
      const app = this.deps.app;

      const guildId = opts.clubExt.extId;
      // const memberId = opts.userExt.extId;
      const userId = opts.userExt.extId;

      const guild = await this.getGuild(opts);

      // await this.discordReady;

      const discordClubUser = await app.contexts.discordClubUser(guildId, userId);

      const roleName = opts.role || 'holder';
      const role = await this.getRole({guild, roleName});
      if (!role) {
        app.log.error(`can't find role ${roleName} for Discord guild #${guildId} in DiscordApp#enableUser`);
        return false;
      }

      const member = await this.getMember({userExt: opts.userExt, guild});
      if (!member) {
        app.log.error(`can't find member #${userId} for Discord guild #${guildId} in DiscordApp#enableUser`);
        return false;
      }
      app.log.debug(`enable member #${userId} for #${guildId} with role ${roleName}`);

      await member.roles.add(role);

      await discordClubUser.discordClubApp
        .postNotification(`Role "${roleName}" has been granted to ${member.displayName || member.nickname}`);

      return true;
    } catch (e) {
      this.deps.app.log.error(e.message, {data: {error: e.toString()}});
      return false;
    }
  }

  async disableUser(opts: {
    // user: User,
    userExt: UserExt,
    // club: Club,
    clubExt: ClubExt,
    role?: string
  }) {
    try {
      // shortcut
      const app = this.deps.app;

      const guildId = opts.clubExt.extId;
      const userId = opts.userExt.extId;

      const guild = await this.getGuild(opts);

      const discordClubUser = await app.contexts.discordClubUser(guildId, userId);

      // await this.discordReady;

      const roleName = opts.role || 'holder';
      const role = await this.getRole({guild, roleName});
      if (!role) {
        app.log.error(`can't find role ${roleName} for Discord guild #${guildId} in DiscordApp#disableUser`);
        return false;
      }

      const member = await this.getMember({userExt: opts.userExt, guild});
      if (!member) {
        app.log.error(`can't find member #${userId} for Discord guild #${guildId} in DiscordApp#disableUser`);
        return false;
      }
      app.log.debug(`disable member #${userId} for #${guildId}`);

      if (member.roles.cache.find(v => v.name === roleName)) {
        await member.roles.remove(role);

        await discordClubUser.discordClubApp
          .postNotification(`Role "${roleName}" has been removed from ${member.displayName || member.nickname}`);

        return true;
      }

      return false;
    } catch (e) {
      this.deps.app.log.error(e.message, {data: {error: e.toString()}});
      return false;
    }
  }

  getClubExtGuildId(opts: { clubExt: ClubExt }) {
    assert(opts.clubExt.service === ExtService.discord, `clubExt.service === ${ExtService.discord} is expected, but ${opts.clubExt.service} given in DiscordApp#changeUserState`);
    return opts.clubExt.extId;
  }

  getCachedGuild(opts: { clubExt: ClubExt }) {
    const guildId = this.getClubExtGuildId(opts);
    return this.discordClient.guilds.cache.find(v => v.id === guildId);
  }

  async getGuild(opts: { clubExt: ClubExt }) {
    let result = this.getCachedGuild(opts);
    if (!result) {
      const guildId = this.getClubExtGuildId(opts);
      result = await this.discordClient.guilds.fetch(guildId);
    }
    return result;
  }

  async getMember(opts: { userExt: UserExt, guild: Guild }) {
    assert(opts.userExt.service === ExtService.discord, `userExt.service === ${ExtService.discord} is expected, but ${opts.userExt.service} given in DiscordApp#changeUserState`);
    const userId = opts.userExt.extId;
    return await opts.guild.members.fetch(userId);
  }

  getCachedRole(opts: { guild: Guild, roleName: string }) {
    return opts.guild.roles.cache.find(v => v.name === opts.roleName);
  }

  async getRole(opts: { guild: Guild, roleName: string }) {
    const result = this.getCachedRole(opts);

    // fetch roles if not found in cache
    if (!result) {
      await opts.guild.roles.fetch();
    }

    return this.getCachedRole(opts);
  }

  // async postNotification(message: string, opts: { guild: Guild }) {
  //   const channel = opts.guild.channels.cache.find((v) => v.name === notificationsThreadName);
  //   if (channel && channel.type === 'GUILD_TEXT') {
  //     await channel.send({
  //       content: message,
  //     });
  //   } else {
  //     this.deps.app.log.warn('Notification thread is not found', {data: {guild: opts.guild}});
  //   }
  // }
}
