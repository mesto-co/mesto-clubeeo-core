import { ITelegramFileService } from './ITelegramFileService';

interface FailedFileEntry {
  timestamp: number;
  error: Error;
}

export class FailedTelegramFileService implements ITelegramFileService {
  private static readonly FAILURE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private failedFiles: Map<string, FailedFileEntry> = new Map();

  constructor(private fileService: ITelegramFileService) {}

  private getCacheKey(type: string, id: string): string {
    return `${type}:${id}`;
  }

  private getCachedFailure(key: string): Error | null {
    const entry = this.failedFiles.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > FailedTelegramFileService.FAILURE_CACHE_TTL) {
      this.failedFiles.delete(key);
      return null;
    }

    return entry.error;
  }

  private cacheFailure(key: string, error: Error) {
    this.failedFiles.set(key, {
      timestamp: Date.now(),
      error
    });
  }

  async getUserAvatar(userId: string): Promise<NodeJS.ReadableStream> {
    const key = this.getCacheKey('avatar', userId);
    
    if (this.getCachedFailure(key)) {
      // This will never execute as isFailureCached throws the cached error
      throw new Error('Unreachable');
    }

    try {
      return await this.fileService.getUserAvatar(userId);
    } catch (error) {
      this.cacheFailure(key, error);
      throw error;
    }
  }

  async getFile(fileId: string): Promise<NodeJS.ReadableStream> {
    const key = this.getCacheKey('file', fileId);

    if (this.getCachedFailure(key)) {
      throw new Error('Unreachable');
    }

    try {
      return await this.fileService.getFile(fileId);
    } catch (error) {
      this.cacheFailure(key, error);
      throw error;
    }
  }

  async getChatAvatar(chatId: string): Promise<NodeJS.ReadableStream> {
    const key = this.getCacheKey('chat', chatId);

    if (this.getCachedFailure(key)) {
      throw new Error('Unreachable');
    }

    try {
      return await this.fileService.getChatAvatar(chatId);
    } catch (error) {
      this.cacheFailure(key, error);
      throw error;
    }
  }
} 