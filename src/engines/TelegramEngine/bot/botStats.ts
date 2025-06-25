import ClubRole from "@/models/ClubRole";
import { MoreThan } from "typeorm";

import { TelegramEngine } from "../TelegramEngine";
import MemberRole from "@/models/MemberRole";
import { fetchUserAndExtByExtId } from "@/contexts/UserExtContext";

export function botStats(telegramEngine: TelegramEngine) {
  const c = telegramEngine.c;
  const bot = telegramEngine.bot;
  const clubId = '1';

  bot.command('stats', async (ctx) => {
    const { user } = await fetchUserAndExtByExtId(c as any, {extId: ctx.from.id.toString(), service: 'tg', userData: ctx.from});

    const MS_PER_HOUR = 60 * 60 * 1000;

    let period = 7 * 24 * MS_PER_HOUR;
    let periodText = 'неделю';
    if (ctx.message.text.includes('месяц') || ctx.message.text.includes('month')) {
      period = 30 * 24 * MS_PER_HOUR;
      periodText = 'месяц';
    } else if (ctx.message.text.includes('неделя') || ctx.message.text.includes('week')) {
      period = 7 * 24 * MS_PER_HOUR;
      periodText = 'неделю';
    } else if (ctx.message.text.includes('день') || ctx.message.text.includes('day')) {
      period = 24 * MS_PER_HOUR;
      periodText = 'день';
    } else if (ctx.message.text.includes('час') || ctx.message.text.includes('hour')) {
      period = MS_PER_HOUR;
      periodText = 'час';
    }

    const memberRole = await c.m.findOne(ClubRole, {where: {club: {id: clubId}, name: 'member'}});
    const newMembers = await c.m.count(MemberRole, {
      where: {
        enabled: true,
        club: {id: clubId},
        clubRole: {id: memberRole.id},
        createdAt: MoreThan(new Date(Date.now() - period))
      }
    });

    const guestRole = await c.m.findOne(ClubRole, {where: {club: {id: clubId}, name: 'guest'}});
    const guestMembers = await c.m.count(MemberRole, {
      where: {
        enabled: true,
        club: {id: clubId},
        clubRole: {id: guestRole.id},
      }
    });

    const message = await c.t('bot.stats', user.lang, {periodText, newMembers, guestMembers}, botStatsMessageTemplate);
    await ctx.reply(message);
  });
}

const botStatsMessageTemplate = 
`За {{periodText}}:
- Новых участников: {{newMembers}}
- Гостей: {{guestMembers}}`;
