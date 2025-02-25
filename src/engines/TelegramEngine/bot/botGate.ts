import Member from "@/models/Member";
import { fetchUserAndExtByExtId } from "@/contexts/UserExtContext";
import { TelegramEngine } from "../TelegramEngine";
import { message } from "telegraf/filters";
import { ExtServicesEnum } from "@/core/lib/enums";
import ClubExt from "@/models/ClubExt";

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

      if (isMember) {
        // Accept the join request
        await ctx.approveChatJoinRequest(Number(userId));
        
        // Welcome message
        await ctx.telegram.sendMessage(chatId, 
          `Добро пожаловать, ${user.screenName}! 🎉\nВы автоматически подтверждены как участник клуба.`
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
          c.logger.warn('Could not send DM to user explaining join rejection', { userId, error: e });
        }
      }
    } catch (error) {
      c.logger.error('Error handling chat join request', { error, userId, chatId });
      
      // Default to rejecting on error
      try {
        await ctx.declineChatJoinRequest(Number(userId));
      } catch (e) {
        c.logger.error('Error declining chat join request', { error: e, userId, chatId });
      }
    }
  });

  // Handle when bot is added to a group
  bot.on(message('new_chat_members'), async (ctx) => {
    // Check if the bot itself was added
    const newMembers = ctx.message.new_chat_members;
    const botWasAdded = newMembers.some(member => member.id === bot.botInfo?.id);

    if (botWasAdded) {
      try {
        const chatId = ctx.chat.id.toString();
        const service = `tg:${ctx.chat.type}`;

        // Create or update ClubExt record
        await c.em.findOneOrCreateBy(ClubExt, {
          club: { id: clubId },
          service,
          extId: chatId
        }, {
          debugData: {
            chat: ctx.chat,
            addedAt: new Date(),
            addedBy: ctx.from
          }
        });

        // Set chat permissions to require admin approval
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

        await ctx.reply(
          '👋 Привет! Я настроен для автоматической проверки участников.\n' +
          'Только подтверждённые участники клуба смогут присоединиться к этому чату.'
        );
      } catch (error) {
        c.logger.error('Error configuring chat after bot add', { error, chatId: ctx.chat.id });
        await ctx.reply(
          '⚠️ Ошибка: Мне нужны права администратора со следующими возможностями:\n' +
          '- Управление пользователями\n' +
          '- Управление заявками на вступление\n' +
          'Пожалуйста, предоставьте эти права и добавьте меня снова.'
        );
      }
    }
  });
} 