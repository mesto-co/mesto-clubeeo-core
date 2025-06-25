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

    const newByRole = async (roleName: string, data: {period?: number, enabledOnly: boolean}) => {
      const role = await c.m.findOne(ClubRole, {where: {club: {id: clubId}, name: roleName}});
      return await c.m.count(MemberRole, {
        where: {
          enabled: data.enabledOnly ? true : undefined,
          club: {id: clubId},
          clubRole: {id: role.id},
          createdAt: data.period ? MoreThan(new Date(Date.now() - data.period)) : undefined
        }
      });
    };

    const newMembers = await newByRole('member', {period, enabledOnly: true});
    const newMembersTotal = await newByRole('member', {enabledOnly: false});

    const applicantMembers = await newByRole('applicant', {period, enabledOnly: false});
    const applicantMembersActive = await newByRole('applicant', {period, enabledOnly: true});
    const applicantMembersTotal = await newByRole('applicant', {enabledOnly: false});
    const applicantMembersTotalActive = await newByRole('applicant', {enabledOnly: true});

    const guestMembers = await newByRole('guest', {period, enabledOnly: false});
    const guestMembersActive = await newByRole('guest', {period, enabledOnly: true});
    const guestMembersTotal = await newByRole('guest', {enabledOnly: false});
    const guestMembersTotalActive = await newByRole('guest', {enabledOnly: true});

    const rejectedCount = await newByRole('rejected', {period, enabledOnly: true});

    const message = await c.t('bot.stats', user.lang, {
      periodText,
      newMembers,
      newMembersTotal,
      applicantMembers,
      applicantMembersActive,
      applicantMembersTotal,
      applicantMembersTotalActive,
      rejectedCount,
      guestMembers,
      guestMembersActive,
      guestMembersTotal,
      guestMembersTotalActive,
    }, botStatsMessageTemplate);
    await ctx.reply(message);
  });
}

const botStatsMessageTemplate = 
`За {{periodText}}:
- Новых участников: {{newMembers}}
- Новых заявок: {{applicantMembers}}, в том числе на рассмотрении: {{applicantMembersActive}}
- Отклоненных заявок: {{rejectedCount}}
- Гостей: {{guestMembers}}, в том числе не подавших заявку: {{guestMembersActive}}

За всё время:
- Новых участников: {{newMembersTotal}}
- Новых заявок: {{applicantMembersTotal}}, в том числе на рассмотрении: {{applicantMembersTotalActive}}
- Гостей: {{guestMembersTotal}}, в том числе не подавших заявку: {{guestMembersTotalActive}}
`;
