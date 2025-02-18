import { Once, PushTo } from "flambo";
import { MestoApp } from "../App";
import { Clubs } from "./Clubs/Clubs";
import { BadgeEngine } from "./BadgeEngine/BadgeEngine";
import { RoleEngine } from "./RoleEngine/RoleEngine";
import TranslationEngine from "./TranslationEngine/TranslationEngine";
import AppsEngine from "./AppsEngine/AppsEngine";
import { TelegramEngine } from "./TelegramEngine/TelegramEngine";
import { Lists } from "./Lists/Lists";
import { MemberProfiles } from "./MemberProfiles/MemberProfiles";
import { fileStorageEngine } from "./FileStorageEngine/FileStorageEngine";
import { AccessEngine } from "./AccessEngine/AccessEngine";
import MotionEngine from "./MotionEngine/MotionEngine";

export class Engines {
  public enabledEngines: string[];

  constructor(private app: MestoApp) {}

  @PushTo('enabledEngines')
  @Once()
  get apps() {
    return new AppsEngine(this.app as any);
  }

  @PushTo('enabledEngines')
  @Once()
  get access() {
    return new AccessEngine(this.app as any);
  }

  @PushTo('enabledEngines')
  @Once()
  get badge() {
    return new BadgeEngine(this.app as any);
  }

  @PushTo('enabledEngines')
  @Once()
  get hubs() {
    return new Clubs(this.app as any);
  }

  @PushTo('enabledEngines')
  @Once()
  get motion() {
    return new MotionEngine(this.app as any);
  }

  @PushTo('enabledEngines')
  @Once()
  get role() {
    return new RoleEngine(this.app as any);
  }

  @PushTo('enabledEngines')
  @Once()
  get lists() {
    return new Lists(this.app);
  }

  @PushTo('enabledEngines')
  @Once()
  get telegram() {
    return new TelegramEngine(this.app);
  }

  @PushTo('enabledEngines')
  @Once()
  get translations() {
    return new TranslationEngine(this.app as any);
  }

  @PushTo('enabledEngines')
  @Once()
  get memberProfiles() {
    return new MemberProfiles(this.app);
  }

  @PushTo('enabledEngines')
  @Once()
  get fileStorage() {
    return fileStorageEngine(this.app);
  }

  // backwards compatibility
  get motionEngine() {
    return this.motion;
  }

  get accessEngine() {
    return this.access;
  }

  get roleEngine() {
    return this.role;
  }

  get badgeEngine() {
    return this.badge;
  }
}