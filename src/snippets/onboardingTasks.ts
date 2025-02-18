import App from '../App'
import Club from '../models/Club'
import User from '../models/User'
import UserExt from '../models/UserExt'
import {ExtServicesEnum} from '../lib/enums'
import ClubExt from '../models/ClubExt'
import ExtCode, {ExtCodeTypes} from '../models/ExtCode'
import Member from '../models/Member'
import {eventNames} from '../engines/MotionEngine/shared/eventNames'

async function checkChatMember(app: App, tgUserExt: UserExt, chatId: string) {
  try {
    const getChatMemberResult = await app.TelegramContainer.Telegram.getChatMember(
      chatId,
      Number(tgUserExt.extId),
    );
    if (!getChatMemberResult) return false;

    return ['member', 'creator', 'administrator']
      .includes(getChatMemberResult.status);
  } catch (e) {
    // telegram client throws error if user is not found in the chat
    return false;
  }
}

export async function onboardingTasks(app: App, taskId: string, club: Club, user: User) {
  const stepsConfig = club.settings['steps'] || [];

  const tgUserExt = user ? await app.m.findOneBy(UserExt, {
    service: ExtServicesEnum.tg,
    user: {id: user.id},
    enabled: true,
  }) : null;

  const steps = [];
  let points = 0;
  for (const stepConfig of stepsConfig) {
    if (stepConfig.type === 'telegram:verify') {
      if (!user) {
        steps.push({
          ...stepConfig,
          state: 'locked',
        })
        continue;
      }

      const isCompleted = !!tgUserExt;

      if (isCompleted) {
        points += stepConfig.points || 0;
      }

      steps.push({
        ...stepConfig,
        state: isCompleted ? 'completed' : 'available',
      });
    } else if (stepConfig.type === 'telegram:join') {
      if (!user || !tgUserExt) {
        steps.push({
          ...stepConfig,
          state: 'locked',
        })

        continue;
      }

      const tgClubExt = await app.m.findOneBy(ClubExt, {
        id: stepConfig.clubExtId,
        service: ExtServicesEnum.tg,
        club: {id: club.id},
      });

      const isCompleted = await checkChatMember(app, tgUserExt, tgClubExt.extId);

      if (isCompleted) {
        points += stepConfig.points || 0;
      }

      //todo: DRY
      if (!tgClubExt.cached['chatInviteLink']) {
        const chatInviteLink = await app.TelegramContainer.Telegram.createChatInviteLink(tgClubExt.extId, {
          creates_join_request: true,
        });

        tgClubExt.cached['chatInviteLink'] = chatInviteLink.invite_link;

        await app.m.save(tgClubExt);
      }

      steps.push({
        ...stepConfig,
        state: isCompleted ? 'completed' : 'available',
        link: tgClubExt?.cached['chatInviteLink'] || '',
      })
    } else if (stepConfig.type === 'typeform:complete') {
      if (!user) {
        steps.push({
          ...stepConfig,
          state: 'locked',
        })

        continue;
      }

      const clubExt = await app.m.findOne(ClubExt, {
        where: {
          id: stepConfig.clubExtId,
          service: ExtServicesEnum.typeform,
          club: {id: club.id},
        },
      });

      if (!clubExt) {
        steps.push({
          ...stepConfig,
          state: 'locked',
          error: 'ClubExt is not configured',
        });
        continue;
      }

      const {value: extCode} = await app.em.findOneOrCreateBy(ExtCode, {
        club: {id: club.id},
        clubExt: {id: clubExt.id},
        user: {id: user.id},
        service: ExtServicesEnum.typeform,
        codeType: ExtCodeTypes.webhook,
      }, { //todo: callable
        code: app.nanoid(),
        used: false,
      });

      const isCompleted = extCode.used;

      if (isCompleted) {
        points += stepConfig.points || 0;
      }

      steps.push({
        ...stepConfig,
        state: isCompleted ? 'completed' : 'available',
        link: `${clubExt.extId}#clubeeo_token=${extCode.code}`,
      });
    } else {
      if (!user) {
        steps.push({
          ...stepConfig,
          state: 'locked',
        })

        continue;
      }

      steps.push(stepConfig)
    }
  }

  const stepsCompletedPoints = club.settings?.['stepsCompleted']?.['points'];
  const tasksCompleted = stepsCompletedPoints && points == stepsCompletedPoints;
  if (tasksCompleted) {
    const completedKey = `page:${taskId}:task:completed`;

    const {isCreated, value: member} = await app.em.findOneOrCreateBy(Member, {
      club: {id: club.id},
      user: {id: user.id},
    }, {
      state: {
        [completedKey]: true,
      },
    });

    if (isCreated || !member.state[completedKey]) {
      await app.engines.motionEngine.processEvent(
        eventNames.task.completed, {
          club,
          user,
        }, {
          locator: completedKey, //todo: use for triggers/events
          completedKey,
        });

      if (!member.state[completedKey]) {
        member.state[completedKey] = true;
        await app.m.save(member);
      }
    }
  }

  return {
    type: 'onboarding-tasks',
    steps,
    completed: tasksCompleted,
  }
}
