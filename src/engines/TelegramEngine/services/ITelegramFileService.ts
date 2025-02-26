export interface ITelegramFileService {
  /**
   * Gets a user's profile photo as a stream
   * @param userId Telegram user ID
   * @throws {Error} If user avatar not found
   */
  getUserAvatar(userId: string): Promise<NodeJS.ReadableStream>;

  /**
   * Gets any Telegram file by its file ID
   * @param fileId Telegram file ID
   * @throws {Error} If file not found
   */
  getFile(fileId: string): Promise<NodeJS.ReadableStream>;

  /**
   * Gets a chat's photo as a stream. Works with all chat types:
   * private chats, groups, supergroups and channels
   * @param chatId Telegram chat ID (can be positive or negative)
   * @throws {Error} If chat avatar not found or chat is inaccessible
   */
  getChatAvatar(chatId: string): Promise<NodeJS.ReadableStream>;
} 