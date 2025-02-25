export interface ITelegramFileService {
  getUserAvatar(userId: string): Promise<NodeJS.ReadableStream>;
  getFile(fileId: string): Promise<NodeJS.ReadableStream>;
  getChatAvatar(chatId: string): Promise<NodeJS.ReadableStream>;
} 