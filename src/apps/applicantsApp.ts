/**
 * A management application for accepting applications from users.
 * 
 * @module applicantsApp
 */

import { MestoApp } from "../App";
import Club from "../models/Club";
import Member from "../models/Member";
import MemberRole from "../models/MemberRole";
import User from "../models/User";
import UserExt from "../models/UserExt";
import MemberProfile from "../engines/MemberProfiles/models/MemberProfile";
import MemberApplication from "../models/MemberApplication";
import { AppBuilder } from "../lib/createApp";

export class ApplicantsRepo {
  constructor(protected c: MestoApp) {}

  // Fetch paginated list of users by role
  async fetchMembersByRole(club: Club, role: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const [members, total] = await this.c.m.findAndCount(Member, {
      where: {
        enabled: true,
        memberRoles: {
          enabled: true,
          club: { id: club.id },
          clubRole: { name: role }
        }
      },
      // relations: {
      //   memberRoles: {
      //     clubRole: true,
      //   },
      // },
      order: {
        id: 'DESC',
      },
      skip: offset,
      take: limit,
    });

    for (const member of members) {
      const profile = await this.c.m.findOneBy(MemberProfile, { member: { id: member.id } });
      const user = await this.c.m.findOneBy(User, {id: member.userId});
      const userExts = await this.c.m.findBy(UserExt, {user: {id: member.userId}});
      member['profile'] = {
        ...profile,
        userId: user.id,
      };
      member['rolesMap'] = await this.c.engines.access.service.getRolesMap({member, user, hub: {id: club.id}}, ['applicant', 'member', 'rejected', 'guest']);
      member['memberRoles'] = await this.c.m.find(MemberRole, {
        where: { member: { id: member.id }, club: { id: club.id }, enabled: true },
        relations: ['clubRole'],
        order: { clubRole: { name: 'ASC' } },
      });
      member['userExts'] = userExts;
    }

    return { members, total };
  }

  // Fetch user profile by user ID
  async fetchMemberProfile(memberId: string) {
    const profile = await this.c.m.findOneBy(MemberProfile, { member: { id: memberId } });
    if (!profile) {
      throw new Error('Profile not found');
    }
    return profile;
  }

  // Fetch application by member ID
  async fetchMemberApplication(memberId: string, clubId: string) {
    const application = await this.c.m.findOne(MemberApplication, {
      where: { member: { id: memberId }, club: { id: clubId } },
      relations: ['user']
    });
    
    if (!application) {
      return null;
    }
    
    return application;
  }

  // Change user role
  async changeUserRole(memberId: string, clubId: string, newRole: string, roles: string[]) {
    const member = await this.c.m.findOneBy(Member, { id: memberId, club: {id: clubId} });
    if (!member) {
      throw new Error('Member not found');
    }

    const user = await this.c.m.findOneBy(User, {id: member.userId});

    const rolesToRemove = ['applicant', 'member', 'rejected', 'guest', 'explorer', 'master', 'legend'].filter(role => role !== newRole);
    for (const role of rolesToRemove) {
      await this.c.engines.access.service.removeRole({member, user, hub: {id: clubId}}, role);
    }

    await this.c.engines.access.service.addRole({member, user, hub: {id: clubId}}, newRole);

    for (const role of roles) {
      await this.c.engines.access.service.addRole({member, user, hub: {id: clubId}}, role);
    }

    let message: any = null;
    if (newRole === 'member') {
      message = messages[`member_${roles[0]}`];
    } else if (newRole === 'rejected') {
      message = messages.rejected;
    }

    if (message) {
      // Send notification via Telegram if user has Telegram integration
      try {
        const userExt = await this.c.m.findOneBy(UserExt, { 
          user: { id: user.id }, 
          service: 'tg' 
        });

        if (userExt) {
          await this.c.engines.telegram.bot.telegram.sendMessage(
            userExt.extId, 
            message.text,
            { 
              parse_mode: message.parse_mode,
              reply_markup: message.reply_markup,
            }
          );
        }
      } catch (error) {
        this.c.logger.error({ error }, 'Failed to send Telegram notification');
      }
    }

    return { newRole };
  }
  
  // Update application status
  async updateApplicationStatus(applicationId: string, status: string, roles: string[], rejectionReason?: string) {
    const application = await this.c.m.findOneBy(MemberApplication, { id: applicationId });
    if (!application) {
      throw new Error('Application not found');
    }

    application.status = status as any;
    if (rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    
    await this.c.m.save(application);

    // Also update the member role based on the application status
    const member = await this.c.m.findOneBy(Member, { id: application.memberId });
    const user = await this.c.m.findOneBy(User, { id: application.userId });

    if (status === 'approved') {
      await this.changeUserRole(application.memberId, application.clubId, 'member', roles);
    } else if (status === 'rejected') {
      await this.changeUserRole(application.memberId, application.clubId, 'rejected', roles);
    }
    
    return application;
  }
}

export class ApplicantsEntity {
  repo: ApplicantsRepo;

  constructor(public c: MestoApp) {
    this.repo = new ApplicantsRepo(c);
  }
}

const applicantsApp = new AppBuilder<MestoApp, ApplicantsEntity>('mesto-applicants', (c) => new ApplicantsEntity(c));

applicantsApp.get('/members', {
  schema: {
    querystring: {
      role: { type: 'string', enum: ['applicant', 'member', 'rejected', 'guest'] },
      page: { type: 'integer', default: 1 },
      limit: { type: 'integer', default: 20 },
    },
  }
}, async ({ repo }, { query, ctx: {club} }, reply) => {
  const { role, page, limit } = query;
  const { members, total } = await repo.fetchMembersByRole(club, role, page, limit);

  return {
    data: members,
    meta: {
      total,
      page,
      limit,
    },
  };
});

applicantsApp.get('/member/:memberId/profile', {}, async ({ repo }, { params }, reply) => {
  const { memberId } = params;
  const profile = await repo.fetchMemberProfile(memberId);
  
  return { data: profile };
});

// New route to fetch application by member ID
applicantsApp.get('/member/:memberId/application', {}, async ({ repo }, { params, ctx: { club } }, reply) => {
  const { memberId } = params;
  const application = await repo.fetchMemberApplication(memberId, club.id);
  
  return { data: application };
});

applicantsApp.patch('/member/:memberId/role', {
  schema: {
    body: {
      type: 'object',
      properties: {
        newRole: { type: 'string', enum: ['applicant', 'member', 'rejected', 'guest'] },
      },
      required: ['newRole'],
    },
  },
}, async ({ repo }, { params, body, ctx: { club } }, reply) => {
  const { memberId } = params;
  const { newRole } = body;
  const result = await repo.changeUserRole(memberId, club.id, newRole, []);

  return { data: result };
});

// New route to update application status
applicantsApp.patch('/application/:applicationId/status', {
  schema: {
    body: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
        roles: { type: 'array', items: { type: 'string', enum: ['explorer', 'master', 'legend'] } },
        rejectionReason: { type: 'string' },
      },
      required: ['status'],
    },
  },
}, async ({ repo }, { params, body }, reply) => {
  const { applicationId } = params;
  let { status, roles, rejectionReason } = body;
  roles = (roles || []).map((role: string) => role.toLowerCase());
  const result = await repo.updateApplicationStatus(applicationId, status, roles, rejectionReason);

  return { data: result };
});

const acceptedReplyKeyboard = {
  inline_keyboard: [
    [
      { text: 'В Меню', web_app: { url: 'https://mesto.clubeeo.com/#/mesto/home' } },
      { text: 'Заполнить Профиль', web_app: { url: 'https://mesto.clubeeo.com/#/mesto/profile' } }
    ],
    [
      { text: 'Перечень чатов и сообществ', web_app: { url: 'https://mesto.clubeeo.com/#/mesto/telegram-chats' } }
    ]
  ]
}

const subscriptionReplyKeyboard = {
  inline_keyboard: [
    [
      { text: 'Оплатить доступ в рублях', url: 'https://t.me/tribute/app?startapp=soAx' },
      { text: 'Оплатить доступ в Euro', url: 'https://t.me/tribute/app?startapp=soA0' }
    ],
    ...acceptedReplyKeyboard.inline_keyboard,
  ]
}

const messages = {
  rejected: {
    text: `Добрый день\\!

Вы отправляли анкету для вступления в Mesto, но, к сожалению, мы не смогли её одобрить\\.

Обычно это происходит, если информации недостаточно или она не соответствует тематике и ценностям сообщества\\.

⚡️Не совпасть — это нормально\\.

Если вы случайно не указали важные детали, просто отправьте анкету ещё раз\\.

Отклонение заявки — не окончательное решение\\. Посещайте наши открытые мероприятия, знакомьтесь с участниками, проявите себя\\. Если кто\\-то из сообщества готов вас порекомендовать, мы будем рады пересмотреть заявку\\.

Следите за новостями и анонсами мероприятий в наших каналах\\!

Мы на связи\\!`,
    parse_mode: "MarkdownV2",
  },
  member_explorer: {
    text: `Ваша заявка одобрена — добро пожаловать во Вселенную Mesto\\!

Вы стали частью сообщества предпринимателей, стартаперов и экспертов, создающих инновационные проекты и технологии\\. Теперь вам доступны ресурсы и мероприятия Mesto\\.

✨ Вам присвоен уровень *Исследователь*, и уже открыт доступ в\\:

*М\\.Кухня* — чат для общих обсуждений, вопросов и знакомств\\.
*М\\.Кампус* — пространство для первых шагов, роста и обучения\\.

Полный перечень чатов и сообществ доступен по кнопке ниже

💬 Чтобы присоединиться к *Академии* или *Совету*, убедитесь, что ваш профиль максимально заполнен и соответствует критериям более высокого уровня\\. Вступление в эти чаты возможно после дополнительной верификации и поддержки проекта \\(оплата участия\\)\\.

Mesto — это самоуправляемый волонтёрский проект\\. Вы можете внести вклад и выбрать формат участия\\:

*Вакансии*
*Открытые задачи*
*Донаты*

Если есть вопросы — мы всегда рядом\\.`,
    parse_mode: "MarkdownV2",
    reply_markup: acceptedReplyKeyboard,
  },
  member_master: {
    text: `Ваша заявка одобрена — добро пожаловать в Mesto\\!

Вы присоединились к сообществу Mesto на уровне *Мастер* — это означает, что у вас уже есть опыт и достижения, которыми вы можете делиться и развивать вместе с другими участниками\\.

✨ Вам открыт доступ в\\:

*М\\.Кухня* — общее пространство для общения\\.
*М\\.Кампус* — поддержка и взаимное развитие проектов\\.
*М\\.Академия* — пространство для обмена знаниями, мастермайндов и прокачки экспертизы\\.

Полный перечень чатов и сообществ доступен по кнопке ниже

💬 Доступ в *Совет* возможен после подтверждения соответствия критериям уровня Легенда и поддержки проекта\\. Убедитесь, что ваш профиль отражает опыт, достижения и вклад в сообщество\\.

Mesto — это самоуправляемый волонтёрский проект, который мы создаём вместе\\. Вы можете подключиться к\\:

*Вакансиям*
*Открытые задачи*
*Донаты*

Мы всегда на связи, если нужна помощь или есть идеи\\.`,
    parse_mode: "MarkdownV2",
    reply_markup: subscriptionReplyKeyboard,
  },
  member_legend: {
    text: `Ваша заявка одобрена — добро пожаловать в Mesto\\!

Вы вошли в сообщество на уровне *Легенда* — вместе с другими экспертами, инвесторами и лидерами, формирующими векторы развития технологий и будущего\\.

✨ Вам открыт доступ во все ключевые пространства\\:

*М\\.Кухня* — для повседневного общения\\.
*М\\.Кампус* — проекты и поддержка новых участников\\.
*М\\.Академия* — экспертиза, наставничество, обмен опытом\\.
*М\\.Совет* — стратегические обсуждения, запуск инициатив, участие в развитии экосистемы\\.

Полный перечень чатов и сообществ доступен по кнопке ниже

💬 Вы можете рекомендовать участников на повышение уровня — ориентируясь на критерии и вклад в сообщество\\. В ближайшее время мы внедрим механизм оценки профиля и автоматического пересмотра уровня\\.

Mesto — это совместный волонтёрский проект\\. Поддержите его временем, знаниями или донатом\\.

Варианты участия\\:

*Эдвайзинг / наставничество*
*Участие в инициативах*
*Донаты*

Если у вас есть предложения или вы хотите усилить какое\\-то направление — пишите, мы рядом\\.`,
    parse_mode: "MarkdownV2",
    reply_markup: subscriptionReplyKeyboard,
  },
};

export default applicantsApp;