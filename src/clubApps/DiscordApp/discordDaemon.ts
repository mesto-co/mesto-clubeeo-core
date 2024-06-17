import {Message} from 'discord.js'
import DiscordApp from './DiscordApp'
import {discordClubUserContextFactory} from './DiscordClubUserContext'
import {DiscordContainer} from './DiscordContainer'
import App from '../../App'
import {createJoinChat} from './procedures/createJoinChat'
import {createAdminChat} from './procedures/createAdminChat'
import {privateMessageFlag} from './procedures/common'
import {createNotifyChat} from './procedures/createNotifyChat'
import {onVerifyWalletClick} from './procedures/onVerifyWalletClick'
import {extActivationLogic} from '../../logic/ExtActivationLogic'
import {ExtService} from '../../lib/enums'
import {DiscordEventCodes} from './lib/discordConsts'
import {toSerializable} from '../../lib/toSerializable'

async function processActivation(app: App, message: Message) {
  try {
    app.log.info('discord:activation', {data: toSerializable(message)});

    const activated = await activate(app, message)

    if (activated) {
      await createJoinChat(app, message.guild);
      await createNotifyChat(app, message.guild);
    }
  } catch (e) {
    app.log.error(`discordDaemon:processActivation:${e.message}`, {data: {error: e.toString()}})
  }
}

async function activate(app: App, message: Message) {
  // if (message.guild.channels.cache.find(v => v.id === message.channelId) !== configThreadName) {
  // if ((await message.channel.fetch()) !== configThreadName) {
  //   return false;
  // }

  const splitContent = message.content.split('activation:', 2);

  if (splitContent.length !== 2) {
    return false;
  }

  const code = splitContent[1];
  if (code.length <= 1) {
    return false;
  }

  return await extActivationLogic(
    code, ExtService.discord, String(message.guildId),
    {
      repos: app.repos,
      async onActivated(extCode, data) {
        const club = await app.repos.club.findById(extCode.clubId);
        const user = await app.repos.user.findById(extCode.userId);

        await app.engines.motionEngine.processEvent(
          DiscordEventCodes['discord:botActivated'], {club, user}, {
            extCode,
            data,
          });
      },
      async reply(text: string) {
        return await message.reply({content: text});
      }
    }
  );
}

export default function discordDaemon(c: DiscordContainer) {
  const app = c.app;
  const client = c.Discord;

  client.on('ready', () => {
    console.log('Discord bot is ready');
  });

  // client.on('guild')

  client.on('guildCreate', guild => {
    console.log('guildCreate')
    console.log('guild', guild)

    app.log.info('guildCreate', {data: guild});

    void createAdminChat(app, guild);

    // guild.systemChannel.send(`Hello, I'm ClubeeoBot. Thanks for inviting me, here are a list of all my commands! :alien:`)
  });

  client.on('interactionCreate', interaction => {
    app.log.info('discord:interactionCreate', {data: toSerializable(interaction)});

    if (interaction.isButton()) {
      if (interaction.customId === 'verifyWallet') {
        void onVerifyWalletClick(app, interaction);
      }
    }
  });

  client.on('messageCreate', (message) => {
    try {
      if (/^activation:/.test(message.content)) {
        app.log.info('discord:messageCreate:activation', {data: toSerializable(message)})
        void processActivation(app, message);
      } else if (message.content === '/clubeeo-wallet-update') {
        app.log.info('discord:messageCreate:clubeeo-wallet-update', {data: toSerializable(message)})

        const clubeeoWalletUpdate = async () => {
          const dcClubUserCtx = await discordClubUserContextFactory(app, message.member.user.id, message.guildId);
          const clubExt = dcClubUserCtx.clubExt;
          const userExt = dcClubUserCtx.userExt;

          // update wallet data
          const isMember = await app.contexts.userInClub(userExt.user, clubExt.club).isMember();

          const discordApp = new DiscordApp({app});

          if (isMember) {
            await discordApp.enableUser({
              userExt,
              clubExt,
            });

            await message.reply({
              content: 'Your membership is verified',
              flags: privateMessageFlag,
            });
          } else {
            await discordApp.disableUser({
              userExt,
              clubExt,
            });

            await message.reply({
              content: 'Your membership wasn\'t verified',
              flags: privateMessageFlag,
            });
          }
        }
        void clubeeoWalletUpdate();

      } else if (message.content === '/clubeeo-reactivate') {
        app.log.info('discord:messageCreate:clubeeo-reactivate', {data: toSerializable(message)})
        const reactivate = async () => {
          await createJoinChat(app, message.guild);
          await createNotifyChat(app, message.guild);
        }

        void reactivate();
      }


      // if (message.content === 'emulate:guildCreate:xx2VdX') {
      //   const guild = message.guild;
      //
      //   console.log('emulate:guildCreate')
      //
      //   void createJoinChat(app, guild);
      //   void createAdminChat(app, guild);
      // } else


      // if (message.content === 'ping') {
      //   const row = new MessageActionRow()
      //     .addComponents(
      //       new MessageButton()
      //         .setLabel('Verify your wallet')
      //         .setURL('https://clubeeo.com')
      //         .setStyle('LINK'),
      //     );
      //
      //   void message.reply({
      //     content: 'pong',
      //     components: [row],
      //   });
      //
      //   const roleName = 'DEMO';
      //   const member = message.member;
      //   const role = member.guild.roles.cache.find(role => role.name === roleName);
      //   if (role) {
      //     void member.roles.add(role);
      //
      //     void message.reply({
      //       content: `role ${roleName} granted`,
      //     });
      //   } else {
      //     void message.reply({
      //       content: `can not find role "${roleName}"`,
      //     });
      //   }
      // } else if (message.content === 'kick') {
      //
      //   const roleName = 'DEMO';
      //   const member = message.member;
      //   const role = member.guild.roles.cache.find(role => role.name === roleName);
      //   if (role) {
      //     void member.roles.remove(role);
      //
      //     void message.reply({
      //       content: `role ${roleName} removed`,
      //     });
      //   } else {
      //     void message.reply({
      //       content: `can not find role "${roleName}"`,
      //     });
      //   }
      // } else

      // else if (message.content === 'enable') {
      //
      //   const doEnable = async () => {
      //     const discordApp = new DiscordApp({app});
      //     const dcClubUserCtx = await discordClubUserContextFactory(app, message.member.user.id, message.guildId);
      //     await discordApp.enableUser({userExt: dcClubUserCtx.userExt, clubExt: dcClubUserCtx.clubExt});
      //   }
      //   void doEnable();
      //
      // } else if (message.content === 'disable') {
      //
      //   const doDisable = async () => {
      //     const discordApp = new DiscordApp({app});
      //     const dcClubUserCtx = await discordClubUserContextFactory(app, message.member.user.id, message.guildId);
      //     await discordApp.disableUser({userExt: dcClubUserCtx.userExt, clubExt: dcClubUserCtx.clubExt});
      //   }
      //   void doDisable();
      //
      // } else if (message.content === '/clubeeo-wallet-update') {
      //
      //   const clubeeoWalletUpdate = async () => {
      //     const dcClubUserCtx = await discordClubUserContextFactory(app, message.member.user.id, message.guildId);
      //     const clubExt = dcClubUserCtx.clubExt;
      //     const userExt = dcClubUserCtx.userExt;
      //
      //     // update wallet data
      //     const isMember = await app.contexts.userInClub(userExt.user, clubExt.club).isMember();
      //
      //     const discordApp = new DiscordApp({app});
      //
      //     if (isMember) {
      //       await discordApp.enableUser({
      //         userExt,
      //         clubExt,
      //       });
      //
      //       await message.reply({
      //         content: 'Your membership is verified',
      //         flags: privateMessageFlag,
      //       });
      //     } else {
      //       await discordApp.disableUser({
      //         userExt,
      //         clubExt,
      //       });
      //
      //       await message.reply({
      //         content: 'Your membership wasn\'t verified',
      //         flags: privateMessageFlag,
      //       });
      //     }
      //   }
      //   void clubeeoWalletUpdate();
      //
      // }
    } catch (e) {
      app.log.error(`discordDaemon:messageCreate:${e.message}`, {data: e})
    }
  });

  void client.login(app.Env.discordBotToken);
}
