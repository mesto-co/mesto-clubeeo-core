import { ICtx } from "@/graphql/graphqlCommon";
import { TelegramEngine } from "../TelegramEngine";
import ClubExt from "@/models/ClubExt";
import { IResolvers } from '@graphql-tools/utils';
import { In, Like } from "typeorm";
import ObjectRole from "@/models/ObjectRole";
import Member from "@/models/Member";
import MemberRole from "@/models/MemberRole";

export const getTelegramResolvers = (engine: TelegramEngine): IResolvers<any, ICtx> => {
  const c = engine.c;

  return {
    Query: {
      telegramChats: async (_, args: { clubId: string, type?: string, page?: number, perPage?: number }, ctx: ICtx) => {
        const user = await ctx.auth.ctx.getUserOrFail();
        // const userInClub = await ctx.auth.ctx.userInClubContextById(args.clubId);
        // await userInClub.requireRoleForMercurius('admin');
        // const member = await c.m.findOne(Member, {
        //   where: {
        //     user: { id: user.id },
        //     club: { id: args.clubId },
        //     enabled: true,
        //   }
        // });

        // const userRoles = await c.m.find(MemberRole, {
        //   where: {
        //     member: { id: member.id },
        //     enabled: true,
        //   }
        // });

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
            index: 'ASC',
            name: 'ASC',
            createdAt: 'DESC'
          }
        });

        const roles = await c.m.find(ObjectRole, {
          where: {
            club: { id: args.clubId },
            objectType: 'ClubExt',
            objectId: In(items.map(item => item.id)),
            enabled: true,
          },
          relations: {
            clubRole: true,
          }
        });

        const rolesMap = new Map<string, string[]>();
        for (const role of roles) {
          const roles = rolesMap.get(role.objectId) || [];
          roles.push(role.clubRole.name);
          rolesMap.set(role.objectId, roles);
        }

        return {
          items: items.map(item => ({
            id: item.id,
            extId: item.extId,
            service: item.service,
            name: item.name,
            isAdmin: item.isAdmin,
            removed: item.removed,
            isForum: item.cached?.isForum,
            generalTopicId: item.cached?.generalTopicId,
            chatInviteLink: item.cached?.chatInviteLink,
            roles: (rolesMap.get(item.id) || []).sort(),
          })),
          total,
          page,
          perPage
        };
      }
    }
  };
};
