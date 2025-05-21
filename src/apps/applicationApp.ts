/**
 * A user-facing application for accepting applications from users.
 * 
 * @module applicationsApp
 */

import { MestoApp } from "../App";
import { AppBuilder } from "../lib/createApp";
import { arr, obj, str, bool } from "json-schema-blocks";
import MemberApplication, { ApplicationStatus, CommunityType } from "../models/MemberApplication";
import Member from "../models/Member";
import UserExt from "@/models/UserExt";

export class ApplicationsRepo {
  constructor(protected c: MestoApp) {}

  // Check if user already has an application for this club
  async hasExistingApplication(userId: string, clubId: string): Promise<boolean> {
    const application = await this.c.m.findOneBy(MemberApplication, {
      user: { id: userId },
      club: { id: clubId }
    });
    
    return !!application;
  }

  // Create a new application
  async createApplication(userId: string, clubId: string, data: any): Promise<MemberApplication> {
    // Check if user already has a member record for this club
    let member = await this.c.m.findOneByOrFail(Member, {
      user: { id: userId },
      club: { id: clubId }
    });

    // Create the application
    const application = await this.c.em.createAndSave(MemberApplication, {
      user: { id: userId },
      club: { id: clubId },
      member: { id: member.id },
      name: data.name,
      city: data.city,
      about: data.about,
      goals: data.goals,
      communityType: data.selectedCommunity,
      socialLinks: data.socialLinks,
      additionalData: data.additionalData || {},
      status: ApplicationStatus.PENDING
    });

    // Add applicant role to the member
    await this.c.engines.access.service.addRole(
      { member, user: { id: userId }, hub: { id: clubId } },
      'applicant'
    );

    return application;
  }

  // Get application status for a user
  async getApplicationStatus(userId: string, clubId: string): Promise<MemberApplication> {
    return await this.c.m.findOneBy(MemberApplication, {
      user: { id: userId },
      club: { id: clubId }
    });
  }
}

export class ApplicationsEntity {
  repo: ApplicationsRepo;

  constructor(public c: MestoApp) {
    this.repo = new ApplicationsRepo(c);
  }
}

const applicationsApp = new AppBuilder<MestoApp, ApplicationsEntity>(
  'mesto-application',
  (c) => new ApplicationsEntity(c)
);

// Get application status
applicationsApp.get('/status', {}, async ({ repo, c }, { ctx: { user, club } }, reply) => {
  const application = await repo.getApplicationStatus(user.id, club.id);

  const member = await c.m.findOneBy(Member, {
    user: { id: user.id },
    club: { id: club.id }
  });

  let roles = {};
  if (member) {
    roles = await c.engines.access.service.getRolesMap(
      { member, user: { id: user.id }, hub: { id: club.id } },
      ['applicant', 'member', 'rejected', 'guest']
    );
  }

  return {
    data: {
      application,
      roles,
      canApply: !application || (!roles['applicant'] && !roles['member'])
    }
  };
});

// Submit application
applicationsApp.post('/submit', {
  schema: {
    body: obj({
      name: str(1),
      city: str(1),
      about: str(1),
      goals: str(1),
      selectedCommunity: str(1),
      socialLinks: arr(str()),
      additionalData: obj({}, { additionalProperties: true })
    }, { required: ['name', 'city', 'about', 'goals', 'selectedCommunity'] })
  }
}, async ({ repo, c }, { body, ctx: { user, club } }, reply) => {
  // Check if user already has an application
  const hasApplication = await repo.hasExistingApplication(user.id, club.id);

  if (hasApplication) {
    throw new Error('Вы уже подали заявку на вступление');
  }

  // Validate community type
  if (!Object.values(CommunityType).includes(body.selectedCommunity as CommunityType)) {
    throw new Error('Неверный тип сообщества');
  }

  // Create application
  const application = await repo.createApplication(user.id, club.id, body);

  // Send notification via Telegram if user has Telegram integration
  try {
    const userExt = await c.m.findOneBy(UserExt, { 
      user: { id: user.id }, 
      service: 'tg' 
    });

    if (userExt) {
      await c.engines.telegram.bot.telegram.sendMessage(
        userExt.extId, 
        successfulApplicationMessage,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    c.logger.error({ error }, 'Failed to send Telegram notification');
  }

  return { 
    data: { 
      success: true, 
      message: 'Заявка успешно отправлена',
      applicationId: application.id
    } 
  };
});

// Register the app in web.ts
applicationsApp.onInit(async (c, $) => {
  // Any initialization logic if needed
});

const successfulApplicationMessage = `Поздравляю, заявка успешно отправлена на рассмотрение 👍

Совсем скоро тебе придет уведомление о том, прошла ли твоя заявка вступление.

Пока анкета на проверке подпишись на наши каналы, чтобы быть в курсе наших событий.
t.me/mesto_community
instagram.com/mesto.co
youtube.com/mesto_community
https://www.linkedin.com/company/mestoco

Мы обрабатываем заявки силами волонтеров сообщества, поэтому это занимает некоторое время. Обычно срок рассмотрения не превышает 14 дней. Удачи!`;

export default applicationsApp;

