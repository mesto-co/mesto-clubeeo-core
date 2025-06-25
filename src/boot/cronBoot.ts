import Club from "@/models/Club";
import { MestoApp } from "../App";
import ClubExt from "@/models/ClubExt";
import { getStats, statsMessage } from "@/engines/TelegramEngine/messages/statsMessage";

export function cronBoot(c: MestoApp) {
  c.engines.cron.schedule('7 * * * *', async () => {
    // const club = await c.m.findOne(Club, {where: {id: '1'}});
    // const clubExt = await c.m.findOne(ClubExt, {where: {club: {id: club.id}}});
    const MS_PER_HOUR = 60 * 60 * 1000;
    let period = 7 * 24 * MS_PER_HOUR;
    let periodText = 'неделю';

    const stats = await getStats(c, '1', period);

    const message = await statsMessage(c, {
      periodText,
      ...stats,
    }, {lang: 'ru'});

    c.engines.telegram.bot.telegram.sendMessage(
      '2778567681',
      message
    )
  });
}