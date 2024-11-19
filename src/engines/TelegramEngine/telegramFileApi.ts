import { MestoApp as App } from "../../App"
import fs from 'fs'
import path from 'path'
import { TelegramEngine } from "./TelegramEngine";

export default function telegramFileApi(app: App, engine: TelegramEngine) {
  return (router, opts, done) => {

    router.get('/userAvatar/:userId', async (request, reply) => {
      try {
        const { userId } = request.params;
    
        const localFilePath = path.join('/tmp', `tg_user_avatar_${userId}`);

        // Check if file exists locally
        if (fs.existsSync(localFilePath)) {
          reply.header('Content-Type', 'application/octet-stream');
          const stream = fs.createReadStream(localFilePath).pipe(reply.raw);

          await new Promise((resolve, reject) => {
            stream.on('data', data => {
              reply.raw.write(data);
            });

            stream.on('end', () => {
              reply.raw.end()
              resolve(true);
            });

            stream.on('error', (error) => {
              console.log('stream error', error);
              reject(error);
            });
          });
          return;
        }

        // If file does not exist locally, proceed with fetching from Telegram
        const TELEGRAM_API_URL = engine.env.telegramApi + '/bot' + engine.env.telegramToken;
        const TELEGRAM_FILE_API_URL = engine.env.telegramApi + '/file/bot' + engine.env.telegramToken;
        const getUserProfilePhotosResponse = await app.axios.get(`${TELEGRAM_API_URL}/getUserProfilePhotos?user_id=${userId}`);
        // app.logger.info({response: getUserProfilePhotosResponse.data}, 'getUserProfilePhotosResponse');

        // if (!fileResponse.data.result.photos[0][0]) throw new Error('User avatar not found');
        const fileId = getUserProfilePhotosResponse.data?.result?.photos?.[0]?.[0]?.file_id;

        const getFileResponse = await app.axios.get(`${TELEGRAM_API_URL}/getFile?file_id=${fileId}`);
        if (!getFileResponse.data.result?.file_path) throw new Error('User avatar not found');
        const filePath = getFileResponse.data.result.file_path;
        const fileUrl = `${TELEGRAM_FILE_API_URL}/${filePath}`;

        // return {stop: true, fileUrl};

        const response = await app.axios.get(fileUrl, { responseType: 'stream' });
        const stream = response.data;

        reply.header('Content-Type', 'application/octet-stream');

        // Save file to /tmp directory and serve it
        const writable = fs.createWriteStream(localFilePath);

        await new Promise((resolve, reject) => {
          stream.on('data', data => {
            reply.raw.write(data);
            writable.write(data);
          });

          stream.on('end', () => {
            reply.raw.end()
            writable.end();
            resolve(true);
          });

          stream.on('error', (error) => {
            console.log('stream error', error);
            reject(error);
          });
        });

        stream.on('error', (error) => {
          console.log('stream error', error);
          reply.status(500).send('Error fetching or saving file');
        });
    
      } catch (error) {
        console.log('error', error);
        reply.status(500).send('Error processing request');
      }
    });

    router.get('/file/:botId/:fileId', async (request, reply) => {
      try {
        const { fileId } = request.params;
    
        const localFilePath = path.join('/tmp', `tg_${fileId}`);

        // Check if file exists locally
        if (fs.existsSync(localFilePath)) {
          reply.header('Content-Type', 'application/octet-stream');
          const stream = fs.createReadStream(localFilePath).pipe(reply.raw);

          await new Promise((resolve, reject) => {
            stream.on('data', data => {
              reply.raw.write(data);
            });
      
            stream.on('end', () => {
              reply.raw.end()
              resolve(true);
            });

            stream.on('error', (error) => {
              console.log('stream error', error);
              reject(error);
            });
          });
          return;
        }

        // If file does not exist locally, proceed with fetching from Telegram
        const TELEGRAM_API_URL = engine.env.telegramApi + '/bot' + engine.env.telegramToken;
        const TELEGRAM_FILE_API_URL = engine.env.telegramApi + '/file/bot' + engine.env.telegramToken;
        const fileResponse = await app.axios.get(`${TELEGRAM_API_URL}/getFile?file_id=${fileId}`);
        const filePath = fileResponse.data.result.file_path;
        const fileUrl = `${TELEGRAM_FILE_API_URL}/${filePath}`;
    
        const response = await app.axios.get(fileUrl, { responseType: 'stream' });
        const stream = response.data;
    
        reply.header('Content-Type', 'application/octet-stream');
    
        // Save file to /tmp directory and serve it
        const writable = fs.createWriteStream(localFilePath);

        await new Promise((resolve, reject) => {
          stream.on('data', data => {
            reply.raw.write(data);
            writable.write(data);
          });
    
          stream.on('end', () => {
            reply.raw.end()
            writable.end();
            resolve(true);
          });

          stream.on('error', (error) => {
            console.log('stream error', error);
            reject(error);
          });
        });

        stream.on('error', (error) => {
          console.log('stream error', error);
          reply.status(500).send('Error fetching or saving file');
        });
    
      } catch (error) {
        console.log('error', error);
        reply.status(500).send('Error processing request');
      }
    });

    done();
  };
}