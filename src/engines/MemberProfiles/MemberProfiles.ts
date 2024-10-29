import { IsNull } from "typeorm";
import { MestoApp } from "../../App";
import MemberProfile from "./models/MemberProfile";
import { memberProfilesApi } from "./memberProfilesApi";
import { MemberProfilesService } from "./MemberProfilesService";

export class MemberProfiles {
  readonly type = "engine";

  service: MemberProfilesService;

  constructor(protected c: MestoApp) {
    this.service = new MemberProfilesService(c);
  }

  async init() {
    const memberProfiles = await this.c.m.find(MemberProfile, {
      where: {
        search_vector: IsNull()
      }
    });
    for (const memberProfile of memberProfiles) {
      await this.service.updateSearchVector(memberProfile.id);
    }
  }

  get api() { return memberProfilesApi(this.c, this) }
  apiConfig = { prefix: '/member-profiles' }

  models = {
    MemberProfile,
  }
}
