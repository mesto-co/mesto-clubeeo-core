import App from '../../../App'
import {Guild, MessageEmbed} from 'discord.js'
import {configThreadName, joinThreadName} from './common'

export async function createAdminChat(app: App, guild: Guild) {
  // find existed thread
  const existedThread = guild.channels.cache.find((v) => v.name === joinThreadName);

  // create thread if not exists
  if (!existedThread) {
    const thread = await guild.channels.create(configThreadName);

    // const club = await app.repos.club.findByExtId(guild.id, ClubExtService.discord);
    // if (!club) {}

    const text = "This is config thread for Clubeeo.\n\n"
      + "Please, enter your community activation code.";

    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Clubeeo')
      .setAuthor({name: 'Clubeeo'})
      .setDescription(text);

    await thread.send({
      embeds: [embed],
    });

    return true;
  }
}
