import App from '../../../App'
import {Guild, MessageEmbed} from 'discord.js'
import {notificationsThreadName} from './common'
import {ExtService} from '../../../lib/enums'

export async function createNotifyChat(app: App, guild: Guild) {
  // find existed thread
  const existedThread = guild.channels.cache.find((v) => v.name === notificationsThreadName);

  // create thread if not exists
  if (!existedThread) {
    const thread = await guild.channels.create(notificationsThreadName, {});

    const club = await app.repos.club.findByExtId(guild.id, ExtService.discord);
    const clubCtx = app.contexts.club(club);

    if (!club) {
      return false;
    }

    const text = `**${club.name}**\n\n`
      + "Here you'll get access granting and removal notifications.";

    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Notifications')
      .setAuthor({ name: 'Clubeeo'})
      .setDescription(text)
      .setThumbnail(clubCtx.getLogoLink());

    await thread.send({
      embeds: [embed],
    });

    return true;
  }
}
