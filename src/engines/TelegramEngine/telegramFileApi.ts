import { MestoApp as App } from "@/App"
import { TelegramEngine } from "./TelegramEngine";
import UserExt from "@/models/UserExt";

export default function telegramFileApi(app: App, engine: TelegramEngine) {
  return (router, opts, done) => {
    
    async function streamResponse(stream: NodeJS.ReadableStream, reply) {
      reply.header('Content-Type', 'application/octet-stream');
      
      await new Promise((resolve, reject) => {
        stream.pipe(reply.raw);
        stream.on('end', () => resolve(true));
        stream.on('error', reject);
      });
    }

    router.get('/user/:userId/avatar', async (request, reply) => {
      try {
        const { userId } = request.params;
        
        // Check if userId can be parsed to a valid number
        const parsedUserId = parseInt(userId);
        if (isNaN(parsedUserId) || parsedUserId <= 0) {
          reply.status(404).send('User not found');
          return;
        }

        const userExt = await app.m.findOne(UserExt, {
          where: {
            user: {
              id: userId
            },
            service: 'tg',
            enabled: true
          },
          order: {
            createdAt: 'DESC'
          }
        });

        if (!userExt) {
          reply.status(404).send('User not found');
          return;
        }

        const stream = await engine.fileService.getUserAvatar(userExt.extId);
        await streamResponse(stream, reply);
      } catch (error) {
        app.logger.error(error);
        reply.status(500).send('Error processing request');
      }
    });

    router.get('/userAvatar/:userId', async (request, reply) => {
      try {
        const { userId } = request.params;
        
        // Check if userId can be parsed to a valid number
        const parsedUserId = parseInt(userId);
        if (isNaN(parsedUserId) || parsedUserId <= 0) {
          reply.status(404).send('User not found');
          return;
        }

        const stream = await engine.fileService.getUserAvatar(userId);
        await streamResponse(stream, reply);
      } catch (error) {
        app.logger.error(error);
        reply.status(500).send('Error processing request');
      }
    });

    router.get('/file/:fileId', async (request, reply) => {
      try {
        const { fileId } = request.params;
        const stream = await engine.fileService.getFile(fileId);
        await streamResponse(stream, reply);
      } catch (error) {
        app.logger.error(error);
        reply.status(500).send('Error processing request');
      }
    });

    router.get('/chatAvatar/:chatId', async (request, reply) => {
      try {
        const { chatId } = request.params;
        
        // Handle both positive (private chats) and negative (groups/channels) IDs
        const parsedChatId = parseInt(chatId);
        if (isNaN(parsedChatId)) {
          reply.status(400).send('Invalid chat ID format');
          return;
        }

        const stream = await engine.fileService.getChatAvatar(chatId);
        await streamResponse(stream, reply);
      } catch (error) {
        if (error.message === 'Chat avatar not found') {
          reply.status(404).send('Chat avatar not found');
          return;
        }
        if (error.message === 'Invalid chat ID or chat not accessible') {
          reply.status(400).send('Invalid chat ID or chat not accessible');
          return;
        }
        
        app.logger.error(error);
        reply.status(500).send('Error processing request');
      }
    });

    done();
  };
}