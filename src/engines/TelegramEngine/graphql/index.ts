import { telegramSchema } from './telegramSchema';
import { getTelegramResolvers } from './telegramResolvers';
import { TelegramEngine } from '../TelegramEngine';

export const getTelegramGraphQL = (engine: TelegramEngine) => ({
  typeDefs: telegramSchema,
  resolvers: getTelegramResolvers(engine)
}); 