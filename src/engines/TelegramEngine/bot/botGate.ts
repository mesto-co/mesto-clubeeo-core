import Member from "@/models/Member";
import { fetchUserAndExtByExtId } from "@/contexts/UserExtContext";
import { TelegramEngine } from "../TelegramEngine";
import { message } from "telegraf/filters";
import ClubExt from "@/models/ClubExt";
import UserExt from "@/models/UserExt";
import UserExtHubExt from "@/models/UserExtHubExt";
import { Context } from 'telegraf';

export function botGate(telegramEngine: TelegramEngine) {
  const c = telegramEngine.c;
  const bot = telegramEngine.bot;
  const clubId = '1';

  // Handle chat join requests
  bot.on('chat_join_request', async (ctx) => {
    const userId = ctx.chatJoinRequest.from.id.toString();
    const chatId = ctx.chatJoinRequest.chat.id.toString();

    try {
      // Fetch or create user and their external service connection
      const { userExt, user } = await fetchUserAndExtByExtId(c as any, {
        extId: userId,
        service: 'tg',
        userData: ctx.chatJoinRequest.from,
        sourceData: ctx
      });

      // Find or create member
      const { value: member } = await c.em.findOneOrCreateBy(Member, {
        user: { id: user.id },
        club: { id: clubId }
      }, {});

      // Check if user has member role
      const isMember = await c.engines.access.service.hasRole(
        { member, user, hub: { id: clubId } },
        'member'
      );

      // Find ClubExt for this chat
      const hubExt = await c.m.findOne(ClubExt, {
        where: {
          club: { id: clubId },
          service: `tg:${ctx.chatJoinRequest.chat.type}`,
          extId: chatId
        }
      });

      if (!hubExt) {
        await ctx.telegram.sendMessage(userId,
          `Извините, но бот не сконфигурирован для работы с этим чатом или отключен. Пожалуйста, обратитесь к администратору.`
        );
        return;
      }

      if (isMember) {
        // Create or update UserExtHubExt record
        await c.em.createOrUpdateBy(UserExtHubExt, {
          user: { id: user.id },
          userExt: { id: userExt.id },
          hubExt: { id: hubExt.id },
          service: hubExt.service,
          extId: userExt.extId
        }, {
          enabled: isMember,
          username: userExt.username,
          data: userExt.data,
          debugData: {
            lastJoinRequest: {
              chat: ctx.chatJoinRequest.chat,
              date: new Date(),
              approved: isMember
            }
          }
        });

        // Accept the join request
        await ctx.approveChatJoinRequest(Number(userId));
        
        // Send welcome message to appropriate topic or main chat
        const messageThread = hubExt.cached?.isForum ? hubExt.cached.generalTopicId : undefined;
        await ctx.telegram.sendMessage(
          chatId,
          `Добро пожаловать, ${user.screenName}! 🎉\n` +
          `${ctx.chatJoinRequest.from.username ? `@${ctx.chatJoinRequest.from.username}` : ''}`,
          messageThread ? { message_thread_id: messageThread } : undefined
        );
      } else {
        // Decline the join request
        await ctx.declineChatJoinRequest(Number(userId));

        // Send DM to explain why they were rejected
        try {
          await ctx.telegram.sendMessage(userId,
            `Извините, но в этот чат могут входить только подтверждённые участники клуба. ` +
            `Пожалуйста, сначала завершите процесс вступления в клуб.`
          );
        } catch (e) {
          // User might have blocked the bot or never started it
          c.logger.warn({ 
            userId, 
            error: e 
          }, 'Could not send DM to user explaining join rejection');
        }
      }
    } catch (error) {
      c.logger.error({ 
        error, 
        userId, 
        chatId 
      }, 'Error handling chat join request');
      
      // Default to rejecting on error
      try {
        await ctx.declineChatJoinRequest(Number(userId));
      } catch (e) {
        c.logger.error({ 
          error: e, 
          userId, 
          chatId 
        }, 'Error declining chat join request');
      }
    }
  });

  // Handle when bot is added to a group or its admin status changes
  bot.on(message('new_chat_members'), async (ctx) => {
    // Check if the bot itself was added
    const newMembers = ctx.message.new_chat_members;
    const botWasAdded = newMembers.some(member => member.id === bot.botInfo?.id);

    if (botWasAdded) {
      await handleBotAddedOrUpdated(ctx);
    } else {
      // Check if bot's admin status changed
      try {
        const chatId = ctx.chat.id.toString();
        const botMember = await ctx.telegram.getChatMember(ctx.chat.id, bot.botInfo!.id);
        
        const clubExt = await c.m.findOne(ClubExt, {
          where: {
            club: { id: clubId },
            service: `tg:${ctx.chat.type}`,
            extId: chatId,
            removed: false
          }
        });

        if (clubExt && botMember.status === 'administrator' !== clubExt.isAdmin) {
          await handleBotAddedOrUpdated(ctx, true);
        }
      } catch (error) {
        c.logger.error({ 
          error, 
          chatId: ctx.chat.id 
        }, 'Error checking bot admin status');
      }
    }
  });

  // Handle bot being removed from chat
  bot.on(message('left_chat_member'), async (ctx) => {
    if (ctx.message.left_chat_member.id === bot.botInfo?.id) {
      await handleBotRemoved(ctx);
    }
  });

  // Handle bot's member status changes (promotion/demotion)
  bot.on('my_chat_member', async (ctx) => {
    const newStatus = ctx.myChatMember.new_chat_member.status;
    const oldStatus = ctx.myChatMember.old_chat_member.status;
    
    // Only handle admin status changes
    if ((newStatus === 'administrator') !== (oldStatus === 'administrator')) {
      await handleBotAddedOrUpdated(ctx, true);
    }
  });

  async function handleBotAddedOrUpdated(ctx: Context, isStatusUpdate = false) {
    try {
      const chatId = ctx.chat.id.toString();
      const service = `tg:${ctx.chat.type}`;

      // Check if bot is admin
      const botMember = await ctx.telegram.getChatMember(ctx.chat.id, bot.botInfo!.id);
      const isAdmin = botMember.status === 'administrator';

      // Create or update bot's UserExt record
      const { value: botUserExt } = await c.em.findOneOrCreateBy(UserExt, {
        extId: bot.botInfo!.id.toString(),
        service: 'tg'
      }, {
        enabled: true,
        username: bot.botInfo!.username,
        data: {
          first_name: bot.botInfo!.first_name,
          is_bot: true
        }
      });

      // Find or create ClubExt record
      const { value: clubExt } = await c.em.findOneOrCreateBy(ClubExt, {
        club: { id: clubId },
        service,
        extId: chatId
      }, {
        removed: false,
        isAdmin,
        debugData: {
          chat: ctx.chat,
          addedAt: new Date(),
          addedBy: ctx.from,
          adminStatus: botMember.status
        },
        cached: {}
      });

      // Update existing record if found
      if (clubExt) {
        await c.m.update(ClubExt, { id: clubExt.id }, {
          removed: false,
          isAdmin,
          debugData: {
            ...clubExt.debugData,
            lastUpdate: {
              date: new Date(),
              adminStatus: botMember.status,
              updatedBy: ctx.from
            }
          }
        });
      }

      // Store chat info
      const chatInfo = await ctx.telegram.getChat(ctx.chat.id);
      const cached = { ...(clubExt.cached || {}) };

      // Store name if available
      if ('title' in chatInfo) {
        cached.name = chatInfo.title;
      }

      // Add forum-specific info only for supergroups
      if (ctx.chat.type === 'supergroup') {
        cached.isForum = 'is_forum' in chatInfo && chatInfo.is_forum;
        if (cached.isForum && 'general_forum_topic_id' in chatInfo) {
          cached.generalTopicId = Number(chatInfo.general_forum_topic_id);
        }
      }
      
      await c.m.update(ClubExt, { id: clubExt.id }, { cached });

      // Only proceed with admin setup if bot is admin
      if (isAdmin) {
        // Generate invite link if not exists
        if (!clubExt.cached?.['chatInviteLink']) {
          const inviteLink = await ctx.telegram.createChatInviteLink(ctx.chat.id, {
            creates_join_request: true,
            name: 'Основная ссылка для вступления'
          });
          
          await c.m.update(ClubExt, { id: clubExt.id }, {
            cached: { ...(clubExt.cached || {}), chatInviteLink: inviteLink.invite_link }
          });
        }

        // Set chat permissions
        await ctx.setChatPermissions({
          can_send_messages: true,
          can_send_audios: true,
          can_send_documents: true,
          can_send_photos: true,
          can_send_videos: true,
          can_send_video_notes: true,
          can_send_voice_notes: true,
          can_send_polls: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false,
          can_manage_topics: false,
        });

        // Send welcome message considering topics
        const messageOptions: any = {};
        if (clubExt.cached?.isForum && clubExt.cached?.generalTopicId) {
          messageOptions.message_thread_id = clubExt.cached.generalTopicId;
        }

        await ctx.reply(
          isStatusUpdate 
            ? '✅ Права администратора получены! Теперь я могу полноценно управлять участниками чата.'
            : '👋 Привет! Я настроен для автоматической проверки участников.\n' +
              'Только подтверждённые участники клуба смогут присоединиться к этому чату.',
          messageOptions
        );
      } else {
        await ctx.reply(
          '⚠️ Для полноценной работы мне нужны права администратора со следующими возможностями:\n' +
          '- Управление пользователями\n' +
          '- Управление заявками на вступление',
          clubExt.cached?.isForum && clubExt.cached?.generalTopicId 
            ? { message_thread_id: clubExt.cached.generalTopicId }
            : undefined
        );
      }
    } catch (error) {
      c.logger.error({ 
        error, 
        chatId: ctx.chat.id,
        chatType: ctx.chat.type 
      }, 'Error handling bot addition or update');
    }
  }

  async function handleBotRemoved(ctx: Context) {
    try {
      const chatId = ctx.chat.id.toString();
      const service = `tg:${ctx.chat.type}`;

      // Find and mark ClubExt as removed
      const clubExt = await c.m.findOne(ClubExt, {
        where: {
          club: { id: clubId },
          service,
          extId: chatId,
          removed: false
        }
      });

      if (clubExt) {
        await c.m.update(ClubExt, { id: clubExt.id }, {
          removed: true,
          isAdmin: false,
          debugData: {
            ...clubExt.debugData,
            removedAt: new Date(),
            removedBy: ctx.from
          }
        });
      }
    } catch (error) {
      c.logger.error({ 
        error, 
        chatId: ctx.chat.id 
      }, 'Error handling bot removal');
    }
  }
} 