import {EntityManager} from 'typeorm'
import ExtendedEntityManager from '../../core/lib/ExtendedEntityManager'
import subscriptionApi from './api/subscriptionApi'
import mitt, {Emitter} from 'mitt'
import Subscription from './models/Subscription'
import SubscriptionUpdate from './models/SubscriptionUpdate'

export interface SubscriptionEngineDeps {
  m: EntityManager
  em: ExtendedEntityManager
}

export type SubscriptionEvents = {
  subscriptionCreated: {
    subscription: Subscription,
    subscriptionUpdate: SubscriptionUpdate,
  }
}

export class SubscriptionEngine {
  readonly app: SubscriptionEngineDeps;

  constructor(app: SubscriptionEngineDeps) {
    this.app = app;
  }

  get api() { return subscriptionApi(this) }

  events: Emitter<SubscriptionEvents> = mitt<SubscriptionEvents>();

  get m() { return this.app.m }
  get em() { return this.app.em }

}
