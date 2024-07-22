import {BadgeEngine} from './engines/BadgeEngine/BadgeEngine'
import {AccessEngine} from './engines/AccessEngine/AccessEngine'
import {RoleEngine} from './engines/RoleEngine/RoleEngine'
import MotionEngine from './engines/MotionEngine/MotionEngine';
import {SubscriptionEngine} from './engines/SubscriptionEngine/SubscriptionEngine'
import {ContainerBase} from './lib/ContainerBase'
import App from './App'
import AppEngine from './engines/AppEngine/AppEngine'
import { TranslationEngine } from './engines/TranslationEngine/TranslationEngine';

export class Engines extends ContainerBase {
  protected app: App

  constructor(app: App) {
    super();
    this.app = app
  }

  get appEngine() { return this.patch('appEngine', () => new AppEngine(this.app)) }
  get accessEngine() { return this.patch('accessEngine', () => new AccessEngine(this.app)) }
  get badgeEngine() { return this.patch('badgeEngine', () => new BadgeEngine(this.app)) }
  get motionEngine() { return this.patch('motionEngine', () => new MotionEngine(this.app)) }
  get roleEngine() { return this.patch('roleEngine', () => new RoleEngine(this.app)) }
  get subscriptionsEngine() { return this.patch('subscriptionsEngine', () => new SubscriptionEngine(this.app)) }
  get translation() { return this.patch('translation', () => new TranslationEngine(this.app)) }

}

