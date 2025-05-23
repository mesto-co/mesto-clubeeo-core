import fs from 'fs';
import path from 'path';
import { ITelegramFileService } from './ITelegramFileService';
import { PassThrough } from 'stream';

export class CachedTelegramFileService implements ITelegramFileService {
  // Cache expiration times in milliseconds
  private static readonly AVATAR_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly FILE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(private fileService: ITelegramFileService) {}

  private isCacheExpired(filePath: string, ttl: number): boolean {
    try {
      const stats = fs.statSync(filePath);
      const age = Date.now() - stats.mtimeMs;
      return age > ttl;
    } catch {
      return true;
    }
  }

  private async cacheAndServeFile(
    cacheKey: string, 
    getStream: () => Promise<NodeJS.ReadableStream>,
    ttl: number = CachedTelegramFileService.FILE_CACHE_TTL
  ): Promise<NodeJS.ReadableStream> {
    const localFilePath = path.join('/tmp', cacheKey);
    
    if (fs.existsSync(localFilePath) && !this.isCacheExpired(localFilePath, ttl)) {
      return fs.createReadStream(localFilePath);
    }

    // Delete expired cache file if it exists
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
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
      () => this.fileService.getUserAvatar(userId),
      CachedTelegramFileService.AVATAR_CACHE_TTL
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
      () => this.fileService.getChatAvatar(chatId),
      CachedTelegramFileService.AVATAR_CACHE_TTL
    );
  }
} 