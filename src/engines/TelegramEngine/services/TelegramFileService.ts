import { MestoApp } from "../../../App";
import { TelegramEngine } from "../TelegramEngine";
import { ITelegramFileService } from "./ITelegramFileService";

export class TelegramFileService implements ITelegramFileService {
  constructor(
    private app: MestoApp,
    private engine: TelegramEngine
  ) {}

  private get TELEGRAM_API_URL() {
    return this.engine.env.telegramApi + '/bot' + this.engine.env.telegramToken;
  }

  private get TELEGRAM_FILE_API_URL() {
    return this.engine.env.telegramApi + '/file/bot' + this.engine.env.telegramToken;
  }

  async getUserAvatar(userId: string): Promise<NodeJS.ReadableStream> {
    const getUserProfilePhotosResponse = await this.app.axios.get(
      `${this.TELEGRAM_API_URL}/getUserProfilePhotos?user_id=${userId}`
    );

    const fileId = getUserProfilePhotosResponse.data?.result?.photos?.[0]?.[0]?.file_id;
    if (!fileId) throw new Error('User avatar not found');
    
    return this.getFile(fileId);
  }

  async getFile(fileId: string): Promise<NodeJS.ReadableStream> {
    const fileResponse = await this.app.axios.get(`${this.TELEGRAM_API_URL}/getFile?file_id=${fileId}`);
    if (!fileResponse.data.result?.file_path) throw new Error('File not found');
    
    const filePath = fileResponse.data.result.file_path;
    const fileUrl = `${this.TELEGRAM_FILE_API_URL}/${filePath}`;
    
    const response = await this.app.axios.get(fileUrl, { responseType: 'stream' });
    return response.data;
  }

  async getChatAvatar(chatId: string): Promise<NodeJS.ReadableStream> {
    try {
      const chat = await this.app.axios.get(`${this.TELEGRAM_API_URL}/getChat?chat_id=${chatId}`);
      
      // Support both photo.big_file_id (for groups) and photo.small_file_id (fallback)
      const fileId = chat.data?.result?.photo?.big_file_id || 
                    chat.data?.result?.photo?.small_file_id;
                    
      if (!fileId) throw new Error('Chat avatar not found');
      
      return this.getFile(fileId);
    } catch (error) {
      // Add more specific error handling
      if (error.response?.status === 400) {
        throw new Error('Invalid chat ID or chat not accessible');
      }
      throw error;
    }
  }
} 