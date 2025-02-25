import fs from 'fs';
import path from 'path';
import { ITelegramFileService } from './ITelegramFileService';
import { PassThrough } from 'stream';

export class CachedTelegramFileService implements ITelegramFileService {
  constructor(private fileService: ITelegramFileService) {}

  private async cacheAndServeFile(
    cacheKey: string, 
    getStream: () => Promise<NodeJS.ReadableStream>
  ): Promise<NodeJS.ReadableStream> {
    const localFilePath = path.join('/tmp', cacheKey);
    
    if (fs.existsSync(localFilePath)) {
      return fs.createReadStream(localFilePath);
    }

    const stream = await getStream();
    const passThrough = new PassThrough();
    const writable = fs.createWriteStream(localFilePath);

    stream.pipe(passThrough);
    stream.pipe(writable);

    return passThrough;
  }

  async getUserAvatar(userId: string): Promise<NodeJS.ReadableStream> {
    return this.cacheAndServeFile(
      `tg_user_avatar_${userId}`,
      () => this.fileService.getUserAvatar(userId)
    );
  }

  async getFile(fileId: string): Promise<NodeJS.ReadableStream> {
    return this.cacheAndServeFile(
      `tg_${fileId}`,
      () => this.fileService.getFile(fileId)
    );
  }

  async getChatAvatar(chatId: string): Promise<NodeJS.ReadableStream> {
    return this.cacheAndServeFile(
      `tg_chat_avatar_${chatId}`,
      () => this.fileService.getChatAvatar(chatId)
    );
  }
} 