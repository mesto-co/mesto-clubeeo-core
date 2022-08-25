import App from '../../../App'
import {Guild, MessageActionRow, MessageButton, MessageEmbed} from 'discord.js'
import {joinThreadName} from './common'
import {ExtService} from '../../../lib/enums'

export async function createJoinChat(app: App, guild: Guild) {
  // find existed thread
  const existedThread = guild.channels.cache.find((v) => v.name === joinThreadName);

  // create thread if not exists
  if (!existedThread) {
    const thread = await guild.channels.create(joinThreadName);

    const club = await app.repos.club.findByExtId(guild.id, ExtService.discord);
    const clubCtx = app.contexts.club(club);

    if (!club) {
      return false;
    }

    const text = `**${club.name}**\n\n`
      + "Here you'll be able to verify ownership of your NFT.\n\n"
      + "This is a read-only connection. We will never ask for your private key or seed phrase.";

    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Verify your wallet')
      .setAuthor({ name: 'Clubeeo'}) //, iconURL: clubCtx.getLogoLink(), url: clubCtx.clubLink() })
      .setDescription(text)
      .setThumbnail(clubCtx.getLogoLink());

    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setLabel('Generate verification link')
          .setCustomId('verifyWallet')
          .setStyle('PRIMARY')
      );

    await thread.send({
      embeds: [embed],
      components: [row]
    });

    return true;
  }
}
