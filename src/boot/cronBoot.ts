import { MestoApp } from "../App";
import { getStats, statsMessage } from "@/engines/TelegramEngine/messages/statsMessage";

export function cronBoot(c: MestoApp) {
  c.engines.cron.schedule('35 * * * *', async () => {
    try {
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

      // Try different chat ID formats
      const chatIdFormats = [
        '2778567681',           // Original format
        '-1002778567681',       // Channel format
        '-2778567681',          // Group format
        '@2778567681'           // Username format (if it's a public channel)
      ];
      
      c.logger.info({ 
        chatIdFormats, 
        messageLength: message.length,
        botInfo: c.engines.telegram.bot.botInfo
      }, 'Attempting to send stats message');

      let success = false;
      let lastError = null;

      for (const chatId of chatIdFormats) {
        try {
          // Try to get chat info first to verify access
          const chatInfo = await c.engines.telegram.bot.telegram.getChat(chatId);
          c.logger.info({ chatId, chatInfo }, 'Chat info retrieved successfully');

          // If we can get chat info, try to send the message
          await c.engines.telegram.bot.telegram.sendMessage(chatId, message);
          c.logger.info({ chatId }, 'Stats message sent successfully');
          success = true;
          break;
        } catch (error) {
          lastError = error;
          c.logger.warn({ 
            chatId, 
            error: error.message,
            errorCode: error.response?.error_code,
            errorDescription: error.response?.description
          }, 'Failed to send message with this chat ID format');
        }
      }

      if (!success) {
        throw lastError || new Error('All chat ID formats failed');
      }

    } catch (error) {
      c.logger.error({ 
        error, 
        errorMessage: error.message,
        errorCode: error.response?.error_code,
        errorDescription: error.response?.description
      }, 'Error sending stats message to Telegram');
    }
  });
}