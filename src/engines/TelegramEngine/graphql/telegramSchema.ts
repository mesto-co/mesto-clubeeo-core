export const telegramSchema = `
  extend type Query {
    telegramChats(
      clubId: ID!, 
      type: String, 
      page: Int = 1, 
      perPage: Int = 20
    ): TelegramChatsResult!
  }

  type TelegramChatsResult {
    items: [TelegramChat!]!
    total: Int!
    page: Int!
    perPage: Int!
  }

  type TelegramChat {
    id: ID!
    extId: String!
    service: String!
    name: String
    isAdmin: Boolean!
    removed: Boolean!
    isForum: Boolean
    generalTopicId: Int
    chatInviteLink: String
  }
`; 