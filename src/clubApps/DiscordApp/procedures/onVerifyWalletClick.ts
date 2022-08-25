import App from '../../../App'
import {Interaction, MessageActionRow, MessageButton} from 'discord.js'
import {privateMessageFlag} from './common'
import {ExtService} from '../../../lib/enums'

export async function onVerifyWalletClick(app: App, interaction: Interaction) {
  if (!interaction.isButton()) return;

  const clubExt = await app.repos.clubExt.findByExtId(interaction.guild.id, ExtService.discord, {
    club: true
  });

  if (!clubExt || !clubExt.club) {
    await interaction.reply({
      content: 'Club is not configured yet',
      flags: privateMessageFlag,
    });

    return;
  }

  const club = clubExt.club;
  const clubCtx = app.contexts.club(club);

  const code = await app.repos.extCode.createDiscordVerify(club, clubExt, interaction.member.user.id);
  const url = clubCtx.clubLink({discordValidation: code.code});

  const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setLabel('Open in browser')
        .setURL(url)
        .setStyle('LINK'),
    );

  await interaction.reply({
    content: 'Please, verify your wallet',
    components: [row],
    flags: privateMessageFlag,
  });
}
