import MestoApp from "@/App";
import ClubRole from "@/models/ClubRole";
import MemberRole from "@/models/MemberRole";
import { MoreThan } from "typeorm";

export async function getStats(c: MestoApp, clubId: string, period?: number) {
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

  return {
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
  }
}

export async function statsMessage(c: MestoApp, data: {
  periodText: string,
  newMembers: number,
  newMembersTotal: number,
  applicantMembers: number,
  applicantMembersActive: number,
  applicantMembersTotal: number,
  applicantMembersTotalActive: number,
  rejectedCount: number,
  guestMembers: number,
  guestMembersActive: number,
  guestMembersTotal: number,
  guestMembersTotalActive: number,
}, opts: {lang: string}) {
  return await c.t('bot.stats', opts.lang, data, botStatsMessageTemplate);
}

export const botStatsMessageTemplate = 
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
