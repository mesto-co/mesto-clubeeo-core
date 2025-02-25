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
        const stream = await engine.fileService.getChatAvatar(chatId);
        await streamResponse(stream, reply);
      } catch (error) {
        app.logger.error(error);
        reply.status(500).send('Error processing request');
      }
    });

    done();
  };
}