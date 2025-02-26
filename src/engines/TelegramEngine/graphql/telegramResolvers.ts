import { ICtx } from "@/graphql/graphqlCommon";
import { TelegramEngine } from "../TelegramEngine";
import ClubExt from "@/models/ClubExt";
import { IResolvers } from '@graphql-tools/utils';
import { Like } from "typeorm";

export const getTelegramResolvers = (engine: TelegramEngine): IResolvers<any, ICtx> => {
  const c = engine.c;

  return {
    Query: {
      telegramChats: async (_, args: { clubId: string, type?: string, page?: number, perPage?: number }, ctx: ICtx) => {
        const user = await ctx.auth.ctx.getUserOrFail();
        // const userInClub = await ctx.auth.ctx.userInClubContextById(args.clubId);
        // await userInClub.requireRoleForMercurius('admin');

        const page = args.page || 1;
        const perPage = args.perPage || 20;
        const skip = (page - 1) * perPage;

        const whereClause: any = {
          club: { id: args.clubId },
          service: args.type ? `tg:${args.type}` : Like('tg:%')
        };

        const [items, total] = await c.m.findAndCount(ClubExt, {
          where: whereClause,
          skip,
          take: perPage,
          order: {
            createdAt: 'DESC'
          }
        });

        return {
          items: items.map(item => ({
            id: item.id,
            extId: item.extId,
            service: item.service,
            name: item.cached?.name,
            isAdmin: item.isAdmin,
            removed: item.removed,
            isForum: item.cached?.isForum,
            generalTopicId: item.cached?.generalTopicId,
            chatInviteLink: item.cached?.chatInviteLink
          })),
          total,
          page,
          perPage
        };
      }
    }
  };
};
