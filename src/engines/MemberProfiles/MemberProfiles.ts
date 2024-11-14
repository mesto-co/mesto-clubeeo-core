import { MestoApp } from "../../App";
import MemberProfile from "./models/MemberProfile";
import { memberProfilesApi } from "./memberProfilesApi";
import { MemberProfilesService } from "./MemberProfilesService";
import { Once } from "flambo";
import { memberProfilesGraphql } from "./memberProfilesGraphql";
import { Member } from "clubeeo-core";

type TCanRules = {
  [key: string]: {
    [key: string]: (ctx: {member: Member | null, hasRole: (roleSlug: string) => Promise<boolean>}, obj?: any) => boolean | Promise<boolean>;
  }
}

export class MemberProfiles {
  readonly type = "engine";

  constructor(protected c: MestoApp) {}

  async init() {
    const memberProfiles = await this.c.m.find(this.models.MemberProfile, {
      // where: {
      //   search_vector: IsNull()
      // }
    });
    for (const memberProfile of memberProfiles) {
      await this.service.updateSearchVector(memberProfile.id);
    }
  }

  @Once()
  get service() { return new MemberProfilesService(this.c) }

  @Once()
  get api() { return memberProfilesApi(this.c, this) }

  apiConfig = { prefix: '/member-profiles' }

  @Once()
  get graphql() { return memberProfilesGraphql(this) }

  @Once()
  get models() {
    return {
      MemberProfile,
    }
  }

  @Once()
  get repos() {
    return {
      MemberProfile: this.c.db.getRepository(this.models.MemberProfile),
    }
  }

  @Once()
  get canRules(): TCanRules {
    return {
      MemberProfile: {
        read: ({hasRole}) => hasRole('member'),
        edit: ({member}, profile: {memberId: string}) => member && member.id === profile.memberId,
        search: ({hasRole}) => hasRole('member'),
      }
    }
  }
}
